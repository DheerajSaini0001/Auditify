import axios from 'axios';

/**
 * Signal 2: llms.txt Detection
 * Checks if domain serves a valid /llms.txt file.
 */

const analyzeLlmsTxt = async (url) => {
    try {
        const rootUrl = new URL(url).origin;
        const llmsUrl = `${rootUrl}/llms.txt`;
        
        const response = await axios.get(llmsUrl, { timeout: 5000 });
        
        const contentType = response.headers['content-type'] || '';
        
        let score = 0;
        if (response.status === 200) {
            if (contentType.includes('text/')) {
                score = 100;
            } else {
                score = 50;
            }
        }

        return {
            signal: "llmsTxt",
            score: score,
            exists: response.status === 200,
            url: llmsUrl,
            statusCode: response.status
        };
    } catch (error) {
        return {
            signal: "llmsTxt",
            score: 0,
            exists: false,
            url: `${new URL(url).origin}/llms.txt`,
            statusCode: error.response?.status || 404,
            fetchError: true
        };
    }
};

export default analyzeLlmsTxt;
