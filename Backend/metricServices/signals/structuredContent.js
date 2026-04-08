/**
 * Signal 4: Structured Content Detection
 * Measures presence of tables and lists.
 */

const analyzeStructuredContent = ($) => {
    const tableCount = $('table').length;
    const ulCount = $('ul').length;
    const olCount = $('ol').length;
    const listCount = ulCount + olCount;

    let score = 0;
    
    // table points (Heavily weighted for Perplexity)
    if (tableCount >= 1) {
        score += 60;
    }
    
    // list points
    if (listCount >= 3) {
        score += 30;
    } else if (listCount >= 1) {
        score += 15;
    }
    
    // table bonus
    if (tableCount >= 2) {
        score += 10;
    }

    score = Math.min(score, 100);

    return {
        signal: "structuredContent",
        score: score,
        tables: tableCount,
        lists: listCount
    };
};

export default analyzeStructuredContent;
