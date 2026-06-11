/**
 * AEO Recommendation Engine
 * Maps failed or partial signal scores to actionable recommendations.
 */

const getAEORecommendations = (signals) => {
    const recommendations = [];

    // 1. Answer-First Recommendation
    if (signals.answerFirst.score < 100) {
        recommendations.push({
            priority: signals.answerFirst.score === 0 ? "Critical" : "Medium",
            title: signals.answerFirst.score === 40 ? "Simplify Your Summary" : "Add Direct Answer Block",
            action: signals.answerFirst.score === 40 
                ? "Your intro is too wordy (>5 sentences). Scale it down to a 1-2 sentence direct answer ('TL;DR') to improve AI extraction and voice search compatibility."
                : "Add a 1-2 sentence direct answer (TL;DR) within the first 100 words of your content. AI models prioritize these 'Instant Answer' blocks for search snippets.",
            platform: "All",
            impact: 30
        });
    }

    // New: Active Voice / Tone Recommendation (Bonus for Perplexity/Gemini)
    if (signals.answerFirst.score > 0) {
        recommendations.push({
            priority: "Low",
            title: "Switch to Active Voice",
            action: "Ensure your primary answers use active voice and objective facts rather than marketing prose. AI models prefer direct, factual statements.",
            platform: "All",
            impact: 10
        });
    }

    // 2. llms.txt Recommendation
    if (signals.llmsTxt.score < 100) {
        recommendations.push({
            priority: "High",
            title: "Create /llms.txt File",
            action: "Create a plain text file at the root of your domain at /llms.txt. Include: title, description, and links to key pages. See llmstxt.org for format.",
            platform: "ChatGPT",
            impact: 25
        });
    }

    // 3. Schema Markup Recommendation
    if (signals.schema.score === 0) {
        recommendations.push({
            priority: "High",
            title: "Implement JSON-LD Schema",
            action: "Add a <script type='application/ld+json'> block. Preferred types: FAQPage for Q&A content, HowTo for guides, Product for product pages.",
            platform: "Gemini",
            impact: 20
        });
    } else if (signals.schema.score < 100) {
        recommendations.push({
            priority: "Medium",
            title: "Upgrade Schema to FAQPage or HowTo",
            action: "Your page has schema but not the highest-value types. Add FAQPage schema for your most common questions. This is the single biggest Gemini signal.",
            platform: "Gemini",
            impact: 15
        });
    }

    // 4. Structured Content Recommendation
    if (signals.structuredContent.dataStuckInImages) {
        recommendations.push({
            priority: "High",
            title: "Replace Image Charts with HTML Tables",
            action: "Your comparison charts or data are'stuck' in images. Perplexity and AI crawlers cannot 'read' images reliably. Re-implement charts as <table> elements for better RAG extraction.",
            platform: "Perplexity",
            impact: 40
        });
    } else if (signals.structuredContent.score < 60) {
        recommendations.push({
            priority: "High",
            title: "Convert Prose to Tables or Lists",
            action: "Replace comparison paragraphs with <table> elements. Use <ul>/<ol> for feature lists, steps, and comparisons. AI models parse tables 3× more accurately than prose.",
            platform: "Perplexity",
            impact: 25
        });
    }

    // 5. Bot Access Recommendations
    if (signals.botAccess.bots?.GPTBot === "blocked") {
        recommendations.push({
            priority: "Critical",
            title: "Allow GPTBot in robots.txt",
            action: "Remove or replace 'Disallow: /' under 'User-agent: GPTBot' in your robots.txt. Without access, ChatGPT cannot read your site regardless of content quality.",
            platform: "ChatGPT",
            impact: 30
        });
    }

    if (signals.botAccess.bots?.["Google-Extended"] === "blocked") {
        recommendations.push({
            priority: "Critical",
            title: "Allow Google-Extended in robots.txt",
            action: "Remove 'Disallow: /' under 'User-agent: Google-Extended'. Blocking this agent prevents Gemini from learning from your content.",
            platform: "Gemini",
            impact: 30
        });
    }

    // 6. Markdown Headers Recommendation
    if (signals.markdownHeaders.score < 80) {
        recommendations.push({
            priority: "Medium",
            title: "Improve Header Hierarchy",
            action: "Ensure your page uses a single H1 and follow-up H2, H3 tags in sequence. This creates a clean Markdown representation that ChatGPT and LLMs use to map your page.",
            platform: "ChatGPT",
            impact: 20
        });
    }

    // 7. Citations Recommendation
    if (signals.citations.score < 70) {
        recommendations.push({
            priority: "Medium",
            title: "Add External Factual Sources",
            action: "Link to reputable 3rd party research or data sources. Use superscript style markers [1] or reference lists. Perplexity and factual AIs prioritize cited data.",
            platform: "Perplexity",
            impact: 20
        });
    }

    // 8. Index Coverage Recommendation (estimated from sitemap)
    if (signals.indexCoverage && signals.indexCoverage.score < 75) {
        const ic = signals.indexCoverage;
        recommendations.push({
            priority: ic.score <= 25 ? "Critical" : "High",
            title: ic.sitemapFound ? "Improve Index Coverage" : "Publish an XML Sitemap",
            action: ic.sitemapFound
                ? `Only ~${ic.estimatedCoverage}% of your sampled sitemap URLs are indexable (≈${ic.estimatedIndexed} of ${ic.submitted}). Fix noindex tags, wrong canonicals, and non-200 pages so search and AI engines can index them. Issues: ${(ic.issues || []).join('; ')}.`
                : "No XML sitemap was found at robots.txt, /sitemap.xml, or /sitemap_index.xml. Publish a sitemap and reference it in robots.txt so Google and AI crawlers have a reliable map of your pages to index.",
            platform: "All",
            impact: ic.score <= 25 ? 35 : 20
        });
    }

    // 9. Entity Recognition / Knowledge Graph Recommendation
    if (signals.entityRecognition && signals.entityRecognition.score < 100) {
        const er = signals.entityRecognition;
        recommendations.push({
            priority: er.score <= 40 ? "High" : "Medium",
            title: er.orgSchema?.found ? "Strengthen Your Entity Schema" : "Add Organization/LocalBusiness Schema",
            action: er.orgSchema?.found
                ? `Your Organization schema is incomplete. Add the missing fields so engines can fully recognize your business as an entity. Issues: ${(er.issues || []).join('; ')}.`
                : "Add Organization (or LocalBusiness/AutoDealer) JSON-LD with name, address, logo, telephone, and sameAs links to your social/Wikipedia profiles. This is the strongest signal for entity recognition and Knowledge Graph eligibility.",
            platform: "Gemini",
            impact: er.score <= 40 ? 25 : 15
        });
    }

    // 10. Brand Entity Strength Recommendation (info-only signal)
    if (signals.brandEntityStrength && signals.brandEntityStrength.score < 55) {
        const bes = signals.brandEntityStrength;
        recommendations.push({
            priority: bes.score < 30 ? "Medium" : "Low",
            title: "Strengthen Your Brand Entity",
            action: `Brand entity strength is ${bes.tier?.toLowerCase() || 'low'} (${bes.score}/100). Broaden your verified footprint and authority signals: add more sameAs profile links, pursue a Wikipedia/Wikidata presence, and expose aggregateRating (review counts) in schema. ${(bes.issues || []).slice(0, 2).join(' ')}`,
            platform: "All",
            impact: 10
        });
    }

    // 11. Citation Consistency (NAP / Brand) Recommendation
    if (signals.citationConsistency && signals.citationConsistency.score < 100) {
        const cc = signals.citationConsistency;
        recommendations.push({
            priority: cc.distinctPhoneCount > 1 ? "High" : "Medium",
            title: cc.distinctPhoneCount > 1 ? "Fix Conflicting NAP Details" : "Complete & Align Your NAP",
            action: `Citation consistency is ${cc.score}/100. Ensure one canonical Name, Address, and Phone across your LocalBusiness schema, tel: links, and brand tags so search/AI engines can state your details confidently. ${(cc.issues || []).slice(0, 2).join(' ')}`,
            platform: "Gemini",
            impact: cc.distinctPhoneCount > 1 ? 20 : 12
        });
    }

    // 12. Topical Authority Recommendation
    if (signals.topicalAuthority && signals.topicalAuthority.score < 100) {
        const ta = signals.topicalAuthority;
        recommendations.push({
            priority: ta.score < 40 ? "High" : "Medium",
            title: "Build Topical Authority",
            action: `Topical authority is ${ta.score}/100. Deepen coverage of your core topics and tie them together: add comprehensive content, more subtopic headings, internal links to related pages (topic clusters), and clear local signals (city/region, service area). ${(ta.issues || []).slice(0, 2).join(' ')}`,
            platform: "All",
            impact: ta.score < 40 ? 20 : 12
        });
    }

    // 13. Experience Signals (first-hand expertise) Recommendation
    if (signals.experienceSignals && signals.experienceSignals.score < 80) {
        const ex = signals.experienceSignals;
        recommendations.push({
            priority: ex.score < 40 ? "Medium" : "Low",
            title: "Show First-Hand Experience",
            action: `Experience signals are ${ex.score}/100. Demonstrate real, hands-on experience: original photos of your actual inventory/staff/lot with alt text, genuine customer testimonials, a walkaround video, and a first-person voice. ${(ex.issues || []).slice(0, 2).join(' ')}`,
            platform: "All",
            impact: 10
        });
    }

    // 14. Expertise Signals (credentials) Recommendation
    if (signals.expertiseSignals && signals.expertiseSignals.score < 80) {
        const ep = signals.expertiseSignals;
        recommendations.push({
            priority: ep.score < 40 ? "Medium" : "Low",
            title: "Surface Your Credentials",
            action: `Expertise signals are ${ep.score}/100. Make your qualifications visible: certifications (ASE, manufacturer-certified, BBB accredited), awards/recognition, years in business, and credentialed author bylines. ${(ep.issues || []).slice(0, 2).join(' ')}`,
            platform: "All",
            impact: 10
        });
    }

    // 15. Authority Signals (mentions / backlinks) Recommendation
    if (signals.authoritySignals && signals.authoritySignals.score < 80) {
        const au = signals.authoritySignals;
        recommendations.push({
            priority: au.score < 40 ? "Medium" : "Low",
            title: "Build Authority Signals",
            action: `Authority signals are ${au.score}/100. Add press/"as seen in" mentions, link to authoritative sources (NHTSA, KBB, .gov/.edu), display third-party trust badges (BBB, Google, DealerRater), and link all social profiles. (Real backlink growth needs off-site work / a paid SEO tool.) ${(au.issues || []).slice(0, 2).join(' ')}`,
            platform: "All",
            impact: 10
        });
    }

    if (signals.botAccess.isNoindexed) {
        recommendations.push({
            priority: "Critical",
            title: "Remove Meta 'noindex' Tag",
            action: "Your page has a meta robots 'noindex' tag. This prevents Google and search-based AI engines from indexing your page entirelly.",
            platform: "Gemini",
            impact: 40
        });
    }

    // Sort by impact descending
    return recommendations.sort((a, b) => b.impact - a.impact);
};

export default getAEORecommendations;
