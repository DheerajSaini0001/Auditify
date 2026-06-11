import axios from 'axios';
import configService from '../../services/configService.js';

/**
 * Signal 10: Brand Entity Strength (INFO-ONLY — not part of the weighted score).
 *
 * Where Entity Recognition asks "can a machine identify this business?", Brand
 * Entity Strength asks "how authoritative/established is that entity?" — a graded
 * 0–100 strength meter built from the *magnitude* of brand signals:
 *
 *   • sameAs BREADTH        — how many social/profile links (5+ ≫ 1)        (max 30)
 *   • AUTHORITATIVE profile — Wikipedia / Wikidata (or KG detailedDescription) (max 25)
 *   • REVIEW VOLUME         — aggregateRating + reviewCount (100+ ≫ a handful) (max 25)
 *   • BRAND COMPLETENESS    — foundingDate / description / award / logo        (max 20)
 *
 * Reaches 100 on-page alone for a top-tier brand, so it isn't stuck low just
 * because the Knowledge Graph API is disabled. NOT included (need paid/heavy
 * infra): backlink counts, branded search volume, social follower counts.
 */

const KG_TIMEOUT = 6000;
const UA = 'Mozilla/5.0 (compatible; DealerPulseAudit/1.0; +https://dealerpulse.app)';

const ORG_TYPE = (t) => {
    const s = String(t).toLowerCase();
    return s === 'organization' || s === 'corporation' || s === 'store'
        || s.includes('business') || s.includes('dealer');
};

const collectObjects = (node, out) => {
    if (Array.isArray(node)) node.forEach((n) => collectObjects(n, out));
    else if (node && typeof node === 'object') {
        out.push(node);
        if (node['@graph']) collectObjects(node['@graph'], out);
    }
};

const typesOf = (obj) => {
    const t = obj['@type'];
    if (!t) return [];
    return Array.isArray(t) ? t.map(String) : [String(t)];
};

const hasValue = (v) => {
    if (!v) return false;
    if (typeof v === 'string') return v.trim().length > 0;
    if (typeof v === 'object') return Object.keys(v).length > 0;
    return false;
};

const toArray = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const hostnameOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return null; } };

const AUTH_HOST = /(wikipedia\.org|wikidata\.org)/i;
const SEMI_AUTH_HOST = /(crunchbase\.com|bbb\.org)/i;

// Pull the richest identity entity and its brand-strength fields from JSON-LD.
const extractBrand = ($) => {
    const objects = [];
    $('script[type="application/ld+json"]').each((_, el) => {
        try { collectObjects(JSON.parse($(el).html()), objects); } catch { /* skip bad block */ }
    });

    const orgs = objects.filter((o) => typesOf(o).some(ORG_TYPE) && hasValue(o.name));
    if (!orgs.length) return null;

    const completeness = (o) => ['sameAs', 'aggregateRating', 'foundingDate', 'description', 'slogan', 'award', 'logo']
        .filter((k) => hasValue(o[k])).length;
    orgs.sort((a, b) => completeness(b) - completeness(a));
    const org = orgs[0];

    const sameAs = toArray(org.sameAs).filter(hasValue).map(String);
    const rating = org.aggregateRating || {};
    const reviewCount = parseInt(rating.reviewCount ?? rating.ratingCount ?? 0, 10) || 0;

    return {
        name: String(org.name).trim(),
        sameAs,
        hasWikipediaLink: sameAs.some((s) => AUTH_HOST.test(s)),
        hasSemiAuthLink: sameAs.some((s) => SEMI_AUTH_HOST.test(s)),
        hasRating: hasValue(org.aggregateRating),
        reviewCount,
        hasFoundingDate: hasValue(org.foundingDate),
        hasDescription: hasValue(org.description) || hasValue(org.slogan),
        hasAward: hasValue(org.award),
        hasLogo: hasValue(org.logo) || hasValue(org.image),
    };
};

const deriveQueryName = ($, brand) => {
    if (brand?.name) return brand.name;
    const og = $('meta[property="og:site_name"]').attr('content');
    if (hasValue(og)) return og.trim();
    const title = $('title').first().text();
    if (hasValue(title)) return title.split(/[|\-–—]/)[0].trim();
    return null;
};

// KG lookup, capturing resultScore + whether the entity has a Wikipedia description.
const queryKnowledgeGraph = async (name, domain) => {
    // Prefer the dedicated Knowledge Graph key; fall back to the shared API_KEY.
    const API_KEY = configService.getConfig('KG_API_KEY') || configService.getConfig('API_KEY');
    if (!API_KEY || !name) return null;
    try {
        const endpoint = 'https://kgsearch.googleapis.com/v1/entities:search'
            + `?query=${encodeURIComponent(name)}&key=${API_KEY}&limit=5&indent=false`;
        const res = await axios.get(endpoint, { timeout: KG_TIMEOUT, headers: { 'User-Agent': UA }, validateStatus: () => true });
        if (res.status !== 200 || !res.data) return null; // 403 = API not enabled → fall back

        const items = res.data.itemListElement || [];
        if (!items.length) return { checked: true, found: false, resultScore: 0, hasWikipedia: false };

        // Scan the top candidates; prefer a url-domain match, else a name-token overlap.
        const q = name.toLowerCase();
        const firstToken = q.split(/\s+/)[0];
        const evals = items.map((it) => {
            const r = it.result || {};
            const rn = String(r.name || '').toLowerCase();
            const nameMatch = rn && (q.includes(rn) || rn.includes(q) || (firstToken.length > 2 && rn.includes(firstToken)));
            const urlMatch = r.url && domain && hostnameOf(r.url) === domain;
            const hasWikipedia = Boolean(r.detailedDescription && /wikipedia\.org/i.test(r.detailedDescription.url || ''));
            return { nameMatch, urlMatch, name: r.name || null, score: it.resultScore ?? 0, hasWikipedia };
        });
        const best = evals.find((e) => e.urlMatch) || evals.filter((e) => e.nameMatch).sort((a, b) => b.score - a.score)[0];
        if (best) return { checked: true, found: true, resultScore: best.score, name: best.name, hasWikipedia: best.hasWikipedia };
        return { checked: true, found: false, resultScore: evals[0].score, name: evals[0].name, hasWikipedia: false };
    } catch {
        return null;
    }
};

const sameAsPoints = (n) => (n >= 5 ? 30 : n >= 3 ? 22 : n >= 1 ? 12 : 0);
const reviewPoints = (brand) => {
    if (!brand.hasRating) return 0;
    if (brand.reviewCount >= 100) return 25;
    if (brand.reviewCount >= 20) return 18;
    if (brand.reviewCount >= 1) return 10;
    return 8; // rating present but no count
};
const completenessPoints = (brand) =>
    (brand.hasFoundingDate ? 5 : 0) + (brand.hasDescription ? 5 : 0) + (brand.hasAward ? 5 : 0) + (brand.hasLogo ? 5 : 0);

const tierOf = (score) =>
    score >= 85 ? 'Strong' : score >= 55 ? 'Moderate' : score >= 30 ? 'Emerging' : 'Weak';

const analyzeBrandEntityStrength = async (url, $, useKnowledgeGraph = true) => {
    try {
        const brand = extractBrand($);
        const queryName = deriveQueryName($, brand);
        const domain = hostnameOf(url);

        let kg = null;
        if (useKnowledgeGraph) kg = await queryKnowledgeGraph(queryName, domain);

        if (!brand) {
            const score = kg?.found ? 35 : 15; // recognized in KG but no on-page brand data
            return {
                signal: 'brandEntityStrength',
                score,
                source: kg ? 'on-page+kg' : 'on-page',
                tier: tierOf(score),
                breakdown: { sameAs: 0, authoritative: kg?.found ? 10 : 0, reviews: 0, completeness: 0 },
                knowledgeGraph: kg,
                issues: ['No Organization/LocalBusiness schema — no on-page brand signals to measure.'],
                reason: '⚠️ Weak brand entity: no Organization schema, so there are no on-page brand-strength signals (sameAs, reviews, awards) to measure.',
            };
        }

        const sameAs = sameAsPoints(brand.sameAs.length);
        let authoritative = 0;
        if (brand.hasWikipediaLink || kg?.hasWikipedia) authoritative = 25;
        else if (brand.hasSemiAuthLink) authoritative = 12;
        else if (kg?.found) authoritative = 10;
        const reviews = reviewPoints(brand);
        const completeness = completenessPoints(brand);

        const score = Math.min(100, sameAs + authoritative + reviews + completeness);
        const tier = tierOf(score);

        const issues = [];
        if (brand.sameAs.length < 5) issues.push(`Only ${brand.sameAs.length} sameAs profile link(s) — broaden your verified social/brand footprint.`);
        if (authoritative === 0) issues.push('No Wikipedia/Wikidata presence — the strongest brand-authority signal.');
        if (!brand.hasRating) issues.push('No aggregateRating schema — review volume is a key trust signal.');
        else if (brand.reviewCount < 20) issues.push(`Only ${brand.reviewCount} reviews in schema — low review volume.`);

        const reason = tier === 'Strong'
            ? `💪 Strong brand entity: broad sameAs footprint${authoritative >= 25 ? ', Wikipedia-level authority' : ''}${brand.reviewCount >= 100 ? `, ${brand.reviewCount}+ reviews` : ''}. Engines treat this as a well-established brand.`
            : `⚠️ ${tier} brand entity (${score}/100). ${issues.join(' ')}`;

        return {
            signal: 'brandEntityStrength',
            score,
            source: kg ? 'on-page+kg' : 'on-page',
            tier,
            breakdown: { sameAs, authoritative, reviews, completeness },
            sameAsCount: brand.sameAs.length,
            reviewCount: brand.reviewCount,
            knowledgeGraph: kg,
            issues,
            reason,
        };
    } catch (error) {
        return {
            signal: 'brandEntityStrength',
            score: 50,
            source: 'on-page',
            tier: 'Moderate',
            breakdown: { sameAs: 0, authoritative: 0, reviews: 0, completeness: 0 },
            knowledgeGraph: null,
            issues: [`Brand entity strength check failed: ${error.message}`],
            error: error.message,
        };
    }
};

export default analyzeBrandEntityStrength;
