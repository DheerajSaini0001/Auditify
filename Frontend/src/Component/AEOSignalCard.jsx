import React, { useState } from 'react';
import {
    Brain, Info, ChevronDown, ChevronUp,
    MessageCircle, Database, ShieldCheck, FileText, Layout,
    Table, Link, Activity, Award, MapPin, Network, Camera, GraduationCap, Megaphone
} from 'lucide-react';
import { InfoDetails } from './InfoDetails';
import { isActionableParam } from '../config/parameterAudience';
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
    authoritySignals: Megaphone,
    // Spec §2.8 params with no dedicated analyzer (derived) + the consolidated E-E-A-T.
    faqQa: MessageCircle,
    sameAsValidation: Link,
    eeatComposite: Award,
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
    eeatComposite: { experience: 100, expertise: 100, authority: 100 },
};

// camelCase key → "Title Case" label.
const prettyLabel = (k) => k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim();

// The actual current data for each parameter — shown in a neutral box (like the
// "Current Description" box on the Meta Description card), instead of a status sentence.
// Returns { label, value, mono?, headerInfo? }. value may be a string or JSX.
const getCurrentData = (signal, data) => {
    switch (signal) {
        case 'aeoSchema': {
            const d = data?.details || {};
            const found = [];
            if (d.hasFAQSchema) found.push('FAQPage');
            if (d.hasHowToSchema) found.push('HowTo');
            if (d.hasFAQContent && !d.hasFAQSchema) found.push('FAQ content (no schema)');
            return {
                label: 'Detected Schema',
                value: found.length ? found.join(', ') : 'No FAQ or HowTo schema found',
                headerInfo: data?.message,
            };
        }
        case 'botAccess': {
            const bots = data?.bots || {};
            const entries = Object.entries(bots);
            return {
                label: 'AI Bot Access',
                mono: true,
                value: entries.length
                    ? entries.map(([b, s]) => `${b}: ${s}`).join('   •   ')
                    : 'No AI-bot rules found in robots.txt',
            };
        }
        case 'llmsTxt': {
            let value;
            if (!data?.exists) value = 'No llms.txt file found';
            else if (data?.isEmpty) value = 'llms.txt found, but the file is empty';
            else value = data?.url || 'llms.txt file found';
            return { label: 'llms.txt File', value, mono: true };
        }
        case 'markdownHeaders': {
            const c = data?.counts || {};
            return { label: 'Heading Structure', mono: true, value: `H1: ${c.h1 ?? 0}     H2: ${c.h2 ?? 0}     H3: ${c.h3 ?? 0}` };
        }
        case 'structuredContent': {
            const rows = [
                { label: 'Tables', count: data?.tables ?? 0 },
                { label: 'Lists', count: data?.lists ?? 0 },
                { label: 'Images', count: data?.images ?? 0 },
            ];
            return {
                label: 'Structured Elements',
                plain: true,
                value: (
                    <div className="flex flex-col gap-2.5">
                        {rows.map((r) => (
                            <div key={r.label} className="flex items-center justify-between gap-3">
                                <span className="text-sm font-semibold">{r.label}</span>
                                <span className="text-sm font-bold">{r.count}</span>
                            </div>
                        ))}
                    </div>
                ),
            };
        }
        case 'answerFirst':
            return {
                label: 'Page Opening',
                value: data?.preview
                    ? `“${data.preview}”`
                    : <span className="italic opacity-50">No clear opening text found</span>,
            };
        case 'citations': {
            const b = data?.breakdown || {};
            return {
                label: 'Trust & Citations',
                mono: true,
                value: `Citations ${b.citations ?? 0}/45   •   Policies ${b.policies ?? 0}/20   •   Contact ${b.contactTransparency ?? 0}/20`,
            };
        }
        case 'indexCoverage':
            return {
                label: 'Index Coverage',
                value: data?.sitemapFound
                    ? `Sitemap found — ~${data?.estimatedCoverage ?? 0}% of sampled URLs are indexable (≈${data?.estimatedIndexed ?? 0} of ${data?.submitted ?? 0}).`
                    : 'No XML sitemap found',
            };
        case 'entityRecognition': {
            const o = data?.orgSchema || {};
            return {
                label: 'Business Identity',
                value: o.found ? `${o.name || 'Organization'} (${o.type || 'Organization'})` : 'No Organization / LocalBusiness schema found',
            };
        }
        case 'citationConsistency': {
            const b = data?.breakdown || {};
            // Per field → 0 (not found), 0.5 (found but inconsistent/partial), 1 (found & consistent).
            // Backend bands: nameConsistency 0/5/15-20, phoneConsistency 0/5/25, addressCompleteness 0/8/15.
            const toVal = (raw, midBand) => (raw === 0 ? 0 : raw === midBand ? 0.5 : 1);
            const nameVal = toVal(b.nameConsistency ?? 0, 5);
            const phoneVal = toVal(b.phoneConsistency ?? 0, 5);
            const addrVal = toVal(b.addressCompleteness ?? 0, 8);
            const rows = [
                { label: 'Name', detail: data?.schemaName || (nameVal ? 'Found' : 'Not found'), val: nameVal },
                { label: 'Phone', detail: phoneVal === 0 ? 'Not found' : phoneVal === 0.5 ? `Conflicting (${data?.distinctPhoneCount ?? 0} numbers)` : 'Found', val: phoneVal },
                { label: 'Address', detail: addrVal === 0 ? 'Not found' : addrVal === 0.5 ? 'Partial' : 'Found', val: addrVal },
            ];
            const badgeTone = (v) => (v === 1
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : v === 0.5
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400');
            const textTone = (v) => (v === 1
                ? 'text-emerald-600 dark:text-emerald-400'
                : v === 0.5
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-600 dark:text-rose-400');
            return {
                label: 'Contact Info (NAP)',
                plain: true,
                value: (
                    <div className="flex flex-col gap-2.5">
                        {rows.map((r) => (
                            <div key={r.label} className="flex items-center justify-between gap-3">
                                <span className="text-sm font-semibold">{r.label}</span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-medium ${textTone(r.val)}`}>{r.detail}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeTone(r.val)}`}>{r.val}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ),
            };
        }
        case 'topicalAuthority':
            return { label: 'Content Depth', value: `~${data?.wordCount ?? 0} words on this page` };
        case 'brandEntityStrength':
            return { label: 'Brand Strength', value: `${data?.tier || 'Weak'} (${data?.score ?? 0}/100)` };
        case 'eeatComposite': {
            const b = data?.breakdown || {};
            return {
                label: 'E-E-A-T Breakdown',
                mono: true,
                value: `Experience ${b.experience ?? 0}   •   Expertise ${b.expertise ?? 0}   •   Authority ${b.authority ?? 0}`,
            };
        }
        case 'faqQa':
            return { label: 'FAQ / Q&A Blocks', value: `${data?.score ?? 0}/100 readiness` };
        case 'sameAsValidation':
            return { label: 'sameAs Profile Links', value: `${data?.score ?? 0}/100 — profile links for entity verification` };
        default:
            return { label: 'Current Status', value: `${data?.score ?? 0}% ready` };
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
        case 'faqQa':
            return "Question-headed sections with concise answers (plus FAQPage schema) are the format answer engines lift directly into AI Overviews and voice results — the cleanest path to being quoted.";
        case 'sameAsValidation':
            return "sameAs links connect your site to your authoritative profiles (Google Business Profile, Facebook, LinkedIn, Yelp, DealerRater). They let engines disambiguate your business from similarly-named ones and corroborate your identity.";
        case 'eeatComposite':
            return "Google's E-E-A-T (Experience · Expertise · Authority · Trust) is one consolidated signal: original media + testimonials, visible credentials/tenure, and third-party mentions together tell engines the content comes from a real, qualified, recognized business worth citing.";
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
        case 'answerFirst':
            if ((data?.sentenceCount ?? 0) === 0) s.push('Add a clear opening — put a short, direct answer in the first 1–2 sentences at the top.');
            else s.push('Lead with a short, direct answer in the first 1–2 sentences so AI can grab it fast.');
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

    let status, statusColor;
    if (score >= T2) {
        status = "Passed";
        statusColor = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    } else if (score >= T1) {
        status = "Partial";
        statusColor = "text-amber-500 bg-amber-500/10 border-amber-500/20";
    } else {
        status = "Failed";
        statusColor = "text-rose-500 bg-rose-500/10 border-rose-500/20";
    }

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
        <div className={`relative overflow-hidden rounded-[2rem] border transition-all duration-500 p-8 flex flex-col gap-6 ${darkMode ? "bg-slate-900 border-slate-800 shadow-xl" : "bg-card border-line shadow-sm shadow-slate-200 hover:shadow-md"}`}>

            {/* Header Area */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-5">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-105 ${darkMode ? "bg-slate-800" : "bg-cardsoft border border-line shadow-inner"}`}>
                        <Icon size={28} className={darkMode ? "text-indigo-400" : "text-indigo-600"} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <h3 className={`text-xl font-black tracking-tight ${darkMode ? "text-slate-100" : "text-ink"}`}>{title}</h3>
                        <div className={`w-fit px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusColor}`}>
                            {status}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {score < 100 && isActionableParam(signal) && (
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${showDetails
                                ? (darkMode ? "bg-slate-700 text-white" : "bg-cardsoft text-ink shadow-sm")
                                : (darkMode ? "bg-slate-800/50 text-slate-400 hover:text-white" : "bg-transparent text-faint hover:text-indigo-600")}`}
                        >
                            {showDetails ? "Hide Detail" : "View Detail"}
                            {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                    )}
                    {onInfo && (
                        <button
                            onClick={() => {
                                const info = InfoDetails[signal] || {};
                                onInfo({
                                    ...info,
                                    title: info.title || title,
                                    whatThisParameterIs: info.whatThisParameterIs || description,
                                    whyItMatters: info.whyItMatters || getWhyItMatters(signal),
                                    icon: Icon,
                                    thresholds: info.thresholds || data?.threshold || "N/A"
                                });
                            }}
                            className={`p-2 rounded-lg transition-colors ${darkMode ? "bg-slate-800 text-slate-500 hover:text-indigo-400" : "bg-cardsoft text-faint hover:text-indigo-600 border border-line"}`}
                        >
                            <Info size={18} />
                        </button>
                    )}
                </div>
            </div>



            {/* Current Data Section — shows the actual data for this parameter
                (mirrors the "Current Description" box on the Meta Description card). */}
            {(() => {
                const cur = getCurrentData(signal, data);
                return (
                    <div className="flex flex-col gap-3">
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ${darkMode ? "text-white" : "text-ink"}`}>{cur.label}</span>
                        <div className={`p-6 rounded-2xl border ${darkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-cardsoft border-line text-inksoft"} ${cur.mono ? "font-mono text-xs break-all leading-relaxed" : cur.plain ? "text-sm" : "font-serif text-sm leading-relaxed"}`}>
                            {cur.value}
                        </div>
                    </div>
                );
            })()}

            {/* Expanded Content (Analysis & Remediation) */}
            {showDetails && (
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-top-4 duration-500 pt-2 border-t border-slate-800/10 dark:border-slate-100/10">
                    {hasRichDetail ? (
                        <>
                            {/* Score Breakdown — which components are dragging the score down */}
                            {breakdownEntries.length > 0 && (
                                <div className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-950 border-slate-800" : "bg-cardsoft border-line"}`}>
                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Score Breakdown</span>
                                    <div className="flex flex-col gap-2.5 mt-3">
                                        {breakdownEntries.map(([key, val]) => {
                                            const max = breakdownMax[key] || null;
                                            const pct = max ? Math.min(100, Math.round((val / max) * 100)) : 100;
                                            const low = max && val < max;
                                            return (
                                                <div key={key} className="flex flex-col gap-1">
                                                    <div className="flex justify-between text-[11px] font-semibold">
                                                        <span className={darkMode ? "text-slate-300" : "text-inksoft"}>{prettyLabel(key)}</span>
                                                        <span className={low ? "text-amber-500" : "text-emerald-500"}>{val}{max ? `/${max}` : ""}</span>
                                                    </div>
                                                    <div className="h-1.5 rounded-full overflow-hidden bg-surface-2 dark:bg-slate-800">
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
                                        <li key={i} className={`flex gap-2 text-[11px] leading-snug font-semibold ${darkMode ? "text-slate-300" : "text-inksoft"}`}>
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
                            <div className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-950 border-slate-800" : "bg-cardsoft border-line"}`}>
                                <div className="flex flex-col gap-4">
                                    <div className="space-y-1.5">
                                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Current Status</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                            <span className={`text-xs font-black ${darkMode ? "text-white" : "text-ink"}`}>
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
                                            <span className={`text-xs font-black ${darkMode ? "text-white" : "text-ink"}`}>
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
                                <p className={`text-[11px] leading-snug font-semibold ${darkMode ? "text-slate-300" : "text-inksoft"}`}>
                                    Failing this signal reduces AI selection probability by ~70% across premium engines.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}



        </div>
    );
};

export default AEOSignalCard;
