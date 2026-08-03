import { z } from 'zod';

/**
 * Zod shapes for the SEO module (architecture doc §6/§8).
 *
 * Kept separate from the Mongoose schema on purpose: Mongoose describes what may be
 * STORED, this describes what a client may SEND. They are different questions —
 * `presence` is a stored field but is derived server-side and must be rejected here.
 */

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid id');

const hreflangEntry = z.object({
  lang: z.string().trim().max(10).optional(),
  url: z.string().trim().max(2048).optional(),
});

const schemaBlock = z.object({
  _id: z.any().optional(),
  type: z.enum([
    'Organization', 'WebSite', 'FAQPage', 'Article', 'Product', 'BreadcrumbList',
    'Review', 'VideoObject', 'Person', 'Event', 'LocalBusiness',
  ]),
  jsonLd: z.any().optional(),
  isActive: z.boolean().optional(),
  generatedBy: z.enum(['manual', 'ai']).optional(),
});

// `presence` is deliberately absent — it is derived on save, and accepting it would
// let a client claim its keyword appears in fields where it does not.
const keywordSeo = z.object({
  primaryKeyword: z.string().trim().max(120).optional(),
  secondaryKeywords: z.array(z.string().trim().max(120)).max(50).optional(),
  relatedKeywords: z.array(z.string().trim().max(120)).max(50).optional(),
  density: z.number().min(0).max(100).optional(),
  position: z.number().int().min(0).max(1000).optional(),
  searchIntent: z.enum(['informational', 'navigational', 'transactional', 'commercial', '']).optional(),
}).strict();

const advanced = z.object({
  hreflang: z.array(hreflangEntry).max(50).optional(),
  language: z.string().trim().max(20).optional(),
  pageRedirect: z.object({
    type: z.union([z.literal(301), z.literal(302), z.null()]).optional(),
    target: z.string().trim().max(2048).optional(),
  }).optional(),
  headerScripts: z.string().max(20000).optional(),
  footerScripts: z.string().max(20000).optional(),
}).strict();

export const seoBlockSchema = z.object({
  title: z.string().trim().max(70).optional(),
  description: z.string().trim().max(200).optional(),
  keywords: z.array(z.string().trim().max(120)).max(25).optional(),
  canonicalUrl: z.string().trim().max(2048).optional(),
  noIndex: z.boolean().optional(),
  noFollow: z.boolean().optional(),
  ogTitle: z.string().trim().max(95).optional(),
  ogDescription: z.string().trim().max(200).optional(),
  ogImage: z.union([objectId, z.null()]).optional(),
  ogType: z.string().trim().max(40).optional(),
  twitterCard: z.enum(['summary', 'summary_large_image']).optional(),
  structuredData: z.any().optional(),
  keywordSeo: keywordSeo.optional(),
  schemas: z.array(schemaBlock).max(25).optional(),
  advanced: advanced.optional(),
}).strict(); // an unknown key is a client bug or an attack — say so rather than ignore

export const idParam = z.object({ id: objectId });

export const rollbackParams = z.object({
  id: objectId,
  version: z.coerce.number().int().positive(),
});

export const listQuery = z.object({
  search: z.string().trim().max(200).optional(),
  status: z.enum(['draft', 'scheduled', 'published', 'archived']).optional(),
  sort: z.enum(['title', 'updated', 'status']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const createPageBody = z.object({
  title: z.string().trim().min(1, 'A page title is required.').max(300),
  slug: z.string().trim().max(120).optional(),
});

export const updateSeoBody = z.object({ seo: seoBlockSchema });

export const importBody = z.object({
  routes: z.array(z.object({
    path: z.string().startsWith('/', 'Path must start with /').max(300),
    title: z.string().max(300).optional(),
    description: z.string().max(500).optional(),
    keywords: z.string().max(500).optional(),
    noindex: z.boolean().optional(),
  })).min(1, 'No routes supplied.').max(200),
});

export const publicMetaQuery = z.object({
  path: z.string().max(300).default('/'),
});
