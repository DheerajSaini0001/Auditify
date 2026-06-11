/**
 * Signal 11: Citation Consistency (NAP / Brand Consistency).
 *
 * NAP = Name, Address, Phone. True citation consistency means the same NAP across
 * every external directory (GBP, Yelp, etc.) — that needs a paid citation API, so
 * this measures the realistic, on-page proxy: do the business's identity details
 * AGREE across every source ON THE PAGE?
 *
 *   • Phone consistency  — schema `telephone` vs every tel: click-to-call link      (max 25)
 *   • Name/brand match   — schema name vs og:site_name vs <title> brand             (max 20)
 *   • NAP completeness   — name + address + phone present in machine-readable form  (max 40)
 *   • Address completeness — street + locality + postal in the PostalAddress        (max 15)
 *
 * Conflicting phone numbers or brand-name variants are the common, real problem this
 * catches. (Future upgrade when billing is available: compare against the Google
 * Business Profile via the Places API for a true external citation check.)
 */

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

// Normalize a phone to its last 10 digits for comparison (ignores formatting/country code).
const normPhone = (s) => {
    const d = String(s || '').replace(/\D/g, '');
    return d.length >= 10 ? d.slice(-10) : null;
};

// Normalize a brand name for loose comparison.
const normName = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

// Two brand names are "consistent" if one contains the other or they share a 3+ char token.
const namesAgree = (a, b) => {
    const na = normName(a); const nb = normName(b);
    if (!na || !nb) return true; // can't disprove with a missing source
    if (na.includes(nb) || nb.includes(na)) return true;
    const ta = new Set(na.split(' ').filter((w) => w.length >= 3));
    return nb.split(' ').some((w) => w.length >= 3 && ta.has(w));
};

const analyzeCitationConsistency = (url, $) => {
    try {
        // ── Gather org schema ──
        const objects = [];
        $('script[type="application/ld+json"]').each((_, el) => {
            try { collectObjects(JSON.parse($(el).html()), objects); } catch { /* skip */ }
        });
        const org = objects.find((o) => typesOf(o).some(ORG_TYPE) && hasValue(o.name)) || null;

        const schemaName = org ? String(org.name).trim() : null;
        const schemaPhone = org && hasValue(org.telephone) ? String(org.telephone) : null;
        const addr = org && org.address && typeof org.address === 'object' ? org.address : null;
        const addrString = org && typeof org.address === 'string' ? org.address : null;

        // ── Brand-name sources ──
        const ogSiteName = $('meta[property="og:site_name"]').attr('content') || null;
        const titleBrand = ($('title').first().text() || '').split(/[|\-–—]/)[0].trim() || null;

        // ── Phone sources: schema telephone + every tel: link ──
        const phones = [];
        if (schemaPhone) phones.push(schemaPhone);
        $('a[href^="tel:"]').each((_, el) => {
            const href = ($(el).attr('href') || '').replace(/^tel:/i, '');
            if (href) phones.push(href);
        });
        const distinctPhones = [...new Set(phones.map(normPhone).filter(Boolean))];
        const phonePresent = distinctPhones.length > 0;

        // ── Scoring ──
        // 1) NAP completeness (machine-readable) — name 10 / address 15 / phone 15
        const completeness = (schemaName ? 10 : 0)
            + (addr || addrString ? 15 : 0)
            + (schemaPhone ? 15 : 0);

        // 2) Phone consistency across all on-page sources
        let phoneConsistency;
        if (!phonePresent) phoneConsistency = 0;
        else if (distinctPhones.length === 1) phoneConsistency = 25;
        else phoneConsistency = 5; // conflicting numbers — the core problem

        // 3) Name/brand consistency across schema / og / title
        const presentNames = [schemaName, ogSiteName, titleBrand].filter(hasValue);
        let nameConsistency;
        if (presentNames.length >= 2) {
            let consistent = true;
            for (let i = 0; i < presentNames.length; i++)
                for (let j = i + 1; j < presentNames.length; j++)
                    if (!namesAgree(presentNames[i], presentNames[j])) consistent = false;
            nameConsistency = consistent ? 20 : 5;
        } else if (presentNames.length === 1) {
            nameConsistency = 15; // single source — can't cross-verify
        } else {
            nameConsistency = 0;
        }

        // 4) Address completeness
        let addressCompleteness = 0;
        if (addr) {
            const parts = ['streetAddress', 'addressLocality', 'postalCode'].filter((k) => hasValue(addr[k])).length;
            addressCompleteness = parts >= 3 ? 15 : parts >= 1 ? 8 : 0;
        } else if (addrString) {
            addressCompleteness = 8;
        }

        const score = Math.min(100, completeness + phoneConsistency + nameConsistency + addressCompleteness);

        // ── Issues + reason ──
        const issues = [];
        if (distinctPhones.length > 1) issues.push(`Conflicting phone numbers on the page (${distinctPhones.length} different numbers) — pick one canonical number.`);
        if (!schemaPhone && !phonePresent) issues.push('No phone number found in schema or tel: links.');
        if (presentNames.length >= 2 && nameConsistency === 5) issues.push('Brand name differs across schema / og:site_name / title — standardize one exact name.');
        if (!org) issues.push('No Organization/LocalBusiness schema — NAP is not machine-readable.');
        else {
            if (!schemaName) issues.push('Schema missing business name.');
            if (!addr && !addrString) issues.push('Schema missing postal address.');
            if (!schemaPhone) issues.push('Schema missing telephone.');
        }

        const reason = score >= 100
            ? '✅ Why: Consistent NAP — one matching name, address, and phone across schema, tel: links, and brand tags. Engines can state your details with confidence.'
            : `⚠️ Why no: NAP/brand consistency is incomplete (${score}/100). ${issues.join(' ')}`;

        return {
            signal: 'citationConsistency',
            score,
            source: 'on-page',
            breakdown: { completeness, phoneConsistency, nameConsistency, addressCompleteness },
            distinctPhoneCount: distinctPhones.length,
            schemaName,
            hasSchemaAddress: Boolean(addr || addrString),
            hasSchemaPhone: Boolean(schemaPhone),
            issues,
            reason,
        };
    } catch (error) {
        return {
            signal: 'citationConsistency',
            score: 50,
            source: 'on-page',
            breakdown: { completeness: 0, phoneConsistency: 0, nameConsistency: 0, addressCompleteness: 0 },
            issues: [`Citation consistency check failed: ${error.message}`],
            error: error.message,
        };
    }
};

export default analyzeCitationConsistency;
