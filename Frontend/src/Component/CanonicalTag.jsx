import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  SITE_ORIGIN, SITE_NAME, PUBLISHER, PUBLISHER_URL,
  LOGO_WIDTH, LOGO_HEIGHT, logoUrl, canonicalFor, resolveSeo,
} from '../config/seoConfig.js';

/**
 * Emits the full per-route head: title, description, keywords, robots, canonical,
 * Open Graph, Twitter card and JSON-LD.
 *
 * This is a SPA, so the head has to be rewritten on every navigation — a tag set
 * once in index.html is only ever correct for the first page a visitor lands on.
 * Every value comes from config/seoConfig.js, which the sitemap generator and the
 * build-time verifier also read, so the three cannot disagree.
 */

/** Upsert a <meta>, keyed by the attribute that identifies it (name or property). */
const setMeta = (keyAttr, keyValue, content) => {
  const selector = `meta[${keyAttr}="${keyValue}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(keyAttr, keyValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const setLink = (rel, href) => {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
};

/** Replace a JSON-LD block by id, so navigating never leaves a stale one behind. */
const setJsonLd = (id, data) => {
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  if (!data) return;
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = id;
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
};

/** Title-cased breadcrumb label from a path segment: "on-page-seo" -> "On Page Seo". */
const labelFor = (segment) =>
  segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const CanonicalTag = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const config = resolveSeo(path);
    const canonical = canonicalFor(path);

    // ── 1. Title & description ──
    document.title = config.title;
    setMeta('name', 'description', config.description);
    setMeta('name', 'keywords', config.keywords || '');

    // ── 2. Canonical: self-referential, exact-match ──
    setLink('canonical', canonical);

    // ── 3. Robots: always explicit, never left to default behaviour ──
    const robots = config.noindex ? 'noindex, nofollow' : 'index, follow';
    setMeta('name', 'robots', robots);
    setMeta('name', 'googlebot', robots);

    // ── 4. Open Graph — og:url must equal the canonical exactly ──
    setMeta('property', 'og:title', config.title);
    setMeta('property', 'og:description', config.description);
    setMeta('property', 'og:url', canonical);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:image', logoUrl());
    setMeta('property', 'og:image:width', String(LOGO_WIDTH));
    setMeta('property', 'og:image:height', String(LOGO_HEIGHT));

    // ── 5. Twitter ──
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', config.title);
    setMeta('name', 'twitter:description', config.description);
    setMeta('name', 'twitter:image', logoUrl());

    // ── 6. JSON-LD ──
    // Organization + WebSite sitewide; a BreadcrumbList only where there is an
    // actual trail to describe (emitting one on the homepage would be a single
    // self-referential crumb, which is noise).
    setJsonLd('ld-organization', {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_ORIGIN,
      logo: logoUrl(),
      publisher: { '@type': 'Organization', name: PUBLISHER, url: PUBLISHER_URL },
    });

    setJsonLd('ld-website', {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_ORIGIN,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_ORIGIN}/?url={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    });

    const segments = path.split('/').filter(Boolean);
    if (segments.length > 0) {
      let href = '';
      const crumbs = [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` }];
      segments.forEach((segment, i) => {
        href += `/${segment}`;
        crumbs.push({
          '@type': 'ListItem',
          position: i + 2,
          name: labelFor(segment),
          item: `${SITE_ORIGIN}${href}`,
        });
      });
      setJsonLd('ld-breadcrumb', {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: crumbs,
      });
    } else {
      setJsonLd('ld-breadcrumb', null);
    }
  }, [location.pathname]);

  return null;
};

export default CanonicalTag;
