import axios from 'axios';
import Puppeteer_Simple from '../../utils/puppeteer_simple.js';

/**
 * Signal 2: llms.txt Detection
 * Checks if domain serves a valid /llms.txt file.
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

const analyzeLlmsTxt = async (url) => {
    try {
        const rootUrl = new URL(url).origin;
        const llmsUrl = `${rootUrl}/llms.txt`;

        // /llms.txt is a static text file — fetch fast with axios; escalate to the
        // stealth browser only if a WAF blocks the plain request (not on a clean 404).
        let status = 0;
        let html = '';
        try {
            const resp = await axios.get(llmsUrl, {
                timeout: 6000,
                maxRedirects: 3,
                responseType: 'text',
                transformResponse: [(d) => d],
                headers: { 'User-Agent': UA, Accept: 'text/plain,*/*' },
                validateStatus: () => true,
            });
            status = resp.status;
            html = typeof resp.data === 'string' ? resp.data : '';
        } catch { status = 0; }

        if (status !== 200 && status !== 404) {
            try {
                const r = await Puppeteer_Simple(llmsUrl);
                if (r.browser) await r.browser.close();
                status = r.status;
                html = r.html;
            } catch { /* keep axios result */ }
        }

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
