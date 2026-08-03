/**
 * Client mirror of Backend/services/cms/seoScoreService.js.
 *
 * It exists so the score and checklist update as the editor types, before anything
 * is saved. The server stays authoritative — every save returns the server's score,
 * which replaces this one. Keep the two files in step: if a check is added or a
 * weight changes on the server, change it here too, or a saved page will visibly
 * jump to a different number the moment the response lands.
 */

const has = (s) => !!(s && s.toString().trim().length);
const lc = (s) => (s || '').toString().toLowerCase();

const contains = (text, keyword) => {
  if (!has(text) || !has(keyword)) return false;
  return lc(text).includes(lc(keyword));
};

/** First non-empty keyword is the focus keyword — same rule as the server. */
export const focusKeywordOf = (seo) => {
  const list = Array.isArray(seo?.keywords) ? seo.keywords : [];
  return list.find((k) => has(k)) || '';
};

export const derivePresence = (entry) => {
  const seo = entry?.seo || {};
  const kw = focusKeywordOf(seo);
  return {
    title: contains(seo.title || entry?.title, kw),
    description: contains(seo.description, kw),
    slug: contains(entry?.slug, kw) || contains(entry?.path, kw),
    excerpt: contains(entry?.excerpt, kw),
  };
};

export const computeClientScore = (entry) => {
  const seo = entry?.seo || {};
  const title = seo.title || '';
  const description = seo.description || '';
  const kw = focusKeywordOf(seo);
  const keywords = Array.isArray(seo.keywords) ? seo.keywords.filter(has) : [];

  const checks = [
    { id: 'title-present', label: 'SEO title is set', weight: 12, passed: has(title) },
    { id: 'title-length', label: 'Title is 30–60 characters', weight: 12, passed: title.length >= 30 && title.length <= 60 },
    { id: 'description-present', label: 'Meta description is set', weight: 12, passed: has(description) },
    { id: 'description-length', label: 'Description is 70–160 characters', weight: 12, passed: description.length >= 70 && description.length <= 160 },
    { id: 'focus-keyword', label: 'At least one keyword is set', weight: 10, passed: keywords.length > 0 },
    { id: 'keyword-in-title', label: 'Focus keyword appears in the title', weight: 10, passed: contains(title || entry?.title, kw) },
    { id: 'keyword-in-slug', label: 'Focus keyword appears in the slug', weight: 8, passed: contains(entry?.slug, kw) || contains(entry?.path, kw) },
    { id: 'canonical', label: 'Canonical URL is set', weight: 8, passed: has(seo.canonicalUrl) },
    { id: 'og-tags', label: 'Open Graph title and image are set', weight: 8, passed: has(seo.ogTitle) && !!seo.ogImage },
    { id: 'structured-data', label: 'Structured data (JSON-LD) is present', weight: 8, passed: !!seo.structuredData && Object.keys(seo.structuredData || {}).length > 0 },
  ];

  const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
  const earned = checks.reduce((s, c) => s + (c.passed ? c.weight : 0), 0);
  return { score: totalWeight ? Math.round((earned / totalWeight) * 100) : 0, checks };
};

export const scoreTone = (score) => {
  if (score >= 80) return 'good';
  if (score >= 60) return 'ok';
  return 'poor';
};

export default { computeClientScore, derivePresence, focusKeywordOf, scoreTone };
