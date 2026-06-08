/**
 * Signal: Markdown-style Headers Detection
 * Evaluates the hierarchical structure of headers (H1-H6).
 * ChatGPT and other LLMs prefer a clean Markdown-like structure.
 */

const analyzeMarkdownHeaders = ($) => {
    const headers = [];
    $('h1, h2, h3, h4, h5, h6').each((i, el) => {
        headers.push({
            level: parseInt(el.tagName.substring(1)),
            text: $(el).text().trim()
        });
    });

    let score = 0;
    const reasons = [];
    
    const h1s = headers.filter(h => h.level === 1);
    const h2s = headers.filter(h => h.level === 2);
    const h3s = headers.filter(h => h.level === 3);

    // 1. H1 check (Exactly one is best)
    if (h1s.length === 1) {
        score += 40;
    } else if (h1s.length > 1) {
        score += 20;
        reasons.push("Multiple H1 tags detected; single H1 is better for structure.");
    } else {
        reasons.push("Missing H1 tag.");
    }

    // 2. H2 presence
    if (h2s.length >= 2) {
        score += 40;
    } else if (h2s.length === 1) {
        score += 20;
        reasons.push("Only one H2 detected; more sub-headers improve structure.");
    } else {
        reasons.push("Missing H2 tags.");
    }

    // 3. Hierarchy progression check (Skips)
    let hasSkips = false;
    for (let i = 0; i < headers.length - 1; i++) {
        const current = headers[i].level;
        const next = headers[i+1].level;
        // Skipping a level (e.g. H2 to H4) is bad practice
        if (next > current + 1) {
            hasSkips = true;
            reasons.push(`Hierarchy skip: H${current} to H${next} detected.`);
            break;
        }
    }

    if (!hasSkips && headers.length > 0) {
        score += 20;
    }

    // H3 bonus if no skips and present
    if (h3s.length >= 2 && !hasSkips) {
        score = Math.min(score + 10, 100);
    }

    return {
        signal: "markdownHeaders",
        score: Math.min(score, 100),
        counts: { 
            h1: h1s.length, 
            h2: h2s.length, 
            h3: h3s.length 
        },
        reasons,
        reason: reasons.length > 0 ? reasons[0] : "Your page is perfectly optimized for this Answer Engine signal."
    };
};

export default analyzeMarkdownHeaders;

