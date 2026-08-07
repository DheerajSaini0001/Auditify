/**
 * Single source of truth for site-wide SEO.
 *
 * Consumed by three places, which is the point — they can no longer disagree:
 *   1. Component/CanonicalTag.jsx  emits the head tags at runtime
 *   2. scripts/generate-seo-assets.mjs  writes robots.txt + sitemap.xml at build
 *   3. scripts/verify-seo.mjs  fails the build if any rule below is broken
 *
 * Rules enforced by the verifier (from seo-technical-implementation-prompt.md):
 *   title        55-65 chars, unique across every route
 *   description  70-150 chars, unique across every route
 *   canonical    self-referential, exact-match, no trailing-slash drift
 */

// The live origin. Previously hardcoded to https://siteaudit.sltechsoft.com, which
// no longer resolves — every canonical, og:url and sitemap entry was pointing search
// engines at a dead host. Overridable per environment, but the default must be the
// domain actually served.
export const SITE_ORIGIN = (
  import.meta.env?.VITE_SITE_ORIGIN || 'https://dealersiteaudit.com'
).replace(/\/+$/, '');

export const SITE_NAME = 'Site Audit';
export const PUBLISHER = 'Success Ladder Technologies';
export const PUBLISHER_URL = 'https://www.sltechsoft.com';

// The schema.org Organization logo — the square brand mark. favicon.png is the
// 512x512 master already in public/, well within the size limit.
export const LOGO_PATH = '/favicon.png';
export const LOGO_WIDTH = 512;
export const LOGO_HEIGHT = 512;
export const logoUrl = () => `${SITE_ORIGIN}${LOGO_PATH}`;

// og:image / twitter:image want a landscape card, not the square mark — a 512x512
// logo gets letterboxed or cropped by every social preview. This is the brand kit's
// 1200x630 Open Graph export, the size Facebook/LinkedIn/X all render natively.
export const SOCIAL_IMAGE_PATH = '/og-image.png';
export const SOCIAL_IMAGE_WIDTH = 1200;
export const SOCIAL_IMAGE_HEIGHT = 630;
export const socialImageUrl = () => `${SITE_ORIGIN}${SOCIAL_IMAGE_PATH}`;

/** Absolute, self-referential canonical for a path. Trailing slash only for root. */
export const canonicalFor = (pathname) => {
  const clean = (pathname || '/').split('?')[0].split('#')[0];
  const noTrail = clean.length > 1 ? clean.replace(/\/+$/, '') : '/';
  return `${SITE_ORIGIN}${noTrail}`;
};

/**
 * Route table.
 *
 * `exact`  matches the pathname exactly.
 * `prefix` matches any path starting with it (report sections carry an :id).
 * `noindex` marks pages that must never be indexed — authenticated surfaces and
 *           anything transactional. These are also excluded from the sitemap and
 *           disallowed in robots.txt, so the three never drift apart.
 */
export const SEO_CONFIGS = [
  {
    path: '/',
    exact: true,
    priority: 1.0,
    changefreq: 'daily',
    title: 'Site Audit: The AI Engine for SEO & Website Performance',
    description: 'A high-speed website auditing engine. Get clear insights on SEO, security, AI readiness and technical performance, free and with no signup.',
    keywords: 'website audit, SEO tool, performance analysis, security compliance, AIO readiness, dealership website',
  },
  {
    path: '/about',
    exact: true,
    priority: 0.8,
    changefreq: 'monthly',
    title: 'About Site Audit: The Team Behind Our Website Audit Engine',
    description: 'Learn who builds Site Audit, why we measure dealership websites the way we do, and the standards each of our eight audit pillars is scored against.',
    keywords: 'about site audit, audit engine team, dealership web standards',
  },
  {
    path: '/services',
    exact: true,
    priority: 0.8,
    changefreq: 'monthly',
    title: 'Website Audit Services: SEO, Speed and Security Checking',
    description: 'Explore every audit we run: technical performance, on-page SEO, accessibility, security, UX, conversion flow, AI readiness and answer readiness.',
    keywords: 'website audit services, seo audit, accessibility audit, security scan',
  },
  {
    path: '/contact',
    exact: true,
    priority: 0.7,
    changefreq: 'monthly',
    title: 'Contact Site Audit: Talk to Our Website Audit Team Today',
    description: 'Get in touch about an audit, a report you have run, partnership options, or anything else. We reply to every message from a real person, not a bot.',
    keywords: 'contact site audit, web audit support, get in touch',
  },
  {
    path: '/documentation',
    exact: true,
    priority: 0.7,
    changefreq: 'weekly',
    title: 'Site Audit Documentation: Metrics, Scoring and API Guide',
    description: 'Full documentation for every metric we measure, how each score is calculated, what the thresholds mean, and how to read your audit report end to end.',
    keywords: 'site audit docs, audit metrics documentation, scoring guide',
  },
  {
    path: '/help',
    exact: true,
    priority: 0.6,
    changefreq: 'weekly',
    title: 'Help Centre: Troubleshoot Audits and Understand Results',
    description: 'Answers to common questions about running an audit, why a score changed, what a failed check means, and how to fix the issues we surface on your site.',
    keywords: 'site audit help, audit troubleshooting, faq',
  },
  {
    path: '/privacy',
    exact: true,
    priority: 0.3,
    changefreq: 'yearly',
    title: 'Privacy Policy: How Site Audit Handles Your Website Data',
    description: 'How we collect, use, store and delete data when you run a website audit, what we never retain, and the rights you hold over any data we do process.',
    keywords: 'privacy policy, data handling, site audit privacy',
  },
  {
    path: '/terms',
    exact: true,
    priority: 0.3,
    changefreq: 'yearly',
    title: 'Terms of Service: Using the Site Audit Platform Fairly.',
    description: 'The terms governing your use of Site Audit: acceptable use, audit limits, account responsibilities, liability, and how disputes are handled.',
    keywords: 'terms of service, acceptable use, site audit terms',
  },
  {
    path: '/cookies',
    exact: true,
    priority: 0.3,
    changefreq: 'yearly',
    title: 'Cookie Policy: Which Cookies Site Audit Sets, and Exactly Why',
    description: 'A plain list of every cookie Site Audit sets, what each does, how long it lasts, and how to refuse non-essential ones without breaking the app.',
    keywords: 'cookie policy, cookie list, tracking preferences',
  },
  {
    path: '/do-not-sell',
    exact: true,
    priority: 0.3,
    changefreq: 'yearly',
    title: 'Do Not Sell My Info: Your Data Opt-Out Rights Explained',
    description: 'Exercise your right to opt out of the sale or sharing of personal information, see exactly what that covers at Site Audit, and submit a request here.',
    keywords: 'do not sell my information, ccpa opt out, data rights',
  },

  // ── Report surfaces: public so a shared report link resolves, and each section
  //    is a genuinely distinct page, so each gets its own title and description.
  {
    path: '/technical-performance',
    prefix: true,
    priority: 0.7,
    changefreq: 'weekly',
    title: 'Technical Performance Report: Core Web Vitals and Speed',
    description: 'Server response, Core Web Vitals, page weight, render-blocking scripts and caching policy, measured on your live pages and scored against Lighthouse.',
    keywords: 'core web vitals, page speed, lcp, cls, technical performance',
  },
  {
    path: '/on-page-seo',
    prefix: true,
    priority: 0.7,
    changefreq: 'weekly',
    title: 'On-Page SEO Report: Meta Tags, Headings and Schema Audit',
    description: 'Titles, meta descriptions, heading hierarchy, canonical tags, alt attributes, robots rules and structured data, checked against current SEO guidance.',
    keywords: 'on-page seo, meta tags audit, heading hierarchy, schema markup',
  },
  {
    path: '/accessibility',
    prefix: true,
    priority: 0.7,
    changefreq: 'weekly',
    title: 'Accessibility Report: Your WCAG 2.2 AA Compliance Findings',
    description: 'Colour contrast, ARIA usage, keyboard navigation, semantic structure and form labelling, tested with axe-core and mapped to WCAG 2.2 AA criteria.',
    keywords: 'accessibility audit, wcag 2.2, axe-core, a11y report',
  },
  {
    path: '/security-compliance',
    prefix: true,
    priority: 0.7,
    changefreq: 'weekly',
    title: 'Security and Compliance Report: SSL, Headers and Cookies',
    description: 'TLS configuration, security headers, cookie flags, mixed content and known vulnerability exposure, probed live and graded against current guidance.',
    keywords: 'security headers, ssl audit, csp, hsts, cookie security',
  },
  {
    path: '/ux-content-structure',
    prefix: true,
    priority: 0.7,
    changefreq: 'weekly',
    title: 'UX and Content Structure Report: Layout and Readability',
    description: 'Readability, tap-target sizing, navigation depth, layout stability and mobile responsiveness, scored against published usability research thresholds.',
    keywords: 'ux audit, readability score, tap targets, mobile usability',
  },
  {
    path: '/conversion-lead-flow',
    prefix: true,
    priority: 0.7,
    changefreq: 'weekly',
    title: 'Conversion and Lead Flow Report: CTAs, Forms, Trust Signals',
    description: 'Call-to-action placement, form friction, trust signals and social proof, assessed from the rendered page to show where enquiries are being lost.',
    keywords: 'conversion audit, lead flow, cta analysis, form ux',
  },
  {
    path: '/aio',
    prefix: true,
    priority: 0.7,
    changefreq: 'weekly',
    title: 'AIO Readiness Report: How AI Crawlers Read Your Web Pages',
    description: 'Whether AI assistants can parse, attribute and cite your pages, covering structured data, entity clarity, crawler access and machine-readable content.',
    keywords: 'aio readiness, ai crawlers, llms.txt, ai optimization',
  },
  {
    path: '/aeo',
    prefix: true,
    priority: 0.7,
    changefreq: 'weekly',
    title: 'AEO Readiness Report: Your Answer Engine Optimisation Score',
    description: 'How well your pages answer the questions buyers actually ask, and whether answer engines can lift those answers cleanly into a generated response.',
    keywords: 'answer engine optimization, aeo, featured snippets, question coverage',
  },
  {
    path: '/report',
    prefix: true,
    priority: 0.6,
    changefreq: 'weekly',
    title: 'Website Audit Report: Full Results Across Eight Pillars',
    description: 'Your complete audit report, with a score for each of the eight pillars and the highest-impact fixes ranked first so you know exactly where to start.',
    keywords: 'website audit report, audit results, site health score',
  },
  {
    path: '/audit-summary',
    exact: true,
    // `/audit-summary/:id` is the same page addressed by its root report (the form
    // every "Back to Summary" now links to), so it must resolve to this entry
    // instead of falling through to DEFAULT_SEO — same shape as /report.
    prefix: true,
    priority: 0.6,
    changefreq: 'weekly',
    title: 'Audit Summary: Every Multi-Page Scan Score at One Glance',
    description: 'A consolidated view of every page scanned in this run, with per-page scores, shared issues grouped together, and the fixes worth doing first.',
    keywords: 'audit summary, multi-page scan, site-wide scores',
  },

  // ── Authenticated / transactional. noindex, excluded from the sitemap, and
  //    disallowed in robots.txt — all three derived from this one flag.
  {
    path: '/login',
    exact: true,
    noindex: true,
    title: 'Sign In to Site Audit and Reach Your Saved Audit Reports',
    description: 'Sign in to reach your saved audits, tracked websites and full report history, and to run new scans against the sites already on your account.',
    keywords: 'site audit login, sign in',
  },
  {
    path: '/register',
    exact: true,
    noindex: true,
    title: 'Create a Site Audit Account to Save and Track Your Scans',
    description: 'Create a free account to keep your audit history, track scores over time across every site you manage, and export reports whenever you need them.',
    keywords: 'site audit signup, create account, register',
  },
  {
    path: '/verify-otp',
    exact: true,
    noindex: true,
    title: 'Verify Your Email Address to Finish Creating Your Account',
    description: 'Enter the one-time code we emailed you to confirm your address and activate your Site Audit account. Codes expire shortly for security reasons.',
    keywords: 'verify email, otp verification',
  },
  {
    path: '/forgot-password',
    exact: true,
    noindex: true,
    title: 'Reset Your Password and Recover Your Site Audit Account',
    description: 'Enter the email address on your account and we will send a secure, single-use link you can follow to choose a new password for Site Audit.',
    keywords: 'forgot password, account recovery, password reset',
  },
  {
    path: '/reset-password',
    exact: true,
    noindex: true,
    title: 'Choose a New Password for Your Site Audit Account Login',
    description: 'Set a new password for your account. Pick something at least eight characters long with an uppercase letter and a digit to keep the account secure.',
    keywords: 'set new password, reset password',
  },
  {
    path: '/dashboard',
    exact: true,
    noindex: true,
    title: 'Your Dashboard: Manage Your Websites and Launch New Audits',
    description: 'Launch new audits, review the scores from your most recent scans, compare performance across the sites you manage, and download reports as PDFs.',
    keywords: 'audit dashboard, manage websites',
  },
  {
    path: '/dashboard/add-website',
    exact: true,
    noindex: true,
    title: 'Add a Website to Your Account and Run Its First Audit Now',
    description: 'Add a domain to your account to run a full multi-parameter audit covering SEO, page speed, mobile usability, accessibility and security posture.',
    keywords: 'add website, new site audit',
  },
  {
    path: '/audit-history',
    exact: true,
    noindex: true,
    title: 'Audit History: Review Every Past Scan and Its Results Now',
    description: 'Browse the full history of scans on your account, compare scores over time to see what improved, and re-run any previous audit in a single click.',
    keywords: 'audit history, past scans, score tracking',
  },
  {
    path: '/seo',
    exact: true,
    noindex: true,
    title: 'SEO Management: Edit Page Titles, Meta Tags and Schema.',
    description: 'Manage the SEO of every page from one place: titles, meta descriptions, keywords, social share cards and JSON-LD, each with a live scored checklist.',
    keywords: 'seo management, meta editor, structured data editor',
  },
  {
    path: '/admin',
    exact: true,
    noindex: true,
    title: 'Admin Panel: Platform Users, Audits and Activity Logs Now',
    description: 'Administrative overview of platform users, audit volume and activity logs, with the controls needed to manage accounts and investigate problems.',
    keywords: 'admin panel, user management, activity logs',
  },
  {
    path: '/admin/setup',
    exact: true,
    noindex: true,
    title: 'System Setup: Platform Configuration and API Key Manager',
    description: 'Configure platform settings, manage third-party API credentials and review configuration history. Restricted to super administrators only.',
    keywords: 'system setup, platform configuration, api keys',
  },
];

export const DEFAULT_SEO = {
  title: 'Site Audit: The AI Engine for SEO & Website Performance',
  description: 'A high-speed website auditing engine. Get clear insights on SEO, security, AI readiness and technical performance, free and with no signup.',
  keywords: 'website audit, SEO tool, performance analysis, security compliance',
  noindex: true, // an unmapped route is not a page we intend search engines to keep
};

/** Resolve the config for a pathname: exact match first, then longest prefix. */
export const resolveSeo = (pathname) => {
  const path = (pathname || '/').split('?')[0].split('#')[0];
  const exact = SEO_CONFIGS.find((c) => c.exact && c.path === path);
  if (exact) return exact;
  const prefixed = SEO_CONFIGS
    .filter((c) => c.prefix && path.startsWith(c.path))
    .sort((a, b) => b.path.length - a.path.length)[0];
  return prefixed || DEFAULT_SEO;
};

/** Only indexable routes belong in the sitemap. */
export const indexableRoutes = () => SEO_CONFIGS.filter((c) => !c.noindex);

export default SEO_CONFIGS;
