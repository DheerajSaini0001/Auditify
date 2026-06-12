import React, { useState } from 'react';
import {
    Brain, Info, ChevronDown, ChevronUp, AlertCircle, CheckCircle,
    MessageCircle, Database, ShieldCheck, FileText, Layout,
    Table, Link, Activity, Award, MapPin, Network, Camera, GraduationCap, Megaphone
} from 'lucide-react';
const iconMap = {
    aeoSchema: Database,
    botAccess: ShieldCheck,
    markdownHeaders: Layout,
    llmsTxt: FileText,
    structuredContent: Table,
    citations: Link,
    answerFirst: MessageCircle,
    indexCoverage: Activity,
    entityRecognition: Brain,
    brandEntityStrength: Award,
    citationConsistency: MapPin,
    topicalAuthority: Network,
    experienceSignals: Camera,
    expertiseSignals: GraduationCap,
    authoritySignals: Megaphone
};

// Per-component max points for the new signals — lets the detail panel show each
// component as score/max so users see exactly which parts are dragging the score down.
const BREAKDOWN_MAX = {
    brandEntityStrength: { sameAs: 30, authoritative: 25, reviews: 25, completeness: 20 },
    citationConsistency: { completeness: 40, phoneConsistency: 25, nameConsistency: 20, addressCompleteness: 15 },
    topicalAuthority: { depth: 20, headings: 15, internalLinks: 15, verifiedCluster: 15, industry: 20, local: 15 },
    experienceSignals: { reviews: 25, media: 30, firstPerson: 25, people: 20 },
    expertiseSignals: { credentials: 35, awards: 25, tenure: 20, authorExpertise: 20 },
    authoritySignals: { pressMentions: 30, externalAuthority: 25, trustBadges: 25, socialProof: 20 },
    llmsTxt: { present: 10, h1: 20, sections: 15, links: 20, summary: 10, sameDomain: 5, relevance: 20 },
    citations: { citations: 45, policies: 20, contactTransparency: 20, trustBasics: 15 },
};

// camelCase key → "Title Case" label.
const prettyLabel = (k) => k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim();

const getStatusDetail = (signal, data, isFailed) => {
    // Prioritize signal-specific reasons if provided
    if (data?.reason) return data.reason;
    if (data?.reasons && Array.isArray(data.reasons) && data.reasons.length > 0) {
        return data.reasons[0];
    }

    if (!isFailed) return "Your page is perfectly optimized for this Answer Engine signal.";

    switch (signal) {
        case 'aeoSchema':
            return data?.count === 0
                ? "Warning: No JSON-LD schema found. AI engines cannot verify your entity data."
                : `Partial: Only ${data?.count} schema types detected. FAQPage or HowTo markup is recommended.`;
        case 'botAccess':
            const blocked = Object.entries(data?.bots || {}).filter(([_, s]) => s === 'blocked').map(([b]) => b);
            return blocked.length > 0
                ? `Blocked: ${blocked.join(', ')} are restricted in robots.txt.`
                : "Accessibility: Bot access is allowed but indexing signals are weak.";
        case 'llmsTxt':
            return data?.exists
                ? "Invalid: /llms.txt found but lacks standard context headers."
                : "Missing: No /llms.txt manifest found for OpenAI context mapping.";
        case 'markdownHeaders':
            return `Unoptimized: Heading hierarchy issues detected (Score: ${data?.score}%). Proper H1->H2 flow is required.`;
        case 'structuredContent':
            return `Low Density: Only ${data?.tables || 0} tables and ${data?.lists || 0} lists found. AI agents prefer higher data density.`;
        case 'answerFirst':
            return `Timing Issue: Direct answer found in sentence ${data?.sentenceCount || 0}. AI models prefer answers in the first 1-2 sentences.`;
        case 'citations':
            return "Trust Gap: Low external citation signals. Perplexity and search engines value verifiable sources.";
        case 'indexCoverage':
            return data?.sitemapFound
                ? `Low Coverage: only ~${data?.estimatedCoverage ?? 0}% of sampled sitemap URLs are indexable (≈${data?.estimatedIndexed ?? 0} of ${data?.submitted ?? 0}).`
                : "No Sitemap: no XML sitemap was found, so search/AI engines have no reliable map of pages to index.";
        case 'entityRecognition':
            return data?.orgSchema?.found
                ? `Incomplete Identity: Organization schema found but missing fields. ${(data?.issues || []).join(' ')}`
                : "No Entity Schema: no Organization/LocalBusiness JSON-LD — engines can't confidently recognize this business as an entity.";
        case 'brandEntityStrength':
            return `${data?.tier || 'Weak'} brand entity (${data?.score ?? 0}/100). ${(data?.issues || []).slice(0, 2).join(' ')}`;
        case 'citationConsistency':
            return data?.distinctPhoneCount > 1
                ? `Conflicting NAP: ${data.distinctPhoneCount} different phone numbers on the page. ${(data?.issues || []).slice(0, 1).join(' ')}`
                : `NAP/brand consistency incomplete (${data?.score ?? 0}/100). ${(data?.issues || []).slice(0, 2).join(' ')}`;
        case 'topicalAuthority':
            return `Topical authority ${data?.score ?? 0}/100 — ~${data?.wordCount ?? 0} words, ${data?.internalLinkCount ?? 0} internal links, ${data?.industryTopicCount ?? 0} industry topics. ${(data?.issues || []).slice(0, 1).join(' ')}`;
        case 'experienceSignals':
            return `First-hand experience ${data?.score ?? 0}/100 — ${data?.imageCount ?? 0} images (${data?.altCoverage ?? 0}% alt), video: ${data?.hasVideo ? 'yes' : 'no'}. ${(data?.issues || []).slice(0, 1).join(' ')}`;
        case 'expertiseSignals':
            return `Expertise/credentials ${data?.score ?? 0}/100 — ${data?.certificationCount ?? 0} certification mention(s) detected. ${(data?.issues || []).slice(0, 1).join(' ')}`;
        case 'authoritySignals':
            return `Authority signals ${data?.score ?? 0}/100 — ${data?.externalAuthLinks ?? 0} authoritative link(s), ${data?.socialProfiles ?? 0} social profile(s). ${(data?.issues || []).slice(0, 1).join(' ')}`;
        default:
            return "Signal requires optimization for better AI indexing and extraction.";
    }
};

const getWhyItMatters = (signal) => {
    switch (signal) {
        case 'aeoSchema':
            return "Schema.org markup acts as a 'Fact Sheet' for AI, allowing models like Gemini to verify your identity, products, and FAQs with 100% confidence.";
        case 'botAccess':
            return "If search crawlers or AI agents are blocked, your content will never appear in 'Direct Answer' snippets, regardless of quality.";
        case 'llmsTxt':
            return "OpenAI uses /llms.txt to quickly understand a site's structure map. This file is the primary context source for GPT-4 crawl agents.";
        case 'markdownHeaders':
            return "Markdown headers (H1-H3) are the primary way LLMs 'read' your page. A broken hierarchy causes extraction errors and loss of context.";
        case 'structuredContent':
            return "Answer engines prioritize tables and lists because they provide high-density, reliable data that is easy to summarize for users.";
        case 'answerFirst':
            return "AI models are trained to find the 'Nugget' of info immediately. Pushing the answer down increases the risk of being ignored.";
        case 'citations':
            return "Trust signals tell engines your content is accountable: cited sources, clear policies (privacy/terms/contact), transparent contact & authorship, HTTPS and dated content. RAG engines like Perplexity prioritize verifiable, trustworthy pages.";
        case 'indexCoverage':
            return "If your pages aren't indexable, they can't appear in Google results or be retrieved by AI answer engines — index coverage is the foundation every other AEO signal builds on.";
        case 'entityRecognition':
            return "AI engines can only cite or recommend a business they can identify with confidence. Organization/LocalBusiness schema and a Knowledge Graph entity turn your site from 'some text' into a recognized entity engines trust.";
        case 'brandEntityStrength':
            return "When engines must choose which business to cite, they favor the strongest, most-corroborated entity — broad sameAs footprint, a Wikipedia presence, and high review volume signal an established, trustworthy brand.";
        case 'citationConsistency':
            return "If your name, address, or phone conflicts across sources, engines can't confidently state your details — so they omit or hedge. One consistent NAP everywhere is foundational for local trust and 'near me / call X' answers.";
        case 'topicalAuthority':
            return "Engines cite sites that demonstrably own a topic. Deep content, well-linked topic clusters, broad industry coverage, and clear local signals tell an AI you're the authoritative source for 'best X in [city]'-type questions.";
        case 'experienceSignals':
            return "Google's E-E-A-T rewards demonstrable first-hand experience. Original photos of your real inventory, genuine testimonials, and an authentic operator voice prove the content comes from people who actually do this — not rephrased boilerplate.";
        case 'expertiseSignals':
            return "E-E-A-T's 'Expertise' is about credentials. Visible certifications, awards, years in business, and credentialed authors tell engines the content comes from qualified professionals — raising trust and citation likelihood.";
        case 'authoritySignals':
            return "Authority is third-party validation — who vouches for you. Press mentions, authoritative outbound links, and trust badges signal that others recognize you. (True backlink authority is off-site and needs a dedicated SEO tool.)";
        default:
            return "This signal is a key weighted parameter in establishing your AEO Mastery score and engine visibility.";
    }
};

// Actionable "How to improve" suggestions for the OLD signals (which don't ship an
// `issues` array), derived from their existing data fields.
const getLegacySuggestions = (signal, data, score) => {
    const s = [];
    switch (signal) {
        case 'aeoSchema':
            if (data?.recommendation) s.push(data.recommendation);
            if (!data?.details?.hasFAQSchema && data?.details?.hasFAQContent) s.push('Add FAQPage schema to your existing FAQ-style content.');
            if (!data?.details?.hasHowToSchema && data?.details?.hasHowToContent) s.push('Add HowTo schema with numbered steps to your guide content.');
            if (!s.length && score < 100) s.push('Add high-value JSON-LD (FAQPage / HowTo) so Gemini can verify your content.');
            break;
        case 'botAccess': {
            const blocked = Object.entries(data?.bots || {}).filter(([, st]) => st === 'blocked').map(([b]) => b);
            blocked.forEach((b) => s.push(`Allow ${b} in robots.txt (remove the "Disallow: /" rule under its User-agent).`));
            if (data?.isNoindexed) s.push('Remove the <meta name="robots" content="noindex"> tag so the page can be indexed.');
            if (!s.length && score < 100) s.push('Ensure AI crawlers (GPTBot, Google-Extended, PerplexityBot) are allowed and the page is indexable.');
            break;
        }
        case 'llmsTxt':
            if (!data?.exists) s.push('Create an /llms.txt manifest at your domain root — title, description, and links to key pages (see llmstxt.org).');
            else s.push('Your /llms.txt exists but is thin — add standard context headers and key page links.');
            break;
        case 'markdownHeaders':
            s.push('Use a single H1, then sequential H2/H3 sections so LLMs can cleanly map your page structure.');
            break;
        case 'structuredContent':
            if (data?.dataStuckInImages) s.push("Move data out of images into real HTML <table> elements — crawlers can't read charts inside images.");
            if ((data?.tables || 0) === 0) s.push('Add HTML data tables for specs/comparisons.');
            if ((data?.lists || 0) === 0) s.push('Use <ul>/<ol> lists for features, steps, and comparisons.');
            if (!s.length && score < 100) s.push('Increase structured-data density (tables and lists) for RAG-based engines.');
            break;
        case 'citations':
            s.push('Link to reputable external sources and add citation markers — Perplexity and factual engines prioritize cited content.');
            break;
        default:
            break;
    }
    return s;
};

const AEOSignalCard = ({ signal, score, data, title, description, darkMode, onInfo, url }) => {
    const [showDetails, setShowDetails] = useState(false);
    const Icon = iconMap[signal] || Database;

    // 3-tier threshold colouring: < T1 → Red (incorrect), T1–T2 → Orange (partial),
    // ≥ T2 → Green (correct).
    const T1 = 25;
    const T2 = 75;

    let status, statusColor, boxBg, boxText;
    if (score >= T2) {
        status = "Passed";
        statusColor = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
        boxBg = darkMode ? "bg-emerald-500/5 border-emerald-500/20" : "bg-emerald-50/50 border-emerald-100";
        boxText = "text-emerald-600";
    } else if (score >= T1) {
        status = "Partial";
        statusColor = "text-amber-500 bg-amber-500/10 border-amber-500/20";
        boxBg = darkMode ? "bg-amber-500/5 border-amber-500/20" : "bg-amber-50 border-amber-100";
        boxText = "text-amber-600";
    } else {
        status = "Failed";
        statusColor = "text-rose-500 bg-rose-500/10 border-rose-500/20";
        boxBg = darkMode ? "bg-rose-500/5 border-rose-500/20" : "bg-rose-50 border-rose-100";
        boxText = "text-rose-600";
    }

    const isFailed = score < T1;

    // ── Data-driven detail (breakdown bars + "How to improve") for ALL signals ──
    const breakdownMax = BREAKDOWN_MAX[signal] || {};
    const breakdownEntries = data && data.breakdown ? Object.entries(data.breakdown) : [];

    // Suggestions: signal's own issues → derived from weakest breakdown components →
    // legacy per-signal suggestions (old signals) → generic fallback.
    let improvements = (Array.isArray(data?.issues) && data.issues.length) ? data.issues : [];
    if (!improvements.length && breakdownEntries.length) {
        improvements = breakdownEntries
            .filter(([k, v]) => breakdownMax[k] && v < breakdownMax[k])
            .sort((a, b) => (a[1] / breakdownMax[a[0]]) - (b[1] / breakdownMax[b[0]]))
            .map(([k, v]) => `Improve ${prettyLabel(k)} (${v}/${breakdownMax[k]}).`);
    }
    if (!improvements.length) improvements = getLegacySuggestions(signal, data, score);
    if (!improvements.length && score < 100) improvements = ["Polish the lower-scoring areas to reach a perfect score."];

    const hasRichDetail = breakdownEntries.length > 0 || improvements.length > 0;

    return (
        <div className={`relative overflow-hidden rounded-[2rem] border transition-all duration-500 p-8 flex flex-col gap-6 ${darkMode ? "bg-slate-900 border-slate-800 shadow-xl" : "bg-white border-gray-100 shadow-sm shadow-slate-200 hover:shadow-md"}`}>

            {/* Header Area */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-5">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-105 ${darkMode ? "bg-slate-800" : "bg-slate-50 border border-slate-100 shadow-inner"}`}>
                        <Icon size={28} className={darkMode ? "text-indigo-400" : "text-indigo-600"} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <h3 className={`text-xl font-black tracking-tight ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{title}</h3>
                        <div className={`w-fit px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusColor}`}>
                            {status}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {score < 100 && (
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${showDetails
                                ? (darkMode ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-800 shadow-sm")
                                : (darkMode ? "bg-slate-800/50 text-slate-400 hover:text-white" : "bg-transparent text-slate-400 hover:text-indigo-600")}`}
                        >
                            {showDetails ? "Hide Detail" : "View Detail"}
                            {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                    )}
                    {onInfo && (
                        <button
                            onClick={() => onInfo({
                                title,
                                whatThisParameterIs: description,
                                whyItMatters: getWhyItMatters(signal),
                                icon: Icon,
                                thresholds: data?.threshold || "N/A"
                            })}
                            className={`p-2 rounded-lg transition-colors ${darkMode ? "bg-slate-800 text-slate-500 hover:text-indigo-400" : "bg-slate-50 text-slate-400 hover:text-indigo-600 border border-slate-100"}`}
                        >
                            <Info size={18} />
                        </button>
                    )}
                </div>
            </div>



            {/* Status Detail Section */}
            <div className="flex flex-col gap-3">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ${darkMode ? "text-white" : "text-slate-900"}`}>Status Detail</span>
                <div className={`p-6 rounded-2xl border transition-all duration-500 ${boxBg}`}>
                    <p className={`text-sm md:text-base font-black tracking-tight ${boxText}`}>
                        {getStatusDetail(signal, data, score < 100)}
                    </p>
                </div>
            </div>

            {/* Expanded Content (Analysis & Remediation) */}
            {showDetails && (
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-top-4 duration-500 pt-2 border-t border-slate-800/10 dark:border-slate-100/10">
                    {hasRichDetail ? (
                        <>
                            {/* Score Breakdown — which components are dragging the score down */}
                            {breakdownEntries.length > 0 && (
                                <div className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Score Breakdown</span>
                                    <div className="flex flex-col gap-2.5 mt-3">
                                        {breakdownEntries.map(([key, val]) => {
                                            const max = breakdownMax[key] || null;
                                            const pct = max ? Math.min(100, Math.round((val / max) * 100)) : 100;
                                            const low = max && val < max;
                                            return (
                                                <div key={key} className="flex flex-col gap-1">
                                                    <div className="flex justify-between text-[11px] fontsemibold">
                                                        <span className={darkMode ? "text-slate-300" : "text-slate-700"}>{prettyLabel(key)}</span>
                                                        <span className={low ? "text-amber-500" : "text-emerald-500"}>{val}{max ? `/${max}` : ""}</span>
                                                    </div>
                                                    <div className="h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                                                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: low ? "#f59e0b" : "#10b981" }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* How to improve — the signal's actual suggestions */}
                            <div className={`p-5 rounded-2xl border ${darkMode ? "bg-indigo-500/5 border-indigo-500/20" : "bg-indigo-50 border-indigo-100"}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <Brain size={14} className="text-indigo-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">How to improve</span>
                                </div>
                                <ul className="flex flex-col gap-2">
                                    {improvements.map((tip, i) => (
                                        <li key={i} className={`flex gap-2 text-[11px] leading-snug fontsemibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                                            <span className="text-indigo-500 mt-0.5">→</span>
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Current vs Target */}
                            <div className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                                <div className="flex flex-col gap-4">
                                    <div className="space-y-1.5">
                                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Current Status</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                            <span className={`text-xs font-black ${darkMode ? "text-white" : "text-slate-900"}`}>
                                                {signal === 'aeoSchema' ? (data?.count === 0 ? 'Zero Markup' : (data?.types?.length > 2 ? 'Multi-Type' : 'Partial Types')) :
                                                    signal === 'llmsTxt' ? (data?.exists ? 'Header Issue' : 'File Missing') :
                                                        signal === 'markdownHeaders' ? `Score: ${data?.score}%` :
                                                            signal === 'structuredContent' ? `${data?.tables + data?.lists} Entities` :
                                                                `${score}% Ready`}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Remediation Action</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            <span className={`text-xs font-black ${darkMode ? "text-white" : "text-slate-900"}`}>
                                                {signal === 'aeoSchema' ? "Inject FAQPage Schema" :
                                                    signal === 'llmsTxt' ? "Initialize /llms.txt" :
                                                        signal === 'markdownHeaders' ? "Fix Heading Hierarchy" :
                                                            "Refactor Structural Logic"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Impact Stat */}
                            <div className={`p-5 rounded-2xl border flex flex-col gap-2 ${darkMode ? "bg-indigo-500/5 border-indigo-500/20" : "bg-indigo-50 border-indigo-100"}`}>
                                <div className="flex items-center gap-2">
                                    <Brain size={14} className="text-indigo-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">AEO Engine Impact</span>
                                </div>
                                <p className={`text-[11px] leading-snug fontsemibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                                    Failing this signal reduces AI selection probability by ~70% across premium engines.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}



            {/* Action Area */}
            <div className="pt-2 border-t border-slate-800/10 dark:border-slate-100/10">
                {!isFailed && status === "Passed" ? (
                    <div className="flex items-center gap-3 py-2">
                        <CheckCircle className="text-emerald-500" size={18} />
                        <span className="text-xs fontsemibold text-emerald-600 uppercase tracking-widest">Optimized & Confirmed</span>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default AEOSignalCard;
