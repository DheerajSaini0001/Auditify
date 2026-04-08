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
    
    // table points
    if (tableCount >= 1) {
        score += 40;
    }
    
    // list points
    if (listCount >= 3) {
        score += 40;
    } else if (listCount >= 1) {
        score += 20;
    }
    
    // table bonus
    if (tableCount >= 3) {
        score += 20;
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
