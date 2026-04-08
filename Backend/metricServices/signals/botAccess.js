import axios from 'axios';

/**
 * Signal 5: Bot Accessibility Detection
 * Fetches and parses robots.txt for AI bots.
 */

const analyzeBotAccess = async (url) => {
    try {
        const rootUrl = new URL(url).origin;
        const robotsUrl = `${rootUrl}/robots.txt`;
        
        const response = await axios.get(robotsUrl, { timeout: 5000 });
        const content = response.status === 200 ? response.data : '';
        
        if (response.status !== 200) {
            return {
                signal: "botAccess",
                score: 100,
                bots: {
                    GPTBot: "allowed",
                    "Google-Extended": "allowed",
                    PerplexityBot: "allowed"
                },
                reason: null,
                triggers: []
            };
        }

        // Parse robots.txt
        const bots = ["GPTBot", "Google-Extended", "PerplexityBot"];
        const results = {
            GPTBot: "allowed",
            "Google-Extended": "allowed",
            PerplexityBot: "allowed"
        };

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
        const score = Math.round((allowedCount / 3) * 100);

        let reason = null;
        let triggers = [];

        if (score < 100) {
            const blocked = Object.entries(results).filter(([b, s]) => s === 'blocked').map(([b]) => b);
            reason = "Your robots.txt file contains explicit 'Disallow' directives for major AI crawlers. This configuration prevents LLMs from indexing your content, effectively removing your site from the training datasets and answer-generation pipelines used by modern AI search engines.";
            triggers = blocked.map(bot => `Explicit Disallow detected for ${bot} (Directly restricts AEO visibility).`);
        }

        return {
            signal: "botAccess",
            score: score,
            bots: results,
            reason: score < 100 ? reason : null,
            triggers: triggers
        };

    } catch (error) {
        // Assume allowed if robots.txt doesn't exist or error occurs
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
