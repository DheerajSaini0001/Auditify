/**
 * Signal: Trust Signals (Citations + Transparency).
 *
 * Two halves:
 *   • Citations (max 45)            — outbound sources, citation markers, references
 *   • Policies (max 20)             — privacy / terms / contact / about pages
 *   • Contact transparency (max 20) — click-to-call, physical address, author bylines
 *   • Trust basics (max 15)         — HTTPS, disclosure/editorial statement, dated content
 *
 * (Previously this only scored citations and the "transparency" half was unmeasured.
 * It also compared external links against the audit app's FRONTEND_URL instead of the
 * audited site's domain — fixed here by using the real site hostname.)
 */

const requiresThirdPartyCitations = (text) => {
    const lower = String(text || '').toLowerCase();
    const patterns = [
        /\b(according to|study shows|research indicates|statistics? show|survey found|data from)\b/i,
        /\b(clinical trial|medical study|scientific research|scientific study|peer-reviewed)\b/i,
        /\b(regulatory standard|federal law|epa compliance|nhtsa regulation|ftc guideline|fcc regulation)\b/i,
        /\b(independent study|statistical report|industry survey|survey of|research study|according to studies)\b/i,
    ];
    return patterns.some(re => re.test(lower));
};

const analyzeCitations = ($, url = '') => {
    const text = $('body').text();
    let siteHost = '';
    try { siteHost = new URL(url).hostname.replace(/^www\./, ''); } catch { /* no url */ }

    // ── Citations (max 45) ──
    let externalCount = 0;
    $('a[href^="http"]').each((i, el) => {
        const href = $(el).attr('href') || '';
        try {
            const h = new URL(href).hostname.replace(/^www\./, '');
            if (h && h !== siteHost) externalCount += 1;
        } catch { /* malformed href */ }
    });
    const superscriptCitations = $('sup').length;
    const bracketCitations = (text.match(/\[\d+\]/g) || []).length;
    const hasReferences = $('h2, h3').filter((i, el) => {
        const t = $(el).text().toLowerCase();
        return t.includes('reference') || t.includes('source') || t.includes('bibliograph');
    }).length > 0;

    const needsVerification = requiresThirdPartyCitations(text);
    let citations = 0;
    if (needsVerification) {
        citations += externalCount >= 3 ? 20 : externalCount >= 1 ? 12 : 0;
        citations += (superscriptCitations > 0 || bracketCitations > 0) ? 12 : 0;
        citations += hasReferences ? 13 : 0; // max 45
    } else {
        citations = 45; // business website is the primary authoritative source for self-sourced content
    }

    // ── Policies (max 20) ── privacy / terms / contact / about
    const linkBlobs = [];
    $('a[href]').each((i, el) => linkBlobs.push(((($(el).attr('href') || '') + ' ' + $(el).text())).toLowerCase()));
    const hasLink = (re) => linkBlobs.some((s) => re.test(s));
    const hasPrivacy = hasLink(/privacy/);
    const hasTerms = hasLink(/terms|conditions|\btos\b/);
    const hasContact = hasLink(/contact/) || /contact us/i.test(text);
    const hasAbout = hasLink(/about/);
    const policies = (hasPrivacy ? 5 : 0) + (hasTerms ? 5 : 0) + (hasContact ? 5 : 0) + (hasAbout ? 5 : 0);

    // ── Contact transparency (max 20) ──
    const hasTel = $('a[href^="tel:"]').length > 0;
    const hasAddress = $('address, [class*="address"], [itemprop="address"]').length > 0
        || /\b\d{1,5}\s+\w+(\s+\w+){0,3}\s+(st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane|way|hwy|highway|suite|ste)\b/i.test(text);
    const hasAuthor = $('[class*="author"], [rel="author"], [class*="byline"]').length > 0 || /written by|reviewed by|author:/i.test(text);
    const contactTransparency = (hasTel ? 8 : 0) + (hasAddress ? 6 : 0) + (hasAuthor ? 6 : 0);

    // ── Trust basics (max 15) ──
    const isHttps = /^https:/i.test(url);
    const hasDisclosure = /disclosure|disclaimer|affiliate|editorial (policy|guidelines|standards)/i.test(text);
    const hasUpdated = $('time').length > 0 || /last updated|updated on|published on|©\s*\d{4}|copyright\s*\d{4}/i.test(text);
    const trustBasics = (isHttps ? 6 : 0) + (hasDisclosure ? 5 : 0) + (hasUpdated ? 4 : 0);

    const breakdown = { citations, policies, contactTransparency, trustBasics };
    const score = Math.min(100, citations + policies + contactTransparency + trustBasics);

    const issues = [];
    if (needsVerification && citations < 45) issues.push('Add at least 3 links to outside sources, use number markers like [1] in your text, and include a References list at the bottom.');
    if (policies < 20) {
        const missing = [!hasPrivacy && 'Privacy Policy', !hasTerms && 'Terms of Service', !hasContact && 'Contact Us', !hasAbout && 'About Us'].filter(Boolean);
        if (missing.length) issues.push(`Add links to standard policy pages: ${missing.join(', ')}.`);
    }
    if (contactTransparency < 20) {
        const missing = [!hasTel && 'a clickable phone number', !hasAddress && 'a physical address', !hasAuthor && 'author bylines'].filter(Boolean);
        if (missing.length) issues.push(`Make contact details clear: add ${missing.join(', ')}.`);
    }
    if (trustBasics < 15) {
        const missing = [!isHttps && 'use a secure HTTPS connection', !hasDisclosure && 'add a disclosure statement', !hasUpdated && 'show copyright or update dates'].filter(Boolean);
        if (missing.length) issues.push(`Add basic trust signals: ${missing.join(', ')}.`);
    }

    const reason = score >= 100
        ? '✅ Why: Strong trust signals — cited sources, clear policy pages, transparent contact details, secure HTTPS link, and update dates.'
        : `⚠️ Why no: Trust signals incomplete (${score}/100). ${issues.slice(0, 2).join(' ')}`;

    return {
        signal: 'citations',
        score,
        externalSources: externalCount,
        citationMarkers: superscriptCitations + bracketCitations,
        hasReferenceSection: hasReferences,
        needsVerification,
        breakdown,
        transparency: { hasPrivacy, hasTerms, hasContact, hasAbout, hasTel, hasAddress, hasAuthor, isHttps, hasDisclosure, hasUpdated },
        issues,
        reason,
    };
};

export default analyzeCitations;
