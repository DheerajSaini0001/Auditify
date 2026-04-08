/**
 * Signal: Citations and Sources Detection
 * Detects presence of external links, superscript citations, and reference sections.
 * Perplexity prioritizes data that can be cited.
 */

const analyzeCitations = ($) => {
    let score = 0;
    const sources = [];
    
    // Detect external links (potential sources)
    const links = $('a[href^="http"]');
    let externalCount = 0;
    links.each((i, el) => {
        const href = $(el).attr('href');
        if (href && !href.includes(process.env.FRONTEND_URL || 'localhost')) {
            externalCount++;
        }
    });

    // Detect superscript citations like [1], [2] or <sup>1</sup>
    const superscriptCitations = $('sup').length;
    const bracketCitations = $('body').text().match(/\[\d+\]/g)?.length || 0;

    // Detect reference sections
    const hasReferences = $('h2, h3').filter((i, el) => {
        const text = $(el).text().toLowerCase();
        return text.includes('reference') || text.includes('source') || text.includes('bibliography');
    }).length > 0;

    // Scoring logic
    if (externalCount >= 3) score += 40;
    else if (externalCount >= 1) score += 20;

    if (superscriptCitations > 0 || bracketCitations > 0) score += 30;
    
    if (hasReferences) score += 30;

    return {
        signal: "citations",
        score: Math.min(score, 100),
        externalSources: externalCount,
        citationMarkers: superscriptCitations + bracketCitations,
        hasReferenceSection: hasReferences
    };
};

export default analyzeCitations;
