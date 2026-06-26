import axios from 'axios';
import configService from '../../services/configService.js';

/**
 * Signal 9: Knowledge Graph & Entity Recognition.
 *
 * Two parts:
 *   A. On-page entity recognition (always runs, free): does the page declare a
 *      machine-readable identity via Organization / LocalBusiness JSON-LD with the
 *      essentials (name, address, logo, sameAs)? Falls back to og:site_name / <title>.
 *   B. Knowledge Graph presence (optional, needs API_KEY): query Google's Knowledge
 *      Graph Search API for the detected business name — does a recognized entity
 *      node exist? KG presence is a BONUS, never a penalty: many legitimate local
 *      dealerships aren't in the KG even when perfectly marked up, so a well-formed
 *      on-page identity can already reach a top score on its own.
 *
 * It measures whether machines can confidently identify *who this site is* — the
 * foundation for being cited/recommended by search and AI answer engines.
 */

const KG_TIMEOUT = 6000;
const KG_BONUS = 20;            // points added when a KG entity is confirmed (capped at 100)
const UA = 'Mozilla/5.0 (compatible; DealerPulseAudit/1.0; +https://dealerpulse.app)';

const ORG_TYPE = (t) => {
    const s = String(t).toLowerCase();
    return s === 'organization' || s === 'corporation' || s === 'store'
        || s.includes('business') || s.includes('dealer');
};

// Recursively gather every JSON-LD object (including @graph children).
const collectObjects = (node, out) => {
    if (Array.isArray(node)) {
        node.forEach((n) => collectObjects(n, out));
    } else if (node && typeof node === 'object') {
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

// Pull the best identity entity out of the page's JSON-LD.
const extractOrgEntity = ($) => {
    const objects = [];
    $('script[type="application/ld+json"]').each((_, el) => {
        try { collectObjects(JSON.parse($(el).html()), objects); } catch { /* skip bad block */ }
    });

    const orgs = objects.filter((o) => typesOf(o).some(ORG_TYPE) && hasValue(o.name));
    if (!orgs.length) return null;

    // Prefer the most complete entity (more identity fields populated).
    const scoreCompleteness = (o) =>
        ['name', 'address', 'logo', 'image', 'url', 'telephone', 'sameAs'].filter((k) => hasValue(o[k])).length;
    orgs.sort((a, b) => scoreCompleteness(b) - scoreCompleteness(a));
    const org = orgs[0];

    return {
        type: typesOf(org)[0] || 'Organization',
        name: String(org.name).trim(),
        hasAddress: hasValue(org.address),
        hasLogo: hasValue(org.logo) || hasValue(org.image),
        hasTelephone: hasValue(org.telephone),
        sameAs: toArray(org.sameAs).filter(hasValue),
    };
};

// Derive a name to query the Knowledge Graph with, from schema → og:site_name → <title>.
const deriveQueryName = ($, orgEntity) => {
    if (orgEntity?.name) return orgEntity.name;
    const og = $('meta[property="og:site_name"]').attr('content');
    if (hasValue(og)) return og.trim();
    const title = $('title').first().text();
    if (hasValue(title)) return title.split(/[|\-–—]/)[0].trim(); // strip "| Tagline"
    return null;
};

const hostnameOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return null; } };

// Query the Knowledge Graph Search API. Returns null if unavailable (no key / API
// not enabled / error) so the signal cleanly falls back to on-page-only.
const queryKnowledgeGraph = async (name, domain) => {
    // Prefer the dedicated Knowledge Graph key; fall back to the shared API_KEY.
    const API_KEY = configService.getConfig('KG_API_KEY') || configService.getConfig('API_KEY');
    if (!API_KEY || !name) return null;

    try {
        const endpoint = 'https://kgsearch.googleapis.com/v1/entities:search'
            + `?query=${encodeURIComponent(name)}&key=${API_KEY}&limit=5&indent=false`;
        const res = await axios.get(endpoint, {
            timeout: KG_TIMEOUT,
            headers: { 'User-Agent': UA },
            validateStatus: () => true,
        });
        if (res.status !== 200 || !res.data) return null; // 403 = API not enabled → fall back

        const items = res.data.itemListElement || [];
        if (!items.length) return { checked: true, found: false, resultScore: 0, name: null };

        // Scan the top candidates and accept the best match — a result whose url
        // domain matches the site (strongest), else a name-token overlap. Conservative
        // on purpose: better a false "not found" than crediting a different entity.
        const q = name.toLowerCase();
        const firstToken = q.split(/\s+/)[0];
        const evals = items.map((it) => {
            const r = it.result || {};
            const rn = String(r.name || '').toLowerCase();
            const nameMatch = rn && (q.includes(rn) || rn.includes(q) || (firstToken.length > 2 && rn.includes(firstToken)));
            const urlMatch = r.url && domain && hostnameOf(r.url) === domain;
            return { nameMatch, urlMatch, name: r.name || null, score: it.resultScore ?? 0 };
        });
        const best = evals.find((e) => e.urlMatch) || evals.filter((e) => e.nameMatch).sort((a, b) => b.score - a.score)[0];
        if (best) return { checked: true, found: true, resultScore: best.score, name: best.name };
        return { checked: true, found: false, resultScore: evals[0].score, name: evals[0].name };
    } catch {
        return null;
    }
};

// On-page identity → base score.
const baseScore = (orgEntity, hasFallbackName) => {
    if (orgEntity) {
        const hasSameAs = orgEntity.sameAs.length >= 1;
        if (orgEntity.hasAddress && hasSameAs) return 100; // complete identity, KG not required
        if (orgEntity.hasAddress) return 80;               // address but no sameAs links
        if (hasSameAs) return 75;                          // graph-linked but no postal address
        return 60;                                         // named org only
    }
    return hasFallbackName ? 40 : 20;
};

const analyzeEntityRecognition = async (url, $, useKnowledgeGraph = true) => {
    try {
        const orgEntity = extractOrgEntity($);
        const queryName = deriveQueryName($, orgEntity);
        const domain = hostnameOf(url);

        const base = baseScore(orgEntity, hasValue(queryName));

        let kg = null;
        if (useKnowledgeGraph) kg = await queryKnowledgeGraph(queryName, domain);

        let score = base;
        if (kg?.found) score = Math.min(100, base + KG_BONUS);

        const source = kg ? 'on-page+kg' : 'on-page';

        // Build issues + a human-readable reason.
        const issues = [];
        if (!orgEntity) {
            issues.push('No Organization/LocalBusiness JSON-LD found.');
        } else {
            if (!orgEntity.hasAddress) issues.push('Organization schema missing a postal address.');
            if (orgEntity.sameAs.length === 0) issues.push('No sameAs links (social/Wikipedia profiles).');
            if (!orgEntity.hasLogo) issues.push('Organization schema missing a logo.');
        }
        if (kg && !kg.found) issues.push('Not found as a distinct entity in the Knowledge Graph.');

        let reason;
        if (score >= 100) {
            reason = kg?.found
                ? `✅ Why: Strong identity — complete Organization schema and a recognized Knowledge Graph entity ("${kg.name}").`
                : `✅ Why: Complete Organization/LocalBusiness schema with address and sameAs links — machines can confidently identify this business.`;
        } else if (orgEntity) {
            reason = `⚠️ Why no: Organization schema present but incomplete. ${issues.join(' ')}`;
        } else {
            reason = `⚠️ Why no: No machine-readable identity (Organization/LocalBusiness JSON-LD). Engines can't confidently recognize this business as an entity.`;
        }

        return {
            signal: 'entityRecognition',
            score,
            source,
            orgSchema: orgEntity
                ? {
                    found: true,
                    type: orgEntity.type,
                    name: orgEntity.name,
                    hasAddress: orgEntity.hasAddress,
                    hasLogo: orgEntity.hasLogo,
                    sameAsCount: orgEntity.sameAs.length,
                    sameAs: orgEntity.sameAs,
                }
                : { found: false },
            knowledgeGraph: kg,
            issues,
            reason,
        };
    } catch (error) {
        // Neutral score on unexpected failure (don't unfairly tank the audit).
        return {
            signal: 'entityRecognition',
            score: 50,
            source: 'on-page',
            orgSchema: { found: false },
            knowledgeGraph: null,
            issues: [`Entity recognition check failed: ${error.message}`],
            error: error.message,
        };
    }
};

export default analyzeEntityRecognition;
