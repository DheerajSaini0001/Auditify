/**
 * Signal 4: Structured Content Detection
 * Measures presence of tables and lists.
 */

const analyzeStructuredContent = ($) => {
    const tableCount = $('table').length;
    const ulCount = $('ul').length;
    const olCount = $('ol').length;
    const imgCount = $('img').length;
    const listCount = ulCount + olCount;

    let score = 0;
    
    // table points (Heavily weighted for Perplexity)
    if (tableCount >= 1) {
        score += 70;
    } else if (imgCount > 5) {
        // Data might be in images
        score += 10;
    }
    
    // list points
    if (listCount >= 3) {
        score += 30;
    } else if (listCount >= 1) {
        score += 15;
    }

    score = Math.min(score, 100);

    return {
        signal: "structuredContent",
        score: score,
        tables: tableCount,
        lists: listCount,
        images: imgCount,
        dataStuckInImages: tableCount === 0 && imgCount > 3
    };
};

export default analyzeStructuredContent;
