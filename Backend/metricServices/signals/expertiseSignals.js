/**
 * Signal 14: Expertise Signals (credentials) — the second "E" of E-E-A-T (INFO-ONLY).
 *
 * Measures on-page proof of QUALIFICATION/credentials (vs. first-hand experience,
 * which is the separate Experience signal). Info-only: similar lens to Experience
 * Signals (author/people credibility), so weighting both would double-count.
 *
 *   • Certifications / accreditation — ASE/manufacturer/factory certified, licensed, BBB (max 35)
 *   • Awards / recognition          — award-winning, dealer of the year, top-rated      (max 25)
 *   • Tenure / track record         — "since 1985", "30+ years", established            (max 20)
 *   • Author / staff credentials     — bylines with titles, Person jobTitle schema       (max 20)
 */

const CERTIFICATIONS = /\base.?certified\b|ase certified|manufacturer.?certified|factory.?certified|certified (technician|pre.?owned|dealer|service)|\bcpo\b|accredited|bbb accredited|\blicensed\b|state.?certified|iso ?\d{3,}|nada certified|master technician/gi;
const AWARDS = /award.?winning|award winner|dealer of the year|best of \w+|top.?rated|#1 (dealer|volume|rated)|five.?star dealer|president'?s award|excellence award|customer satisfaction award|recognized (as|for)/i;
const TENURE = /since (18|19|20)\d{2}|established (in )?(18|19|20)\d{2}|for (over|more than) ?\d{1,3}\+? years|\d{2,3}\+? years (of|in) (business|experience|service|the)|serving .* (since|for)|family.?owned (since|for)/i;
const AUTHOR_LANG = /about the author|written by|reviewed by|our (certified|expert|specialist)|meet our (specialist|expert|advisor)/i;

const analyzeExpertiseSignals = (url, $) => {
    try {
        const text = $('body').text();
        const ld = $('script[type="application/ld+json"]').text() || '';

        // ── Certifications (max 35) ──
        const certHits = new Set((text.match(CERTIFICATIONS) || []).map((m) => m.toLowerCase())).size;
        const credentials = certHits >= 3 ? 35 : certHits === 2 ? 26 : certHits === 1 ? 16 : 0;

        // ── Awards (max 25) ──
        const awards = AWARDS.test(text) ? 25 : 0;

        // ── Tenure (max 20) ──
        const tenure = TENURE.test(text) ? 20 : 0;

        // ── Author / staff credentials (max 20) ──
        const hasByline = $('[class*="author"], [rel="author"], [class*="byline"], [class*="credential"]').length > 0;
        const hasJobTitle = /"jobtitle"/i.test(ld);
        const hasAuthorLang = AUTHOR_LANG.test(text);
        const authorExpertise = [hasByline, hasJobTitle, hasAuthorLang].filter(Boolean).length >= 2 ? 20
            : [hasByline, hasJobTitle, hasAuthorLang].some(Boolean) ? 11 : 0;

        const breakdown = { credentials, awards, tenure, authorExpertise };
        const score = Math.min(100, credentials + awards + tenure + authorExpertise);

        const issues = [];
        if (credentials < 35) issues.push('Surface certifications/accreditations (ASE, manufacturer-certified, BBB accredited, licensed) prominently on the page.');
        if (!awards) issues.push('Showcase any awards or recognition ("Dealer of the Year", "Top-Rated", customer-satisfaction awards).');
        if (!tenure) issues.push('State your track record — years in business ("Serving the area since 1995", "30+ years").');
        if (authorExpertise < 20) issues.push('Attribute content to credentialed people — author bylines with titles and Person/jobTitle schema.');

        const reason = score >= 80
            ? '✅ Strong expertise: clear certifications, recognition, and a stated track record.'
            : `⚠️ Expertise/credentials are thin (${score}/100). ${issues.slice(0, 2).join(' ')}`;

        return { signal: 'expertiseSignals', score, source: 'on-page', breakdown, certificationCount: certHits, issues, reason };
    } catch (error) {
        return { signal: 'expertiseSignals', score: 50, source: 'on-page', breakdown: { credentials: 0, awards: 0, tenure: 0, authorExpertise: 0 }, issues: [`Expertise signals check failed: ${error.message}`], error: error.message };
    }
};

export default analyzeExpertiseSignals;
