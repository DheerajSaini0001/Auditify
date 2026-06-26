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

// Map a sameAs URL to a recognizable platform label (for the found/missing profile lists).
const SAMEAS_PLATFORMS = [
    { key: 'Google Business Profile', re: /g\.page|google\.com\/maps|business\.google|maps\.app\.goo/i },
    { key: 'Facebook', re: /facebook\.com|fb\.com/i },
    { key: 'Instagram', re: /instagram\.com/i },
    { key: 'X (Twitter)', re: /twitter\.com|\bx\.com/i },
    { key: 'LinkedIn', re: /linkedin\.com/i },
    { key: 'YouTube', re: /youtube\.com|youtu\.be/i },
    { key: 'Yelp', re: /yelp\.com/i },
    { key: 'DealerRater', re: /dealerrater\.com/i },
    { key: 'Wikipedia', re: /wikipedia\.org/i },
    { key: 'Wikidata', re: /wikidata\.org/i },
    { key: 'Pinterest', re: /pinterest\./i },
    { key: 'TikTok', re: /tiktok\.com/i },
];
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return String(u || ''); } };
const labelForSameAs = (u) => SAMEAS_PLATFORMS.find((p) => p.re.test(String(u)))?.key || hostOf(u);

// The profiles engines most want for entity disambiguation (NAP/sameAs cross-verification).
const SAMEAS_EXPECTED = ['Google Business Profile', 'Facebook', 'LinkedIn', 'Yelp', 'DealerRater'];

// The actual current data for each parameter — shown in a neutral box (like the
// "Current Description" box on the Meta Description card), instead of a status sentence.
// Returns { label, value, mono?, headerInfo? }. value may be a string or JSX.
const getCurrentData = (signal, data) => {
    switch (signal) {
        case 'aeoSchema': {
            const d = data?.details || {};
            const raw = Array.isArray(d.rawSchemas) ? d.rawSchemas.filter(Boolean) : [];
            const types = Array.isArray(d.schemaTypes) ? d.schemaTypes : [];
            // Show the FULL JSON-LD schema markup directly on the card.
            if (raw.length) {
                return {
                    label: 'Schema Markup (JSON-LD)',
                    plain: true,
                    value: (
                        <div className="flex flex-col gap-3">
                            {types.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {types.map((t, i) => (
                                        <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">{t}</span>
                                    ))}
                                </div>
                            )}
                            {raw.map((s, i) => (
                                <pre key={i} className="text-[11px] font-mono leading-relaxed whitespace-pre-wrap break-all max-h-80 overflow-y-auto custom-scrollbar p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-slate-200/60 dark:border-slate-700/60">{s}</pre>
                            ))}
                        </div>
                    ),
                };
            }
            const found = [];
            if (d.hasFAQContent) found.push('FAQ content (no schema)');
            return {
                label: 'Schema Markup (JSON-LD)',
                value: found.length ? found.join(', ') : 'No JSON-LD schema markup found on this page',
                headerInfo: data?.message,
            };
        }
        case 'botAccess': {
            const bots = data?.bots || {};
            const entries = Object.entries(bots);
            if (!entries.length) {
                return { label: 'AI Bot Access', value: 'No AI-bot rules found in robots.txt' };
            }
            // One row per AI bot — green when allowed, red when blocked.
            return {
                label: 'AI Bot Access',
                plain: true,
                value: (
                    <div className="flex flex-col gap-2.5">
                        {entries.map(([bot, state]) => {
                            const blocked = String(state).toLowerCase() === 'blocked';
                            return (
                                <div key={bot} className="flex items-center justify-between gap-4">
                                    <span className="text-sm font-semibold flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${blocked ? 'bg-rose-400' : 'bg-emerald-500'}`} />
                                        {bot}
                                    </span>
                                    <span className={`text-sm text-right capitalize ${blocked ? 'text-rose-500 font-semibold' : ''}`}>
                                        {state}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ),
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
        case 'answerFirst': {
            const sentences = Array.isArray(data?.sentences) ? data.sentences.filter(Boolean) : [];
            // Show the actual sentence(s) detected at the top of the page on the card.
            if (sentences.length) {
                return {
                    label: `Sentence(s) detected at the top of the page (${sentences.length})`,
                    plain: true,
                    value: (
                        <div className="flex flex-col gap-2.5">
                            {sentences.map((s, i) => (
                                <div key={i} className="flex items-start gap-2.5 text-sm leading-relaxed">
                                    <span className="shrink-0 text-[10px] font-black mt-1 w-5 h-5 rounded-full flex items-center justify-center bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">{i + 1}</span>
                                    <span>{s}</span>
                                </div>
                            ))}
                        </div>
                    ),
                };
            }
            return {
                label: 'Page Opening',
                value: data?.preview
                    ? `"${data.preview}"`
                    : <span className="italic opacity-50">No clear opening text found</span>,
            };
        }
        case 'citations': {
            const b = data?.breakdown || {};
            return {
                label: 'Trust & Citations',
                mono: true,
                value: `Citations ${b.citations ?? 0}/45   •   Policies ${b.policies ?? 0}/20   •   Contact ${b.contactTransparency ?? 0}/20`,
            };
        }
        case 'indexCoverage': {
            const notIndexed = Array.isArray(data?.notIndexed) ? data.notIndexed.filter((p) => p && p.url) : [];
            const summary = data?.sitemapFound
                ? `Sitemap found — ~${data?.estimatedCoverage ?? 0}% of sampled URLs are indexable (≈${data?.estimatedIndexed ?? 0} of ${data?.submitted ?? 0}).`
                : 'No XML sitemap found';
            if (notIndexed.length) {
                const short = (u) => { try { const p = new URL(u); return p.pathname + p.search || '/'; } catch { return u; } };
                return {
                    label: `Pages not indexed (${notIndexed.length})`,
                    plain: true,
                    value: (
                        <div className="flex flex-col gap-3">
                            <p className="text-sm leading-relaxed text-inksoft dark:text-slate-300">{summary}</p>
                            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                                {notIndexed.map((p, i) => (
                                    <div key={i} className="flex items-start justify-between gap-3 p-2.5 rounded-lg border bg-rose-50/40 border-rose-100 dark:bg-rose-500/5 dark:border-rose-500/15">
                                        <a href={p.url} target="_blank" rel="noopener noreferrer"
                                            className="text-xs font-mono break-all text-indigo-600 dark:text-indigo-400 hover:underline" title={p.url}>
                                            {short(p.url)}
                                        </a>
                                        {p.reason && (
                                            <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 whitespace-nowrap">
                                                {p.reason}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ),
                };
            }
            return { label: 'Index Coverage', value: summary };
        }
        case 'entityRecognition': {
            const o = data?.orgSchema || {};
            return {
                label: 'Business Identity',
                value: o.found ? `${o.name || 'Organization'} (${o.type || 'Organization'})` : 'No Organization / LocalBusiness schema found',
            };
        }
        case 'citationConsistency': {
            // Show the actual name / phone number / address from the page's schema.
            const rows = [
                { label: 'Name', value: data?.schemaName || null },
                { label: 'Phone', value: data?.phoneDisplay || null },
                { label: 'Address', value: data?.addressDisplay || null },
            ];
            return {
                label: 'Contact Info (NAP)',
                plain: true,
                value: (
                    <div className="flex flex-col gap-2.5">
                        {rows.map((r) => (
                            <div key={r.label} className="flex items-start justify-between gap-4">
                                <span className="text-sm font-semibold shrink-0">{r.label}</span>
                                <span className={`text-sm text-right ${r.value ? '' : 'italic opacity-50'}`}>
                                    {r.value || 'Not found'}
                                </span>
                            </div>
                        ))}
                    </div>
                ),
            };
        }
        case 'topicalAuthority':
            return { label: 'Content Depth', value: `~${data?.wordCount ?? 0} words on this page` };
        case 'brandEntityStrength': {
            const det = data?.detected || {};
            const social = det.socialProfiles || [];
            const others = det.otherProfiles || [];
            const schema = det.schema || {};
            // One found/not-found row: green/red dot + the actual value (URL / count) when found.
            const Row = ({ label, found, sub }) => (
                <div className="flex items-start justify-between gap-4">
                    <span className="text-sm font-semibold shrink-0 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${found ? 'bg-emerald-500' : 'bg-rose-400'}`} />
                        {label}
                    </span>
                    <span className={`text-sm text-right break-all ${found ? '' : 'italic opacity-50'}`}>
                        {found ? (sub || 'Found') : 'Not found'}
                    </span>
                </div>
            );
            const GroupTitle = ({ children }) => (
                <span className="text-[10px] font-black uppercase tracking-[0.15em] opacity-40">{children}</span>
            );
            return {
                label: `Detected Brand Signals — ${data?.tier || 'Weak'} (${data?.score ?? 0}/100)`,
                plain: true,
                value: (
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2.5">
                            <GroupTitle>Social / brand profiles</GroupTitle>
                            {social.map((p) => <Row key={p.platform} label={p.platform} found={p.found} sub={p.url} />)}
                            {others.map((p, i) => <Row key={`other-${i}`} label={p.platform} found sub={p.url} />)}
                        </div>
                        <div className="flex flex-col gap-2.5">
                            <GroupTitle>Authority &amp; reviews</GroupTitle>
                            <Row label="Wikipedia" found={det.hasWikipedia} />
                            <Row label="Wikidata" found={det.hasWikidata} />
                            <Row label="Reviews in schema" found={det.hasRating}
                                sub={det.hasRating ? `${det.reviewCount || 0} review(s)` : null} />
                        </div>
                        <div className="flex flex-col gap-2.5">
                            <GroupTitle>Organization schema</GroupTitle>
                            <Row label="Name" found={schema.name} />
                            <Row label="Logo" found={schema.logo} />
                            <Row label="Address" found={schema.address} />
                            <Row label="Founding date" found={schema.foundingDate} />
                            <Row label="Description" found={schema.description} />
                            <Row label="Awards" found={schema.award} />
                        </div>
                    </div>
                ),
            };
        }
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
        case 'sameAsValidation': {
            const links = Array.isArray(data?.sameAs) ? data.sameAs.filter(Boolean) : [];
            if (links.length) {
                return {
                    label: `sameAs Profiles Found (${links.length})`,
                    plain: true,
                    value: (
                        <div className="flex flex-col gap-2.5">
                            {links.map((u, i) => (
                                <div key={i} className="flex items-center justify-between gap-3">
                                    <span className="text-sm font-semibold flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                        {labelForSameAs(u)}
                                    </span>
                                    <a href={u} target="_blank" rel="noopener noreferrer"
                                        className="text-xs font-mono break-all text-right text-indigo-600 dark:text-indigo-400 hover:underline" title={u}>
                                        {hostOf(u)}
                                    </a>
                                </div>
                            ))}
                        </div>
                    ),
                };
            }
            return { label: 'sameAs Profile Links', value: 'No sameAs profile links found in Organization schema' };
        }
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

// ─────────────────────────────────────────────────────────────────────────
// Sub-score breakdown — break EVERY parameter into its individual checks so the
// user sees, in plain language, which parts pass and what each failing part wants.
// Each row: { label, got, max, want }. got>=max → OK (green), 0<got<max → Partial
// (amber), got===0 → Missing (red). `want` is shown only when the part isn't full.

// Nicer labels for breakdown keys (per signal); falls back to prettyLabel.
const SUB_LABELS = {
    llmsTxt: { present: 'Valid text file', h1: 'Title (H1)', sections: 'Sections (##)', links: 'Page links', summary: 'Summary line', sameDomain: 'Links to your own pages', relevance: 'On-topic content' },
    citations: { citations: 'Cited sources', policies: 'Policy pages', contactTransparency: 'Contact & authorship', trustBasics: 'Trust basics (HTTPS, dates)' },
    brandEntityStrength: { sameAs: 'Social / brand profiles', authoritative: 'Wikipedia / Wikidata', reviews: 'Reviews & ratings', completeness: 'Schema completeness' },
    citationConsistency: { completeness: 'NAP in schema', phoneConsistency: 'Phone is consistent', nameConsistency: 'Name is consistent', addressCompleteness: 'Address is complete' },
    topicalAuthority: { depth: 'Content depth', headings: 'Topic headings', internalLinks: 'Internal links', verifiedCluster: 'Real linked pages', industry: 'Industry coverage', local: 'Local signals' },
    experienceSignals: { reviews: 'Customer testimonials', media: 'Original photos / video', firstPerson: 'First-hand voice', people: 'Real people shown' },
    expertiseSignals: { credentials: 'Certifications', awards: 'Awards & recognition', tenure: 'Years in business', authorExpertise: 'Credentialed authors' },
    authoritySignals: { pressMentions: 'Press mentions', externalAuthority: 'Authoritative links', trustBadges: 'Trust badges', socialProof: 'Social proof' },
    eeatComposite: { experience: 'Experience', expertise: 'Expertise', authority: 'Authority' },
};

// What each breakdown sub-check wants in order to be full — plain language.
const SUB_WANTS = {
    llmsTxt: {
        present: 'Serve a real plain-text llms.txt at your domain root (not an HTML page).',
        h1: 'Start the file with a single "# Your Business Name" title.',
        sections: 'Group links under "## Section" headings (e.g. ## Inventory, ## Financing).',
        links: 'List your key pages as markdown links: [name](url): description.',
        summary: 'Add a one-line "> summary" under the title.',
        sameDomain: 'Link to your own pages (same domain), not just external sites.',
        relevance: 'Describe your real brand and pages — no placeholder / off-topic text.',
    },
    citations: {
        citations: 'Cite 3+ reputable sources, add [1]-style markers and a References / Sources section.',
        policies: 'Add clear policy pages (privacy, terms, contact, about).',
        contactTransparency: 'Show author bylines and transparent contact info.',
        trustBasics: 'Cover trust basics — HTTPS, disclosures, and visible dates.',
    },
    brandEntityStrength: {
        sameAs: 'Add more verified social / brand profile links (sameAs).',
        authoritative: 'Earn a Wikipedia / Wikidata presence — the strongest authority signal.',
        reviews: 'Add aggregateRating schema and grow your review volume.',
        completeness: 'Complete your Organization schema (name, logo, address, etc.).',
    },
    citationConsistency: {
        completeness: 'Add machine-readable Name, Address and Phone in your schema.',
        phoneConsistency: 'Use one consistent phone number across the page.',
        nameConsistency: 'Use one exact business name across schema, title and social tags.',
        addressCompleteness: 'Add a complete address (street, city, postal code).',
    },
    topicalAuthority: {
        depth: 'Add more in-depth content on your core topics.',
        headings: 'Break the content into clear topic sections with H2 / H3 headings.',
        internalLinks: 'Link to related pages to build a topic cluster.',
        verifiedCluster: 'Make sure linked pages are real, in-depth pages.',
        industry: 'Cover more industry topics (financing, service, trade-in, CPO, etc.).',
        local: 'Add local signals (city / region terms, "near me", directions).',
    },
    experienceSignals: {
        reviews: 'Add genuine testimonials with Review / aggregateRating schema.',
        media: 'Add original photos / video of your real inventory and lot (with alt text).',
        firstPerson: 'Write in a first-hand voice ("we", "our team").',
        people: 'Show real staff / people on the page.',
    },
    expertiseSignals: {
        credentials: 'Show certifications / accreditations (ASE, manufacturer-certified, BBB, licensed).',
        awards: 'Showcase awards and recognition.',
        tenure: 'State your years in business / established date.',
        authorExpertise: 'Add credentialed authors with short bios.',
    },
    authoritySignals: {
        pressMentions: 'Add a press / "as seen in" section linking media coverage.',
        externalAuthority: 'Link authoritative sources (NHTSA, KBB, manufacturer, .gov / .edu).',
        trustBadges: 'Display trust badges (BBB, manufacturer, secure-checkout).',
        socialProof: 'Show social proof — followers, review counts, ratings.',
    },
    eeatComposite: {
        experience: 'Show first-hand experience — original photos, testimonials, your own voice.',
        expertise: 'Show credentials — certifications, awards, qualified authors.',
        authority: 'Earn third-party validation — press, authoritative links, trust badges.',
    },
};

// What each sub-check currently HAS on the page — { found, missing } lists, rendered
// as separate "Found:" / "Missing:" rows alongside the "Wants:" line so a partial
// score explains both sides. Defined where the backend exposes concrete findings.
const getGotText = (signal, key, data) => {
    if (signal === 'citations') {
        const t = data?.transparency || {};
        switch (key) {
            case 'citations': {
                const ext = data?.externalSources ?? 0;
                const markers = data?.citationMarkers ?? 0;
                const refs = data?.hasReferenceSection;
                return {
                    found: [
                        ext > 0 && `${ext} external source link(s)`,
                        markers > 0 && `${markers} citation marker(s) ([1] / superscript)`,
                        refs && 'References / Sources section',
                    ].filter(Boolean),
                    missing: [
                        ext < 3 && 'cited sources (3+ outbound links)',
                        markers === 0 && 'citation markers ([1] / superscript)',
                        !refs && 'References / Sources section',
                    ].filter(Boolean),
                };
            }
            case 'policies':
                return {
                    found: [t.hasPrivacy && 'Privacy', t.hasTerms && 'Terms', t.hasContact && 'Contact', t.hasAbout && 'About'].filter(Boolean),
                    missing: [!t.hasPrivacy && 'Privacy', !t.hasTerms && 'Terms', !t.hasContact && 'Contact', !t.hasAbout && 'About'].filter(Boolean),
                };
            case 'contactTransparency':
                return {
                    found: [t.hasTel && 'click-to-call phone', t.hasAddress && 'physical address', t.hasAuthor && 'author byline'].filter(Boolean),
                    missing: [!t.hasTel && 'click-to-call phone', !t.hasAddress && 'physical address', !t.hasAuthor && 'author byline'].filter(Boolean),
                };
            case 'trustBasics':
                return {
                    found: [t.isHttps && 'HTTPS', t.hasDisclosure && 'disclosure statement', t.hasUpdated && 'dated content'].filter(Boolean),
                    missing: [!t.isHttps && 'HTTPS', !t.hasDisclosure && 'disclosure statement', !t.hasUpdated && 'dated content'].filter(Boolean),
                };
            default:
                return null;
        }
    }
    if (signal === 'topicalAuthority') {
        const words = data?.wordCount ?? 0;
        const headings = data?.headingCount ?? 0;
        const links = data?.internalLinkCount ?? 0;
        const cluster = data?.verifiedClusterPages ?? 0;
        const industry = data?.industryTopicCount ?? 0;
        const local = data?.localSignals ?? 0;
        switch (key) {
            case 'depth':
                return {
                    found: words > 0 ? [`~${words} words of content`] : [],
                    missing: words < 700 ? [`more depth — aim for 700+ words (${words} now)`] : [],
                };
            case 'headings':
                return {
                    found: headings > 0 ? [`${headings} H2/H3 subtopic heading(s)`] : [],
                    missing: headings < 8 ? [`more subtopic headings — aim for 8+ (${headings} now)`] : [],
                };
            case 'internalLinks':
                return {
                    found: links > 0 ? [`${links} internal topic link(s)`] : [],
                    missing: links < 20 ? [`more internal links — aim for 20+ (${links} now)`] : [],
                };
            case 'verifiedCluster':
                return {
                    found: cluster > 0 ? [`${cluster} real, in-depth linked page(s)`] : [],
                    missing: cluster < 5 ? [`more substantive linked pages — aim for 5+ (${cluster} verified)`] : [],
                };
            case 'industry':
                return {
                    found: industry > 0 ? [`${industry} industry subtopic(s) covered`] : [],
                    missing: industry < 6 ? [`more industry topics (financing, service, trade-in, CPO…) — aim for 6+ (${industry} now)`] : [],
                };
            case 'local':
                return {
                    found: local > 0 ? [`${local} local-authority signal(s)`] : [],
                    missing: local < 3 ? [`more local signals (city/region, "near me", service area, map/directions) — aim for 3+ (${local} now)`] : [],
                };
            default:
                return null;
        }
    }
    return null;
};

// Map a backend `breakdown` object into sub-score rows.
const rowsFromBreakdown = (signal, data) => {
    const bd = data?.breakdown || {};
    const max = BREAKDOWN_MAX[signal] || {};
    return Object.entries(bd).map(([key, got]) => ({
        label: SUB_LABELS[signal]?.[key] || prettyLabel(key),
        got: Number(got) || 0,
        max: max[key] ?? 100,
        want: SUB_WANTS[signal]?.[key] || `Improve ${(SUB_LABELS[signal]?.[key] || prettyLabel(key)).toLowerCase()}.`,
        gotText: getGotText(signal, key, data),
    }));
};

// Build the per-parameter sub-score rows for any signal — using the real backend
// breakdown where one exists, or synthesising one from the signal's fields.
const getSubScores = (signal, data) => {
    // NAP must stay consistent with the Contact Info box: drive each row from whether
    // the actual value was FOUND (not the schema-only breakdown), so a field shown as
    // "Not found" can never appear as OK / passed here.
    if (signal === 'citationConsistency') {
        const nameFound = !!data?.schemaName;
        const phoneFound = !!data?.phoneDisplay;
        const addrFound = !!data?.addressDisplay;
        const bd = data?.breakdown || {};
        const rows = [
            { label: 'Business name', got: nameFound ? 1 : 0, max: 1, want: 'Add your business name in Organization / LocalBusiness schema.' },
            { label: 'Phone number', got: phoneFound ? 1 : 0, max: 1, want: 'Add a phone number — in schema, a tel: link, or your footer.' },
            { label: 'Address', got: addrFound ? 1 : 0, max: 1, want: 'Add your address — in schema or an address block in the footer.' },
        ];
        if (phoneFound) {
            rows.push({ label: 'Phone is consistent', got: (data?.distinctPhoneCount ?? 0) <= 1 ? 1 : 0, max: 1,
                want: `Use one phone number everywhere — the page shows ${data?.distinctPhoneCount ?? 0} different numbers.` });
        }
        if (nameFound) {
            rows.push({ label: 'Name is consistent', got: (bd.nameConsistency ?? 0) >= 15 ? 1 : 0, max: 1,
                want: 'Use the exact same business name across schema, title and social tags.' });
        }
        return rows;
    }

    if (data?.breakdown && BREAKDOWN_MAX[signal]) return rowsFromBreakdown(signal, data);

    switch (signal) {
        case 'aeoSchema': {
            const d = data?.details || {};
            return [
                { label: 'FAQ markup (FAQPage)', got: d.hasFAQSchema ? 1 : 0, max: 1,
                  want: d.hasFAQContent ? 'You have FAQ content — wrap it in FAQPage JSON-LD so AI can read it.' : 'Add an FAQ section and mark it up with FAQPage schema.' },
                { label: 'How-to markup (HowTo)', got: d.hasHowToSchema ? 1 : 0, max: 1,
                  want: d.hasHowToContent ? 'You have step-by-step content — add HowTo schema with numbered steps.' : 'If you publish guides, add HowTo schema with numbered steps.' },
            ];
        }
        case 'botAccess': {
            const bots = data?.bots || {};
            const rows = ['GPTBot', 'Google-Extended', 'PerplexityBot'].map((b) => ({
                label: `${b} allowed`,
                got: bots[b] === 'blocked' ? 0 : 1,
                max: 1,
                want: `Allow ${b} in your robots.txt so this AI engine can crawl the page.`,
            }));
            rows.push({
                label: 'Page is indexable',
                got: data?.isNoindexed ? 0 : 1, max: 1,
                want: 'Remove the noindex tag (meta robots or X-Robots-Tag header) so the page can be indexed.',
            });
            rows.push({
                label: 'Sitemap in robots.txt',
                got: data?.sitemapDeclared ? 1 : 0, max: 1,
                want: 'Add a "Sitemap: https://…/sitemap.xml" line to robots.txt so crawlers find all your pages.',
            });
            return rows;
        }
        case 'markdownHeaders': {
            const c = data?.counts || {};
            return [
                { label: 'One main heading (H1)', got: c.h1 === 1 ? 1 : 0, max: 1,
                  want: (c.h1 ?? 0) === 0 ? 'Add one clear main heading (H1) at the top of the page.' : 'Use exactly one H1 — keep a single main heading.' },
                { label: 'Sub-headings (H2)', got: (c.h2 ?? 0) >= 2 ? 1 : 0, max: 1,
                  want: 'Add at least two H2 sub-headings to split the page into clear sections.' },
                { label: 'Deeper structure (H3)', got: (c.h3 ?? 0) >= 1 ? 1 : 0, max: 1,
                  want: 'Add H3s under your H2s for finer structure AI can follow.' },
            ];
        }
        case 'structuredContent': {
            const t = data?.tables ?? 0, l = data?.lists ?? 0;
            return [
                { label: 'Data tables', got: t >= 1 ? 1 : 0, max: 1,
                  want: data?.dataStuckInImages ? 'Your data looks trapped in images — move it into real HTML tables AI can read.' : 'Add at least one data table (specs, pricing or comparison).' },
                { label: 'Lists', got: l >= 3 ? 2 : l >= 1 ? 1 : 0, max: 2,
                  want: 'Use bullet / numbered lists for features, steps and comparisons.' },
            ];
        }
        case 'indexCoverage': {
            const cov = data?.estimatedCoverage ?? 0;
            // Surface the concrete reasons pages failed (e.g. "3 of 25 sampled: canonicalized elsewhere").
            const reasons = (Array.isArray(data?.issues) ? data.issues : []).filter((i) => /sampled:/.test(i));
            return [
                { label: 'XML sitemap found', got: data?.sitemapFound ? 1 : 0, max: 1,
                  want: 'Add an XML sitemap and list it in robots.txt so engines find all your pages.' },
                { label: 'Pages are indexable', got: cov, max: 100,
                  want: reasons.length
                      ? `Fix the pages that aren't indexable — ${reasons.join('; ')}.`
                      : 'Fix sampled pages that are noindex or canonicalised to another URL so they can be indexed.' },
            ];
        }
        case 'entityRecognition': {
            const o = data?.orgSchema || {};
            const kg = data?.knowledgeGraph || {};
            return [
                { label: 'Organization schema', got: o.found ? 1 : 0, max: 1, want: 'Add Organization / LocalBusiness JSON-LD so AI knows who you are.' },
                { label: 'Postal address', got: o.hasAddress ? 1 : 0, max: 1, want: 'Add your postal address to the schema.' },
                { label: 'Logo', got: o.hasLogo ? 1 : 0, max: 1, want: 'Add a logo to your Organization schema.' },
                { label: 'sameAs profile links', got: (o.sameAsCount ?? 0) >= 3 ? 2 : (o.sameAsCount ?? 0) > 0 ? 1 : 0, max: 2, want: 'Add 3+ sameAs links (Google, Facebook, LinkedIn, Yelp).' },
                { label: 'Knowledge Graph presence', got: kg.found ? 1 : 0, max: 1, want: 'Build a wider web presence so engines recognise you as a distinct entity.' },
            ];
        }
        case 'answerFirst': {
            const sc = data?.score ?? 0;
            return [
                { label: 'Direct answer at the top', got: sc >= 100 ? 1 : sc >= 60 ? 0.5 : 0, max: 1,
                  want: 'Lead with a short, 1–2 sentence direct answer in the first 40–60 words.' },
            ];
        }
        case 'faqQa':
        case 'sameAsValidation': {
            const issues = Array.isArray(data?.issues) ? data.issues : [];
            const ok = (data?.score ?? 0) >= 75;
            const row = {
                label: signal === 'faqQa' ? 'FAQ / Q&A blocks' : 'sameAs profile links',
                got: ok ? 1 : 0, max: 1,
                want: issues[0] || (signal === 'faqQa' ? 'Add a clear FAQ section with FAQPage schema.' : 'Add sameAs profile links to your Organization schema.'),
            };
            if (signal === 'sameAsValidation') {
                const links = Array.isArray(data?.sameAs) ? data.sameAs.filter(Boolean) : [];
                const foundLabels = [...new Set(links.map(labelForSameAs))];
                row.gotText = {
                    found: foundLabels,
                    missing: SAMEAS_EXPECTED.filter((p) => !foundLabels.includes(p)),
                };
            }
            return [row];
        }
        default: {
            const ok = (data?.score ?? 0) >= 75;
            return [{ label: 'Overall', got: ok ? 1 : 0, max: 1, want: 'Improve this signal to reach a passing score.' }];
        }
    }
};

// Signals whose per-part breakdown is shown inline on the card (no "View Detail"
// click), with passing parts (OK) separated from the parts that still need work.
const INLINE_BREAKDOWN = new Set([
    'entityRecognition', 'citationConsistency',
    'sameAsValidation', 'indexCoverage', 'topicalAuthority', 'citations',
]);

// One per-part sub-check row: dot + label + OK/Partial/Missing badge, plus the
// "Wants:" hint when the part isn't fully passing.
const SubScoreRow = ({ row, darkMode }) => {
    const full = row.got >= row.max;
    const partial = !full && row.got > 0;
    const state = full ? 'ok' : partial ? 'partial' : 'missing';
    const dot = full ? 'bg-emerald-500' : partial ? 'bg-amber-500' : 'bg-rose-500';
    const badge = full
        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
        : partial
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
    const badgeText = full ? 'OK' : partial ? 'Partial' : 'Missing';
    return (
        <div className={`p-3.5 rounded-xl border ${full
            ? (darkMode ? "bg-slate-900/40 border-slate-800" : "bg-cardsoft border-line")
            : (darkMode ? "bg-rose-500/5 border-rose-500/15" : "bg-rose-50/40 border-rose-100")}`}>
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    <span className={`text-xs font-semibold ${darkMode ? "text-slate-200" : "text-inksoft"}`}>{row.label}</span>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap ${badge}`}>
                    {badgeText}{row.max > 2 ? ` · ${row.got}/${row.max}` : ''}
                </span>
            </div>
            {state !== 'ok' && row.gotText?.found?.length > 0 && (
                <div className={`mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed ${darkMode ? "text-slate-400" : "text-muted"}`}>
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <span><span className="font-semibold">Found: </span>{row.gotText.found.join(', ')}</span>
                </div>
            )}
            {state !== 'ok' && row.gotText?.missing?.length > 0 && (
                <div className={`mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed ${darkMode ? "text-slate-400" : "text-muted"}`}>
                    <span className="text-rose-500 mt-0.5">✕</span>
                    <span><span className="font-semibold">Missing: </span>{row.gotText.missing.join(', ')}</span>
                </div>
            )}
            {state !== 'ok' && row.want && (
                <div className={`mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed ${darkMode ? "text-slate-400" : "text-muted"}`}>
                    <span className="text-indigo-500 mt-0.5">→</span>
                    <span><span className="font-semibold">Wants: </span>{row.want}</span>
                </div>
            )}
        </div>
    );
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

    // NAP: the badge must agree with the Contact Info box. If the actual Name / Phone /
    // Address aren't found, don't show "Passed" — downgrade so it never contradicts.
    if (signal === 'citationConsistency') {
        const missing = [data?.schemaName, data?.phoneDisplay, data?.addressDisplay].filter((v) => !v).length;
        if (missing > 0) {
            status = missing >= 2 ? "Failed" : "Partial";
            statusColor = missing >= 2
                ? "text-rose-500 bg-rose-500/10 border-rose-500/20"
                : "text-amber-500 bg-amber-500/10 border-amber-500/20";
        }
    }

    // ── Break this parameter into its individual sub-checks (pass / partial / fail
    // + what each failing part wants). This is the View-Detail content for ALL signals.
    const subScores = getSubScores(signal, data);

    // Some signals show this breakdown inline (always visible) instead of behind
    // "View Detail", with passing parts (OK) split from the parts that need work.
    const inlineBreakdown = INLINE_BREAKDOWN.has(signal);
    const okRows = subScores.filter((r) => r.got >= r.max);
    const todoRows = subScores.filter((r) => r.got < r.max);

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
                    {(score < 100 || status !== "Passed") && isActionableParam(signal) && !inlineBreakdown && (
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

            {/* Inline breakdown (no click) — OK parts and the parts that need work, separated. */}
            {inlineBreakdown && (
                <div className="flex flex-col gap-5 pt-2 border-t border-slate-800/10 dark:border-slate-100/10">
                    {okRows.length > 0 && (
                        <div className="flex flex-col gap-2.5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600/70 dark:text-emerald-400/70">OK · {okRows.length}</span>
                            {okRows.map((row, i) => <SubScoreRow key={`ok-${i}`} row={row} darkMode={darkMode} />)}
                        </div>
                    )}
                    {todoRows.length > 0 && (
                        <div className="flex flex-col gap-2.5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-rose-600/70 dark:text-rose-400/70">Missing · {todoRows.length}</span>
                            {todoRows.map((row, i) => <SubScoreRow key={`todo-${i}`} row={row} darkMode={darkMode} />)}
                        </div>
                    )}
                </div>
            )}

            {/* Expanded Content — every part of this parameter, with what each one wants */}
            {showDetails && !inlineBreakdown && (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-4 duration-500 pt-2 border-t border-slate-800/10 dark:border-slate-100/10">
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-40">What each part needs</span>
                    <div className="flex flex-col gap-2.5">
                        {subScores.map((row, i) => <SubScoreRow key={i} row={row} darkMode={darkMode} />)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AEOSignalCard;