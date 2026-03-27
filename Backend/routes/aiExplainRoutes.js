// Auditify AI Assistant Route
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

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

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'AI service not configured.' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = buildExplanationPrompt(findingType, findingTitle, findingDetails, findingMeta, severity, pageUrl, auditScore);
        const result = await model.generateContent(prompt);
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

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'AI service not configured.' });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

        const auditSummary = summarizeAuditData(auditData);
        
        const systemPrompt = `You are "Auditify AI Assistant", a world-class senior full-stack developer and security researcher.
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

        const result = await model.generateContent(systemPrompt);
        const text = result.response.text();

        res.json({ text });
    } catch (error) {
        console.error('❌ CHAT AI ERROR:', error);
        res.status(500).json({ error: `AI Connection Error: ${error.message}` });
    }
});

function buildExplanationPrompt(type, title, details, meta, severity, url, score) {
    const metaString = meta ? JSON.stringify(meta, null, 2) : "None available";
    return `Analyze this audit finding:\nFinding: ${title}\nType: ${type}\nSeverity: ${severity}\nDetails: ${details}\n\nRAW DATA:\n${metaString}\n\nProvide 1) What it is, 2) Why it matters, 3) Detailed fix instructions.`;
}

export default router;
