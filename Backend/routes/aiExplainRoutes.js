// DealerPulse AI Assistant Route
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import configService from '../services/configService.js';

const router = express.Router();

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
                console.warn(`[AI Retry] Attempt ${i + 1} failed. Retrying in ${delay}ms...`);
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
    summary += `Overall Score: ${data.totalScore}/100\n\n`;

    // Extract High Level Metrics
    if (data.technicalPerformance) {
        summary += `Technical Performance Score: ${data.technicalPerformance.overallScore}/100\n`;
    }
    if (data.seo) {
        summary += `SEO Score: ${data.seo.totalScore || 0}/100\n`;
    }
    if (data.securityCompliance) {
        summary += `Security & Compliance Status: ${data.securityCompliance.Percentage || 0}%\n`;
    }
    
    // Add specific failed/warning findings
    summary += "\nTOP ISSUES DETECTED:\n";
    
    // Example from technical performance
    if (data.technicalPerformance?.metrics) {
        data.technicalPerformance.metrics.filter(m => m.status !== 'pass').forEach(m => {
            summary += `- [Tech] ${m.title}: ${m.status.toUpperCase()} (${m.details})\n`;
        });
    }

    if (data.securityCompliance) {
        Object.keys(data.securityCompliance).forEach(key => {
            const m = data.securityCompliance[key];
            if (m && typeof m === 'object' && m.status && m.status !== 'pass') {
                summary += `- [Security] ${key}: ${m.status.toUpperCase()} (${m.details || 'Issue detected'})\n`;
            }
        });
    }

    return summary;
}

// 1. Existing Explain endpoint (updated previously)
router.post('/explain', async (req, res) => {
    const { findingType, findingTitle, findingDetails, findingMeta, severity, pageUrl, auditScore } = req.body;

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
        console.error('AI Error:', error.message);
        res.write(`data: ${JSON.stringify({ text: 'Error generating explanation.' })}\n\n`);
        res.end();
    }
});

// 2. NEW Global Chat Endpoint
router.post('/chat', async (req, res) => {
    const { message, auditData, history } = req.body;

    if (!configService.getConfig('GEMINI_API_KEY')) {
        return res.status(500).json({ error: 'AI service not configured.' });
    }

    try {
        const genAI = new GoogleGenerativeAI(configService.getConfig('GEMINI_API_KEY'));
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

        const auditSummary = summarizeAuditData(auditData);
        
        const systemPrompt = `You are "DealerPulse AI Assistant", a world-class senior full-stack developer and security researcher.
Your goal is to help users understand their latest website audit results and provide actionable, high-quality advice to fix issues.

CONTEXT OF THE CURRENT AUDIT:
${auditSummary}

CONVERSATION HISTORY:
${history ? history.map(h => `${h.role === 'bot' ? 'Assistant' : 'User'}: ${h.text}`).join('\n') : "No previous conversation."}

USER MESSAGE:
${message}

STRICT GUIDELINES:
1. Always base your answers on the DATA provided above. If the user asks "How is my performance?", refer to the scores in the context.
2. If the user asks about something NOT in the data, try to be helpful but mention that you don't have that specific data for their site right now.
3. Be friendly, concise, and professional.
4. Use Markdown for formatting (bold, lists, etc).
5. If recommending a fix, provide a short, modern code example if possible.

Response length: Keep it under 200 words.`;

        const result = await generateWithRetry(model, systemPrompt);
        const text = result.response.text();

        res.json({ text });
    } catch (error) {
        console.error('❌ CHAT AI ERROR:', error);
        res.status(500).json({ error: `AI Connection Error: ${error.message}` });
    }
});

// 3. NEW Section Summary Endpoint
router.post('/summarize-section', async (req, res) => {
    const { sectionName, sectionData, auditScore, url } = req.body;
    console.log(`[AI Strategist] Summary request for ${sectionName} (${url})`);

    if (!configService.getConfig('GEMINI_API_KEY')) {
        console.error('[AI Strategist] Missing GEMINI_API_KEY');
        return res.status(500).json({ error: 'AI service not configured.' });
    }

    try {
        const genAI = new GoogleGenerativeAI(configService.getConfig('GEMINI_API_KEY'));
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

        const prompt = `You are "DealerPulse AI Strategist", an expert web consultant.
        
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
            console.error('JSON Parse Error:', text);
            jsonResponse = {
                strength: "Audit data synthesis completed successfully.",
                bottleneck: "Unable to parse detailed strategist insights.",
                action: "Review the raw audit metrics for detailed bottlenecks."
            };
        }
        
        res.json(jsonResponse);
    } catch (error) {
        console.error('❌ SUMMARY AI ERROR:', error);
        res.status(500).json({ error: `AI Connection Error: ${error.message}` });
    }
});

function buildExplanationPrompt(type, title, details, meta, severity, url, score) {
    const metaString = meta ? JSON.stringify(meta, null, 2) : "None available";
    return `Analyze this audit finding:\nFinding: ${title}\nType: ${type}\nSeverity: ${severity}\nDetails: ${details}\n\nRAW DATA:\n${metaString}\n\nProvide 1) What it is, 2) Why it matters, 3) Detailed fix instructions.`;
}

export default router;
