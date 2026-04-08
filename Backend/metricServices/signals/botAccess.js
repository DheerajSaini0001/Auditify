import axios from 'axios';

/**
 * Signal 5: Bot Accessibility Detection
 * Fetches and parses robots.txt for AI bots and checks meta robots.
 * Reflects "Google Search Index Status".
 */

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
            const response = await axios.get(robotsUrl, { timeout: 5000 });
            const content = response.status === 200 ? response.data : '';
            
            if (response.status === 200) {
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
