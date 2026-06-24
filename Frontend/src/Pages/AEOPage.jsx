import React from 'react';
import AEOScoreGauge from '../Component/AEOScoreGauge';
import AEOSignalCard from '../Component/AEOSignalCard';
import AEORecommendations from '../Component/AEORecommendations';
import PlatformScoreBar from '../Component/PlatformScoreBar';
import LivePreview from '../Component/LivePreview';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { isVisibleForAudience } from '../config/parameterAudience';

import { useNavigate } from 'react-router-dom';
import { savePostAuthIntent } from '../utils/intentStore';

// ─────────────────────────────────────────────────────────────────────────
// AEO parameter cards = the spec §2.8 parameter list, in spec order. This is the
// SINGLE source of truth for which cards render. Each entry maps a spec param
// (the backend `aeo.params` key — the weighted scorecard) to the underlying
// signal that supplies rich detail. Params NOT in §2.8 are intentionally absent:
//   • markdownHeaders  → owned by AIO §2.7 (structure), not an AEO param
//   • experience/expertise/authority signals → consolidated into ONE E-E-A-T
// Page-specific params (FAQ/Q&A, sameAs, E-E-A-T) render only where they apply
// (aeo.params[key].applicable === false → dropped, matching the score). Brand
// Entity Strength is informational (shown, weight 0).
const AEO_PARAM_CARDS = [
    { paramKey: 'Schema_Markup',            signal: 'aeoSchema',           sig: 'schema',              title: 'Schema Markup',                                 description: 'Page-appropriate JSON-LD (FAQ/HowTo/Vehicle/Offer/LocalBusiness) that AI engines parse to verify your content.' },
    { paramKey: 'Answer_First_Structure',   signal: 'answerFirst',         sig: 'answerFirst',         title: 'Answer-First Structure',                        description: 'A direct, quotable answer in the first ~40–60 words / a TL;DR lead so engines can extract the nugget immediately.' },
    { paramKey: 'Bot_Access',               signal: 'botAccess',           sig: 'botAccess',           title: 'Bot Access (Search Index Status)',              description: 'robots.txt / meta / X-Robots allow GPTBot, Google-Extended, PerplexityBot — scored per engine and averaged.' },
    { paramKey: 'Structured_Content',       signal: 'structuredContent',   sig: 'structuredContent',   title: 'Structured Content',                            description: 'Machine-parseable spec/comparison tables and lists (not data trapped inside images).' },
    { paramKey: 'FAQ_QA_Blocks',            signal: 'faqQa',               sig: null,                  title: 'FAQ / Q&A Blocks',                              description: 'Question-headed sections with concise answers plus FAQPage schema (FAQ / Finance / Service / VDP pages).' },
    { paramKey: 'Entity_Recognition',       signal: 'entityRecognition',   sig: 'entityRecognition',   title: 'Entity Recognition',                            description: 'Organization/LocalBusiness schema + Knowledge Graph presence — how confidently engines identify the business.' },
    { paramKey: 'Citation_NAP_Consistency', signal: 'citationConsistency', sig: 'citationConsistency', title: 'Citation / NAP Consistency',                    description: 'Name / address / phone identical on-page (and vs Google Business Profile).' },
    { paramKey: 'Citations_Attribution',    signal: 'citations',           sig: 'citations',           title: 'Citations & Attribution',                       description: 'Links to authoritative sources (OEM, NHTSA, IIHS) and transparent attribution that RAG engines value.' },
    { paramKey: 'Topical_Authority',        signal: 'topicalAuthority',    sig: 'topicalAuthority',    title: 'Topical Authority',                             description: 'Content depth and topic-cluster coverage around dealership topics.' },
    { paramKey: 'Index_Coverage',           signal: 'indexCoverage',       sig: 'indexCoverage',       title: 'Index Coverage',                                description: 'Are key pages actually indexable (GSC real data, sitemap estimate fallback).' },
    { paramKey: 'SameAs_Validation',        signal: 'sameAsValidation',    sig: null,                  title: 'sameAs Validation',                             description: 'Extracted sameAs profile links (GBP/Facebook/LinkedIn/Yelp/DealerRater) for entity disambiguation (Home / About).' },
    { paramKey: 'EEAT_Composite',           signal: 'eeatComposite',       sig: null,                  title: 'E-E-A-T (Experience · Expertise · Authority)',  description: 'One consolidated E-E-A-T score — original media, credentials, team, reviews, mentions (About / Blog / Service).' },
    { paramKey: 'Llms_Txt',                 signal: 'llmsTxt',             sig: 'llmsTxt',             title: 'llms.txt Standard',                             description: 'A well-formed /llms.txt manifest at the domain root.' },
    { paramKey: 'Brand_Entity_Strength',    signal: 'brandEntityStrength', sig: 'brandEntityStrength', title: 'Brand Entity Strength',                         description: 'Brand-authority meter (sameAs breadth, KG/Wikipedia, review volume). Informational — overlaps Entity Recognition.', info: true },
];

// Signal keys still drive the dealer/dev visibility gate (now a no-op true).
const AEO_SIGNAL_KEYS = AEO_PARAM_CARDS.map((c) => c.signal);

// Derived-param detail builders (params with no dedicated analyzer — they reuse
// existing signal evidence, mirroring the backend's deriveFaqScore/deriveSameAsScore
// and the E-E-A-T composite).
const buildFaqData = (schemaSig, score) => {
    const d = schemaSig?.details || {};
    const reason = d.hasFAQSchema
        ? '✅ FAQPage schema detected — your Q&A is machine-readable for answer engines.'
        : d.hasFAQContent
            ? '⚠️ FAQ-style content found but no FAQPage schema — wrap your Q&A in FAQPage JSON-LD so engines can extract it.'
            : 'No FAQ / Q&A blocks detected on this page.';
    const issues = [];
    if (!d.hasFAQSchema) issues.push('Add FAQPage schema (JSON-LD) around your question/answer pairs.');
    if (!d.hasFAQContent) issues.push('Add a concise FAQ section answering common buyer questions.');
    return { score, reason, issues };
};

const buildSameAsData = (entitySig, score) => {
    const n = entitySig?.orgSchema?.sameAsCount || 0;
    const reason = n >= 3
        ? `✅ ${n} sameAs profile links found — strong entity disambiguation.`
        : n > 0
            ? `⚠️ Only ${n} sameAs link(s) — add more authoritative profiles for cross-verification.`
            : 'No sameAs links in Organization schema — engines can\'t cross-verify your identity.';
    const issues = n >= 3 ? [] : ['Add a sameAs array to your Organization/LocalBusiness JSON-LD linking GBP, Facebook, LinkedIn, Yelp and DealerRater.'];
    return { score, reason, issues };
};

const buildEeatData = (signals, score) => {
    const exp = signals.experienceSignals || {}, expt = signals.expertiseSignals || {}, auth = signals.authoritySignals || {};
    const breakdown = { experience: exp.score ?? 0, expertise: expt.score ?? 0, authority: auth.score ?? 0 };
    const issues = [
        ...((exp.issues || []).slice(0, 1)),
        ...((expt.issues || []).slice(0, 1)),
        ...((auth.issues || []).slice(0, 1)),
    ];
    const reason = score >= 75
        ? '✅ Strong E-E-A-T: first-hand experience, visible credentials, and third-party authority.'
        : `⚠️ E-E-A-T composite ${score}/100 — experience ${breakdown.experience}, expertise ${breakdown.expertise}, authority ${breakdown.authority}.`;
    return { score, breakdown, issues, reason };
};

const SignalSkeleton = ({ darkMode, title }) => (
    <div className={`relative overflow-hidden rounded-[2rem] border p-8 flex flex-col gap-6 ${darkMode ? "bg-slate-900/50 border-slate-800" : "bg-cardsoft border-line"}`}>
        <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center animate-pulse ${darkMode ? "bg-slate-800" : "bg-surface-2"}`}></div>
            <div className="flex flex-col gap-2">
                <div className={`h-6 w-48 rounded animate-pulse ${darkMode ? "bg-slate-800" : "bg-surface-2"}`}></div>
                <div className={`h-4 w-16 rounded-full animate-pulse ${darkMode ? "bg-slate-800" : "bg-surface-2"}`}></div>
            </div>
        </div>
        <div className={`h-24 w-full rounded-2xl animate-pulse ${darkMode ? "bg-slate-800" : "bg-surface-2"}`}></div>
    </div>
);

const AEOPage = ({ auditData, darkMode, onInfo, hideScreenshot = false }) => {
    const { isAuthenticated } = useAuth();
    const { audienceMode } = useData();
    const navigate = useNavigate();

    // AEO signals are developer-only by default — hide the whole breakdown in Dealer mode
    // (per-signal classification still honored via isVisibleForAudience).
    const showSignalBreakdown = AEO_SIGNAL_KEYS.some((s) => isVisibleForAudience(s, audienceMode));

    const [streamedAeo, setStreamedAeo] = React.useState(null);
    const [streamStatus, setStreamStatus] = React.useState("Initializing AEO Engine...");
    const [isStreaming, setIsStreaming] = React.useState(false);
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    React.useEffect(() => {
        if (!auditData?.aeo && auditData?.url && !isStreaming && !streamedAeo) {
            setIsStreaming(true);
            let active = true;
            
            const startStream = async () => {
                try {
                    const response = await fetch(`${baseUrl}/api/aeo/stream`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: auditData.url, device: auditData.device || "desktop", reportId: auditData._id })
                    });
                    
                    if (!response.body) return;
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    
                    let signals = {};
                    setStreamedAeo({ signals });

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done || !active) break;
                        
                        const chunkStr = decoder.decode(value);
                        const lines = chunkStr.split('\n');
                        
                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const dataStr = line.replace('data: ', '').trim();
                                if (!dataStr) continue;
                                try {
                                    const { type, data, error } = JSON.parse(dataStr);
                                    if (type === 'error') {
                                        setStreamStatus("Error: " + error);
                                        break;
                                    } else if (type === 'status') {
                                        setStreamStatus(data.message);
                                    } else if (type === 'signal') {
                                        signals = { ...signals, [data.name]: data.data };
                                        setStreamedAeo(prev => ({ ...prev, signals }));
                                    } else if (type === 'complete') {
                                        setStreamedAeo(data);
                                        setIsStreaming(false);
                                    }
                                } catch (e) {
                                    console.error("Error parsing stream:", e);
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.error("Stream error", e);
                    setStreamStatus("Failed to load AEO data.");
                    setIsStreaming(false);
                }
            };
            startStream();
            return () => { active = false; };
        }
    }, [auditData, isStreaming, streamedAeo, baseUrl]);

    const aeo = auditData?.aeo || streamedAeo;
    const isComplete = aeo && aeo.overallScore !== undefined;

    if (!aeo || (!isComplete && Object.keys(aeo?.signals || {}).length === 0)) {
        return (
            <div className="max-w-7xl mx-auto space-y-24 mt-8 transition-colors duration-500">
                <div className={`flex flex-col xl:flex-row items-center ${hideScreenshot ? "justify-center" : "gap-10 py-4"}`}>
                    {!hideScreenshot && (
                        <div className="w-full xl:w-[45%] flex items-center justify-center">
                            <div className="w-full relative">
                                <LivePreview data={auditData} variant="plain" />
                            </div>
                        </div>
                    )}
                    <div className={`w-full ${hideScreenshot ? "max-w-3xl" : "xl:w-[55%]"} flex flex-col items-center justify-center`}>
                        <div className={`flex flex-col items-center justify-center w-full min-h-[400px] border border-dashed rounded-3xl p-12 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-surface-2 border-line"}`}>
                            {auditData?.aioReadiness?.Percentage !== undefined && (
                                <div className="mb-8 flex flex-col items-center">
                                    <div className="text-[3.5rem] font-black text-emerald-500 leading-none tracking-tighter mb-2">
                                        {auditData.aioReadiness.Percentage}%
                                    </div>
                                    <div className="text-[10px] uppercase font-semibold tracking-widest text-muted mb-6">
                                        Initial AIO Score
                                    </div>
                                </div>
                            )}
                            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mb-6 ${darkMode ? "border-indigo-400" : "border-indigo-600"}`}></div>
                            <h3 className={`text-xl font-semibold ${darkMode ? "text-slate-200" : "text-inksoft"}`}>AEO Engine Analyzing...</h3>
                            <p className={`text-sm mt-2 text-center max-w-sm ${darkMode ? "text-slate-500" : "text-faint"}`}>{streamStatus || "Generating Answer Engine Optimization scores across Gemini, ChatGPT, and Perplexity AI."}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-24 mt-8 transition-colors duration-500">

                 {/* Visual Overview (Top Row) */}
            <div className={`flex flex-col xl:flex-row items-center ${hideScreenshot ? "justify-center" : "gap-10 py-4"}`}>
                {/* Left Column: LivePreview */}
                {!hideScreenshot && (
                    <div className="w-full xl:w-[45%] flex items-center justify-center">
                        <div className="w-full relative">
                            <LivePreview data={auditData} variant="plain" />
                        </div>
                    </div>
                )}

                {/* Right Column: AEO Score Section */}
                <div className={`w-full ${hideScreenshot ? "max-w-3xl" : "xl:w-[55%]"} flex flex-col items-center justify-center`}>
                    <h2 className={`text-[1.35rem] font-semibold mb-7 tracking-tight ${darkMode ? "text-slate-100" : "text-ink"}`}>
                        AI Engine Visibility
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-3xl">
                        {isComplete ? (
                            <>
                                <AEOScoreGauge score={aeo.platforms?.gemini?.score || 0} title="GOOGLE" subtitle="GEMINI" color="#4285F4" size={160} darkMode={darkMode} />
                                <AEOScoreGauge score={aeo.platforms?.chatgpt?.score || 0} title="OPENAI" subtitle="CHATGPT" color="#10A37F" size={160} darkMode={darkMode} />
                                <AEOScoreGauge score={aeo.platforms?.perplexity?.score || 0} title="PERPLEXITY" subtitle="AI" color="#A259FF" size={160} darkMode={darkMode} />
                            </>
                        ) : (
                            <div className="col-span-3 flex flex-col items-center justify-center py-8">
                                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mb-6 ${darkMode ? "border-indigo-400" : "border-indigo-600"}`}></div>
                                <h3 className={`text-xl font-semibold ${darkMode ? "text-slate-200" : "text-inksoft"}`}>{streamStatus}</h3>
                            </div>
                        )}
                    </div>
                </div>
            </div> 
            {/* Header Section (Middle Row) */}
            <header className={`flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-transparent`}>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      
                        <h1 className={`text-4xl md:text-[2.75rem] font-black tracking-tight ${darkMode ? "text-white" : "text-ink"} leading-none`}>
                            Answer Engine <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Optimization</span>
                        </h1>
                    </div>
                    <p className="text-[1.1rem] font-medium text-muted">Measuring your site's readiness for the next generation of AI search.</p>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <div className="text-[3.5rem] font-black leading-none text-accent tracking-tighter">{isComplete ? `${aeo.overallScore}%` : '...'}</div>
                        <div className="text-[10px] uppercase font-semibold tracking-[0.2em] mt-1 text-muted">AEO Mastery</div>
                    </div>
                    <div className={`h-16 w-[1px] ${darkMode ? "bg-slate-800" : "bg-line"}`}></div>
                    <div className="text-xs font-medium leading-relaxed max-w-[120px] text-muted">
                        Overall platform readiness across 5 signals.
                    </div>
                </div>
            </header>

            {/* Platform Master Grid (Bottom Row) */}
            {isComplete && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {['gemini', 'chatgpt', 'perplexity'].map((platform) => (
                        <PlatformScoreBar
                            key={platform}
                            platformKey={platform}
                            platforms={aeo.platforms}
                            darkMode={darkMode}
                            singleCard={true}
                        />
                    ))}
                </div>
            )}

     

            {/* AEO insights are open to everyone — guests included (login gate removed). */}
            {(
                <>
                    {/* Signal Breakdown (developer-only by default) */}
                    {showSignalBreakdown && (
                    <div className="space-y-6 pt-6">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="h-6 w-1.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                            <h2 className={`text-2xl font-semibold tracking-tight ${darkMode ? "text-slate-200" : "text-ink"}`}>Core Signal Breakdown</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                            {AEO_PARAM_CARDS.map((c) => {
                                const params = aeo.params || {};
                                const signals = aeo.signals || {};
                                const p = params[c.paramKey];

                                // Page-specific params (FAQ/Q&A, sameAs, E-E-A-T) that don't apply
                                // to this page type are dropped — matching how they're excluded from
                                // the weighted score (rule-6 N/A). Common + informational always show.
                                if (p && p.applicable === false && !c.info) return null;

                                // Schema Markup here is the FAQ/HowTo check. On page types that don't
                                // need FAQ/HowTo (home, about/contact, generic, listing, etc.) it just
                                // auto-passes and adds noise — hide it unless real FAQ/HowTo schema or
                                // content is actually present on the page.
                                if (c.paramKey === 'Schema_Markup') {
                                    const FAQ_HOWTO_PAGES = ['content', 'finance', 'service', 'vdp'];
                                    const d = aeo.signals?.schema?.details || {};
                                    const hasRealFaqHowTo = d.hasFAQSchema || d.hasHowToSchema || d.hasFAQContent || d.hasHowToContent;
                                    if (!FAQ_HOWTO_PAGES.includes(aeo.pageType) && !hasRealFaqHowTo) return null;
                                }

                                // Resolve the param score (prefer the backend scorecard) and the
                                // detail data (real signal, or a derived builder for params with
                                // no dedicated analyzer).
                                const score = typeof p?.score === 'number'
                                    ? p.score
                                    : (signals[c.sig]?.score ?? 0);

                                let data, ready;
                                if (c.signal === 'faqQa') {
                                    ready = !!signals.schema;
                                    data = buildFaqData(signals.schema, score);
                                } else if (c.signal === 'sameAsValidation') {
                                    ready = !!signals.entityRecognition;
                                    data = buildSameAsData(signals.entityRecognition, score);
                                } else if (c.signal === 'eeatComposite') {
                                    ready = !!(signals.experienceSignals || signals.expertiseSignals || signals.authoritySignals);
                                    data = buildEeatData(signals, score);
                                } else {
                                    ready = !!signals[c.sig];
                                    data = signals[c.sig];
                                }

                                return ready ? (
                                    <AEOSignalCard
                                        key={c.paramKey}
                                        signal={c.signal}
                                        score={score}
                                        data={data}
                                        title={c.title}
                                        description={c.description}
                                        darkMode={darkMode}
                                        onInfo={onInfo}
                                        url={auditData.url}
                                    />
                                ) : <SignalSkeleton key={c.paramKey} darkMode={darkMode} title={c.title} />;
                            })}
                        </div>
                    </div>
                    )}

                    {/* Actionable Recommendations */}
                    {isComplete && (
                        <div className={`pt-8 border-t ${darkMode ? "border-slate-800" : "border-line"}`}>
                            <AEORecommendations recommendations={aeo.recommendations} darkMode={darkMode} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AEOPage;
