import * as repo from './seo.repository.js';
import logger from '../../utils/logger.js';
import { AppError } from '../../utils/apiResponse.js';
import {
  computeSeoScore,
  derivePresence,
  deriveIndexStatus,
  deriveMetaStatus,
} from '../../services/cms/seoScoreService.js';

/**
 * All SEO business logic (architecture doc §3). Talks to the database only through
 * seo.repository.js, and never touches `req`/`res` — everything here is callable
 * from a job or a script, which is the practical test of whether the layering is
 * real or decorative.
 */

// Writable leaf keys. An allow-list rather than a deny-list, so a field added to the
// model later is closed by default instead of silently becoming client-writable.
const SEO_FIELDS = [
  'title', 'description', 'keywords', 'canonicalUrl', 'noIndex', 'noFollow',
  'ogTitle', 'ogDescription', 'ogImage', 'ogType', 'twitterCard', 'structuredData',
  'keywordSeo', 'schemas', 'advanced',
];

/** Non-privileged callers only ever see and edit entries they authored. */
export const scopeFor = (user) => {
  const base = { deletedAt: null };
  if (['admin', 'super_admin'].includes(user?.role)) return base;
  return { ...base, author: user.userId };
};

const decorate = (entry) => ({
  ...entry,
  seoScore: computeSeoScore(entry).score,
  indexStatus: deriveIndexStatus(entry),
  metaStatus: deriveMetaStatus(entry),
});

export const ensurePageType = async (userId) => {
  const existing = await repo.findPageType();
  if (existing) return existing;
  return repo.createPageType({
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

/**
 * Append a revision. Versions are allocated read-max-plus-one, which is safe without
 * transactions only because of the unique index on {entityType, entityId, version}:
 * a concurrent writer loses and retries here rather than producing a duplicate.
 */
const writeRevision = async ({ entry, action, actor, meta = {}, restoredFromVersion = null }) => {
  const snapshot = entry.toObject ? entry.toObject() : entry;
  const user = await repo.findUserName(actor.userId);
  const changedByName = user?.name || user?.email || 'Unknown user';

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const latest = await repo.findLatestRevision(entry._id);
    try {
      return await repo.createRevision({
        entityType: 'entry',
        entityId: entry._id,
        contentTypeKey: entry.contentTypeKey,
        version: (latest?.version || 0) + 1,
        snapshot,
        action,
        restoredFromVersion,
        changedBy: actor.userId,
        changedByName,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
        sizeBytes: Buffer.byteLength(JSON.stringify(snapshot)),
      });
    } catch (err) {
      if (err?.code === 11000) continue;
      throw err;
    }
  }
  // History is an audit record, not the operation — never fail a user's save because
  // the trail could not be written, but make the gap loud.
  logger.error('[seo.service] could not allocate a revision version after 4 attempts');
  return null;
};

export const getSummary = async (user) => {
  const entries = await repo.findAllForSummary(scopeFor(user));
  const scored = entries.map((e) => ({
    score: computeSeoScore(e).score,
    indexStatus: deriveIndexStatus(e),
    metaStatus: deriveMetaStatus(e),
  }));
  const total = scored.length;
  const indexed = scored.filter((s) => s.indexStatus === 'indexed').length;
  return {
    averageSeoScore: total ? Math.round(scored.reduce((s, x) => s + x.score, 0) / total) : 0,
    pages: total,
    indexedPages: indexed,
    notIndexed: total - indexed,
    missingMeta: scored.filter((s) => s.metaStatus === 'missing').length,
    pagesWithErrors: scored.filter((s) => s.score < 60).length,
    lastUpdated: entries.reduce((max, e) => (e.updatedAt && (!max || e.updatedAt > max) ? e.updatedAt : max), null),
  };
};

export const listPages = async (user, { search, status, sort, page, limit }) => {
  const scope = scopeFor(user);
  if (status) scope.status = status;
  if (search) {
    // Escaped: an unescaped user string is both a wrong-results bug and a ReDoS vector.
    const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    scope.$or = [{ title: rx }, { slug: rx }, { 'seo.title': rx }];
  }
  const sortMap = { title: { title: 1 }, updated: { updatedAt: -1 }, status: { status: 1, updatedAt: -1 } };
  const total = await repo.countEntries(scope);
  const rows = await repo.findEntries(scope, {
    sort: sortMap[sort] || { updatedAt: -1 },
    skip: (page - 1) * limit,
    limit,
    select: 'title slug path status seo updatedAt contentTypeKey',
  });
  return { pages: rows.map(decorate), total, page, totalPages: Math.ceil(total / limit) || 1 };
};

export const getPage = async (user, id) => {
  const entry = await repo.findEntryLean(id, scopeFor(user));
  if (!entry) throw new AppError('Page not found.', 404);
  const { score, checks } = computeSeoScore(entry);
  return {
    page: entry, score, checks,
    presence: derivePresence(entry),
    indexStatus: deriveIndexStatus(entry),
    metaStatus: deriveMetaStatus(entry),
  };
};

export const updatePageSeo = async (user, id, incoming = {}, meta = {}) => {
  const entry = await repo.findEntryDoc(id, scopeFor(user));
  if (!entry) throw new AppError('Page not found.', 404);

  SEO_FIELDS.forEach((key) => {
    if (incoming[key] === undefined) return;
    if (key === 'keywords') {
      entry.seo.keywords = incoming.keywords.map((k) => String(k).trim()).filter(Boolean).slice(0, 25);
      return;
    }
    if (key === 'ogImage') {
      entry.seo.ogImage = repo.isValidId(incoming.ogImage) ? incoming.ogImage : null;
      return;
    }
    if (key === 'keywordSeo') {
      const current = entry.seo.keywordSeo?.toObject?.() ?? entry.seo.keywordSeo ?? {};
      entry.seo.keywordSeo = { ...current, ...incoming.keywordSeo };
      return;
    }
    if (key === 'advanced') {
      const current = entry.seo.advanced?.toObject?.() ?? entry.seo.advanced ?? {};
      entry.seo.advanced = { ...current, ...incoming.advanced };
      return;
    }
    entry.seo[key] = incoming[key];
  });

  // Keep the flat list and the analysis block in step whichever side was edited, so
  // the head tag and the score can never be computed from different keywords.
  if (!entry.seo.keywordSeo) entry.seo.keywordSeo = {};
  const first = (entry.seo.keywords || []).find((k) => String(k).trim());
  if (entry.seo.keywordSeo.primaryKeyword && !first) {
    entry.seo.keywords = [entry.seo.keywordSeo.primaryKeyword];
  } else if (first) {
    entry.seo.keywordSeo.primaryKeyword = first;
  }
  entry.seo.keywordSeo.presence = derivePresence(entry);

  entry.updatedBy = user.userId;
  entry.markModified('seo');
  await repo.saveEntry(entry);

  // Snapshot AFTER the write: the timeline is "what the page looked like at each
  // point", so restoring vN yields exactly what vN displays.
  await writeRevision({ entry, action: 'UPDATE', actor: user, meta });

  const { score, checks } = computeSeoScore(entry);
  return { page: entry.toObject(), score, checks, presence: derivePresence(entry) };
};

export const createPage = async (user, { title, slug }) => {
  const derived = (slug || title).toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
  if (!derived) throw new AppError('Could not derive a slug from that title.', 400);

  const type = await ensurePageType(user.userId);
  const entry = await repo.createEntry({
    contentType: type._id,
    contentTypeKey: type.key,
    title,
    slug: derived,
    path: `/${derived}`,
    status: 'draft',
    seo: {},
    author: user.userId,
    createdBy: user.userId,
    updatedBy: user.userId,
  });

  const { score, checks } = computeSeoScore(entry);
  return { page: entry.toObject(), score, checks };
};

export const deletePage = async (user, id, meta = {}) => {
  const entry = await repo.findEntryDoc(id, scopeFor(user));
  if (!entry) throw new AppError('Page not found.', 404);

  // Soft delete: deletedAt frees the slug (its uniqueness index is partial on that
  // field) while the row and its revision trail survive for recovery.
  await writeRevision({ entry, action: 'DELETE', actor: user, meta });
  entry.deletedAt = new Date();
  entry.deletedBy = user.userId;
  entry.updatedBy = user.userId;
  await repo.saveEntry(entry);
  return { id: entry._id };
};

export const listRevisions = async (user, id) => {
  const entry = await repo.findEntryLean(id, scopeFor(user));
  if (!entry) throw new AppError('Page not found.', 404);
  return { revisions: await repo.listRevisionsFor(entry._id) };
};

export const rollbackPage = async (user, id, version, meta = {}) => {
  const entry = await repo.findEntryDoc(id, scopeFor(user));
  if (!entry) throw new AppError('Page not found.', 404);

  const revision = await repo.findRevision(entry._id, version);
  if (!revision?.snapshot?.seo) throw new AppError('That version no longer exists.', 404);

  // Restores the seo block ONLY. The snapshot also holds status, author and the data
  // bag; reverting those would turn an SEO undo into an unpublish.
  entry.seo = revision.snapshot.seo;
  entry.updatedBy = user.userId;
  entry.markModified('seo');
  await repo.saveEntry(entry);

  // Rolls forward, never rewrites — the rollback is itself an auditable version.
  await writeRevision({ entry, action: 'ROLLBACK', actor: user, meta, restoredFromVersion: version });

  const { score, checks } = computeSeoScore(entry);
  return { page: entry.toObject(), score, checks };
};

export const importRoutes = async (user, routes) => {
  const type = await ensurePageType(user.userId);
  const created = [];
  const skipped = [];

  for (const route of routes) {
    // '/' has no slug of its own; give the homepage a stable, reserved one.
    const slug = route.path === '/'
      ? 'home'
      : route.path.replace(/^\/+/, '').replace(/\//g, '-').slice(0, 120);

    if (await repo.findEntryBySlug(type.key, slug)) { skipped.push(route.path); continue; }

    await repo.createEntry({
      contentType: type._id,
      contentTypeKey: type.key,
      title: route.title || route.path,
      slug,
      path: route.path,
      // Indexable routes are already live and served, so their entry is published
      // too. noindex routes arrive as drafts — real pages, but nothing should be
      // serving their metadata.
      status: route.noindex ? 'draft' : 'published',
      seo: {
        title: route.title || '',
        description: route.description || '',
        keywords: String(route.keywords || '').split(',').map((k) => k.trim()).filter(Boolean),
        noIndex: !!route.noindex,
        noFollow: !!route.noindex,
      },
      author: user.userId,
      createdBy: user.userId,
      updatedBy: user.userId,
    });
    created.push(route.path);
  }
  return { created, skipped };
};

export const getPublicPageMeta = async (rawPath) => {
  const clean = rawPath.length > 1 ? rawPath.replace(/\/+$/, '') : '/';
  const entry = await repo.findPublishedByPath(clean, clean.replace(/^\//, ''));
  // Not an error: most routes are not CMS-managed and fall back to the static table.
  if (!entry) return { meta: null };

  const seo = entry.seo || {};
  const schemas = (seo.schemas || []).filter((s) => s?.isActive).map((s) => s.jsonLd);
  if (seo.structuredData) schemas.push(seo.structuredData);

  return {
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
      schemas,
      // headerScripts / footerScripts are deliberately NOT exposed: author-supplied
      // script text served to a public page is the stored-XSS path the model warns of.
    },
  };
};
