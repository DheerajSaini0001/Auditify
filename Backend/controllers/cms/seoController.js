import mongoose from 'mongoose';
import { CmsContentEntry, CmsContentType } from '../../models/cms/index.js';
import logger from '../../utils/logger.js';
import {
  computeSeoScore,
  derivePresence,
  deriveIndexStatus,
  deriveMetaStatus,
} from '../../services/cms/seoScoreService.js';

/**
 * SEO dashboard over the CMS content entries.
 *
 * There is no separate SEO collection: every entry already carries a `seo` block
 * (models/cms/subschemas.js), so a second store would immediately disagree with it.
 * This controller is a focused editor over that block — it never touches `data`,
 * `status`, or any lifecycle field, so it cannot publish or unpublish by accident.
 */

// The only paths a client may write. `seo` is nested one level, so an allow-list of
// leaf keys is what keeps a crafted body from reaching status/author/data.
const SEO_FIELDS = [
  'title', 'description', 'keywords', 'canonicalUrl', 'noIndex', 'noFollow',
  'ogTitle', 'ogDescription', 'ogImage', 'ogType', 'twitterCard', 'structuredData',
];

/** Non-privileged users only ever see and edit their own entries. */
const scopeFor = (req) => {
  const base = { deletedAt: null };
  if (['admin', 'super_admin'].includes(req.user?.role)) return base;
  return { ...base, author: req.user.userId };
};

/**
 * Pages need a content type to exist at all (contentType is required on the entry).
 * Phase 1 shipped the models with no seeding, so the dashboard bootstraps the one
 * system type it needs rather than showing an empty screen the user cannot escape.
 */
export const ensurePageType = async (userId) => {
  const existing = await CmsContentType.findOne({ key: 'page' });
  if (existing) return existing;

  return CmsContentType.create({
    key: 'page',
    name: 'Page',
    namePlural: 'Pages',
    description: 'A standalone page with its own URL and SEO settings.',
    icon: 'FileText',
    kind: 'collection',
    isSystem: true,
    supports: {
      slug: true, seo: true, revisions: true, scheduling: true,
      excerpt: true, featuredImage: true, hierarchy: true, ordering: true, author: true,
    },
    listColumns: ['title', 'status', 'updatedAt'],
    createdBy: userId,
    updatedBy: userId,
  });
};

// GET /api/cms/seo/summary
export const getSummary = async (req, res) => {
  try {
    const entries = await CmsContentEntry.find(scopeFor(req))
      .select('title slug path status seo updatedAt')
      .lean();

    const scored = entries.map((e) => ({
      score: computeSeoScore(e).score,
      indexStatus: deriveIndexStatus(e),
      metaStatus: deriveMetaStatus(e),
    }));

    const total = scored.length;
    const indexed = scored.filter((s) => s.indexStatus === 'indexed').length;
    const missingMeta = scored.filter((s) => s.metaStatus === 'missing').length;
    const withErrors = scored.filter((s) => s.score < 60).length;
    const avgScore = total ? Math.round(scored.reduce((sum, s) => sum + s.score, 0) / total) : 0;
    const lastUpdated = entries.reduce(
      (max, e) => (e.updatedAt && (!max || e.updatedAt > max) ? e.updatedAt : max), null);

    return res.json({
      success: true,
      data: {
        averageSeoScore: avgScore,
        pages: total,
        indexedPages: indexed,
        notIndexed: total - indexed,
        missingMeta,
        pagesWithErrors: withErrors,
        lastUpdated,
      },
    });
  } catch (err) {
    logger.error('[CMS/SEO] summary failed', err);
    return res.status(500).json({ success: false, message: 'Could not compute the SEO summary.' });
  }
};

// GET /api/cms/seo/pages?search=&status=&sort=&page=&limit=
export const listPages = async (req, res) => {
  try {
    const { search, status, sort } = req.query;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

    const filter = scopeFor(req);
    if (status && ['draft', 'scheduled', 'published', 'archived'].includes(status)) {
      filter.status = status;
    }
    if (search) {
      // Escaped: an unescaped user string here is both a wrong-results bug and a
      // ReDoS vector on a large collection.
      const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ title: rx }, { slug: rx }, { 'seo.title': rx }];
    }

    const sortMap = {
      title: { title: 1 },
      updated: { updatedAt: -1 },
      status: { status: 1, updatedAt: -1 },
    };

    const total = await CmsContentEntry.countDocuments(filter);
    const rows = await CmsContentEntry.find(filter)
      .select('title slug path status seo updatedAt contentTypeKey')
      .sort(sortMap[sort] || { updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Score is derived, never stored — so it can never drift from the seo block.
    const pages = rows.map((e) => ({
      ...e,
      seoScore: computeSeoScore(e).score,
      indexStatus: deriveIndexStatus(e),
      metaStatus: deriveMetaStatus(e),
    }));

    return res.json({
      success: true,
      data: { pages, total, page, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    logger.error('[CMS/SEO] list failed', err);
    return res.status(500).json({ success: false, message: 'Could not list pages.' });
  }
};

// GET /api/cms/seo/pages/:id
export const getPage = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid page id.' });
    }
    const entry = await CmsContentEntry.findOne({ _id: req.params.id, ...scopeFor(req) }).lean();
    if (!entry) return res.status(404).json({ success: false, message: 'Page not found.' });

    const { score, checks } = computeSeoScore(entry);
    return res.json({
      success: true,
      data: {
        page: entry,
        score,
        checks,
        presence: derivePresence(entry),
        indexStatus: deriveIndexStatus(entry),
        metaStatus: deriveMetaStatus(entry),
      },
    });
  } catch (err) {
    logger.error('[CMS/SEO] get failed', err);
    return res.status(500).json({ success: false, message: 'Could not load the page.' });
  }
};

// PUT /api/cms/seo/pages/:id  — updates the seo block ONLY
export const updatePageSeo = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid page id.' });
    }
    const entry = await CmsContentEntry.findOne({ _id: req.params.id, ...scopeFor(req) });
    if (!entry) return res.status(404).json({ success: false, message: 'Page not found.' });

    const incoming = req.body?.seo || {};
    SEO_FIELDS.forEach((key) => {
      if (incoming[key] === undefined) return;
      if (key === 'keywords') {
        entry.seo.keywords = (Array.isArray(incoming.keywords) ? incoming.keywords : [])
          .map((k) => String(k).trim())
          .filter(Boolean)
          .slice(0, 25);
        return;
      }
      if (key === 'ogImage') {
        // Media reference or nothing — a bare string would fail cast and 500.
        entry.seo.ogImage = mongoose.isValidObjectId(incoming.ogImage) ? incoming.ogImage : null;
        return;
      }
      entry.seo[key] = incoming[key];
    });

    entry.updatedBy = req.user.userId;
    entry.markModified('seo');
    await entry.save();

    const { score, checks } = computeSeoScore(entry);
    return res.json({
      success: true,
      message: 'SEO settings saved.',
      data: { page: entry.toObject(), score, checks, presence: derivePresence(entry) },
    });
  } catch (err) {
    if (err?.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    logger.error('[CMS/SEO] update failed', err);
    return res.status(500).json({ success: false, message: 'Could not save SEO settings.' });
  }
};

// POST /api/cms/seo/pages — create a bare page to hang SEO settings on
export const createPage = async (req, res) => {
  try {
    const title = String(req.body?.title || '').trim();
    const rawSlug = String(req.body?.slug || '').trim();
    if (!title) return res.status(400).json({ success: false, message: 'A page title is required.' });

    const slug = (rawSlug || title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120);
    if (!slug) return res.status(400).json({ success: false, message: 'Could not derive a slug from that title.' });

    const type = await ensurePageType(req.user.userId);

    const entry = await CmsContentEntry.create({
      contentType: type._id,
      contentTypeKey: type.key,
      title,
      slug,
      path: `/${slug}`,
      status: 'draft',
      seo: {},
      author: req.user.userId,
      createdBy: req.user.userId,
      updatedBy: req.user.userId,
    });

    const { score, checks } = computeSeoScore(entry);
    return res.status(201).json({
      success: true,
      message: 'Page created.',
      data: { page: entry.toObject(), score, checks },
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ success: false, message: 'A page with that slug already exists.' });
    }
    logger.error('[CMS/SEO] create failed', err);
    return res.status(500).json({ success: false, message: 'Could not create the page.' });
  }
};
