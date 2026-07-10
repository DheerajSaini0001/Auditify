// ─────────────────────────────────────────────────────────────────────────────
// AI link-relevance judge — semantic "is this link contextual?" decision.
//
// WHY THIS EXISTS
// The deterministic matcher in shared/linkSemantics.js compares anchor-text tokens
// against URL tokens using hand-maintained synonym groups. That can never keep up with
// natural language: "Pre-Owned" ≈ "Used", "Browse our range" ≈ /inventory,
// "Meet the crew" ≈ /about/team — the words differ but the MEANING is the same. Rather
// than bolt on another synonym list every time a mismatch is reported, this module asks
// a model to judge relatedness the way a human reviewer would.
//
// CONTRACT
//   • Gated on GEMINI_API_KEY. No key → returns null, and every caller falls back to the
//     deterministic matcher, so audits still run offline with zero behaviour change.
//   • One batched call per ~30 links (not one call per link). Deduped and cached across
//     pages within the process, so a header/footer link seen on every page is judged once.
//   • Returns a Map keyed by (text, href); entries missing from the Map (a failed batch,
//     a link past the cap) are simply absent → the caller falls back per-link.
//   • Never throws to the caller: any API/parse/timeout error degrades to the fallback.
// ─────────────────────────────────────────────────────────────────────────────

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import configService from '../services/configService.js';
import logger from '../utils/logger.js';

const MODEL = 'gemini-2.5-flash';
const MAX_LINKS = 90;       // hard cap of links judged per page (rest fall back to rules)
const BATCH_SIZE = 30;      // links per Gemini call
const BATCH_TIMEOUT_MS = 25000;

// Process-lifetime cache: identical (text, href) pairs recur constantly across a
// multi-page audit (nav, footer, brand logo), so judge each pair only once.
const _cache = new Map();

const _norm = (s, n) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, n);
const cacheKey = (text, href) => `${_norm(text, 140)}\n${_norm(href, 300)}`;

export const aiRelevanceAvailable = () => !!configService.getConfig('GEMINI_API_KEY');

const RESPONSE_SCHEMA = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      i: { type: SchemaType.INTEGER, description: 'The index number of the link being judged' },
      contextual: { type: SchemaType.BOOLEAN, description: 'true if the anchor text and destination are about the same thing' },
      reason: { type: SchemaType.STRING, description: 'Short (max 12 words) explanation of the verdict' },
    },
    required: ['i', 'contextual'],
  },
};

const buildPrompt = (batch, ctx) => {
  const lines = batch.map((l, i) => {
    // Prefer visible anchor text; fall back to the image alt/aria text the crawler captured.
    const text = (l.text && l.text !== '[No Text]') ? l.text : (l.altText ? `[image: ${l.altText}]` : '[no text / icon]');
    return `${i}. TEXT: ${JSON.stringify(String(text).slice(0, 140))}  →  URL: ${JSON.stringify(String(l.href).slice(0, 300))}`;
  }).join('\n');

  return `You are an SEO reviewer auditing the INTERNAL/OUTBOUND links of a car-dealership web page.

PAGE BEING AUDITED:
  URL:   ${ctx.pageUrl || '(unknown)'}
  Title: ${ctx.pageTitle || '(unknown)'}

For EACH link below decide whether it is CONTEXTUAL. A link is contextual when a reader
would find the anchor text an honest, meaningful description of where the link goes —
judged by MEANING, not string overlap. Apply real-world and automotive knowledge:

  • Synonyms / paraphrases count as a match: "Pre-Owned" = "Used", "Vehicles" = "Cars"
    = "Autos", "Browse our range" = /inventory, "Meet the team" = /about/staff,
    "Get approved" = /finance, "Book a service" = /service-appointment.
  • Abbreviations/acronyms count: "CPO" = certified pre-owned, "MY24" = model year 2024.
  • The dealership's own BRAND or business NAME pointing at the homepage ("/") IS
    contextual — it is the standard logo/masthead → home pattern.
  • A link INTO a content hub (blog, guide, news, article, press, review, resource) IS
    contextual, even if the anchor is a headline whose words don't overlap the slug.
  • Vague anchors ("click here", "read more", "learn more") are contextual ONLY if the
    destination URL is itself descriptive/on-topic; otherwise not.
  • Phone/mailto/social share widgets and truly unrelated destinations are NOT contextual.

Return a JSON array with one object per link: {"i": <index>, "contextual": <bool>, "reason": "<short>"}.

LINKS:
${lines}`;
};

// Run ONE batch through Gemini. Returns an array of {i, contextual, reason} or [] on failure.
const classifyBatch = async (model, batch, ctx) => {
  try {
    const call = model.generateContent(buildPrompt(batch, ctx));
    const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('ai-link-timeout')), BATCH_TIMEOUT_MS));
    const result = await Promise.race([call, timeout]);
    const raw = result?.response?.text?.() || '';
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    logger.warn(`[AI Link Relevance] batch failed (${batch.length} links): ${err?.message || err}`);
    return [];
  }
};

/**
 * Judge a list of links for contextual relevance.
 * @param {Array<{href:string,text:string,altText?:string}>} links
 * @param {{pageUrl?:string,pageTitle?:string}} ctx
 * @returns {Promise<Map<string,{contextual:boolean,reason:string}>|null>} verdicts, or null if AI unavailable
 */
export async function classifyLinks(links, ctx = {}) {
  const apiKey = configService.getConfig('GEMINI_API_KEY');
  if (!apiKey) return null;
  if (!Array.isArray(links) || links.length === 0) return new Map();

  const out = new Map();

  // 1) De-duplicate by (text, href) and serve anything already cached.
  const uniques = new Map(); // cacheKey -> link
  for (const l of links) {
    if (!l || !l.href) continue;
    const k = cacheKey(l.text, l.href);
    if (_cache.has(k)) { out.set(k, _cache.get(k)); continue; }
    if (!uniques.has(k)) uniques.set(k, l);
  }

  let toJudge = Array.from(uniques.entries()); // [ [key, link], ... ]
  if (toJudge.length === 0) return out;

  // 2) Cap to protect quota/latency. Anything past the cap is left unresolved so the
  //    caller falls back to the deterministic matcher (logged, never silently dropped).
  if (toJudge.length > MAX_LINKS) {
    logger.info(`[AI Link Relevance] ${toJudge.length} unique links exceed cap ${MAX_LINKS}; judging first ${MAX_LINKS}, rest use rule-based fallback.`);
    toJudge = toJudge.slice(0, MAX_LINKS);
  }

  let model;
  try {
    model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
      model: MODEL,
      generationConfig: { responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA, temperature: 0 },
    });
  } catch (err) {
    logger.warn(`[AI Link Relevance] model init failed: ${err?.message || err}`);
    return null; // treat as unavailable → full deterministic fallback
  }

  // 3) Judge in batches, in parallel.
  const batches = [];
  for (let i = 0; i < toJudge.length; i += BATCH_SIZE) batches.push(toJudge.slice(i, i + BATCH_SIZE));

  const batchResults = await Promise.all(batches.map(async (batch) => {
    const batchLinks = batch.map(([, l]) => l);
    const verdicts = await classifyBatch(model, batchLinks, ctx);
    return { batch, verdicts };
  }));

  for (const { batch, verdicts } of batchResults) {
    for (const v of verdicts) {
      const entry = batch[v.i];
      if (!entry) continue;
      const [k] = entry;
      const decision = { contextual: !!v.contextual, reason: String(v.reason || '').slice(0, 120) };
      _cache.set(k, decision);
      out.set(k, decision);
    }
  }

  return out;
}

// Look up a single link's verdict from a Map returned by classifyLinks. null when absent.
export const verdictFor = (verdicts, text, href) => {
  if (!verdicts) return null;
  return verdicts.get(cacheKey(text, href)) || null;
};
