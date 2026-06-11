/**
 * Signal 13: Experience Signals — first-hand expertise (INFO-ONLY, not weighted).
 *
 * The "E" (Experience) in E-E-A-T: does the page demonstrate real, first-hand,
 * hands-on experience — or is it generic/stock filler? On-page only (no external
 * API can measure first-hand experience). Info-only to avoid double-counting the
 * review signal already used by Brand Entity Strength.
 *
 *   • Reviews / testimonials proof   — Review schema, testimonial sections, stars  (max 25)
 *   • Original media                  — image richness + alt coverage, video, gallery (max 30)
 *   • First-person experiential voice — we/our/us + experiential phrases            (max 25)
 *   • Real people / staff presence    — "meet our team", staff photos, Person schema (max 20)
 */

const TESTIMONIAL = /testimonial|what (our )?(customers|clients) say|customer review|client review|hear from our|reviews? from|happy customers|5.?star/i;
const STAFF = /meet (our|the) team|our (team|staff|sales team|service team|technicians|experts|people)|about us/i;
const EXPERIENTIAL = [
    /\bwe (offer|provide|have|test|drive|inspect|service|sell|help|deliver|recommend|carry|stock)/i,
    /our (team|staff|customers|experience|inventory|service|technicians|experts|family|dealership)/i,
    /hands.?on/i,
    /in our experience/i,
    /years of experience|decades of/i,
    /we'?ve (helped|served|been|sold)/i,
    /come (visit|see) (us|our)/i,
    /family.?owned|locally owned|family.?run/i,
];

const ORG_OR_PERSON = /"@type"\s*:\s*"?(Review|Person)"?/i;

const analyzeExperienceSignals = (url, $) => {
    try {
        const bodyText = $('body').text();
        const ldText = $('script[type="application/ld+json"]').text() || '';

        // ── Reviews / testimonials (max 25) ──
        const hasReviewSchema = ORG_OR_PERSON.test(ldText) || /"aggregaterating"/i.test(ldText);
        const hasTestimonial = TESTIMONIAL.test(bodyText);
        const hasStars = $('[class*="star"], [class*="rating"], [class*="review"]').length > 0;
        let reviews = 0;
        if (hasReviewSchema) reviews += 12;
        if (hasTestimonial) reviews += 8;
        if (hasStars) reviews += 5;
        reviews = Math.min(25, reviews);

        // ── Original media (max 30) ──
        const imgs = $('img');
        const imgCount = imgs.length;
        let withAlt = 0;
        imgs.each((_, el) => { if (($(el).attr('alt') || '').trim().length > 0) withAlt += 1; });
        const altRatio = imgCount ? withAlt / imgCount : 0;
        const hasVideo = $('iframe[src*="youtube"], iframe[src*="vimeo"], video').length > 0;
        const hasGallery = $('[class*="gallery"], [class*="carousel"], [class*="slider"], [class*="lightbox"]').length > 0;
        let media = 0;
        media += imgCount >= 20 ? 12 : imgCount >= 8 ? 8 : imgCount >= 3 ? 4 : 0;
        media += altRatio >= 0.7 ? 8 : altRatio >= 0.4 ? 5 : altRatio > 0 ? 2 : 0;
        if (hasVideo) media += 6;
        if (hasGallery) media += 4;
        media = Math.min(30, media);

        // ── First-person experiential voice (max 25) ──
        const pronounMatches = (bodyText.match(/\b(we|our|us|we'?re|we'?ve)\b/gi) || []).length;
        const experientialHits = EXPERIENTIAL.filter((re) => re.test(bodyText)).length;
        let firstPerson = 0;
        firstPerson += pronounMatches >= 15 ? 12 : pronounMatches >= 6 ? 8 : pronounMatches >= 1 ? 4 : 0;
        firstPerson += experientialHits >= 3 ? 13 : experientialHits >= 1 ? 7 : 0;
        firstPerson = Math.min(25, firstPerson);

        // ── Real people / staff (max 20) ──
        const hasStaffSection = STAFF.test(bodyText);
        const hasPersonSchema = /"@type"\s*:\s*"?Person"?/i.test(ldText);
        const hasByline = $('[class*="author"], [rel="author"], [class*="byline"]').length > 0;
        let people = 0;
        if (hasStaffSection) people += 10;
        if (hasPersonSchema) people += 6;
        if (hasByline) people += 4;
        people = Math.min(20, people);

        const breakdown = { reviews, media, firstPerson, people };
        const score = Math.min(100, reviews + media + firstPerson + people);

        const issues = [];
        if (reviews < 25) issues.push('Add genuine customer testimonials with Review/aggregateRating schema to prove real customer experience.');
        if (media < 30) issues.push('Add original photos of your actual inventory, staff, and lot (with descriptive alt text), plus a walkaround video — not stock imagery.');
        if (firstPerson < 25) issues.push("Write in a first-person, experiential voice ('we test every trade-in', 'our team') instead of generic copy.");
        if (people < 20) issues.push('Add a "Meet our team" section with real staff photos/bios (and Person schema) to show the humans behind the dealership.');

        const reason = score >= 80
            ? '✅ Strong first-hand experience: original media, real customer proof, and an authentic operator voice.'
            : `⚠️ Experience signals are limited (${score}/100). ${issues.slice(0, 2).join(' ')}`;

        return {
            signal: 'experienceSignals',
            score,
            source: 'on-page',
            breakdown,
            imageCount: imgCount,
            altCoverage: Math.round(altRatio * 100),
            hasVideo,
            issues,
            reason,
        };
    } catch (error) {
        return {
            signal: 'experienceSignals',
            score: 50,
            source: 'on-page',
            breakdown: { reviews: 0, media: 0, firstPerson: 0, people: 0 },
            issues: [`Experience signals check failed: ${error.message}`],
            error: error.message,
        };
    }
};

export default analyzeExperienceSignals;
