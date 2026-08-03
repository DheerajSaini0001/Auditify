/**
 * seoScoreService — pure, dependency-free scoring for a CmsContentEntry's `seo` block.
 *
 * Deliberately has NOTHING to do with the audit pillars in metricServices/. That
 * scoring grades somebody else's live site from a crawl; this grades whether OUR
 * editor has filled in the fields we control, and is recomputed on every save so
 * the dashboard can show the effect of an edit before it is persisted.
 *
 * Returns 0-100 plus the per-check breakdown the right rail renders, so the score
 * is never a bare number the editor has to reverse-engineer.
 */

const has = (s) => !!(s && s.toString().trim().length);
const lc = (s) => (s || '').toString().toLowerCase();

/** Case-insensitive "does `text` contain `keyword`". */
const contains = (text, keyword) => {
  if (!has(text) || !has(keyword)) return false;
  return lc(text).includes(lc(keyword));
};

/**
 * The first keyword is treated as the focus keyword — the CMS seo block stores a
 * flat `keywords` array rather than a separate focusKeyword field, and ordering is
 * the only signal of intent we have.
 */
export const focusKeywordOf = (seo) => {
  const list = Array.isArray(seo?.keywords) ? seo.keywords : [];
  return list.find((k) => has(k)) || '';
};

/**
 * Where the focus keyword actually appears. Title/description/slug are the fields
 * this dashboard owns; anything needing page body text would require a crawl and
 * is deliberately out of scope.
 */
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

/**
 * Weighted checklist → percentage. Weights are the SERP-impact ordering: the title
 * and description carry the most because they are what actually renders in results.
 *
 * The length bands are Google's truncation points, matching the maxlengths already
 * declared on seoSchema (title 70, description 200) rather than inventing new ones.
 */
export const computeSeoScore = (entry) => {
  const seo = entry?.seo || {};
  const title = seo.title || '';
  const description = seo.description || '';
  const kw = focusKeywordOf(seo);
  const keywords = Array.isArray(seo.keywords) ? seo.keywords.filter(has) : [];

  const checks = [
    {
      id: 'title-present',
      label: 'SEO title is set',
      hint: 'Falls back to the entry title in search results when empty.',
      weight: 12,
      passed: has(title),
    },
    {
      id: 'title-length',
      label: 'Title is 30–60 characters',
      hint: 'Longer titles get truncated in Google results.',
      weight: 12,
      passed: title.length >= 30 && title.length <= 60,
    },
    {
      id: 'description-present',
      label: 'Meta description is set',
      hint: 'Without one, Google invents a snippet from the page body.',
      weight: 12,
      passed: has(description),
    },
    {
      id: 'description-length',
      label: 'Description is 70–160 characters',
      hint: 'Under 70 wastes the slot; over 160 gets cut off.',
      weight: 12,
      passed: description.length >= 70 && description.length <= 160,
    },
    {
      id: 'focus-keyword',
      label: 'At least one keyword is set',
      hint: 'The first keyword is treated as the focus keyword.',
      weight: 10,
      passed: keywords.length > 0,
    },
    {
      id: 'keyword-in-title',
      label: 'Focus keyword appears in the title',
      weight: 10,
      passed: contains(title || entry?.title, kw),
    },
    {
      id: 'keyword-in-slug',
      label: 'Focus keyword appears in the slug',
      weight: 8,
      passed: contains(entry?.slug, kw) || contains(entry?.path, kw),
    },
    {
      id: 'canonical',
      label: 'Canonical URL is set',
      hint: 'Points duplicate URLs at the version you want ranked.',
      weight: 8,
      passed: has(seo.canonicalUrl),
    },
    {
      id: 'og-tags',
      label: 'Open Graph title and image are set',
      hint: 'Controls how the page looks when shared.',
      weight: 8,
      passed: has(seo.ogTitle) && !!seo.ogImage,
    },
    {
      id: 'structured-data',
      label: 'Structured data (JSON-LD) is present',
      weight: 8,
      passed: !!seo.structuredData && Object.keys(seo.structuredData || {}).length > 0,
    },
  ];

  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const earned = checks.reduce((sum, c) => sum + (c.passed ? c.weight : 0), 0);
  const score = totalWeight ? Math.round((earned / totalWeight) * 100) : 0;

  return { score, checks };
};

/**
 * Whether this entry is eligible to be indexed. `noIndex` is the author's explicit
 * instruction; a non-published entry is not reachable regardless of what it says.
 */
export const deriveIndexStatus = (entry) => {
  if (entry?.seo?.noIndex) return 'excluded';
  if (entry?.status !== 'published') return 'not_indexed';
  return 'indexed';
};

export const deriveMetaStatus = (entry) => (has(entry?.seo?.description) ? 'ok' : 'missing');

export default { computeSeoScore, derivePresence, deriveIndexStatus, deriveMetaStatus, focusKeywordOf };
