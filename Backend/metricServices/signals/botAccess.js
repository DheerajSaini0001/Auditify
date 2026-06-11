import axios from 'axios';
import Puppeteer_Simple from '../../utils/puppeteer_simple.js';

/**
 * Signal 5: Bot Accessibility Detection
 * Fetches and parses robots.txt for AI bots and checks meta robots.
 * Reflects "Google Search Index Status".
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

// robots.txt is a static text file. Fetch it fast with axios; only escalate to the
// stealth browser (slow) if a WAF appears to block the plain request — never for a
// clean 404 (which just means "no robots.txt", i.e. everything allowed).
const fetchRobots = async (robotsUrl) => {
    try {
        const resp = await axios.get(robotsUrl, {
            timeout: 6000,
            maxRedirects: 3,
            responseType: 'text',
            transformResponse: [(d) => d],
            headers: { 'User-Agent': UA, Accept: 'text/plain,*/*' },
            validateStatus: () => true,
        });
        if (resp.status === 200 || resp.status === 404) {
            return { status: resp.status, content: typeof resp.data === 'string' ? resp.data : '' };
        }
    } catch { /* fall through to browser */ }

    try {
        const r = await Puppeteer_Simple(robotsUrl);
        if (r.browser) await r.browser.close();
        return { status: r.status, content: r.html };
    } catch {
        return { status: 0, content: '' };
    }
};

const analyzeBotAccess = async (url, $) => {
    try {
        const rootUrl = new URL(url).origin;
        const robotsUrl = `${rootUrl}/robots.txt`;
        
        let robotsScore = 100;
        const bots = ["GPTBot", "Google-Extended", "PerplexityBot"];
        const results = {
            GPTBot: "allowed",
            "Google-Extended": "allowed",
            PerplexityBot: "allowed"
        };

        try {
            const { status, content } = await fetchRobots(robotsUrl);

            if (status === 200 && content) {
                const lines = content.split(/\r?\n/);
                let currentAgents = [];

                for (let line of lines) {
                    line = line.split('#')[0].trim();
                    if (!line) continue;

                    const [directive, ...valueParts] = line.split(':');
                    const value = valueParts.join(':').trim();
                    const lowerDirective = directive.toLowerCase();

                    if (lowerDirective === 'user-agent') {
                        currentAgents = [value.toLowerCase()];
                    } else if (lowerDirective === 'disallow' || lowerDirective === 'allow') {
                        const isBlocked = lowerDirective === 'disallow' && (value === '/' || value === '/*');
                        
                        for (const bot of bots) {
                            if (currentAgents.includes(bot.toLowerCase()) || currentAgents.includes('*')) {
                                if (isBlocked) {
                                    results[bot] = "blocked";
                                }
                            }
                        }
                    }
                }
                const allowedCount = Object.values(results).filter(v => v === "allowed").length;
                robotsScore = Math.round((allowedCount / 3) * 100);
            }
        } catch (e) {
            // robots.txt missing or failed, assume allowed or handle as error elsewhere
        }

        // Meta Robots check
        let metaScore = 100;
        let isNoindexed = false;
        if ($) {
            const metaRobots = $('meta[name="robots"]').attr('content') || '';
            if (metaRobots.toLowerCase().includes('noindex')) {
                metaScore = 0;
                isNoindexed = true;
            }
        }

        const finalScore = Math.min(robotsScore, metaScore);

        return {
            signal: "botAccess",
            score: finalScore,
            bots: results,
            isNoindexed: isNoindexed,
            robotsScore: robotsScore,
            metaScore: metaScore
        };

    } catch (error) {
        return {
            signal: "botAccess",
            score: 100,
            bots: {
                GPTBot: "allowed",
                "Google-Extended": "allowed",
                PerplexityBot: "allowed"
            }
        };
    }
};

export default analyzeBotAccess;
