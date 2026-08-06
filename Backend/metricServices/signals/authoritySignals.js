/**
 * Signal 15: Authority Signals (mentions / backlinks) — the "A" of E-E-A-T (INFO-ONLY).
 *
 * TRUE authority is off-site: backlinks + Domain Authority, which need a paid SEO API
 * (Ahrefs/Moz/Majestic). With no external API this measures on-page MENTION PROXIES.
 * Info-only: strongly overlaps Brand Entity Strength (external authority/sameAs), so
 * weighting both would double-count.
 *
 *   • Press / media mentions   — "as seen in / featured in / press"            (max 30)
 *   • External authority links — outbound links to .gov/.edu/Wikipedia/industry (max 25)
 *   • Third-party trust badges — BBB, Trustpilot, Google/DealerRater, Carfax    (max 25)
 *   • Social proof             — linked social profiles (sameAs footprint)      (max 20)
 *
 * NOTE: a real backlink/DA upgrade requires a paid SEO API.
 */

import { getLocale } from "../../config/locale/index.js";

const PRESS = /as seen (in|on)|as featured (in|on)|featured (in|on)|in the (news|press|media)\b|press release|media coverage|in the spotlight|press (room|page|kit)/i;

const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Badges and authorities that carry weight regardless of market.
const TRUST_UNIVERSAL = "trustpilot|google reviews?|verified business|accredited business|google guaranteed";
const AUTH_UNIVERSAL = "\\.gov(\\b|\\/)|\\.edu(\\b|\\/)|wikipedia\\.org|wikidata\\.org";

const SOCIAL_HOSTS = /facebook\.com|instagram\.com|twitter\.com|x\.com|linkedin\.com|youtube\.com|tiktok\.com|pinterest\.com/i;

/**
 * Trust badges and authoritative outbound domains, per market.
 *
 * NHTSA/EPA/IIHS and ANCAP/Green Vehicle Guide/ACCC have no overlap at all, so
 * an authority whitelist HAS to be market-specific — an Australian dealer
 * linking to ANCAP is doing exactly the right thing and earned nothing for it
 * under the US list.
 */
const trustBadgesFor = (market) => {
  const dirs = getLocale(market).directories.map(escapeRe).join("|");
  return new RegExp(`${TRUST_UNIVERSAL}|${dirs}`, "i");
};
const authDomainsFor = (market) => {
  const locale = getLocale(market);
  const domains = [...locale.authorities.domains, ...locale.directoryDomains].map(escapeRe).join("|");
  return new RegExp(`${AUTH_UNIVERSAL}|${domains}`, "i");
};

const hostnameOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return null; } };

const analyzeAuthoritySignals = (url, $, market = null) => {
    try {
        const text = $('body').text();
        const siteHost = hostnameOf(url);
        const AUTH_DOMAINS = authDomainsFor(market);
        const TRUST_BADGES = trustBadgesFor(market);

        // ── Press / media mentions (max 30) ──
        const pressMentions = PRESS.test(text) ? 30 : 0;

        // ── External authority links (max 25) ──
        let authLinkCount = 0;
        const socialProfiles = new Set();
        $('a[href^="http"]').each((_, el) => {
            const href = $(el).attr('href') || '';
            const host = hostnameOf(href);
            if (!host || host === siteHost) return;
            if (AUTH_DOMAINS.test(href)) authLinkCount += 1;
            if (SOCIAL_HOSTS.test(href)) {
                const m = href.match(SOCIAL_HOSTS);
                if (m) socialProfiles.add(m[0].toLowerCase());
            }
        });
        const externalAuthority = authLinkCount >= 3 ? 25 : authLinkCount === 2 ? 17 : authLinkCount === 1 ? 9 : 0;

        // ── Third-party trust badges (max 25) ──
        const badgeHits = new Set((text.match(new RegExp(TRUST_BADGES.source, 'gi')) || []).map((m) => m.toLowerCase())).size;
        const trustBadges = badgeHits >= 3 ? 25 : badgeHits === 2 ? 17 : badgeHits === 1 ? 9 : 0;

        // ── Social proof (max 20) ──
        const socialCount = socialProfiles.size;
        const socialProof = socialCount >= 4 ? 20 : socialCount >= 2 ? 13 : socialCount === 1 ? 7 : 0;

        const breakdown = { pressMentions, externalAuthority, trustBadges, socialProof };
        const score = Math.min(100, pressMentions + externalAuthority + trustBadges + socialProof);

        const issues = [];
        if (!pressMentions) issues.push('Add a press/"as seen in" section linking to any media coverage or local news mentions.');
        if (externalAuthority < 17) issues.push(getLocale(market).code === 'AU'
            ? 'Cite/link authoritative sources (ANCAP, Green Vehicle Guide, PPSR, ACCC, your state road authority, .gov.au) to associate with trusted entities.'
            : 'Cite/link authoritative sources (NHTSA, KBB, manufacturer, .gov/.edu) to associate with trusted entities.');
        if (trustBadges < 17) issues.push(`Display third-party trust badges (${getLocale(market).directories.slice(0, 4).join(', ')}) with links to your profiles.`);
        if (socialProof < 20) issues.push('Link all your social profiles (Facebook, Instagram, YouTube, LinkedIn) to broaden your verified footprint.');

        const reason = score >= 80
            ? '✅ Strong authority signals: media mentions, authoritative associations, and third-party trust badges.'
            : `⚠️ Authority signals are limited (${score}/100). ${issues.slice(0, 2).join(' ')}`;

        return { signal: 'authoritySignals', score, source: 'on-page', breakdown, externalAuthLinks: authLinkCount, socialProfiles: socialCount, note: 'On-page mention proxies — real backlinks/Domain Authority require a paid SEO API.', issues, reason };
    } catch (error) {
        // Crashed probe → not calculated, renormalized out (SCORING_FORMAT §7 policy 4).
        return { signal: 'authoritySignals', score: null, notCalculated: true, source: 'on-page', breakdown: { pressMentions: 0, externalAuthority: 0, trustBadges: 0, socialProof: 0 }, issues: [`Authority signals check failed: ${error.message}`], error: error.message };
    }
};

export default analyzeAuthoritySignals;
