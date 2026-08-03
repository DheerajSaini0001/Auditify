import mongoose from 'mongoose';
import { CmsContentEntry, CmsContentType, CmsRevision } from '../../models/cms/index.js';
import User from '../../models/User.js';
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
  'keywordSeo', 'schemas', 'advanced',
];

/** Display name for the revision trail — denormalised so it outlives the account. */
const actorName = async (userId) => {
  const u = await User.findById(userId).select('name email').lean();
  return u?.name || u?.email || 'Unknown user';
};

/**
 * Append a revision. Version numbers are allocated by reading the current max and
 * adding one, and the unique index on {entityType, entityId, version} is what makes
 * that safe without transactions — a concurrent writer loses the race and we retry.
 */
const writeRevision = async ({ entry, action, req, restoredFromVersion = null }) => {
  const snapshot = entry.toObject ? entry.toObject() : entry;
  const name = await actorName(req.user.userId);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const latest = await CmsRevision.findOne({ entityType: 'entry', entityId: entry._id })
      .sort({ version: -1 }).select('version').lean();
    const version = (latest?.version || 0) + 1;
    try {
      return await CmsRevision.create({
        entityType: 'entry',
        entityId: entry._id,
        contentTypeKey: entry.contentTypeKey,
        version,
        snapshot,
        action,
        restoredFromVersion,
        changedBy: req.user.userId,
        changedByName: name,
        ipAddress: req.ip,
        userAgent: req.headers?.['user-agent'],
        sizeBytes: Buffer.byteLength(JSON.stringify(snapshot)),
      });
    } catch (err) {
      if (err?.code === 11000) continue; // lost the race — recompute and retry
      throw err;
    }
  }
  // A revision is an audit record, not the operation itself: never fail the user's
  // save because history could not be written, but do make the gap visible.
  logger.error('[CMS/SEO] could not allocate a revision version after 4 attempts');
  return null;
};

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
      if (key === 'keywordSeo') {
        // presence is derived below — never trust a client-supplied value for it.
        const { presence, ...rest } = incoming.keywordSeo || {};
        entry.seo.keywordSeo = { ...(entry.seo.keywordSeo?.toObject?.() ?? entry.seo.keywordSeo), ...rest };
        return;
      }
      if (key === 'schemas') {
        entry.seo.schemas = (Array.isArray(incoming.schemas) ? incoming.schemas : []).slice(0, 25);
        return;
      }
      if (key === 'advanced') {
        entry.seo.advanced = { ...(entry.seo.advanced?.toObject?.() ?? entry.seo.advanced), ...(incoming.advanced || {}) };
        return;
      }
      entry.seo[key] = incoming[key];
    });

    // Keep the flat list and the analysis block in step, whichever side was edited,
    // so the head tag and the score can never be computed from different keywords.
    if (!entry.seo.keywordSeo) entry.seo.keywordSeo = {};
    const firstKeyword = (entry.seo.keywords || []).find((k) => String(k).trim());
    if (entry.seo.keywordSeo.primaryKeyword && !firstKeyword) {
      entry.seo.keywords = [entry.seo.keywordSeo.primaryKeyword];
    } else if (firstKeyword) {
      entry.seo.keywordSeo.primaryKeyword = firstKeyword;
    }
    entry.seo.keywordSeo.presence = derivePresence(entry);

    entry.updatedBy = req.user.userId;
    entry.markModified('seo');
    await entry.save();

    // Snapshot AFTER the write: the timeline is "what the page looked like at each
    // point", so rolling back to vN restores exactly what vN shows.
    await writeRevision({ entry, action: 'UPDATE', req });

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

// GET /api/cms/seo/pages/:id/revisions — the History tab
export const listRevisions = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid page id.' });
    }
    const entry = await CmsContentEntry.findOne({ _id: req.params.id, ...scopeFor(req) }).select('_id').lean();
    if (!entry) return res.status(404).json({ success: false, message: 'Page not found.' });

    // The snapshot is the payload; the list only needs enough to render a timeline.
    const revisions = await CmsRevision.find({ entityType: 'entry', entityId: entry._id })
      .select('version action changedByName createdAt sizeBytes restoredFromVersion snapshot.seo.title')
      .sort({ version: -1 })
      .limit(50)
      .lean();

    return res.json({ success: true, data: { revisions } });
  } catch (err) {
    logger.error('[CMS/SEO] revisions failed', err);
    return res.status(500).json({ success: false, message: 'Could not load history.' });
  }
};

// POST /api/cms/seo/pages/:id/rollback/:version
export const rollbackPage = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid page id.' });
    }
    const entry = await CmsContentEntry.findOne({ _id: req.params.id, ...scopeFor(req) });
    if (!entry) return res.status(404).json({ success: false, message: 'Page not found.' });

    const version = parseInt(req.params.version, 10);
    const revision = await CmsRevision.findOne({
      entityType: 'entry', entityId: entry._id, version,
    }).lean();
    if (!revision?.snapshot?.seo) {
      return res.status(404).json({ success: false, message: 'That version no longer exists.' });
    }

    // Rolling back only restores the seo block. The snapshot also holds status,
    // author and the data bag, and silently reverting those would turn an SEO undo
    // into an unpublish — a rollback must not do more than the screen implies.
    entry.seo = revision.snapshot.seo;
    entry.updatedBy = req.user.userId;
    entry.markModified('seo');
    await entry.save();

    // Rolling forward, never rewriting: the rollback is itself a new version, so it
    // is auditable and can be undone in turn.
    await writeRevision({ entry, action: 'ROLLBACK', req, restoredFromVersion: version });

    const { score, checks } = computeSeoScore(entry);
    return res.json({
      success: true,
      message: `Rolled back to version ${version}.`,
      data: { page: entry.toObject(), score, checks },
    });
  } catch (err) {
    logger.error('[CMS/SEO] rollback failed', err);
    return res.status(500).json({ success: false, message: 'Could not roll back.' });
  }
};

// DELETE /api/cms/seo/pages/:id — soft delete
export const deletePage = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid page id.' });
    }
    const entry = await CmsContentEntry.findOne({ _id: req.params.id, ...scopeFor(req) });
    if (!entry) return res.status(404).json({ success: false, message: 'Page not found.' });

    // Soft delete. The model carries deletedAt/deletedBy and its slug-uniqueness
    // index is partial on deletedAt:null, so removing a page frees its slug for
    // reuse while the row — and its revision trail — survives for recovery.
    await writeRevision({ entry, action: 'DELETE', req });
    entry.deletedAt = new Date();
    entry.deletedBy = req.user.userId;
    entry.updatedBy = req.user.userId;
    await entry.save();

    return res.json({ success: true, message: 'Page deleted.', data: { id: entry._id } });
  } catch (err) {
    logger.error('[CMS/SEO] delete failed', err);
    return res.status(500).json({ success: false, message: 'Could not delete the page.' });
  }
};

// GET /api/cms/seo/public/page-meta?path=/about  — UNAUTHENTICATED
// The endpoint that makes the dashboard mean anything: without it an editor's title
// and description are stored and never served to a visitor.
export const getPublicPageMeta = async (req, res) => {
  try {
    const raw = String(req.query.path || '/').split('?')[0].split('#')[0];
    const clean = raw.length > 1 ? raw.replace(/\/+$/, '') : '/';
    const slug = clean.replace(/^\//, '');

    const entry = await CmsContentEntry.findOne({
      deletedAt: null,
      status: 'published', // a draft must never leak its metadata to the public
      $or: [{ path: clean }, { slug }],
    }).select('title excerpt seo path slug').lean();

    if (!entry) {
      // Not an error: most routes are not CMS-managed and fall back to the static
      // route table in the frontend.
      return res.json({ success: true, data: { meta: null } });
    }

    const seo = entry.seo || {};
    const activeSchemas = (seo.schemas || []).filter((s) => s?.isActive).map((s) => s.jsonLd);
    if (seo.structuredData) activeSchemas.push(seo.structuredData);

    return res.json({
      success: true,
      data: {
        meta: {
          title: seo.title || entry.title,
          description: seo.description || entry.excerpt || '',
          keywords: (seo.keywords || []).join(', '),
          canonicalUrl: seo.canonicalUrl || '',
          noIndex: !!seo.noIndex,
          noFollow: !!seo.noFollow,
          ogTitle: seo.ogTitle || '',
          ogDescription: seo.ogDescription || '',
          ogType: seo.ogType || 'website',
          twitterCard: seo.twitterCard || 'summary_large_image',
          language: seo.advanced?.language || 'en',
          hreflang: seo.advanced?.hreflang || [],
          schemas: activeSchemas,
          // headerScripts / footerScripts are deliberately NOT exposed. They are
          // author-supplied raw script text; serving them to a public page is the
          // exact stored-XSS path the model warns about.
        },
      },
    });
  } catch (err) {
    logger.error('[CMS/SEO] public page-meta failed', err);
    return res.status(500).json({ success: false, message: 'Could not load page metadata.' });
  }
};

// POST /api/cms/seo/pages/import — populate the CMS from the site's route table
//
// The route table lives in the frontend (Frontend/src/config/seoConfig.js) and the
// two are deployed as separate containers, so the backend cannot read it from disk.
// The client posts it instead: no duplicated list to drift, no cross-package file
// access, and importing stays an explicit action rather than a hidden migration.
export const importRoutes = async (req, res) => {
  try {
    const routes = Array.isArray(req.body?.routes) ? req.body.routes : [];
    if (!routes.length) {
      return res.status(400).json({ success: false, message: 'No routes supplied.' });
    }

    const type = await ensurePageType(req.user.userId);
    const created = [];
    const skipped = [];

    for (const route of routes.slice(0, 200)) {
      const path = String(route.path || '').trim();
      if (!path.startsWith('/')) continue;

      // '/' has no slug of its own; give the homepage a stable, reserved one.
      const slug = path === '/' ? 'home' : path.replace(/^\/+/, '').replace(/\//g, '-').slice(0, 120);

      const exists = await CmsContentEntry.findOne({
        contentTypeKey: type.key, slug, deletedAt: null,
      }).select('_id').lean();
      if (exists) { skipped.push(path); continue; }

      await CmsContentEntry.create({
        contentType: type._id,
        contentTypeKey: type.key,
        title: route.title || path,
        slug,
        path,
        // Indexable routes are already live and served, so the CMS entry that
        // describes them is published too. noindex routes come in as drafts —
        // they are real pages but nothing should be serving their metadata.
        status: route.noindex ? 'draft' : 'published',
        seo: {
          title: route.title || '',
          description: route.description || '',
          keywords: String(route.keywords || '').split(',').map((k) => k.trim()).filter(Boolean),
          noIndex: !!route.noindex,
          noFollow: !!route.noindex,
        },
        author: req.user.userId,
        createdBy: req.user.userId,
        updatedBy: req.user.userId,
      });
      created.push(path);
    }

    return res.json({
      success: true,
      message: `Imported ${created.length} page${created.length === 1 ? '' : 's'}${skipped.length ? `, skipped ${skipped.length} already present` : ''}.`,
      data: { created, skipped },
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ success: false, message: 'A page with that slug already exists.' });
    }
    logger.error('[CMS/SEO] import failed', err);
    return res.status(500).json({ success: false, message: 'Could not import the site pages.' });
  }
};
