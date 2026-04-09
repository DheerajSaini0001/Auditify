/**
 * Signal 1: Answer-First Detection
 * Evaluates whether the page provides a direct answer summary in the first 100 words.
 */

const analyzeAnswerFirst = ($) => {
    // Clone body to avoid mutating original
    const bodyCopy = $('body').clone();
    
    // Remove unwanted elements
    bodyCopy.find('script, style, nav, header, footer, aside').remove();
    
    // Extract text and split into words
    const text = bodyCopy.text().trim();
    const first100Words = text.split(/\s+/).slice(0, 100).join(' ');
    
    // Simple sentence count logic
    const sentences = first100Words.match(/[^.!?]+[.!?]+/g) || [];
    const sentenceCount = sentences.length;
    
    let score = 0;
    // AI models love short 1-2 sentence direct answers
    if (sentenceCount >= 1 && sentenceCount <= 2) {
        score = 100;
    } else if (sentenceCount > 2 && sentenceCount <= 4) {
        // A bit wordy
        score = 60;
    } else if (sentenceCount > 4) {
        // Too wordy
        score = 30;
    } else {
        score = 0;
    }

    return {
        signal: "answerFirst",
        score: score,
        sentenceCount: sentenceCount,
        found: sentenceCount > 0
    };
};

export default analyzeAnswerFirst;
