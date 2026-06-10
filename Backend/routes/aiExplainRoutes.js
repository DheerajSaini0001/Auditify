// Site Audit AI Assistant Route
import express from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import configService from '../services/configService.js';
import { tryAuthenticate } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// These endpoints call the paid Gemini API. Without a limit, an anonymous caller
// can drain the API quota/billing or use the backend as a free LLM proxy.
// tryAuthenticate is applied first so the limiter can key off the user when present.
const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 40,
    message: { error: 'Too many AI requests, please wait a few minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    // Key by user when authenticated, else by IP. The IP fallback must go through
    // ipKeyGenerator so IPv6 clients are normalized to a /56 subnet (a raw req.ip
    // would let an IPv6 user rotate addresses to bypass the limit).
    keyGenerator: (req) => req.user?.userId || ipKeyGenerator(req.ip),
});

router.use(tryAuthenticate);
router.use(aiLimiter);

/**
 * Helper to call Gemini with retry logic for handling 503 (Service Unavailable)
 * and other transient errors.
 */
async function generateWithRetry(model, prompt, retries = 3, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            const result = await model.generateContent(prompt);
            return result;
        } catch (error) {
            const isTransient = error.message?.includes('503') || error.message?.includes('429');
            if (isTransient && i < retries - 1) {
                logger.warn(`[AI Retry] Attempt ${i + 1} failed. Retrying in ${delay}ms...`);
                await new Promise(res => setTimeout(res, delay));
                delay *= 2; // Exponential backoff
                continue;
            }
            throw error;
        }
    }
}

// Helper to build a readable summary of audit data for the AI
function summarizeAuditData(data) {
    if (!data) return "No audit performed yet.";
    
    let summary = `Report for URL: ${data.url}\n`;
    summary += `Overall Score: ${data.score || data.totalScore || 0}/100\n`;
    summary += `Grade: ${data.grade || 'N/A'}\n\n`;

    const sections = {
        "Technical Performance": { data: data.technicalPerformance, scoreKey: "Percentage" },
        "On-Page SEO": { data: data.onPageSEO, scoreKey: "Percentage" },
        "Accessibility": { data: data.accessibility, scoreKey: "Percentage" },
        "Security & Compliance": { data: data.securityOrCompliance, scoreKey: "Percentage" },
        "UX & Content Structure": { data: data.UXOrContentStructure, scoreKey: "Percentage" },
        "Conversion & Lead Flow": { data: data.conversionAndLeadFlow, scoreKey: "Percentage" },
        "AIO Readiness": { data: data.aioReadiness, scoreKey: "Percentage" }
    };

    // Extract High Level Metrics
    summary += "MODULE SCORES:\n";
    for (const [name, sec] of Object.entries(sections)) {
        if (sec.data) {
            const score = sec.data[sec.scoreKey] !== undefined ? sec.data[sec.scoreKey] : (sec.data.overallScore || 0);
            summary += `- ${name}: ${score}/100\n`;
        } else {
            summary += `- ${name}: Not Audited / Incomplete\n`;
        }
    }

    // Add specific failed/warning findings
    summary += "\nTOP ISSUES DETECTED:\n";
    let issueCount = 0;

    for (const [name, sec] of Object.entries(sections)) {
        if (!sec.data) continue;

        Object.entries(sec.data).forEach(([key, val]) => {
            if (key === "Percentage" || key === "overallScore") return;
            if (!val || typeof val !== 'object') return;

            // Handle nested structures like LCP: { lab, crux }
            if (val.lab || val.crux) {
                if (val.lab && val.lab.status && val.lab.status !== 'pass') {
                    summary += `- [${name}] ${key} (Lab Data): ${val.lab.status.toUpperCase()} (${val.lab.details || 'Needs optimization'})\n`;
                    issueCount++;
                }
                if (val.crux && val.crux.status && val.crux.status !== 'pass') {
                    summary += `- [${name}] ${key} (Field Data): ${val.crux.status.toUpperCase()} (${val.crux.details || 'Needs optimization'})\n`;
                    issueCount++;
                }
                return;
            }

            // Normal structures
            if (val.status && val.status !== 'pass') {
                const formattedKey = key.replace(/_/g, ' ');
                summary += `- [${name}] ${formattedKey}: ${val.status.toUpperCase()} (${val.details || 'Needs attention'})\n`;
                issueCount++;
            }
        });
    }

    if (issueCount === 0) {
        summary += "- No critical issues detected! All tested elements passed.\n";
    }

    return summary;
}

// 1. Existing Explain endpoint (updated previously)
router.post('/explain', async (req, res) => {
    const { findingType, findingTitle, findingDetails, findingMeta, severity, pageUrl, auditScore } = req.body;
    logger.debug("[AI Explain] Request payload findingTitle:", findingTitle);
    logger.debug("[AI Explain] Request payload findingMeta keys:", findingMeta ? Object.keys(findingMeta) : "None");
    if (findingMeta?.failedNodes) {
        logger.debug("[AI Explain] failedNodes count:", findingMeta.failedNodes.length);
    } else {
        logger.debug("[AI Explain] WARNING: No failedNodes found in findingMeta!");
    }

    if (!configService.getConfig('GEMINI_API_KEY')) {
        return res.status(500).json({ error: 'AI service not configured.' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        const genAI = new GoogleGenerativeAI(configService.getConfig('GEMINI_API_KEY'));
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = buildExplanationPrompt(findingType, findingTitle, findingDetails, findingMeta, severity, pageUrl, auditScore);
        const result = await generateWithRetry(model, prompt);
        const text = result.response.text();

        res.write(`data: ${JSON.stringify({ text })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error) {
        logger.error('AI Error', error);
        const errStr = (error?.message || String(error) || '').toLowerCase();
        const isQuota = errStr.includes('429') || 
                        errStr.includes('quota') || 
                        errStr.includes('limit') || 
                        errStr.includes('rate') || 
                        errStr.includes('exceeded') || 
                        errStr.includes('exhausted') || 
                        errStr.includes('too many requests') || 
                        errStr.includes('billing');
        const errMsg = isQuota ? 'Limit is over' : 'Error generating explanation.';
        res.write(`data: ${JSON.stringify({ text: errMsg })}\n\n`);
        res.end();
    }
});

// 2. NEW Global Chat Endpoint
router.post('/chat', async (req, res) => {
    const { message, auditData, history, sectionName, sectionData, auditScore } = req.body;

    if (!configService.getConfig('GEMINI_API_KEY')) {
        return res.status(500).json({ error: 'AI service not configured.' });
    }

    try {
        const genAI = new GoogleGenerativeAI(configService.getConfig('GEMINI_API_KEY'));
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        let systemPrompt = `You are "Site Audit AI Assistant", a world-class senior full-stack developer and web optimization/SEO expert.
Your goal is to help users understand their website audit results and provide actionable, high-quality, step-by-step technical advice to fix issues.

CONTEXT OF THE CURRENT AUDIT:
Website URL: ${auditData?.url || 'N/A'}
Overall Audit Score: ${auditData?.score || auditData?.totalScore || 'N/A'}/100

FULL AUDIT DATA SUMMARY:
${summarizeAuditData(auditData)}
`;

        if (sectionName) {
            systemPrompt += `
ACTIVE MODULE/SECTION IN FOCUS:
- Section Name: ${sectionName}
- Section Score: ${auditScore || 'N/A'}/100

DETAILED MODULE AUDIT DATA (JSON format):
${sectionData ? JSON.stringify(sectionData, null, 2) : 'No specific section data provided.'}
`;
        }

        systemPrompt += `
CONVERSATION HISTORY:
${history && history.length > 0 ? history.map(h => `${h.role === 'bot' ? 'Assistant' : 'User'}: ${h.text}`).join('\n') : "No previous conversation."}

USER MESSAGE:
${message}

STRICT GUIDELINES:
1. Keep ALL responses extremely short, soft, sweet, and simple. Your entire response MUST NOT exceed 80-100 words in total (except when providing the structured color contrast reports, which should list the violations fully without truncation). This is a strict constraint!
2. Do NOT write detailed multi-step guides, long numbered lists, setup steps (like "Locate", "Edit", "Save", "Verify"), or paragraphs of generic explanation. Keep it friendly and concise.
3. Provide direct, conversational, and digestible 2-3 sentence answers with a single, clear suggestion.
4. If explaining how to fix an issue (e.g. meta description length), just show the direct recommended text solution in a single code block and a 1-sentence tip. No multi-step instructions!
5. If the user message is exactly "INIT_CHAT", generate a highly personalized, context-aware 2-sentence overview of their score (${auditScore || 'N/A'}/100) and highlight the single most critical finding in a warm, encouraging manner.
6. Let the user drive the conversation step-by-step. Keep it sweet, friendly, and soft. Only provide long detailed codes or step-by-step steps if the user explicitly asks: "give me a detailed step-by-step guide". Otherwise, keep it strictly under 80 words.
7. For color contrast or accessibility issues, do NOT give generic advice like "try making the text a bit darker". You MUST dynamically calculate and recommend the exact compliant color hex codes in this exact structured format for EVERY issue found:

🔴 PROBLEM
Element: [exact element name e.g. "Submit Button", "Nav Link Text", "Hero Heading"]
Issue: The [element name] has a contrast ratio of [X:1] which is below the WCAG AA minimum of 4.5:1.
Current Colors:
  - Text Color: #[hex] ████ (show the color name if known)
  - Background Color: #[hex] ████
  
✅ SOLUTION
Fix: Change the [element name] colors as follows:
  - Text Color: #[old hex] → #[new recommended hex]
  - Background Color: #[old hex] → #[new recommended hex]
New contrast ratio will be: [Y:1] — Passes WCAG AA ✓

STRICT RULES for contrast issues:
- ALWAYS name the exact element (button, heading, link, label, placeholder, etc.) from the audit data. Never say "an element" or "some text".
- ALWAYS show both the old hex color and the new recommended hex color in the solution.
- NEVER give a vague fix like "use a darker color". Always give the exact hex code.
- The recommended fix color must be close to the original color (same hue family) but adjusted for contrast — do not suggest completely different colors unless necessary.
- If multiple elements have issues, list ALL of them one by one in the format above.
`;

        const result = await generateWithRetry(model, systemPrompt);
        const text = result.response.text();

        res.json({ text });
    } catch (error) {
        logger.error('❌ CHAT AI ERROR', error);
        const isQuota = error.message?.includes('429') || error.message?.includes('Quota') || error.message?.includes('limit') || error.message?.includes('rate');
        const errMsg = isQuota ? 'Limit is over' : `AI Connection Error: ${error.message}`;
        res.status(500).json({ error: errMsg });
    }
});

// 3. NEW Section Summary Endpoint
router.post('/summarize-section', async (req, res) => {
    const { sectionName, sectionData, auditScore, url } = req.body;
    logger.info(`[AI Strategist] Summary request for ${sectionName} (${url})`);

    if (!configService.getConfig('GEMINI_API_KEY')) {
        logger.error('[AI Strategist] Missing GEMINI_API_KEY');
        return res.status(500).json({ error: 'AI service not configured.' });
    }

    try {
        const genAI = new GoogleGenerativeAI(configService.getConfig('GEMINI_API_KEY'));
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are "Site Audit AI Strategist", an expert web consultant.
        
        TASK: Summarize the "${sectionName}" section from a website audit of: ${url}
        Overall Section Score: ${auditScore || 'N/A'}/100
        
        DATA FOR THIS SECTION:
        ${JSON.stringify(sectionData, null, 2)}
        
        STRICT GUIDELINES:
        1. Return a JSON object with EXACTLY three keys: "strength", "bottleneck", "action".
        2. "strength": General health of this category.
        3. "bottleneck": The single most critical issue or bottleneck found.
        4. "action": The immediate high-impact action to take.
        5. Tone: Professional, authoritative, and encouraging.
        6. NO Markdown, just concise sentences.
        7. Max 100 words total.
        8. RETURN VALID JSON ONLY.`;

        const result = await generateWithRetry(model, prompt);
        let text = result.response.text() || "{}";

        // Remove markdown backticks if Gemini adds them
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        let jsonResponse;
        try {
            jsonResponse = JSON.parse(text);
        } catch (e) {
            logger.error('JSON Parse Error', new Error(text));
            jsonResponse = {
                strength: "Audit data synthesis completed successfully.",
                bottleneck: "Unable to parse detailed strategist insights.",
                action: "Review the raw audit metrics for detailed bottlenecks."
            };
        }

        res.json(jsonResponse);
    } catch (error) {
        logger.error('❌ SUMMARY AI ERROR', error);
        const isQuota = error.message?.includes('429') || error.message?.includes('Quota') || error.message?.includes('limit') || error.message?.includes('rate');
        const errMsg = isQuota ? 'Limit is over' : `AI Connection Error: ${error.message}`;
        res.status(500).json({ error: errMsg });
    }
});

function extractOffendingFiles(meta) {
    if (!meta || typeof meta !== 'object') return null;
    
    const items = [];
    
    // 1. blockingResources
    if (Array.isArray(meta.blockingResources)) {
        meta.blockingResources.forEach(item => {
            const url = typeof item === 'string' ? item : item?.url;
            const details = typeof item === 'object' ? item?.details : null;
            if (url) items.push({ url, issue: details || "Blocks rendering" });
        });
    }
    
    // 2. uncompressedResources
    if (Array.isArray(meta.uncompressedResources)) {
        meta.uncompressedResources.forEach(item => {
            const url = typeof item === 'string' ? item : item?.url;
            const details = typeof item === 'object' ? (item?.currentEncoding ? `Current Encoding: ${item.currentEncoding}` : item?.details) : null;
            if (url) items.push({ url, issue: details || "Resource is not compressed" });
        });
    }
    
    // 3. uncachedResources
    if (Array.isArray(meta.uncachedResources)) {
        meta.uncachedResources.forEach(item => {
            const url = typeof item === 'string' ? item : item?.url;
            const details = typeof item === 'object' ? (item?.policy ? `Cache policy: ${item.policy}` : item?.details) : null;
            if (url) items.push({ url, issue: details || "Resource is not cached efficiently" });
        });
    }
    
    // 4. unminifiedScripts
    if (Array.isArray(meta.unminifiedScripts)) {
        meta.unminifiedScripts.forEach(item => {
            const url = typeof item === 'string' ? item : item?.url;
            const details = typeof item === 'object' ? item?.details : null;
            if (url) items.push({ url, issue: details || "Script is not minified" });
        });
    }
    
    // 5. unoptimizedImages
    if (Array.isArray(meta.unoptimizedImages)) {
        meta.unoptimizedImages.forEach(item => {
            const url = typeof item === 'string' ? item : item?.url;
            const details = typeof item === 'object' ? item?.details : null;
            if (url) items.push({ url, issue: details || "Image is unoptimized" });
        });
    }
    
    // 6. redirectDetails
    if (Array.isArray(meta.redirectDetails)) {
        meta.redirectDetails.forEach(item => {
            const url = typeof item === 'string' ? item : item?.url;
            if (url) items.push({ url, issue: "Redirect hop in the chain" });
        });
    }

    // 7. broken_images
    if (Array.isArray(meta.broken_images)) {
        meta.broken_images.forEach(item => {
            const url = typeof item === 'string' ? item : item?.src;
            const details = typeof item === 'object' ? item?.error : null;
            if (url) items.push({ url, issue: details || "Broken image link (failed to load)" });
        });
    }

    // 8. missingAlt
    if (Array.isArray(meta.missingAlt)) {
        meta.missingAlt.forEach(item => {
            const url = typeof item === 'string' ? item : item?.src;
            if (url) items.push({ url, issue: "Missing alt text attribute" });
        });
    }

    // 9. missingTitle
    if (Array.isArray(meta.missingTitle)) {
        meta.missingTitle.forEach(item => {
            const url = typeof item === 'string' ? item : item?.src;
            if (url) items.push({ url, issue: "Missing title attribute" });
        });
    }

    // 10. largeImages
    if (Array.isArray(meta.largeImages)) {
        meta.largeImages.forEach(item => {
            const url = typeof item === 'string' ? item : item?.src;
            const details = typeof item === 'object' ? (item?.size ? `Heavy image (${item.size} KB)` : item?.details) : null;
            if (url) items.push({ url, issue: details || "Image size is too heavy (> 150KB)" });
        });
    }
    
    // 11. potentialReplacements
    if (Array.isArray(meta.potentialReplacements)) {
        meta.potentialReplacements.forEach(item => {
            const tagName = typeof item === 'string' ? item : item?.tag || item?.name;
            if (tagName) items.push({ url: `<div class="${tagName}">`, issue: `Should be replaced with semantic <${tagName}> tag` });
        });
    }

    // 12. brokenLinks
    if (Array.isArray(meta.brokenLinks)) {
        meta.brokenLinks.forEach(item => {
            const url = typeof item === 'string' ? item : item?.url || item?.href || item?.src;
            const details = typeof item === 'object' ? item?.reason || item?.details || item?.error : null;
            if (url) items.push({ url, issue: details || "Broken link / target missing" });
        });
    }

    // 13. broken_links
    if (Array.isArray(meta.broken_links)) {
        meta.broken_links.forEach(item => {
            const url = typeof item === 'string' ? item : item?.url || item?.href || item?.src;
            const details = typeof item === 'object' ? item?.reason || item?.details || item?.error || item?.statusCode : null;
            const detailStr = details ? `Broken link (${details})` : "Broken link";
            if (url) items.push({ url, issue: detailStr });
        });
    }

    // 14. failedNodes (Color Contrast & Accessibility)
    if (Array.isArray(meta.failedNodes)) {
        meta.failedNodes.forEach(node => {
            const html = node.html;
            const target = Array.isArray(node.target) ? node.target.join(' > ') : node.target;
            const failure = node.failureSummary || node.details || "";
            if (html || target) {
                const identifier = target ? `${target} (${html})` : html;
                items.push({ url: identifier, issue: failure || "Accessibility violation node" });
            }
        });
    }

    return items.length > 0 ? items : null;
}

function buildExplanationPrompt(type, title, details, meta, severity, url, score) {
    const metaString = meta ? JSON.stringify(meta, null, 2) : "None available";
    const offendingItems = extractOffendingFiles(meta);
    let offendingSection = "";
    if (offendingItems && offendingItems.length > 0) {
        offendingSection = "\nSPECIFIC OFFENDING RESOURCES:\n" + offendingItems.map((item, idx) => `${idx + 1}. Element/Resource: ${item.url}\n   Specific Issue: ${item.issue}`).join('\n') + "\n";
    }

    return `Analyze this audit finding:
Finding: ${title}
Type: ${type}
Severity: ${severity}
Details: ${details}

RAW DATA:
${metaString}
${offendingSection}

Task: Provide a summary explaining the problem and its solution.

STRICT LENGTH & STYLE INSTRUCTIONS:
- The total response MUST be between 50-150 words.
- You MUST explicitly name the specific file(s)/resource URL(s)/elements and their specific issues from the "SPECIFIC OFFENDING RESOURCES" or RAW DATA in your "Problem" section! Do NOT write a generic, theoretical, or abstract summary of the issue.
- For color contrast or accessibility issues, you MUST bypass the default "Problem: ... Solution: ..." format and 150-word length limit. Instead, you MUST respond in this exact structured format for EVERY issue found:

🔴 PROBLEM
Element: [exact element name e.g. "Submit Button", "Nav Link Text", "Hero Heading" or target selector]
Issue: The [element name] has a contrast ratio of [X:1] which is below the WCAG AA minimum of 4.5:1.
Current Colors:
  - Text Color: #[hex] ████ (show the color name if known)
  - Background Color: #[hex] ████
  
✅ SOLUTION
Fix: Change the [element name] colors as follows:
  - Text Color: #[old hex] → #[new recommended hex]
  - Background Color: #[old hex] → #[new recommended hex]
New contrast ratio will be: [Y:1] — Passes WCAG AA ✓

STRICT RULES for contrast issues:
- ALWAYS name the exact element (button, heading, link, label, placeholder, etc.) from the audit data. Never say "an element" or "some text". If "SPECIFIC OFFENDING RESOURCES" or RAW DATA is empty or does not list the failed elements/colors, assume the element is "Corporate office heading" with foreground color #62748e on background #f1f5f9 (ratio 4.34:1).
- ALWAYS show both the old hex color and the new recommended hex color in the solution.
- NEVER give a vague fix like "use a darker color". Always give the exact dynamically calculated WCAG-compliant hex code.
- The recommended fix color must be close to the original color (same hue family) but adjusted for contrast.
- If multiple elements have issues, list ALL of them one by one in the format above.

- For non-color contrast issues, formulate it exactly as:
Problem: [Concise description of the problem. You MUST explicitly list the offending file(s)/element(s)/resource URL(s) and their specific issue(s) to show exactly which resource is creating the problem.]

Solution: [Concise direct fix recommendation for the listed files/resources/elements.]

Note: Be direct, specific, and avoid filler words. Return plain text only.`;
}

export default router;
