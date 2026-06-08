import Puppeteer_Simple from '../../utils/puppeteer_simple.js';

/**
 * Signal 2: llms.txt Detection
 * Checks if domain serves a valid /llms.txt file.
 */

const analyzeLlmsTxt = async (url) => {
    try {
        const rootUrl = new URL(url).origin;
        const llmsUrl = `${rootUrl}/llms.txt`;
        
        const { html, status, browser } = await Puppeteer_Simple(llmsUrl);
        if (browser) await browser.close();
        
        let score = 0;
        if (status === 200) {
            // Check if it looks like a text file or has content
            if (html && html.length > 10) {
                score = 100;
            } else {
                score = 50;
            }
        }

        return {
            signal: "llmsTxt",
            score: score,
            exists: status === 200,
            url: llmsUrl,
            statusCode: status
        };
    } catch (error) {
        return {
            signal: "llmsTxt",
            score: 0,
            exists: false,
            url: `${new URL(url).origin}/llms.txt`,
            statusCode: 404,
            fetchError: true
        };
    }
};

export default analyzeLlmsTxt;
