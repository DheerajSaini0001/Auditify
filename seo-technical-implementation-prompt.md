# Website SEO & Technical Implementation Prompt

**Purpose:** Give this document to an AI coding assistant (or developer) to implement site-wide SEO and technical hygiene across every page. Each rule below is a hard requirement — treat missing items as build failures, not suggestions.

---

## 1. Title Tag
- **Length:** 55–65 characters (spaces included).
- **Uniqueness:** No two pages on the site may share an identical `<title>`.
- **Placement:** Inside `<head>`, primary keyword near the start where natural.

```html
<title>Primary Keyword | Secondary Term – Brand Name</title>
```

## 2. Meta Description
- **Length:** 70–150 characters.
- **Uniqueness:** No two pages may share an identical meta description.
- Must summarize the specific page's content (not the site generically).

```html
<meta name="description" content="Concise, unique summary of this exact page's content and value, written to fit 70–150 characters.">
```

## 3. Canonical URL (Self-Referential)
- Every page must declare a canonical tag pointing to **its own fully-resolved URL** (protocol + domain + exact path), not a shortened or parameterized alternate — unless deliberately consolidating duplicate/paginated content.

```html
<link rel="canonical" href="https://www.example.com/exact-current-path/">
```

**Rule for the AI:** `canonical href` === the URL the page is actually served at (no trailing-slash mismatches, no query-string drift, no http/https mismatch, no www/non-www mismatch).

## 4. Robots Meta Tag
- Every page must declare an explicit robots directive — do not rely on default behavior.

```html
<meta name="robots" content="index, follow">
```
- Use `noindex, nofollow` (or appropriate variant) only on pages intentionally excluded (thank-you pages, internal search results, staging, filters, etc.).

## 5. X-Robots-Tag (HTTP Header)
- Set at the server/CDN/edge config level (Nginx, Apache, or hosting platform rules), in addition to the meta tag — required especially for non-HTML assets (PDFs, images) that can't carry a meta tag.

```
X-Robots-Tag: index, follow
```

Nginx example:
```nginx
add_header X-Robots-Tag "index, follow" always;
```

## 6. Meta Keywords
- Include, even though minor for modern search engines — populate with page-specific, relevant terms only (no stuffing).

```html
<meta name="keywords" content="keyword one, keyword two, keyword three">
```

## 7. Heading Hierarchy
- Exactly **one `<h1>`** per page, matching the page's primary topic/title intent.
- Headings must nest in order with no skipped levels: `h1 → h2 → h3 → h4...` (never jump h1 → h3).
- Headings reflect content structure/semantics, not visual styling — style separately via CSS, not by choosing a heading level for its size.

## 8. Images
Every `<img>` element must have:
- `alt` attribute — descriptive, specific to the image (not keyword-stuffed).
- `title` attribute — supplementary tooltip text.
- File size **under 150KB** — compress/optimize on build (WebP/AVIF preferred, with fallback), and lazy-load below-the-fold images.

```html
<img
  src="/images/product-hero.webp"
  alt="Red ceramic espresso cup on wooden table"
  title="Red ceramic espresso cup"
  width="800"
  height="600"
  loading="lazy">
```
**Build step:** add an automated check/optimizer (e.g. `sharp`, `imagemin`) that rejects any image asset ≥150KB before deploy.

## 9. Schema Markup (Structured Data)
- Implement JSON-LD in every page's `<head>` or before `</body>`.
- Minimum sitewide: `Organization` + `WebSite` (homepage). Add page-type-specific schema as relevant: `Article`, `Product`, `BreadcrumbList`, `FAQPage`, `LocalBusiness`, etc.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Brand Name",
  "url": "https://www.example.com/",
  "logo": "https://www.example.com/images/logo.png"
}
</script>
```

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.example.com/" },
    { "@type": "ListItem", "position": 2, "name": "Category", "item": "https://www.example.com/category/" }
  ]
}
</script>
```

## 10. Open Graph Tags
- Include on every page, with `og:url` matching the canonical URL exactly (self-referential).
- `og:image` must use the site logo asset.

```html
<meta property="og:title" content="Same intent as page title, 40–60 chars ideal">
<meta property="og:description" content="Same intent as meta description, page-specific">
<meta property="og:url" content="https://www.example.com/exact-current-path/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Brand Name">
<meta property="og:image" content="https://www.example.com/images/logo.png">
<meta property="og:image:width" content="512">
<meta property="og:image:height" content="512">
```

## 11. Uniqueness Enforcement (Sitewide)
- Maintain a build-time check (script or CI step) that scans all rendered pages and fails the build if any two pages share:
  - identical `<title>`
  - identical meta description
- Recommend a content inventory (CSV/sheet) mapping URL → title → description for QA before launch.

## 12. robots.txt
Place at domain root: `https://www.example.com/robots.txt`

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /cart/
Disallow: /checkout/
Disallow: /*?*sort=
Disallow: /*?*filter=

Sitemap: https://www.example.com/sitemap.xml
```
Adjust `Disallow` rules to the site's actual private/duplicate/utility paths.

## 13. sitemap.xml
Place at domain root: `https://www.example.com/sitemap.xml`. Auto-generate on build/deploy so it stays current; include only canonical, indexable (200 status, non-noindex) URLs.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.example.com/</loc>
    <lastmod>2026-08-03</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.example.com/category/</loc>
    <lastmod>2026-08-03</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```
Reference this file in `robots.txt` (done above) and submit it in Google Search Console / Bing Webmaster Tools after deploy.

---

## Implementation Checklist (for the AI/dev to self-verify before marking complete)

| # | Requirement | Pass condition |
|---|---|---|
| 1 | Title tag | 55–65 chars, unique per page |
| 2 | Meta description | 70–150 chars, unique per page |
| 3 | Canonical | Present, self-referential, exact-match URL |
| 4 | Robots meta tag | Present on every page, correct directive |
| 5 | X-Robots-Tag header | Set at server/CDN level |
| 6 | Meta keywords | Present, page-relevant |
| 7 | Heading hierarchy | One `<h1>`, no skipped levels |
| 8 | Images | `alt` + `title` on all, each file <150KB |
| 9 | Schema markup | Valid JSON-LD, passes Google Rich Results Test |
| 10 | Open Graph | Present, `og:url` self-referential, `og:image` = logo |
| 11 | Uniqueness | No duplicate titles/descriptions sitewide |
| 12 | robots.txt | Present at root, references sitemap |
| 13 | sitemap.xml | Present at root, auto-generated, only indexable URLs |

**Final step:** validate every page with Google's Rich Results Test, a broken-link/meta crawler (e.g. Screaming Frog), and Lighthouse before deployment.
