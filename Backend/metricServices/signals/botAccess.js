import Puppeteer_Simple from '../../utils/puppeteer_simple.js';

/**
 * Signal 5: Bot Accessibility Detection
 * Fetches and parses robots.txt for AI bots and checks meta robots.
 * Reflects "Google Search Index Status".
 */

const analyzeBotAccess = async (url, $) => {
    console.log(`\x1b[32m[AEO:botAccess]\x1b[0m ▶ Fetching robots.txt for: ${url}`);
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
            const { html: content, status, browser } = await Puppeteer_Simple(robotsUrl);
            if (browser) await browser.close();
            
            if (status === 200 && content) {
                console.log(`\x1b[32m[AEO:botAccess]\x1b[0m ✔ robots.txt fetched (${content.length} chars)`);
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
                console.log(`\x1b[32m[AEO:botAccess]\x1b[0m ✔ Bot status: GPTBot=${results.GPTBot}, Google-Extended=${results['Google-Extended']}, PerplexityBot=${results.PerplexityBot}`);
            } else {
                console.log(`\x1b[32m[AEO:botAccess]\x1b[0m ⚠ robots.txt not found or empty (status: ${status})`);
            }
        } catch (e) {
            console.log(`\x1b[32m[AEO:botAccess]\x1b[0m ⚠ robots.txt fetch error: ${e.message}`);
        }

        // Meta Robots check
        let metaScore = 100;
        let isNoindexed = false;
        if ($) {
            const metaRobots = $('meta[name="robots"]').attr('content') || '';
            if (metaRobots.toLowerCase().includes('noindex')) {
                metaScore = 0;
                isNoindexed = true;
                console.log(`\x1b[32m[AEO:botAccess]\x1b[0m ❌ meta noindex detected!`);
            }
        }

        const finalScore = Math.min(robotsScore, metaScore);
        console.log(`\x1b[32m[AEO:botAccess]\x1b[0m ✔ robotsScore: ${robotsScore}, metaScore: ${metaScore} → finalScore: ${finalScore}`);

        return {
            signal: "botAccess",
            score: finalScore,
            bots: results,
            isNoindexed: isNoindexed,
            robotsScore: robotsScore,
            metaScore: metaScore
        };

    } catch (error) {
        console.log(`\x1b[32m[AEO:botAccess]\x1b[0m ❌ Fatal error: ${error.message} - returning neutral/unknown result`);
        // Don't claim a perfect 100 on a fetch failure — that falsely reports bots as
        // allowed. Return a neutral/unknown state so the AEO score isn't inflated.
        return {
            signal: "botAccess",
            score: 50,
            error: true,
            bots: {
                GPTBot: "unknown",
                "Google-Extended": "unknown",
                PerplexityBot: "unknown"
            }
        };
    }
};

export default analyzeBotAccess;
