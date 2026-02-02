import React from 'react';
import {
    Zap,
    Search,
    Eye,
    Shield,
    TrendingUp,
    Bot,
    Smartphone
} from 'lucide-react';


export const InfoDetails = {

    // Technical Performance - Core Web Vitals & Performance
    LCP: {
        title: "Largest Contentful Paint (LCP)",
        whatThisParameterIs: "Measures how long it takes for the largest visible element (hero image, banner, or main heading) to load in the viewport.",
        whyItMatters: "Direct Google ranking factor that strongly affects perceived speed, bounce rate, and user experience.",
        thresholds: {
            good: "≤ 2.5s",
            needsImprovement: "2.5s – 4s",
            poor: "> 4s"
        },
        actualReasonsForFailure: [
            "Slow server response time",
            "Large or unoptimized hero images",
            "Render-blocking CSS and JavaScript",
            "Incorrect lazy loading on LCP element",
            "Missing or misconfigured CDN"
        ],
        howToOvercomeFailure: [
            "Optimize images using WebP or AVIF",
            "Preload the LCP element",
            "Improve server performance and caching",
            "Inline critical CSS",
            "Defer non-essential JavaScript"
        ]
    },
    FID: {
        title: "First Input Delay (FID)",
        whatThisParameterIs: "Measures the delay between a user's first interaction and the browser’s response.",
        whyItMatters: "High input delay makes the page feel unresponsive and frustrates users.",
        thresholds: {
            good: "≤ 100ms",
            needsImprovement: "100ms – 300ms",
            poor: "> 300ms"
        },
        actualReasonsForFailure: [
            "Long JavaScript execution on main thread",
            "Heavy third-party scripts",
            "Large bundled JavaScript files"
        ],
        howToOvercomeFailure: [
            "Break long JavaScript tasks",
            "Defer non-critical scripts",
            "Remove unused third-party scripts"
        ]
    },
    INP: {
        title: "Interaction to Next Paint (INP)",
        whatThisParameterIs: "Measures how quickly the page responds to user interactions.",
        whyItMatters: "Slow interaction response creates a laggy user experience.",
        thresholds: {
            good: "≤ 200ms",
            needsImprovement: "200ms – 500ms",
            poor: "> 500ms"
        },
        actualReasonsForFailure: [
            "Long event handlers",
            "Heavy main-thread work",
            "Complex layout or style recalculations"
        ],
        howToOvercomeFailure: [
            "Optimize event handlers",
            "Reduce main-thread workload",
            "Break up long tasks"
        ]
    },
    CLS: {
        title: "Cumulative Layout Shift (CLS)",
        whatThisParameterIs: "Measures unexpected layout movements that occur during page load.",
        whyItMatters: "Layout shifts cause accidental clicks and reduce visual stability.",
        thresholds: {
            good: "≤ 0.1",
            needsImprovement: "0.1 – 0.25",
            poor: "> 0.25"
        },
        actualReasonsForFailure: [
            "Images without width and height attributes",
            "Ads or embeds without reserved space",
            "Dynamically injected content"
        ],
        howToOvercomeFailure: [
            "Set explicit size attributes for images and media",
            "Reserve space for ads and embeds",
            "Avoid inserting content above existing elements"
        ]
    },
    FCP: {
        title: "First Contentful Paint (FCP)",
        whatThisParameterIs: "Measures the time when the first visible content appears on the screen.",
        whyItMatters: "Early content visibility improves perceived performance and user trust.",
        thresholds: {
            good: "≤ 1.8s",
            needsImprovement: "1.8s – 3s",
            poor: "> 3s"
        },
        actualReasonsForFailure: [
            "Render-blocking CSS and JavaScript",
            "Slow font loading",
            "Network latency"
        ],
        howToOvercomeFailure: [
            "Eliminate render-blocking resources",
            "Optimize font loading strategy",
            "Prioritize above-the-fold content"
        ]
    },
    TTFB: {
        title: "Time to First Byte (TTFB)",
        whatThisParameterIs: "Measures how long the server takes to respond to the initial request.",
        whyItMatters: "Slow server response delays all subsequent loading processes.",
        thresholds: {
            good: "≤ 800ms",
            needsImprovement: "800ms – 1.8s",
            poor: "> 1.8s"
        },
        actualReasonsForFailure: [
            "Slow backend processing",
            "Unoptimized database queries",
            "Lack of server-side caching"
        ],
        howToOvercomeFailure: [
            "Enable server-side caching",
            "Optimize backend logic and database queries",
            "Use a CDN to serve content closer to users"
        ]
    },
    TBT: {
        title: "Total Blocking Time (TBT)",
        whatThisParameterIs: "Measures how long the main thread is blocked by long JavaScript tasks.",
        whyItMatters: "High blocking time prevents users from interacting with the page.",
        thresholds: {
            good: "≤ 200ms",
            needsImprovement: "200ms – 600ms",
            poor: "> 600ms"
        },
        actualReasonsForFailure: [
            "Heavy JavaScript execution",
            "Long-running tasks on the main thread",
            "Excessive third-party scripts"
        ],
        howToOvercomeFailure: [
            "Split long JavaScript tasks",
            "Defer non-critical scripts",
            "Implement code splitting"
        ]
    },
    SI: {
        title: "Speed Index (SI)",
        whatThisParameterIs: "Measures how quickly visible content is populated on the screen.",
        whyItMatters: "Lower speed index means users see content sooner.",
        thresholds: {
            good: "≤ 3.4s",
            needsImprovement: "3.4s – 5.8s",
            poor: "> 5.8s"
        },
        actualReasonsForFailure: [
            "Slow visual rendering",
            "JavaScript delaying paint events",
            "Main-thread blocking"
        ],
        howToOvercomeFailure: [
            "Reduce JavaScript execution time",
            "Optimize rendering pipeline",
            "Ensure text remains visible during font load"
        ]
    },

    // Technical Performance - Assets & Server
    Compression: {
        title: "Text Compression",
        whatThisParameterIs: "Checks whether text-based resources like HTML, CSS, and JavaScript are compressed using Gzip or Brotli.",
        whyItMatters: "Compressed resources load faster and reduce bandwidth usage, improving page speed.",
        thresholds: {
            good: "100% resources compressed",
            needsImprovement: "80% – 99% compressed",
            poor: "< 80% compressed"
        },
        actualReasonsForFailure: [
            "Gzip or Brotli not enabled on server",
            "Incorrect server configuration",
            "Static assets served without compression"
        ],
        howToOvercomeFailure: [
            "Enable Gzip or Brotli on the server",
            "Configure compression for all text-based resources",
            "Verify compression via response headers"
        ]
    },
    Caching: {
        title: "Browser Caching",
        whatThisParameterIs: "Checks whether static resources are cached with sufficient cache duration.",
        whyItMatters: "Proper caching reduces repeat load time and lowers server requests.",
        thresholds: {
            good: "≥ 7 days cache duration",
            needsImprovement: "1 – 7 days",
            poor: "< 1 day or no caching"
        },
        actualReasonsForFailure: [
            "Missing cache-control headers",
            "Short cache expiration time",
            "Dynamic caching applied to static assets"
        ],
        howToOvercomeFailure: [
            "Set long max-age for static assets",
            "Use immutable caching for versioned files",
            "Configure proper cache-control headers"
        ]
    },
    Resource_Optimization: {
        title: "Resource Optimization",
        whatThisParameterIs: "Evaluates image sizing and JavaScript minification efficiency.",
        whyItMatters: "Unoptimized images and scripts increase page weight and load time.",
        thresholds: {
            good: "≥ 80% resources optimized",
            needsImprovement: "50% – 79% optimized",
            poor: "< 50% optimized"
        },
        actualReasonsForFailure: [
            "Images larger than display size",
            "Unminified JavaScript files",
            "Serving high-resolution images unnecessarily"
        ],
        howToOvercomeFailure: [
            "Resize images to match display dimensions",
            "Minify JavaScript files",
            "Serve responsive images"
        ]
    },
    Render_Blocking: {
        title: "Render Blocking Resources",
        whatThisParameterIs: "Identifies CSS and JavaScript that block initial page rendering.",
        whyItMatters: "Render-blocking resources delay visible content and hurt perceived speed.",
        thresholds: {
            good: "0 blocking resources",
            needsImprovement: "1 – 3 blocking resources",
            poor: "> 3 blocking resources"
        },
        actualReasonsForFailure: [
            "CSS files loaded without media attributes",
            "JavaScript without async or defer",
            "Large critical CSS files"
        ],
        howToOvercomeFailure: [
            "Defer non-critical JavaScript",
            "Inline critical CSS",
            "Use media attributes for non-critical styles"
        ]
    },

    // Technical Performance - SEO & Crawlability
    HTTP: {
        title: "HTTPS Security",
        whatThisParameterIs: "Checks whether the website is served securely over HTTPS.",
        whyItMatters: "HTTPS ensures data security, user trust, and better SEO rankings.",
        thresholds: {
            good: "HTTPS enabled",
            needsImprovement: "Mixed content",
            poor: "HTTP only"
        },
        actualReasonsForFailure: [
            "SSL certificate not installed",
            "Mixed HTTP and HTTPS resources",
            "Expired or misconfigured SSL"
        ],
        howToOvercomeFailure: [
            "Install and configure SSL certificate",
            "Redirect all HTTP URLs to HTTPS",
            "Fix mixed content issues"
        ]
    },
    Resource_Optimization: {
        title: "Resource Optimization",
        whatThisParameterIs: "Evaluates whether images are properly sized and JavaScript files are minified.",
        whyItMatters: "Unoptimized images and scripts increase page size, slow down load times, and negatively impact user experience.",
        thresholds: {
            good: "≥ 80% images optimized and scripts minified",
            needsImprovement: "50% – 79% resources optimized",
            poor: "< 50% resources optimized"
        },
        actualReasonsForFailure: [
            "Images served larger than their display dimensions",
            "JavaScript files not minified",
            "Serving high-resolution images unnecessarily",
            "Lack of responsive image usage"
        ],
        howToOvercomeFailure: [
            "Resize images to match display dimensions",
            "Compress images and use modern formats like WebP",
            "Minify JavaScript files",
            "Use responsive images and proper srcset attributes"
        ]
    },
    Sitemap: {
        title: "XML Sitemap",
        whatThisParameterIs: "Checks whether an XML sitemap is available for search engines.",
        whyItMatters: "Sitemaps help search engines discover and index pages efficiently.",
        thresholds: {
            good: "Sitemap present",
            needsImprovement: "Present but outdated",
            poor: "Missing sitemap"
        },
        actualReasonsForFailure: [
            "Sitemap.xml not created",
            "Sitemap not accessible",
            "Outdated or incomplete sitemap"
        ],
        howToOvercomeFailure: [
            "Create sitemap.xml",
            "Ensure sitemap is accessible",
            "Submit sitemap to search engines"
        ]
    },
    Robots: {
        title: "Robots.txt",
        whatThisParameterIs: "Checks whether robots.txt file exists and is accessible.",
        whyItMatters: "Controls how search engines crawl and index the website.",
        thresholds: {
            good: "Robots.txt present",
            needsImprovement: "Present with issues",
            poor: "Missing robots.txt"
        },
        actualReasonsForFailure: [
            "Robots.txt missing",
            "Incorrect disallow rules",
            "Blocking important pages"
        ],
        howToOvercomeFailure: [
            "Create robots.txt file",
            "Allow crawling of important pages",
            "Review and fix disallow rules"
        ]
    },
    Structured_Data: {
        title: "Structured Data",
        whatThisParameterIs: "Checks for the presence of structured data (schema markup).",
        whyItMatters: "Structured data improves search appearance and rich results.",
        thresholds: {
            good: "Structured data present",
            needsImprovement: "Partial or invalid markup",
            poor: "No structured data"
        },
        actualReasonsForFailure: [
            "No schema markup added",
            "Invalid JSON-LD structure",
            "Missing required schema properties"
        ],
        howToOvercomeFailure: [
            "Add relevant schema markup",
            "Validate structured data",
            "Fix schema errors and warnings"
        ]
    },
    Broken_Links: {
        title: "Broken Links",
        whatThisParameterIs: "Detects links that return 4xx or 5xx error responses.",
        whyItMatters: "Broken links harm user experience and reduce SEO credibility.",
        thresholds: {
            good: "0 broken links",
            needsImprovement: "1 – 2 broken links",
            poor: "> 2 broken links"
        },
        actualReasonsForFailure: [
            "Deleted or moved pages",
            "Incorrect URL references",
            "External links no longer available"
        ],
        howToOvercomeFailure: [
            "Fix or update broken URLs",
            "Redirect removed pages properly",
            "Remove invalid external links"
        ]
    },
    Redirect_Chains: {
        title: "Redirect Chains",
        whatThisParameterIs: "Identifies unnecessary redirect hops between the initial and final URL.",
        whyItMatters: "Multiple redirects slow page load and waste crawl budget.",
        thresholds: {
            good: "≤ 1 redirect",
            needsImprovement: "2 redirects",
            poor: "≥ 3 redirects"
        },
        actualReasonsForFailure: [
            "Legacy URL redirects",
            "HTTP to HTTPS redirect chains",
            "Incorrect canonical URL setup"
        ],
        howToOvercomeFailure: [
            "Update links to final destination URLs",
            "Remove unnecessary redirect hops",
            "Fix redirect rules at server level"
        ]
    },

    // Methodologies (Technical)
    Technical_Performance_Methodology: {
        icon: Zap,
        badge: "Performance",
        title: "Technical Performance",
        guideLink: "https://developers.google.com/search/docs/appearance/core-web-vitals",
        whatThisMetricIs: "Measures how fast, responsive, and visually stable your website is for real users across devices and network conditions.",
        whyItMatters: "Technical performance directly affects how users experience your site. Slow loading, delayed interactions, or shifting layouts frustrate visitors, increase bounce rates, and negatively impact search rankings. Fast and stable sites keep users engaged and are favored by Google.",
        whatToDoForAGoodScore: (
            <ul className="list-disc pl-5 space-y-2">
                <li>
                    <span className="font-semibold">Focus on Core Web Vitals first:</span> Prioritize loading speed, responsiveness, and layout stability, as these have the biggest impact on user experience.
                </li>
                <li>
                    <span className="font-semibold">Optimize images and media assets:</span> Ensure images are properly sized, compressed, and delivered efficiently to reduce load times.
                </li>
                <li>
                    <span className="font-semibold">Reduce heavy JavaScript and unused code:</span> Minimize long-running scripts and remove unnecessary third-party code that blocks interactions.
                </li>
                <li>
                    <span className="font-semibold">Improve server response speed:</span> Use caching, optimize backend processing, and reduce delays before content starts loading.
                </li>
                <li>
                    <span className="font-semibold">Prevent layout shifts during loading:</span> Reserve space for images, ads, and dynamic content to keep pages visually stable.
                </li>
                <li>
                    <span className="font-semibold">Eliminate render-blocking resources:</span> Defer non-critical scripts and optimize stylesheets to speed up initial rendering.
                </li>
            </ul>
        ),
        howThisScoreIsCalculated: "We analyze multiple performance signals related to page loading speed, interactivity, and visual stability. These signals are evaluated using both lab testing and real-user data when available. Higher-impact factors contribute more to the final score to reflect what most affects real user experience.",
        weightage: [
            { param: "Largest Contentful Paint (LCP)", weight: "25%" },
            { param: "Total Blocking Time (TBT)", weight: "25%" },
            { param: "Interaction to Next Paint (INP)", weight: "15%" },
            { param: "First Contentful Paint (FCP)", weight: "10%" },
            { param: "Speed Index (SI)", weight: "10%" },
            { param: "Time to First Byte (TTFB)", weight: "10%" },
            { param: "Cumulative Layout Shift (CLS)", weight: "5%" }
        ]
    },

    // On-Page SEO
    Title: {
        title: "Title Tag",
        whatThisParameterIs: "Checks whether the page has a title tag with an optimal length.",
        whyItMatters: "Title tags are a key ranking factor and directly impact click-through rate in search results.",
        thresholds: {
            good: "30–60 characters",
            needsImprovement: "<30 or >60 characters",
            poor: "Missing title tag"
        },
        actualReasonsForFailure: [
            "Title tag missing",
            "Title too short or too long",
            "Duplicate or generic titles"
        ],
        howToOvercomeFailure: [
            "Add a unique title tag for each page",
            "Keep title length between 30–60 characters",
            "Include the primary keyword naturally"
        ]
    },
    Meta_Description: {
        title: "Meta Description",
        whatThisParameterIs: "Checks whether a meta description exists and follows recommended length guidelines.",
        whyItMatters: "Meta descriptions influence click-through rate from search results.",
        thresholds: {
            good: "50–160 characters",
            needsImprovement: "<50 or >160 characters",
            poor: "Missing meta description"
        },
        actualReasonsForFailure: [
            "Meta description missing",
            "Description too short or too long",
            "Duplicate descriptions"
        ],
        howToOvercomeFailure: [
            "Write unique meta descriptions",
            "Keep length within 50–160 characters",
            "Clearly summarize page content"
        ]
    },
    Canonical: {
        title: "Canonical Tag",
        whatThisParameterIs: "Checks whether a valid canonical tag is present and correctly configured.",
        whyItMatters: "Canonical tags prevent duplicate content issues and consolidate ranking signals.",
        thresholds: {
            good: "Single valid canonical tag",
            needsImprovement: "Canonical points to another URL",
            poor: "Missing or invalid canonical"
        },
        actualReasonsForFailure: [
            "Canonical tag missing",
            "Multiple canonical tags",
            "Canonical pointing to wrong or external URL"
        ],
        howToOvercomeFailure: [
            "Add one canonical tag per page",
            "Ensure canonical points to preferred URL",
            "Avoid cross-domain canonicals unless intentional"
        ]
    },
    URL_Structure: {
        title: "URL Structure",
        whatThisParameterIs: "Evaluates whether URLs follow SEO-friendly structure and formatting.",
        whyItMatters: "Clean URLs improve crawlability, readability, and ranking potential.",
        thresholds: {
            good: "Short, lowercase, hyphenated, ≤3 levels deep",
            needsImprovement: "Minor formatting issues",
            poor: "Deep, parameterized, or messy URLs"
        },
        actualReasonsForFailure: [
            "Uppercase letters in URL",
            "Underscores instead of hyphens",
            "Too many URL segments",
            "Query parameters present"
        ],
        howToOvercomeFailure: [
            "Use lowercase letters",
            "Replace underscores with hyphens",
            "Keep URL depth shallow",
            "Remove unnecessary parameters"
        ]
    },
    H1: {
        title: "H1 Tag",
        whatThisParameterIs: "Checks whether the page contains a proper H1 heading.",
        whyItMatters: "H1 tags help search engines understand the main topic of the page.",
        thresholds: {
            good: "Exactly one H1 tag",
            needsImprovement: "Multiple H1 tags",
            poor: "Missing H1 tag"
        },
        actualReasonsForFailure: [
            "H1 tag missing",
            "Multiple H1 tags used",
            "Non-descriptive H1 content"
        ],
        howToOvercomeFailure: [
            "Use exactly one H1 per page",
            "Make H1 descriptive and relevant",
            "Include the main keyword naturally"
        ]
    },
    Image: {
        title: "Image Optimization",
        whatThisParameterIs: "Evaluates image alt text, titles, and file size optimization.",
        whyItMatters: "Optimized images improve accessibility, SEO, and page load speed.",
        thresholds: {
            good: "Alt text present & images <150KB",
            needsImprovement: "Partial optimization",
            poor: "Missing alt text or large images"
        },
        actualReasonsForFailure: [
            "Missing or meaningless alt text",
            "Oversized image files",
            "Missing title attributes"
        ],
        howToOvercomeFailure: [
            "Add descriptive alt text",
            "Compress and resize images",
            "Use modern formats like WebP"
        ]
    },
    Video: {
        title: "Video Optimization",
        whatThisParameterIs: "Evaluates whether videos are properly embedded, lazily loaded, and include basic metadata.",
        whyItMatters: "Optimized videos prevent slow page loads and improve user experience, especially on mobile devices.",
        thresholds: {
            good: "Videos embedded correctly with lazy loading and metadata",
            needsImprovement: "Partial optimization (missing lazy loading or metadata)",
            poor: "Unoptimized video embeds"
        },
        actualReasonsForFailure: [
            "Videos not using lazy loading",
            "Heavy iframe-based embeds loading immediately",
            "Missing structured or descriptive metadata",
            "Too many videos loading on initial page load"
        ],
        howToOvercomeFailure: [
            "Enable lazy loading for video embeds",
            "Use optimized embed methods for YouTube or Vimeo",
            "Add relevant metadata where applicable",
            "Limit the number of videos loading on page load"
        ]
    },
    Semantic_Tags: {
        title: "Semantic HTML Tags",
        whatThisParameterIs: "Checks usage of semantic HTML elements like main, nav, header, and footer.",
        whyItMatters: "Semantic tags improve accessibility and help search engines understand page structure.",
        thresholds: {
            good: "Core semantic tags present",
            needsImprovement: "Partial usage",
            poor: "No semantic structure"
        },
        actualReasonsForFailure: [
            "Missing main or nav tags",
            "Overuse of generic divs",
            "Incomplete semantic structure"
        ],
        howToOvercomeFailure: [
            "Use semantic HTML elements",
            "Replace generic divs with meaningful tags",
            "Ensure logical document structure"
        ]
    },
    Contextual_Linking: {
        title: "Contextual Linking",
        whatThisParameterIs: "Checks whether internal links exist naturally within main content.",
        whyItMatters: "Contextual links improve crawlability and distribute link equity.",
        thresholds: {
            good: "Contextual links present",
            needsImprovement: "Some key links missing",
            poor: "No contextual links"
        },
        actualReasonsForFailure: [
            "No links in main content",
            "Important pages only linked in navigation",
            "Poor internal linking strategy"
        ],
        howToOvercomeFailure: [
            "Add internal links within content",
            "Link to important pages contextually",
            "Use descriptive anchor text"
        ]
    },
    Heading_Hierarchy: {
        title: "Heading Hierarchy",
        whatThisParameterIs: "Checks whether headings follow a logical H1 → H2 → H3 structure.",
        whyItMatters: "Proper heading structure improves readability and SEO understanding.",
        thresholds: {
            good: "Logical hierarchy without skips",
            needsImprovement: "Minor heading level skips",
            poor: "Missing H1 or major hierarchy issues"
        },
        actualReasonsForFailure: [
            "Skipped heading levels",
            "Missing H1 tag",
            "Improper heading order"
        ],
        howToOvercomeFailure: [
            "Follow sequential heading order",
            "Use headings for structure, not styling",
            "Ensure a single H1"
        ]
    },
    HTTPS: {
        title: "HTTPS",
        whatThisParameterIs: "Checks whether the site is served securely over HTTPS.",
        whyItMatters: "HTTPS is essential for security, trust, and SEO.",
        thresholds: {
            good: "HTTPS enabled",
            needsImprovement: "Mixed content",
            poor: "HTTP only"
        },
        actualReasonsForFailure: [
            "SSL certificate not installed",
            "Mixed HTTP/HTTPS resources",
            "Incorrect redirects"
        ],
        howToOvercomeFailure: [
            "Install SSL certificate",
            "Redirect HTTP to HTTPS",
            "Fix mixed content issues"
        ]
    },
    Content_Quality: {
        title: "Content Quality",
        whatThisParameterIs: "Analyzes content length and internal duplication.",
        whyItMatters: "Thin or repetitive content reduces ranking potential.",
        thresholds: {
            good: "≥300 words, low repetition",
            needsImprovement: "Some repetition detected",
            poor: "Thin or highly repetitive content"
        },
        actualReasonsForFailure: [
            "Low word count",
            "Repeated sentences",
            "Boilerplate content"
        ],
        howToOvercomeFailure: [
            "Add unique, valuable content",
            "Reduce repetition",
            "Improve topical depth"
        ]
    },
    Links: {
        title: "Anchor Text Quality",
        whatThisParameterIs: "Evaluates whether links use descriptive anchor text.",
        whyItMatters: "Descriptive anchors help search engines understand linked pages.",
        thresholds: {
            good: "≥75% descriptive anchors",
            needsImprovement: "Mixed anchor quality",
            poor: "Mostly generic anchors"
        },
        actualReasonsForFailure: [
            "Generic anchors like click here",
            "Repeated non-descriptive text",
            "Missing anchor context"
        ],
        howToOvercomeFailure: [
            "Use descriptive anchor text",
            "Avoid generic phrases",
            "Match anchors with linked content"
        ]
    },
    URL_Slugs: {
        title: "URL Slugs",
        whatThisParameterIs: "Evaluates whether the URL slug is clean and SEO-friendly.",
        whyItMatters: "Readable slugs improve CTR and keyword relevance.",
        thresholds: {
            good: "≤50 chars, lowercase, hyphenated",
            needsImprovement: "Minor formatting issues",
            poor: "Long or unreadable slug"
        },
        actualReasonsForFailure: [
            "Slug too long",
            "Uppercase letters or underscores",
            "Numbers or IDs in slug"
        ],
        howToOvercomeFailure: [
            "Keep slugs short and descriptive",
            "Use lowercase and hyphens",
            "Remove unnecessary numbers"
        ]
    },
    Structured_Data: {
        title: "Structured Data (Schema Markup)",
        whatThisParameterIs: "Checks whether structured data (JSON-LD schema markup) is present on the page.",
        whyItMatters: "Structured data helps search engines better understand content and enables rich results in search listings.",
        thresholds: {
            good: "Valid structured data present",
            needsImprovement: "Partial or invalid structured data",
            poor: "No structured data found"
        },
        actualReasonsForFailure: [
            "No JSON-LD structured data implemented",
            "Invalid or malformed schema markup",
            "Missing required schema properties",
            "Incorrect schema type used"
        ],
        howToOvercomeFailure: [
            "Add relevant JSON-LD schema markup",
            "Use appropriate schema types (Article, Product, FAQ, etc.)",
            "Validate schema using testing tools",
            "Fix errors and warnings in structured data"
        ]
    },
    Open_Graph: {
        title: "Open Graph Tags",
        whatThisParameterIs: "Checks whether essential Open Graph meta tags are present to control how pages appear when shared on social platforms.",
        whyItMatters: "Open Graph tags improve link previews on social media, increase click-through rate, and ensure consistent branding.",
        thresholds: {
            good: "og:title, og:image, and og:url present",
            needsImprovement: "Some required Open Graph tags missing",
            poor: "No Open Graph tags found"
        },
        actualReasonsForFailure: [
            "Missing og:title, og:image, or og:url",
            "Incomplete Open Graph metadata",
            "Incorrect or broken image URLs",
            "Using default or generic Open Graph values"
        ],
        howToOvercomeFailure: [
            "Add og:title, og:image, and og:url meta tags",
            "Use high-quality, accessible images for sharing",
            "Ensure Open Graph values match page content",
            "Validate Open Graph tags before publishing"
        ]
    },
    Twitter_Card: {
        title: "Twitter Card Tags",
        whatThisParameterIs: "Checks whether Twitter Card meta tags are present to control how pages appear when shared on Twitter/X.",
        whyItMatters: "Twitter Card tags improve link previews, increase engagement, and ensure content displays correctly on Twitter/X.",
        thresholds: {
            good: "twitter:card and twitter:title present",
            needsImprovement: "Some required Twitter Card tags missing",
            poor: "No Twitter Card tags found"
        },
        actualReasonsForFailure: [
            "Missing twitter:card or twitter:title tags",
            "Incomplete Twitter Card metadata",
            "Incorrect or broken image URLs",
            "Using generic or default Twitter Card values"
        ],
        howToOvercomeFailure: [
            "Add twitter:card and twitter:title meta tags",
            "Include twitter:image and twitter:description",
            "Ensure Twitter Card content matches page content",
            "Validate Twitter Card implementation before publishing"
        ]
    },
    Social_Links: {
        title: "Social Profile Links",
        whatThisParameterIs: "Checks whether the website links to official social media profiles.",
        whyItMatters: "Social profile links build trust, improve brand credibility, and help users connect with the brand.",
        thresholds: {
            good: "At least one social profile link present",
            needsImprovement: "Social profiles exist but are incomplete",
            poor: "No social profile links found"
        },
        actualReasonsForFailure: [
            "No social media profile links on the website",
            "Social links hidden or hard to find",
            "Incorrect or broken social profile URLs"
        ],
        howToOvercomeFailure: [
            "Add links to official social media profiles",
            "Place social links in header, footer, or contact page",
            "Ensure social profile URLs are correct and active"
        ]
    },

    // Methodologies (On-Page SEO)
    On_Page_SEO_Methodology: {
        icon: Search,
        badge: "SEO",
        title: "On-Page SEO",
        guideLink: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide",
        whatThisMetricIs: (
            <div className="space-y-2">
                <p>Evaluates how well your page content, structure, and metadata are optimized for search engines and users.</p>
                <p>This includes page titles, headings, URLs, internal linking, media optimization, and content quality signals that help search engines understand and rank your page.</p>
            </div>
        ),
        whyItMatters: "Strong on-page SEO makes your content easier to discover, understand, and rank in search results. Well-structured pages improve visibility, click-through rates, accessibility, and overall user experience—leading to more organic traffic and better engagement.",
        whatToDoForAGoodScore: (
            <ul className="list-disc pl-5 space-y-2">
                <li>
                    <span className="font-semibold">Optimize page titles and meta descriptions:</span> Use clear, descriptive titles and summaries that accurately reflect page content and encourage clicks from search results.
                </li>
                <li>
                    <span className="font-semibold">Use a clear heading structure:</span> Ensure each page has a single main heading, followed by logically ordered subheadings that organize content clearly.
                </li>
                <li>
                    <span className="font-semibold">Improve content quality and uniqueness:</span> Avoid thin or repetitive content. Provide enough original, meaningful text to fully cover the topic.
                </li>
                <li>
                    <span className="font-semibold">Optimize images and videos:</span> Add descriptive alt text, meaningful titles, and ensure media files are properly sized and optimized for performance and accessibility.
                </li>
                <li>
                    <span className="font-semibold">Strengthen internal and contextual linking:</span> Use descriptive link text and include links within content to important internal pages, not just navigation menus.
                </li>
                <li>
                    <span className="font-semibold">Clean up URLs and slugs:</span> Keep URLs short, readable, lowercase, and hyphen-separated. Avoid unnecessary parameters or overly deep paths.
                </li>
                <li>
                    <span className="font-semibold">Use semantic HTML elements:</span> Structure pages with semantic tags to improve readability, accessibility, and search engine understanding.
                </li>
                <li>
                    <span className="font-semibold">Ensure canonical and HTTPS best practices:</span> Use valid canonical tags to avoid duplicate content issues and serve pages securely over HTTPS.
                </li>
            </ul>
        ),
        howThisScoreIsCalculated: (
            <div className="space-y-2">
                <p>We analyze multiple on-page SEO signals related to content quality, page structure, metadata, media usage, internal linking, and URL best practices. Each factor contributes to the final score based on its relative importance in helping search engines understand and rank your page.</p>
                <p>Higher-impact elements—such as titles, content quality, images, internal linking, and headings—carry more weight to reflect what most influences search performance.</p>
            </div>
        ),
        weightage: [
            { param: "URL Structure & Hierarchy", weight: "15%" },
            { param: "Image & Video Optimization", weight: "15%" },
            { param: "Title Tags", weight: "12%" },
            { param: "Content Quality & Uniqueness", weight: "10%" },
            { param: "Meta Descriptions", weight: "9%" },
            { param: "H1 Tags", weight: "9%" },
            { param: "Contextual Linking", weight: "9%" },
            { param: "Canonicalization", weight: "8%" },
            { param: "Other Technical SEO", weight: "13%" }
        ]
    },

    // Accessibility
    Color_Contrast: {
        title: "Color Contrast",
        whatThisParameterIs: "Checks whether text has sufficient color contrast against its background.",
        whyItMatters: "Poor contrast makes text difficult to read for users with visual impairments.",
        thresholds: {
        good: "No contrast violations",
        needsImprovement: "Minor contrast issues",
        poor: "Multiple contrast failures"
        },
        actualReasonsForFailure: [
        "Low contrast between text and background",
        "Light text on light backgrounds",
        "Incorrect color combinations"
        ],
        howToOvercomeFailure: [
        "Increase contrast ratio between text and background",
        "Use accessible color palettes",
        "Follow WCAG contrast guidelines"
        ]
    },
    Focus_Order: {
        title: "Focus Order",
        whatThisParameterIs: "Checks whether interactive elements receive focus in a logical order.",
        whyItMatters: "Incorrect focus order confuses keyboard and screen reader users.",
        thresholds: {
        good: "Logical and sequential focus order",
        needsImprovement: "Minor focus jumps",
        poor: "Disorganized focus order"
        },
        actualReasonsForFailure: [
        "Incorrect DOM order",
        "Improper tabindex usage",
        "Hidden elements receiving focus"
        ],
        howToOvercomeFailure: [
        "Maintain logical DOM structure",
        "Avoid unnecessary tabindex values",
        "Ensure focus follows visual order"
        ]
    },
    Focusable_Content: {
        title: "Focusable Content",
        whatThisParameterIs: "Checks whether interactive elements can be reached using keyboard navigation.",
        whyItMatters: "Users relying on keyboards must be able to access all interactive elements.",
        thresholds: {
        good: "All interactive elements are focusable",
        needsImprovement: "Some elements not keyboard accessible",
        poor: "Many elements not focusable"
        },
        actualReasonsForFailure: [
        "Interactive elements missing tabindex",
        "Custom components not keyboard accessible",
        "Disabled focus styles"
        ],
        howToOvercomeFailure: [
        "Ensure interactive elements are keyboard accessible",
        "Use semantic HTML elements",
        "Avoid disabling focus outlines"
        ]
    },
    Tab_Index: {
        title: "Tabindex Usage",
        whatThisParameterIs: "Checks whether tabindex attributes are used correctly.",
        whyItMatters: "Incorrect tabindex values disrupt keyboard navigation.",
        thresholds: {
        good: "Valid tabindex usage",
        needsImprovement: "Some tabindex misuse",
        poor: "Negative or excessive tabindex values"
        },
        actualReasonsForFailure: [
        "Positive tabindex values",
        "Focus order manipulation",
        "Hidden elements with tabindex"
        ],
        howToOvercomeFailure: [
        "Avoid positive tabindex values",
        "Use natural DOM order for focus",
        "Remove tabindex from hidden elements"
        ]
    },
    Interactive_Element_Affordance: {
        title: "Interactive Element Affordance",
        whatThisParameterIs: "Checks whether interactive elements are clearly identifiable.",
        whyItMatters: "Users must be able to recognize clickable and interactive elements.",
        thresholds: {
        good: "Interactive elements clearly identifiable",
        needsImprovement: "Some unclear interactive elements",
        poor: "Interactive elements not recognizable"
        },
        actualReasonsForFailure: [
        "Buttons styled as plain text",
        "Links without visual cues",
        "Missing hover or focus styles"
        ],
        howToOvercomeFailure: [
        "Use clear button and link styles",
        "Add hover and focus indicators",
        "Follow standard UI patterns"
        ]
    },
    Label: {
        title: "Form Labels",
        whatThisParameterIs: "Checks whether form inputs have associated labels.",
        whyItMatters: "Labels help screen readers announce form fields correctly.",
        thresholds: {
        good: "All inputs have labels",
        needsImprovement: "Some labels missing",
        poor: "Most inputs unlabeled"
        },
        actualReasonsForFailure: [
        "Missing label elements",
        "Placeholder text used instead of labels",
        "Incorrect label associations"
        ],
        howToOvercomeFailure: [
        "Associate labels with inputs",
        "Avoid using placeholders as labels",
        "Use aria-label only when necessary"
        ]
    },
    Aria_Allowed_Attr: {
        title: "ARIA Allowed Attributes",
        whatThisParameterIs: "Checks whether ARIA attributes are valid for their assigned roles.",
        whyItMatters: "Invalid ARIA usage can confuse assistive technologies.",
        thresholds: {
        good: "ARIA attributes used correctly",
        needsImprovement: "Minor ARIA misuse",
        poor: "Invalid ARIA attributes"
        },
        actualReasonsForFailure: [
        "Using unsupported ARIA attributes",
        "ARIA roles without required attributes",
        "Incorrect ARIA combinations"
        ],
        howToOvercomeFailure: [
        "Use ARIA attributes only when necessary",
        "Follow ARIA role specifications",
        "Validate ARIA implementation"
        ]
    },
    Aria_Roles: {
        title: "ARIA Roles",
        whatThisParameterIs: "Checks whether ARIA roles are valid and correctly applied.",
        whyItMatters: "ARIA roles help assistive technologies understand page structure.",
        thresholds: {
        good: "Valid ARIA roles",
        needsImprovement: "Some incorrect roles",
        poor: "Invalid or conflicting roles"
        },
        actualReasonsForFailure: [
        "Invalid ARIA role values",
        "Redundant ARIA roles",
        "ARIA roles overriding native semantics"
        ],
        howToOvercomeFailure: [
        "Use native HTML elements first",
        "Apply ARIA roles only when needed",
        "Ensure roles match element purpose"
        ]
    },
    Aria_Hidden_Focus: {
        title: "ARIA Hidden Focus",
        whatThisParameterIs: "Checks whether hidden elements can incorrectly receive focus.",
        whyItMatters: "Hidden focusable elements confuse keyboard and screen reader users.",
        thresholds: {
        good: "No hidden focusable elements",
        needsImprovement: "Few hidden focus issues",
        poor: "Multiple hidden focus issues"
        },
        actualReasonsForFailure: [
        "aria-hidden elements still focusable",
        "Hidden modals or menus receiving focus",
        "Incorrect visibility handling"
        ],
        howToOvercomeFailure: [
        "Remove focus from hidden elements",
        "Manage focus when showing or hiding content",
        "Use aria-hidden correctly"
        ]
    },
    Image_Alt: {
        title: "Image Alt Text",
        whatThisParameterIs: "Checks whether images have meaningful alternative text.",
        whyItMatters: "Alt text allows screen readers to describe images to users.",
        thresholds: {
        good: "All images have meaningful alt text",
        needsImprovement: "Some alt text missing or generic",
        poor: "Most images missing alt text"
        },
        actualReasonsForFailure: [
        "Missing alt attributes",
        "Generic or meaningless alt text",
        "Decorative images not marked properly"
        ],
        howToOvercomeFailure: [
        "Add descriptive alt text to images",
        "Use empty alt for decorative images",
        "Avoid generic alt descriptions"
        ]
    },
    Skip_Links: {
        title: "Skip Links",
        whatThisParameterIs: "Checks whether a visible skip link is available for keyboard users.",
        whyItMatters: "Skip links help users bypass repetitive navigation.",
        thresholds: {
        good: "Skip link present",
        needsImprovement: "Skip link hidden or unclear",
        poor: "No skip link found"
        },
        actualReasonsForFailure: [
        "Skip link missing",
        "Skip link hidden from keyboard users",
        "Incorrect skip link target"
        ],
        howToOvercomeFailure: [
        "Add a visible skip to content link",
        "Ensure skip link is keyboard accessible",
        "Link skip target to main content"
        ]
    },
    Landmarks: {
        title: "Landmark Roles",
        whatThisParameterIs: "Checks whether ARIA landmark roles or semantic landmarks are present.",
        whyItMatters: "Landmarks help screen reader users navigate page structure efficiently.",
        thresholds: {
        good: "Landmark roles present",
        needsImprovement: "Partial landmark usage",
        poor: "No landmark roles found"
        },
        actualReasonsForFailure: [
        "Missing main or navigation landmarks",
        "Improper landmark role usage",
        "Overuse of generic containers"
        ],
        howToOvercomeFailure: [
        "Use semantic HTML landmarks",
        "Add ARIA landmark roles where needed",
        "Ensure clear page regions"
        ]
    },

    // Methodologies (Accessibility)
    Accessibility_Methodology: {
        icon: Eye,
        badge: "Accessibility",
        title: "Accessibility",
        guideLink: "https://www.w3.org/WAI/standards-guidelines/wcag/",
        whatThisMetricIs: (
            <div className="space-y-2">
                <p>Measures how accessible your website is for users who rely on assistive technologies such as screen readers, keyboards, and and other accessibility tools.</p>
                <p>It evaluates whether users can perceive, navigate, and interact with your content regardless of ability.</p>
            </div>
        ),
        whyItMatters: "Accessible websites are easier to use for everyone. They improve usability, expand your audience, reduce legal and compliance risk, and often perform better in search engines. Accessibility is also a key part of inclusive, user-first design.",
        whatToDoForAGoodScore: (
            <ul className="list-disc pl-5 space-y-2">
                <li>
                    <span className="font-semibold">Ensure sufficient color contrast:</span> Make sure text and interactive elements are easy to read against their backgrounds.
                </li>
                <li>
                    <span className="font-semibold">Support full keyboard navigation:</span> Users should be able to navigate and interact with all elements using a keyboard alone, in a logical order.
                </li>
                <li>
                    <span className="font-semibold">Use clear labels for form fields:</span> Inputs, buttons, and controls should have descriptive labels that assistive technologies can understand.
                </li>
                <li>
                    <span className="font-semibold">Provide meaningful alternative text for images:</span> Images should include clear descriptions so users who can’t see them still understand their purpose.
                </li>
                <li>
                    <span className="font-semibold">Use ARIA roles correctly:</span> Only apply ARIA attributes when needed, and ensure they match the intended role and behavior of elements.
                </li>
                <li>
                    <span className="font-semibold">Include page landmarks and skip links:</span> Structural landmarks and skip navigation links help users move efficiently through the page.
                </li>
                <li>
                    <span className="font-semibold">Avoid hidden or inaccessible interactive elements:</span> Elements should not be hidden from assistive tools while still receiving focus.
                </li>
            </ul>
        ),
        howThisScoreIsCalculated: (
            <div className="space-y-2">
                <p>We evaluate your page against recognized accessibility best practices using automated checks and structural analysis. The score is based on whether key accessibility requirements are met, with higher weight given to issues that most affect usability for assistive technology users.</p>
                <p>Each check either passes or fails, and the final score reflects how consistently your site meets accessibility standards.</p>
            </div>
        ),
        weightage: [
            { param: "Navigation & Focus Order", weight: "35%" },
            { param: "Visual Labels & Contrast", weight: "35%" },
            { param: "ARIA Roles & Attributes", weight: "25%" },
            { param: "Interactive Elements", weight: "5%" }
        ]
    },

    // Security & Compliance
    HTTPS: {
        title: "HTTPS Usage",
        whatThisParameterIs: "Checks whether the website is served over a secure HTTPS protocol.",
        whyItMatters: "HTTPS encrypts data between users and servers, protecting against interception and tampering.",
        thresholds: {
        good: "HTTPS enabled",
        needsImprovement: "Mixed content",
        poor: "HTTP only"
        },
        actualReasonsForFailure: [
        "Website served over HTTP",
        "Missing HTTPS redirect",
        "Invalid URL structure"
        ],
        howToOvercomeFailure: [
        "Install an SSL certificate",
        "Force HTTPS redirects",
        "Ensure all resources load over HTTPS"
        ]
    },
    SSL: {
    title: "SSL Connection",
    whatThisParameterIs: "Checks whether a secure SSL connection is successfully established with the server.",
    whyItMatters: "A valid SSL connection ensures encrypted communication and protects user data from interception.",
    thresholds: {
        good: "SSL connection established successfully",
        needsImprovement: "SSL present but misconfigured",
        poor: "SSL connection failed"
    },
    actualReasonsForFailure: [
        "SSL handshake failure",
        "Invalid or self-signed certificate",
        "Incorrect server SSL configuration",
        "Expired or revoked certificate"
    ],
    howToOvercomeFailure: [
        "Install a valid SSL certificate from a trusted authority",
        "Ensure server supports modern TLS versions",
        "Fix certificate chain and configuration issues",
        "Test SSL configuration after deployment"
    ]
    },
    SSL_Expiry: {
        title: "SSL Certificate Validity",
        whatThisParameterIs: "Checks whether the SSL certificate is valid and not expired.",
        whyItMatters: "Expired certificates break trust and expose users to security risks.",
        thresholds: {
        good: "Valid, non-expired certificate",
        needsImprovement: "Certificate nearing expiry",
        poor: "Expired or invalid certificate"
        },
        actualReasonsForFailure: [
        "Expired SSL certificate",
        "Incorrect certificate configuration",
        "Missing SSL security details"
        ],
        howToOvercomeFailure: [
        "Renew SSL certificate before expiry",
        "Use trusted certificate authorities",
        "Monitor SSL validity regularly"
        ]
    },
    TLS_Version: {
        title: "TLS Version",
        whatThisParameterIs: "Checks whether the site uses a secure TLS protocol version.",
        whyItMatters: "Older TLS versions are vulnerable to known attacks.",
        thresholds: {
        good: "TLS 1.2 or TLS 1.3",
        needsImprovement: "Older but supported TLS",
        poor: "Weak or unsupported TLS version"
        },
        actualReasonsForFailure: [
        "TLS 1.0 or 1.1 enabled",
        "Outdated server configuration"
        ],
        howToOvercomeFailure: [
        "Disable older TLS versions",
        "Enable TLS 1.2 or TLS 1.3",
        "Update server security settings"
        ]
    },
    X_Frame_Options: {
    title: "X-Frame-Options Header",
    whatThisParameterIs: "Checks whether the X-Frame-Options HTTP header is present to control iframe embedding.",
    whyItMatters: "This header protects the site from clickjacking attacks by preventing it from being embedded in malicious iframes.",
    thresholds: {
        good: "X-Frame-Options header present",
        needsImprovement: "Header present but not strictly configured",
        poor: "X-Frame-Options header missing"
    },
    actualReasonsForFailure: [
        "X-Frame-Options header not configured on the server",
        "Misconfigured security headers",
        "Reliance on default server settings"
    ],
    howToOvercomeFailure: [
        "Add X-Frame-Options header with DENY or SAMEORIGIN value",
        "Configure security headers at the server or CDN level",
        "Verify headers using browser dev tools or security scanners"
    ]
    },
    X_Content_Type_Options: {
    title: "X-Content-Type-Options Header",
    whatThisParameterIs: "Checks whether the X-Content-Type-Options HTTP header is present to prevent MIME type sniffing.",
    whyItMatters: "This header protects against attacks where browsers incorrectly interpret file types, which can lead to script execution vulnerabilities.",
    thresholds: {
        good: "X-Content-Type-Options header present (nosniff)",
        needsImprovement: "Header present but misconfigured",
        poor: "X-Content-Type-Options header missing"
    },
    actualReasonsForFailure: [
        "X-Content-Type-Options header not set on the server",
        "Incomplete or missing security header configuration",
        "Reliance on default server behavior"
    ],
    howToOvercomeFailure: [
        "Add X-Content-Type-Options header with value 'nosniff'",
        "Configure security headers at the web server or CDN level",
        "Verify response headers using browser developer tools"
    ]
    },
    HSTS: {
        title: "HTTP Strict Transport Security (HSTS)",
        whatThisParameterIs: "Checks whether the HSTS header is enabled.",
        whyItMatters: "HSTS forces browsers to always use HTTPS, preventing downgrade attacks.",
        thresholds: {
        good: "HSTS header present",
        needsImprovement: "Short max-age value",
        poor: "HSTS missing"
        },
        actualReasonsForFailure: [
        "HSTS header not set",
        "Incorrect HSTS configuration"
        ],
        howToOvercomeFailure: [
        "Add Strict-Transport-Security header",
        "Use a long max-age value",
        "Enable includeSubDomains if applicable"
        ]
    },
    CSP: {
        title: "Content Security Policy (CSP)",
        whatThisParameterIs: "Checks whether a Content Security Policy header is implemented.",
        whyItMatters: "CSP protects against XSS and data injection attacks.",
        thresholds: {
        good: "CSP header present",
        needsImprovement: "Overly permissive CSP",
        poor: "CSP missing"
        },
        actualReasonsForFailure: [
        "CSP header missing",
        "Unsafe inline scripts allowed"
        ],
        howToOvercomeFailure: [
        "Define a strict CSP policy",
        "Avoid unsafe-inline and unsafe-eval",
        "Test CSP before enforcing"
        ]
    },
    Cookies_Secure: {
        title: "Secure Cookies",
        whatThisParameterIs: "Checks whether cookies use the Secure flag.",
        whyItMatters: "Secure cookies are only transmitted over HTTPS, reducing risk of interception.",
        thresholds: {
        good: "Secure flag enabled",
        needsImprovement: "Some cookies missing Secure flag",
        poor: "No cookies use Secure flag"
        },
        actualReasonsForFailure: [
        "Secure flag not set",
        "Cookies served over HTTP"
        ],
        howToOvercomeFailure: [
        "Enable Secure flag on cookies",
        "Serve cookies only over HTTPS"
        ]
    },
    Cookies_HttpOnly: {
        title: "HttpOnly Cookies",
        whatThisParameterIs: "Checks whether cookies are protected with HttpOnly flag.",
        whyItMatters: "HttpOnly cookies prevent access via JavaScript, reducing XSS risks.",
        thresholds: {
        good: "HttpOnly flag enabled",
        needsImprovement: "Some cookies missing HttpOnly",
        poor: "HttpOnly not used"
        },
        actualReasonsForFailure: [
        "HttpOnly flag missing",
        "Cookies accessible via JavaScript"
        ],
        howToOvercomeFailure: [
        "Enable HttpOnly flag",
        "Limit JavaScript access to cookies"
        ]
    },
    SQLi_Exposure: {
        title: "SQL Injection Exposure",
        whatThisParameterIs: "Checks whether the site appears vulnerable to SQL injection attacks.",
        whyItMatters: "SQL injection can lead to data theft or system compromise.",
        thresholds: {
        good: "No SQL injection indicators",
        needsImprovement: "Suspicious response behavior",
        poor: "SQL error patterns detected"
        },
        actualReasonsForFailure: [
        "Unsanitized user input",
        "Exposed database error messages"
        ],
        howToOvercomeFailure: [
        "Use parameterized queries",
        "Sanitize and validate inputs",
        "Hide database error messages"
        ]
    },
    XSS: {
        title: "Cross-Site Scripting (XSS)",
        whatThisParameterIs: "Checks whether user input is reflected without proper sanitization.",
        whyItMatters: "XSS attacks can hijack user sessions and steal sensitive data.",
        thresholds: {
        good: "No reflected scripts",
        needsImprovement: "Partial input sanitization",
        poor: "Script payload reflected"
        },
        actualReasonsForFailure: [
        "User input not escaped",
        "Inline script execution allowed"
        ],
        howToOvercomeFailure: [
        "Escape user-generated content",
        "Implement CSP",
        "Avoid inline JavaScript"
        ]
    },
    Cookie_Consent: {
        title: "Cookie Consent Banner",
        whatThisParameterIs: "Checks whether a cookie consent mechanism is present.",
        whyItMatters: "Cookie consent is required for GDPR and privacy compliance.",
        thresholds: {
        good: "Consent banner present",
        needsImprovement: "Banner unclear",
        poor: "No consent banner"
        },
        actualReasonsForFailure: [
        "No cookie banner",
        "Hidden or non-functional banner"
        ],
        howToOvercomeFailure: [
        "Implement cookie consent banner",
        "Allow users to manage preferences"
        ]
    },
    Privacy_Policy: {
        title: "Privacy Policy",
        whatThisParameterIs: "Checks whether a privacy policy link is available.",
        whyItMatters: "Privacy policies are legally required and build user trust.",
        thresholds: {
        good: "Privacy policy accessible",
        needsImprovement: "Hard to find policy",
        poor: "No privacy policy"
        },
        actualReasonsForFailure: [
        "Privacy policy missing",
        "Broken policy link"
        ],
        howToOvercomeFailure: [
        "Add a privacy policy page",
        "Link it in footer or menu"
        ]
    },
    Admin_Panel_Public: {
        title: "Public Admin Panel Exposure",
        whatThisParameterIs: "Checks whether admin or control panels are publicly accessible.",
        whyItMatters: "Exposed admin panels increase attack surface.",
        thresholds: {
        good: "No public admin panels",
        needsImprovement: "Restricted admin paths",
        poor: "Admin panel publicly accessible"
        },
        actualReasonsForFailure: [
        "Admin URLs publicly accessible",
        "No access restrictions"
        ],
        howToOvercomeFailure: [
        "Restrict admin access",
        "Use authentication and IP restrictions"
        ]
    },
    MFA_Enabled: {
        title: "Multi-Factor Authentication (MFA)",
        whatThisParameterIs: "Checks whether MFA or SSO indicators are present on login flows.",
        whyItMatters: "MFA adds an extra layer of account security.",
        thresholds: {
        good: "MFA or SSO detected",
        needsImprovement: "MFA unclear",
        poor: "No MFA indicators"
        },
        actualReasonsForFailure: [
        "Single-factor authentication only",
        "No MFA-related UI elements"
        ],
        howToOvercomeFailure: [
        "Enable MFA for logins",
        "Use SSO or authenticator-based MFA"
        ]
    },
    Google_Safe_Browsing: {
    title: "Google Safe Browsing",
    whatThisParameterIs: "Checks whether the website is flagged for malware or harmful activity by Google Safe Browsing.",
    whyItMatters: "Sites flagged by Google may be blocked or warned in browsers, harming trust and traffic.",
    thresholds: {
        good: "URL not found in Google Safe Browsing database",
        poor: "URL flagged as unsafe"
    },
    actualReasonsForFailure: [
        "Malware detected on the website",
        "Previously compromised files",
        "Suspicious redirects or injected scripts"
    ],
    howToOvercomeFailure: [
        "Remove malware and suspicious scripts",
        "Request a review in Google Search Console",
        "Keep CMS and plugins updated"
    ]
    },
    Blacklist: {
    title: "Domain Blacklist Status",
    whatThisParameterIs: "Checks whether the domain appears in known security blacklists.",
    whyItMatters: "Blacklisted domains may be blocked by browsers, email providers, or security tools.",
    thresholds: {
        good: "Domain not blacklisted",
        poor: "Domain found in blacklist databases"
    },
    actualReasonsForFailure: [
        "Malware hosting",
        "Phishing activity",
        "Past security breaches"
    ],
    howToOvercomeFailure: [
        "Clean infected files",
        "Request delisting from blacklist providers",
        "Improve server security practices"
    ]
    },
    Malware_Scan: {
    title: "Malware Detection",
    whatThisParameterIs: "Checks domain reputation using malware scanning services.",
    whyItMatters: "Malware affects user safety, SEO rankings, and browser trust.",
    thresholds: {
        good: "No malware detected",
        poor: "Malware detected"
    },
    actualReasonsForFailure: [
        "Injected malicious scripts",
        "Compromised server or CMS",
        "Unpatched vulnerabilities"
    ],
    howToOvercomeFailure: [
        "Remove malicious files",
        "Harden server security",
        "Run regular security scans"
    ]
    },
    Forms_Use_HTTPS: {
    title: "Secure Form Submission",
    whatThisParameterIs: "Checks whether form actions submit data over HTTPS.",
    whyItMatters: "Insecure form submissions can expose sensitive user data.",
    thresholds: {
        good: "All forms submit data over HTTPS",
        poor: "One or more forms use HTTP"
    },
    actualReasonsForFailure: [
        "Form action points to HTTP URL",
        "Mixed content issues"
    ],
    howToOvercomeFailure: [
        "Update form actions to HTTPS",
        "Force HTTPS site-wide"
    ]
    },
    GDPR_CCPA: {
    title: "GDPR / CCPA Compliance",
    whatThisParameterIs: "Checks for presence of GDPR or CCPA consent notices.",
    whyItMatters: "Compliance is legally required in many regions and builds user trust.",
    thresholds: {
        good: "Consent notice found",
        poor: "No consent notice found"
    },
    actualReasonsForFailure: [
        "No consent banner implemented",
        "Hidden or inaccessible consent UI"
    ],
    howToOvercomeFailure: [
        "Add GDPR/CCPA compliant consent banner",
        "Allow users to manage consent preferences"
    ]
    },
    Data_Collection: {
    title: "Data Collection Disclosure",
    whatThisParameterIs: "Checks whether the site discloses how user data is collected and used.",
    whyItMatters: "Transparency about data usage is required for privacy compliance.",
    thresholds: {
        good: "Data collection disclosure found",
        poor: "No disclosure found"
    },
    actualReasonsForFailure: [
        "Missing privacy or data usage pages",
        "No clear data usage explanation"
    ],
    howToOvercomeFailure: [
        "Add a detailed privacy policy",
        "Clearly explain data usage and cookies"
    ]
    },
    Weak_Default_Credentials: {
    title: "Weak or Default Credentials",
    whatThisParameterIs: "Checks for indicators of weak or default login credentials.",
    whyItMatters: "Weak credentials increase the risk of unauthorized access.",
    thresholds: {
        good: "No weak credential indicators found",
        poor: "Weak or default credentials detected"
    },
    actualReasonsForFailure: [
        "Default usernames or passwords",
        "Missing CSRF protection",
        "Unprotected login forms"
    ],
    howToOvercomeFailure: [
        "Enforce strong password policies",
        "Enable CSRF protection and captcha",
        "Remove default credentials"
    ]
    },
    HTML_Doctype: {
    title: "HTML Doctype",
    whatThisParameterIs: "Checks whether a valid HTML5 doctype is declared.",
    whyItMatters: "Correct doctype ensures consistent rendering across browsers.",
    thresholds: {
        good: "HTML5 doctype present",
        poor: "Missing or incorrect doctype"
    },
    actualReasonsForFailure: [
        "DOCTYPE missing",
        "Legacy or invalid doctype"
    ],
    howToOvercomeFailure: [
        "Declare <!DOCTYPE html> at document start"
    ]
    },
    Character_Encoding: {
    title: "Character Encoding",
    whatThisParameterIs: "Checks whether a character encoding is defined.",
    whyItMatters: "Missing charset can cause text rendering and security issues.",
    thresholds: {
        good: "Charset defined",
        poor: "Charset missing"
    },
    actualReasonsForFailure: [
        "No meta charset tag",
        "No charset in HTTP headers"
    ],
    howToOvercomeFailure: [
        "Add <meta charset='UTF-8'>",
        "Define charset in server headers"
    ]
    },
    Browser_Console_Errors: {
    title: "Browser Console Errors",
    whatThisParameterIs: "Detects JavaScript and runtime errors in the browser console.",
    whyItMatters: "Console errors can break functionality and user experience.",
    thresholds: {
        good: "No console errors",
        poor: "Console errors detected"
    },
    actualReasonsForFailure: [
        "JavaScript runtime errors",
        "Missing or broken scripts"
    ],
    howToOvercomeFailure: [
        "Fix JavaScript errors",
        "Test scripts across browsers"
    ]
    },
    Geolocation_Request: {
    title: "Geolocation Permission Request",
    whatThisParameterIs: "Checks whether the page requests geolocation access on load.",
    whyItMatters: "Unnecessary permission requests reduce user trust.",
    thresholds: {
        good: "No geolocation request on load",
        poor: "Geolocation requested automatically"
    },
    actualReasonsForFailure: [
        "Geolocation API called on page load"
    ],
    howToOvercomeFailure: [
        "Request location only when necessary",
        "Explain why location access is required"
    ]
    },
    Input_Paste_Allowed: {
    title: "Paste Allowed in Inputs",
    whatThisParameterIs: "Checks whether users can paste into input fields.",
    whyItMatters: "Blocking paste harms accessibility and usability.",
    thresholds: {
        good: "Paste allowed",
        poor: "Paste blocked"
    },
    actualReasonsForFailure: [
        "onpaste handlers blocking paste",
        "Custom JS preventing paste"
    ],
    howToOvercomeFailure: [
        "Allow paste events",
        "Avoid unnecessary input restrictions"
    ]
    },
    Notification_Request: {
    title: "Notification Permission Request",
    whatThisParameterIs: "Checks whether notification permission is requested on page load.",
    whyItMatters: "Aggressive permission requests reduce trust and engagement.",
    thresholds: {
        good: "No notification request on load",
        poor: "Notification requested automatically"
    },
    actualReasonsForFailure: [
        "Notification API triggered on load"
    ],
    howToOvercomeFailure: [
        "Request notifications only after user interaction"
    ]
    },
    Third_Party_Cookies: {
    title: "Third-Party Cookies",
    whatThisParameterIs: "Checks whether third-party cookies are set.",
    whyItMatters: "Third-party cookies raise privacy and compliance concerns.",
    thresholds: {
        good: "No third-party cookies detected",
        poor: "Third-party cookies detected"
    },
    actualReasonsForFailure: [
        "Third-party scripts setting cookies",
        "Tracking pixels"
    ],
    howToOvercomeFailure: [
        "Audit third-party scripts",
        "Limit cross-domain cookie usage"
    ]
    },
    Deprecated_APIs: {
    title: "Deprecated API Usage",
    whatThisParameterIs: "Detects usage of deprecated browser APIs.",
    whyItMatters: "Deprecated APIs may break in future browsers.",
    thresholds: {
        good: "No deprecated APIs used",
        poor: "Deprecated APIs detected"
    },
    actualReasonsForFailure: [
        "Legacy JavaScript APIs",
        "Outdated libraries"
    ],
    howToOvercomeFailure: [
        "Update libraries",
        "Replace deprecated APIs with modern alternatives"
    ]
    },
    Viewport_Meta_Tag: {
    title: "Viewport Meta Tag",
    whatThisParameterIs: "Checks whether the viewport meta tag is present and correctly configured for responsive design.",
    whyItMatters: "A proper viewport meta tag ensures pages scale correctly on mobile devices and improves usability and accessibility.",
    thresholds: {
        good: "Viewport meta tag present with width or initial-scale",
        needsImprovement: "Viewport meta tag present but misconfigured",
        poor: "Viewport meta tag missing"
    },
    actualReasonsForFailure: [
        "Viewport meta tag missing",
        "Viewport meta tag does not define width or initial-scale"
    ],
    howToOvercomeFailure: [
        "Add <meta name='viewport' content='width=device-width, initial-scale=1'> to the head section",
        "Verify viewport configuration using browser developer tools"
    ]
    },

    // Methodologies (Security & Compliance)
    Security_And_Compliance_Methodology: {
        icon: Shield,
        badge: "Security",
        title: "Security & Compliance",
        guideLink: "https://owasp.org/www-project-top-ten/",
        whatThisMetricIs: (
            <div className="space-y-2">
                <p>Evaluates how securely your website is configured and whether it follows modern security, privacy, and compliance best practices.</p>
                <p>It checks encryption, security headers, vulnerabilities, malware risks, data protection, authentication safeguards, and user privacy signals.</p>
            </div>
        ),
        whyItMatters: "Security issues put users, data, and your business at risk. Weak configurations can lead to breaches, malware infections, regulatory violations, and loss of trust. A secure and compliant website protects users, reduces legal exposure, and builds credibility with customers and search engines.",
        whatToDoForAGoodScore: (
            <ul className="list-disc pl-5 space-y-2">
                <li>
                    <span className="font-semibold">Secure your site with HTTPS and valid SSL:</span> Ensure your site uses HTTPS, has a valid SSL certificate, and supports modern encryption protocols.
                </li>
                <li>
                    <span className="font-semibold">Harden security headers:</span> Use headers that protect against common attacks, such as clickjacking, content injection, and MIME sniffing.
                </li>
                <li>
                    <span className="font-semibold">Protect against common vulnerabilities:</span> Prevent exposure to issues like SQL injection, cross-site scripting (XSS), and insecure admin access.
                </li>
                <li>
                    <span className="font-semibold">Avoid weak or default credentials:</span> Ensure login systems are protected with secure credentials, proper access controls, and modern authentication practices.
                </li>
                <li>
                    <span className="font-semibold">Enable multi-factor authentication where possible:</span> Adding MFA or secure single sign-on greatly reduces account takeover risks.
                </li>
                <li>
                    <span className="font-semibold">Ensure cookies and forms are handled securely:</span> Cookies should be properly flagged, and forms should submit data over secure connections only.
                </li>
                <li>
                    <span className="font-semibold">Comply with privacy and data protection expectations:</span> Display cookie consent notices, privacy policies, and disclosures about how user data is collected and used.
                </li>
                <li>
                    <span className="font-semibold">Prevent unnecessary permission requests:</span> Avoid requesting sensitive permissions (such as notifications or location) without clear user intent.
                </li>
            </ul>
        ),
        howThisScoreIsCalculated: (
            <div className="space-y-2">
                <p>We evaluate your site across multiple security and compliance categories, including encryption, headers, vulnerabilities, authentication, malware reputation, and privacy practices.</p>
                <p>Each check is weighted based on risk severity. Critical security issues have a stronger impact on the final score, ensuring the result reflects real-world security risk rather than cosmetic issues.</p>
            </div>
        ),
        weightage: [
            { param: "Vulnerability Scanning", weight: "35%" },
            { param: "Browser Security & Best Practices", weight: "20%" },
            { param: "SSL & HTTPS Security", weight: "15%" },
            { param: "Security Headers", weight: "15%" },
            { param: "Compliance & Privacy", weight: "10%" },
            { param: "Access Control", weight: "5%" }
        ]
    },

    // UX & Content 
    Viewport_Configuration: {
    title: "Viewport Configuration",
    whatThisParameterIs: "Checks whether the page defines a proper viewport meta tag for responsive rendering, especially on mobile devices.",
    whyItMatters: "Without a correct viewport configuration, pages may appear zoomed out, require horizontal scrolling, or be hard to read on mobile screens.",
    thresholds: {
        good: "Viewport meta tag present with width=device-width and initial-scale=1",
        needsImprovement: "Viewport meta tag present but incorrectly configured",
        poor: "Viewport meta tag missing"
    },
    actualReasonsForFailure: [
        "Viewport meta tag missing from the HTML head",
        "Viewport meta tag does not include width=device-width",
        "Viewport meta tag missing initial-scale value",
        "Viewport configured only for desktop layouts"
    ],
    howToOvercomeFailure: [
        "Add <meta name='viewport' content='width=device-width, initial-scale=1'> in the head section",
        "Avoid fixed-width layouts on mobile",
        "Test responsiveness across common mobile breakpoints"
    ]
    },
    Text_Readability: {
    title: "Text Readability",
    whatThisParameterIs: "Measures how easy the page content is to read using the Flesch Reading Ease formula.",
    whyItMatters: "Readable content improves user engagement, comprehension, and conversion rates.",
    thresholds: {
        good: "Score within recommended range for page type",
        needsImprovement: "Slightly complex content",
        poor: "Hard to read content"
    },
    actualReasonsForFailure: [
        "Very long sentences",
        "Complex vocabulary with many syllables",
        "Dense paragraphs without breaks"
    ],
    howToOvercomeFailure: [
        "Use shorter sentences",
        "Replace complex words with simpler alternatives",
        "Break content into smaller paragraphs"
    ]
    },
    Cumulative_Layout_Shift: {
    title: "Cumulative Layout Shift (CLS)",
    whatThisParameterIs: "Measures unexpected layout movement during page load.",
    whyItMatters: "Layout shifts frustrate users and can cause accidental clicks.",
    thresholds: {
        good: "CLS ≤ 0.1",
        needsImprovement: "CLS between 0.1 and 0.25",
        poor: "CLS > 0.25"
    },
    actualReasonsForFailure: [
        "Images without width and height",
        "Ads injected dynamically",
        "Late-loading fonts or banners"
    ],
    howToOvercomeFailure: [
        "Define width and height for images",
        "Reserve space for ads and embeds",
        "Use font-display swap"
    ]
    },
    Tap_Target_Size: {
    title: "Tap Target Size",
    whatThisParameterIs: "Checks whether clickable elements are large enough for touch interaction.",
    whyItMatters: "Small tap targets cause misclicks and poor mobile usability.",
    thresholds: {
        good: "≥ 90% tap targets meet size requirements",
        needsImprovement: "Some targets are too small",
        poor: "Many targets are too small"
    },
    actualReasonsForFailure: [
        "Buttons smaller than recommended size",
        "Links placed too close together"
    ],
    howToOvercomeFailure: [
        "Increase button and link size",
        "Add spacing between interactive elements"
    ]
    },
    Text_Font_Size: {
    title: "Text Font Size",
    whatThisParameterIs: "Checks whether text size meets minimum readability standards.",
    whyItMatters: "Small text strains the eyes and reduces accessibility.",
    thresholds: {
        good: "≥ 90% text meets minimum size",
        needsImprovement: "Some text is too small",
        poor: "Most text is too small"
    },
    actualReasonsForFailure: [
        "Font size below recommended minimum",
        "Overuse of small captions"
    ],
    howToOvercomeFailure: [
        "Increase base font size",
        "Avoid scaling text too small on mobile"
    ]
    },
    Horizontal_Scroll_Check: {
    title: "Horizontal Scrolling",
    whatThisParameterIs: "Detects whether horizontal scrolling is required on the page.",
    whyItMatters: "Horizontal scrolling breaks mobile usability expectations.",
    thresholds: {
        good: "No horizontal scroll",
        poor: "Horizontal scroll detected"
    },
    actualReasonsForFailure: [
        "Fixed-width elements",
        "Large images or tables"
    ],
    howToOvercomeFailure: [
        "Use responsive layouts",
        "Avoid fixed-width containers"
    ]
    },
    Sticky_Header_Usage: {
    title: "Sticky Header Usage",
    whatThisParameterIs: "Checks whether sticky headers occupy excessive screen space.",
    whyItMatters: "Oversized sticky headers reduce visible content area.",
    thresholds: {
        good: "Header height within limit",
        poor: "Header too tall"
    },
    actualReasonsForFailure: [
        "Large fixed headers",
        "Multiple stacked sticky elements"
    ],
    howToOvercomeFailure: [
        "Reduce header height",
        "Collapse header on scroll"
    ]
    },
    Navigation_Depth: {
    title: "Navigation Depth",
    whatThisParameterIs: "Measures how deep internal pages are within the site structure.",
    whyItMatters: "Shallow navigation improves discoverability.",
    thresholds: {
        good: "≥ 80% links ≤ 3 levels deep",
        needsImprovement: "Some deep links",
        poor: "Many deep links"
    },
    actualReasonsForFailure: [
        "Over-nested URLs",
        "Complex menu structure"
    ],
    howToOvercomeFailure: [
        "Flatten navigation hierarchy",
        "Improve internal linking"
    ]
    },
    Intrusive_Interstitials: {
    title: "Intrusive Interstitials",
    whatThisParameterIs: "Detects large popups or overlays blocking content.",
    whyItMatters: "Intrusive popups frustrate users and hurt SEO.",
    thresholds: {
        good: "No intrusive interstitials",
        poor: "Intrusive elements detected"
    },
    actualReasonsForFailure: [
        "Full-screen popups",
        "Scroll-blocking modals"
    ],
    howToOvercomeFailure: [
        "Use non-intrusive banners",
        "Delay popups until user interaction"
    ]
    },
    Image_Stability: {
    title: "Image Stability",
    whatThisParameterIs: "Checks whether images reserve space before loading.",
    whyItMatters: "Unstable images cause layout shifts.",
    thresholds: {
        good: "≥ 90% images stable",
        poor: "Many unstable images"
    },
    actualReasonsForFailure: [
        "Missing width/height attributes",
        "No aspect-ratio defined"
    ],
    howToOvercomeFailure: [
        "Define width and height",
        "Use CSS aspect-ratio"
    ]
    },
    Breadcrumbs: {
    title: "Breadcrumb Navigation",
    whatThisParameterIs: "Checks whether breadcrumb navigation is present.",
    whyItMatters: "Breadcrumbs improve navigation clarity and SEO.",
    thresholds: {
        good: "Breadcrumbs detected",
        poor: "Breadcrumbs missing"
    },
    actualReasonsForFailure: [
        "No breadcrumb markup",
        "Missing schema"
    ],
    howToOvercomeFailure: [
        "Add breadcrumb navigation",
        "Use BreadcrumbList schema"
    ]
    },
    Navigation_Discoverability: {
    title: "Navigation Discoverability",
    whatThisParameterIs: "Checks whether navigation and search are easy to find on mobile.",
    whyItMatters: "Hidden navigation reduces usability.",
    thresholds: {
        good: "Menu and search available",
        needsImprovement: "Only one present",
        poor: "Navigation hard to find"
    },
    actualReasonsForFailure: [
        "Hidden menu",
        "No search option"
    ],
    howToOvercomeFailure: [
        "Add hamburger menu",
        "Provide visible search"
    ]
    },
    Above_the_Fold_Content: {
    title: "Above-the-Fold Content",
    whatThisParameterIs: "Measures how much important content is visible without scrolling.",
    whyItMatters: "Users expect meaningful content immediately.",
    thresholds: {
        good: "≥ 50% important content visible",
        needsImprovement: "20–49% visible",
        poor: "< 20% visible"
    },
    actualReasonsForFailure: [
        "Large hero sections",
        "Excessive banners"
    ],
    howToOvercomeFailure: [
        "Reduce hero height",
        "Move key content higher"
    ]
    },
    Interactive_Click_Feedback: {
    title: "Click Feedback",
    whatThisParameterIs: "Checks whether interactive elements provide visual feedback.",
    whyItMatters: "Feedback confirms actions to users.",
    thresholds: {
        good: "≥ 80% elements show feedback",
        needsImprovement: "Some feedback missing",
        poor: "Little or no feedback"
    },
    actualReasonsForFailure: [
        "No hover or active styles",
        "Missing cursor changes"
    ],
    howToOvercomeFailure: [
        "Add hover/active states",
        "Use cursor:pointer"
    ]
    },
    Form_Validation_UX: {
    title: "Form Validation UX",
    whatThisParameterIs: "Checks whether form inputs have labels and clear validation feedback.",
    whyItMatters: "Good form UX reduces errors and abandonment.",
    thresholds: {
        good: "≥ 90% inputs labeled",
        needsImprovement: "Some labels missing",
        poor: "Many unlabeled inputs"
    },
    actualReasonsForFailure: [
        "Missing labels",
        "Unclear error messages"
    ],
    howToOvercomeFailure: [
        "Add labels or aria-labels",
        "Show inline error messages"
    ]
    },
    Loading_Feedback: {
    title: "Loading Feedback",
    whatThisParameterIs: "Detects spinners, skeletons, or loading indicators.",
    whyItMatters: "Loading feedback reassures users during delays.",
    thresholds: {
        good: "Loading feedback present",
        poor: "No loading feedback"
    },
    actualReasonsForFailure: [
        "No spinners or skeleton UI",
        "Long loading without feedback"
    ],
    howToOvercomeFailure: [
        "Add spinners or skeleton screens",
        "Show loading text for async actions"
    ]
    },

    // Methodologies (UX & Content )
    UX_And_Content_Methodology: {
        icon: Smartphone,
        badge: "UX & Content",
        title: "Mobile UX & Content Experience",
        guideLink: "https://developers.google.com/search/mobile-sites",
        whatThisMetricIs: (
            <div className="space-y-2">
                <p>Measures how easy, readable, and frustration-free your website feels for users — especially on mobile devices.</p>
                <p>It evaluates layout stability, readability, touch interactions, navigation clarity, visual hierarchy, and feedback signals that directly affect real user experience.</p>
            </div>
        ),
        whyItMatters: (
            <div className="space-y-4">
                <p>Even fast websites fail if users struggle to read content, tap elements, navigate pages, or understand what’s happening on screen.</p>

                <div>
                    <span className="font-semibold block mb-1">Poor mobile experience leads to:</span>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Higher bounce rates</li>
                        <li>Lower engagement and conversions</li>
                        <li>Frustrated users</li>
                        <li>Reduced search visibility</li>
                    </ul>
                </div>

                <p className="font-medium">A strong UX keeps users comfortable, confident, and moving forward.</p>
            </div>
        ),
        whatToDoForAGoodScore: (
            <ul className="list-disc pl-5 space-y-2">
                <li>
                    <span className="font-semibold">Make content easy to read:</span> Use clear language, short sentences, and appropriate vocabulary based on page type (articles vs product pages).
                </li>
                <li>
                    <span className="font-semibold">Prevent layout shifts and visual jumps:</span> Ensure images, headers, and dynamic elements don’t move unexpectedly while the page loads.
                </li>
                <li>
                    <span className="font-semibold">Optimize tap targets and text size:</span> Buttons, links, and form fields should be large enough to tap comfortably, with readable font sizes on all devices.
                </li>
                <li>
                    <span className="font-semibold">Avoid horizontal scrolling:</span> Pages should fit cleanly within the screen width at common mobile breakpoints.
                </li>
                <li>
                    <span className="font-semibold">Use non-intrusive overlays:</span> Avoid popups, modals, or banners that block content or prevent scrolling, especially on mobile.
                </li>
                <li>
                    <span className="font-semibold">Ensure strong above-the-fold content:</span> Important headings, visuals, and calls-to-action should be visible without scrolling.
                </li>
                <li>
                    <span className="font-semibold">Provide clear interaction feedback:</span> Buttons and links should visually respond when users hover, tap, or click.
                </li>
                <li>
                    <span className="font-semibold">Improve navigation clarity:</span> Keep navigation shallow, discoverable, and easy to access with clear menus, breadcrumbs, and search when applicable.
                </li>
                <li>
                    <span className="font-semibold">Show loading and processing feedback:</span> Use spinners, skeletons, or progress indicators so users know something is happening.
                </li>
                <li>
                    <span className="font-semibold">Maintain form usability:</span> Forms should have clear labels, validation feedback, and accessible error messages.
                </li>
            </ul>
        ),
        howThisScoreIsCalculated: (
            <div className="space-y-2">
                <p>We analyze multiple UX and usability signals related to readability, interaction, layout stability, and navigation behavior.</p>
                <p>Each factor is weighted based on how strongly it impacts real user frustration, especially on mobile. Issues that block interaction or readability have a greater influence on the final score.</p>
            </div>
        ),
        weightage: [
            { param: "Mobile & Viewport Configuration", weight: "40%" },
            { param: "Content Readability & Stability", weight: "20%" },
            { param: "Interaction & Forms", weight: "20%" },
            { param: "First Screen Experience (ATF)", weight: "10%" },
            { param: "Navigation & Structure", weight: "10%" }
        ]
    },

    // Conversion & Lead Flow
    CTA_Visibility: {
    title: "CTA Visibility",
    whatThisParameterIs: "Checks whether prominent Call-to-Action buttons are present and visible on the page.",
    whyItMatters: "CTAs guide users toward conversions like signups, purchases, or downloads.",
    thresholds: {
        good: "One or more visible CTAs present",
        poor: "No CTAs detected"
    },
    actualReasonsForFailure: [
        "No buttons or CTA links on the page",
        "CTAs hidden below the fold",
        "CTAs styled like normal text"
    ],
    howToOvercomeFailure: [
        "Add clear CTA buttons",
        "Place CTAs in hero and key sections",
        "Use contrasting button styles"
    ]
    },
    CTA_Clarity: {
    title: "CTA Text Clarity",
    whatThisParameterIs: "Evaluates whether CTA text uses clear, action-oriented language.",
    whyItMatters: "Clear CTAs reduce hesitation and increase click-through rates.",
    thresholds: {
        good: "CTAs use action verbs",
        poor: "CTAs are vague or generic"
    },
    actualReasonsForFailure: [
        "Generic text like 'Click here'",
        "Unclear value proposition"
    ],
    howToOvercomeFailure: [
        "Use action verbs like Buy, Get, Download",
        "Clearly state the benefit"
    ]
    },
    CTA_Contrast: {
    title: "CTA Color Contrast",
    whatThisParameterIs: "Checks whether CTA buttons have sufficient color contrast.",
    whyItMatters: "High contrast improves visibility and accessibility.",
    thresholds: {
        good: "Contrast ratio ≥ 4.5",
        poor: "Low contrast CTAs"
    },
    actualReasonsForFailure: [
        "CTA color blends with background",
        "Low contrast brand colors"
    ],
    howToOvercomeFailure: [
        "Increase contrast between text and background",
        "Test contrast using accessibility tools"
    ]
    },
    CTA_Crowding: {
    title: "CTA Crowding",
    whatThisParameterIs: "Checks whether too many CTAs appear at once.",
    whyItMatters: "Too many choices confuse users and reduce conversions.",
    thresholds: {
        good: "1–3 CTAs per section",
        needsImprovement: "Too many CTAs",
        poor: "No CTAs found"
    },
    actualReasonsForFailure: [
        "Multiple CTAs competing for attention"
    ],
    howToOvercomeFailure: [
        "Prioritize one primary CTA",
        "Reduce secondary CTAs"
    ]
    },
    CTA_Flow_Alignment: {
    title: "CTA Flow Alignment",
    whatThisParameterIs: "Checks whether CTAs appear at logical points in the user journey.",
    whyItMatters: "Well-timed CTAs match user intent and improve conversion.",
    thresholds: {
        good: "CTA placed mid-content",
        needsImprovement: "CTA too early or too late",
        poor: "No flow-based CTA found"
    },
    actualReasonsForFailure: [
        "CTA placed before context",
        "CTA hidden at page end"
    ],
    howToOvercomeFailure: [
        "Place CTAs after key information",
        "Match CTA to content intent"
    ]
    },
    Form_Presence: {
    title: "Lead Form Presence",
    whatThisParameterIs: "Checks whether lead capture forms are present on the page.",
    whyItMatters: "Forms are essential for collecting leads and inquiries.",
    thresholds: {
        good: "At least one form present",
        poor: "No forms found"
    },
    actualReasonsForFailure: [
        "No form elements on page"
    ],
    howToOvercomeFailure: [
        "Add signup or contact forms",
        "Embed lead capture sections"
    ]
    },
    Form_Length: {
    title: "Form Length Optimization",
    whatThisParameterIs: "Evaluates whether forms are short and user-friendly.",
    whyItMatters: "Shorter forms reduce friction and abandonment.",
    thresholds: {
        good: "Less than 7 fields",
        needsImprovement: "Too many fields"
    },
    actualReasonsForFailure: [
        "Excessive required fields"
    ],
    howToOvercomeFailure: [
        "Remove unnecessary fields",
        "Split long forms into steps"
    ]
    },
    Required_vs_Optional_Fields: {
    title: "Required vs Optional Fields",
    whatThisParameterIs: "Checks whether required and optional fields are clearly distinguished.",
    whyItMatters: "Clear labeling reduces user frustration.",
    thresholds: {
        good: "Required fields clearly marked",
        needsImprovement: "No distinction shown"
    },
    actualReasonsForFailure: [
        "Missing required indicators"
    ],
    howToOvercomeFailure: [
        "Mark required fields clearly",
        "Label optional fields explicitly"
    ]
    },
    Inline_Validation: {
    title: "Inline Form Validation",
    whatThisParameterIs: "Checks whether forms provide basic inline validation.",
    whyItMatters: "Immediate feedback reduces form errors.",
    thresholds: {
        good: "HTML5 or inline validation present",
        poor: "No validation detected"
    },
    actualReasonsForFailure: [
        "No required or pattern attributes"
    ],
    howToOvercomeFailure: [
        "Use HTML5 validation",
        "Add client-side validation"
    ]
    },
    Submit_Button_Clarity: {
    title: "Submit Button Clarity",
    whatThisParameterIs: "Checks whether submit buttons use clear action text.",
    whyItMatters: "Clear submit actions improve form completion.",
    thresholds: {
        good: "Clear submit text",
        needsImprovement: "Generic submit text"
    },
    actualReasonsForFailure: [
        "Buttons labeled Submit only"
    ],
    howToOvercomeFailure: [
        "Use action-based submit text"
    ]
    },
    Testimonials: {
    title: "Testimonials",
    whatThisParameterIs: "Checks for presence of customer testimonials.",
    whyItMatters: "Testimonials build trust and credibility.",
    thresholds: {
        good: "Testimonials found",
        poor: "No testimonials"
    },
    actualReasonsForFailure: [
        "No social proof sections"
    ],
    howToOvercomeFailure: [
        "Add testimonials or reviews"
    ]
    },
    Trust_Badges: {
    title: "Trust Badges",
    whatThisParameterIs: "Checks whether trust or security badges are displayed.",
    whyItMatters: "Trust badges reassure users about security.",
    thresholds: {
        good: "Trust badges present",
        poor: "No trust badges"
    },
    actualReasonsForFailure: [
        "No security or payment badges"
    ],
    howToOvercomeFailure: [
        "Add SSL, payment, or verification badges"
    ]
    },
    Contact_Info_Visibility: {
    title: "Contact Information Visibility",
    whatThisParameterIs: "Checks whether contact details are visible on the page.",
    whyItMatters: "Visible contact info increases trust and confidence.",
    thresholds: {
        good: "Email or phone visible",
        poor: "No contact info found"
    },
    actualReasonsForFailure: [
        "Contact details hidden or missing"
    ],
    howToOvercomeFailure: [
        "Add email or phone details",
        "Place contact info in footer or header"
    ]
    },
    Chatbot_Presence: {
    title: "Chatbot / Live Chat",
    whatThisParameterIs: "Checks whether a chatbot or live chat system is present.",
    whyItMatters: "Live chat helps users resolve doubts instantly.",
    thresholds: {
        good: "Chat system detected",
        needsImprovement: "No chat available"
    },
    actualReasonsForFailure: [
        "No chat widget installed"
    ],
    howToOvercomeFailure: [
        "Integrate live chat or chatbot tools"
    ]
    },
    Lead_Magnets: {
    title: "Lead Magnets",
    whatThisParameterIs: "Checks whether free resources are offered to capture leads.",
    whyItMatters: "Lead magnets incentivize users to share contact details.",
    thresholds: {
        good: "Lead magnets present",
        needsImprovement: "No lead magnets"
    },
    actualReasonsForFailure: [
        "No free offers or downloads"
    ],
    howToOvercomeFailure: [
        "Offer free guides, ebooks, or tools"
    ]
    },
    Scarcity_Urgency: {
    title: "Scarcity & Urgency",
    whatThisParameterIs: "Checks for urgency or scarcity messaging.",
    whyItMatters: "Urgency encourages quicker decision-making.",
    thresholds: {
        good: "Urgency signals present",
        needsImprovement: "No urgency messaging"
    },
    actualReasonsForFailure: [
        "No time-bound messaging"
    ],
    howToOvercomeFailure: [
        "Add limited-time offers",
        "Use urgency language carefully"
    ]
    },
    AutoFocus_Field: {
    title: "Autofocus Field",
    whatThisParameterIs: "Checks whether important form fields use the autofocus attribute.",
    whyItMatters: "Autofocus reduces friction and helps users start filling forms faster.",
    thresholds: {
        good: "Autofocus present on key input",
        acceptable: "Autofocus not used (optional best practice)"
    },
    actualReasonsForFailure: [
        "No input field uses autofocus"
    ],
    howToOvercomeFailure: [
        "Add autofocus to the first important input field"
    ]
    },
    MultiStep_Form_Progress: {
    title: "Multi-Step Form Progress",
    whatThisParameterIs: "Checks whether multi-step forms show progress indicators.",
    whyItMatters: "Progress indicators reduce form abandonment by setting expectations.",
    thresholds: {
        good: "Progress indicators detected",
        acceptable: "No multi-step form present"
    },
    actualReasonsForFailure: [
        "Multi-step form without progress UI"
    ],
    howToOvercomeFailure: [
        "Add step indicators or progress bars"
    ]
    },
    Reviews: {
    title: "User Reviews & Ratings",
    whatThisParameterIs: "Checks for visible user reviews or star ratings.",
    whyItMatters: "Reviews act as strong social proof and influence purchase decisions.",
    thresholds: {
        good: "Reviews or ratings detected",
        poor: "No reviews found"
    },
    actualReasonsForFailure: [
        "No visible review or rating section"
    ],
    howToOvercomeFailure: [
        "Display customer reviews or ratings",
        "Use schema markup for reviews"
    ]
    },
    Client_Logos: {
    title: "Client / Partner Logos",
    whatThisParameterIs: "Checks whether client or partner logos are displayed.",
    whyItMatters: "Logos build credibility and demonstrate trustworthiness.",
    thresholds: {
        good: "Client or partner logos found",
        needsImprovement: "No logos detected"
    },
    actualReasonsForFailure: [
        "No visual brand associations shown"
    ],
    howToOvercomeFailure: [
        "Add logos of clients or partners",
        "Place logos near testimonials or CTAs"
    ]
    },
    Case_Studies_Accessibility: {
    title: "Case Studies & Success Stories",
    whatThisParameterIs: "Checks whether case studies or success stories are accessible.",
    whyItMatters: "Case studies provide proof of results and reduce buyer hesitation.",
    thresholds: {
        good: "Case studies detected",
        needsImprovement: "No case studies found"
    },
    actualReasonsForFailure: [
        "No success story or case study content"
    ],
    howToOvercomeFailure: [
        "Add case studies with real results",
        "Link to detailed success stories"
    ]
    },
    Exit_Intent_Triggers: {
    title: "Exit-Intent Triggers",
    whatThisParameterIs: "Checks for exit-intent popups or modal triggers.",
    whyItMatters: "Exit-intent CTAs help recover abandoning users.",
    thresholds: {
        good: "Popup or modal detected",
        needsImprovement: "No exit-intent elements"
    },
    actualReasonsForFailure: [
        "No modal or popup markup found"
    ],
    howToOvercomeFailure: [
        "Add exit-intent popups carefully",
        "Offer incentives on exit"
    ]
    },
    Interactive_Elements: {
    title: "Interactive Elements",
    whatThisParameterIs: "Checks for interactive UI elements like sliders or tooltips.",
    whyItMatters: "Interactive elements increase engagement and time on site.",
    thresholds: {
        good: "Interactive components detected",
        needsImprovement: "No interactive elements"
    },
    actualReasonsForFailure: [
        "Static content only"
    ],
    howToOvercomeFailure: [
        "Add sliders, carousels, or tooltips"
    ]
    },
    Personalization: {
    title: "Personalization Signals",
    whatThisParameterIs: "Checks for personalized messaging on the page.",
    whyItMatters: "Personalization improves relevance and conversion rates.",
    thresholds: {
        good: "Personalization keywords detected",
        needsImprovement: "No personalization signals"
    },
    actualReasonsForFailure: [
        "Generic messaging for all users"
    ],
    howToOvercomeFailure: [
        "Add personalized greetings or recommendations"
    ]
    },
    Progress_Indicators: {
    title: "Progress Indicators",
    whatThisParameterIs: "Checks for visual progress indicators during user flows.",
    whyItMatters: "Progress indicators reduce uncertainty and improve UX.",
    thresholds: {
        good: "Progress UI detected",
        needsImprovement: "No progress indicators"
    },
    actualReasonsForFailure: [
        "Long flows without visual feedback"
    ],
    howToOvercomeFailure: [
        "Add step counters or progress bars"
    ]
    },
    Friendly_Error_Handling: {
    title: "Friendly Error Handling",
    whatThisParameterIs: "Checks whether forms provide basic error handling support.",
    whyItMatters: "Clear error handling prevents frustration and drop-offs.",
    thresholds: {
        good: "Basic error handling detected",
        needsImprovement: "No explicit error handling"
    },
    actualReasonsForFailure: [
        "No required attributes or validation hints"
    ],
    howToOvercomeFailure: [
        "Add validation messages",
        "Use required fields with guidance"
    ]
    },
    Microcopy_Clarity: {
    title: "Microcopy Clarity",
    whatThisParameterIs: "Checks whether inputs include helpful placeholder or helper text.",
    whyItMatters: "Good microcopy guides users and reduces mistakes.",
    thresholds: {
        good: "Placeholders/helper text present",
        needsImprovement: "Limited or missing microcopy"
    },
    actualReasonsForFailure: [
        "Inputs without guidance text"
    ],
    howToOvercomeFailure: [
        "Add meaningful placeholder text",
        "Include helper hints where needed"
    ]
    },
    Incentives_Displayed: {
    title: "Incentives & Offers",
    whatThisParameterIs: "Checks whether incentives like discounts or free offers are shown.",
    whyItMatters: "Incentives motivate users to convert faster.",
    thresholds: {
        good: "Incentives detected",
        needsImprovement: "No incentives visible"
    },
    actualReasonsForFailure: [
        "No offers or promotional messaging"
    ],
    howToOvercomeFailure: [
        "Highlight discounts or free offers",
        "Add incentive near CTAs"
    ]
    },
    Smooth_Scrolling: {
    title: "Smooth Scrolling",
    whatThisParameterIs: "Checks whether smooth scrolling or anchor navigation is used.",
    whyItMatters: "Smooth scrolling improves navigation experience.",
    thresholds: {
        good: "Smooth scrolling or anchors detected",
        needsImprovement: "No smooth scroll behavior"
    },
    actualReasonsForFailure: [
        "No anchor links or smooth scroll styles"
    ],
    howToOvercomeFailure: [
        "Enable CSS smooth scrolling",
        "Use anchor-based navigation"
    ]
    },
    Mobile_CTA_Adaptation: {
    title: "Mobile CTA Adaptation",
    whatThisParameterIs: "Checks whether CTAs are optimized for mobile devices.",
    whyItMatters: "Mobile-friendly CTAs improve tap accuracy and conversions.",
    thresholds: {
        good: "Mobile CTA styles detected",
        needsImprovement: "No mobile-specific CTA styling"
    },
    actualReasonsForFailure: [
        "CTAs too small for mobile"
    ],
    howToOvercomeFailure: [
        "Use larger CTA buttons on mobile",
        "Apply mobile-specific CTA classes"
    ]
    },
    MultiChannel_FollowUp: {
    title: "Multi-Channel Follow-Up",
    whatThisParameterIs: "Checks whether social follow-up channels are available.",
    whyItMatters: "Multiple channels increase user re-engagement.",
    thresholds: {
        good: "Social follow-up links present",
        needsImprovement: "No follow-up channels"
    },
    actualReasonsForFailure: [
        "No social media links"
    ],
    howToOvercomeFailure: [
        "Add social media follow links",
        "Encourage multi-channel engagement"
    ]
    },

    // Methodologies (Conversion & Lead Flow)
    Conversion_And_Lead_Flow_Methodology: {
        icon: TrendingUp,
        badge: "Conversion",
        title: "Conversion & Lead Flow",
        guideLink: "https://www.nngroup.com/articles/web-form-design/",
        whatThisMetricIs: (
            <div className="space-y-2">
                <p>Measures how effectively your website guides visitors toward taking meaningful actions — such as signing up, contacting you, or making a purchase.</p>
                <p>It evaluates call-to-action quality, lead capture forms, trust signals, engagement elements, and overall conversion flow clarity.</p>
            </div>
        ),
        whyItMatters: (
            <div className="space-y-2">
                <p>Traffic alone doesn’t grow a business — conversions do.</p>
                <p>If users can’t clearly see what to do next, don’t trust the page, or feel friction while taking action, they’ll leave. Strong conversion flow turns visitors into leads, customers, and revenue.</p>
            </div>
        ),
        whatToDoForAGoodScore: (
            <ul className="list-disc pl-5 space-y-4">
                <li>
                    <span className="font-semibold block mb-1">Improve Call-to-Action (CTA) effectiveness:</span>
                    <ul className="list-[circle] pl-5 space-y-1 text-sm">
                        <li>Make sure primary CTAs are visible and easy to find</li>
                        <li>Use clear, action-oriented language (e.g. “Get Started”, “Sign Up”)</li>
                        <li>Ensure CTA buttons stand out visually with strong contrast</li>
                        <li>Avoid cluttering the page with too many CTAs</li>
                        <li>Place CTAs where they naturally fit the user’s reading flow</li>
                    </ul>
                </li>
                <li>
                    <span className="font-semibold block mb-1">Optimize forms and lead capture:</span>
                    <ul className="list-[circle] pl-5 space-y-1 text-sm">
                        <li>Keep forms short and focused</li>
                        <li>Clearly mark required vs optional fields</li>
                        <li>Use descriptive submit buttons, not generic labels</li>
                        <li>Add inline validation to prevent form errors</li>
                        <li>Provide progress indicators for multi-step forms</li>
                        <li>Use autofocus to help users start faster</li>
                    </ul>
                </li>
                <li>
                    <span className="font-semibold block mb-1">Build trust and credibility:</span>
                    <ul className="list-[circle] pl-5 space-y-1 text-sm">
                        <li>Display testimonials, reviews, or ratings</li>
                        <li>Show trust badges or security indicators where relevant</li>
                        <li>Highlight client logos or case studies</li>
                        <li>Make contact information easy to find</li>
                    </ul>
                </li>
                <li>
                    <span className="font-semibold block mb-1">Support engagement and follow-through:</span>
                    <ul className="list-[circle] pl-5 space-y-1 text-sm">
                        <li>Offer lead magnets like guides or downloads</li>
                        <li>Use chat or live support where appropriate</li>
                        <li>Add subtle incentives or offers</li>
                        <li>Avoid aggressive popups, but support exit-intent thoughtfully</li>
                        <li>Include social or multi-channel follow-up options</li>
                    </ul>
                </li>
                <li>
                    <span className="font-semibold block mb-1">Reduce friction during interaction:</span>
                    <ul className="list-[circle] pl-5 space-y-1 text-sm">
                        <li>Provide clear microcopy and helper text</li>
                        <li>Use friendly error handling</li>
                        <li>Show progress or loading indicators</li>
                        <li>Ensure CTAs and forms are optimized for mobile users</li>
                    </ul>
                </li>
            </ul>
        ),
        howThisScoreIsCalculated: (
            <div className="space-y-2">
                <p>We evaluate multiple conversion-focused signals across CTAs, forms, trust elements, and user engagement patterns.</p>
                <p>Each area is weighted based on its impact on real conversion behavior. Strong signals earn full credit, partial optimizations earn partial credit, and missing elements reduce the score.</p>
                <p>The final score reflects how easy it is for a visitor to move from interest to action.</p>
            </div>
        ),
        weightage: [
            { param: "Form Optimization", weight: "25%" },
            { param: "Call-to-Action (CTA) Strategy", weight: "20%" },
            { param: "Trust & Social Proof", weight: "15%" },
            { param: "Engagement Experience", weight: "15%" },
            { param: "Lead Capture Mechanisms", weight: "15%" },
            { param: "Mobile Adaptation", weight: "10%" }
        ]
    },

    // AIO Readiness
    Structured_Data: {
    title: "Structured Data",
    whatThisParameterIs: "Checks whether valid structured data (JSON-LD) is present on the page.",
    whyItMatters: "Structured data helps AI systems and search engines understand page content more accurately.",
    thresholds: {
        good: "Valid JSON-LD structured data detected",
        poor: "No valid structured data found"
    },
    actualReasonsForFailure: [
        "No JSON-LD scripts present",
        "Invalid or malformed JSON-LD"
    ],
    howToOvercomeFailure: [
        "Add schema.org structured data",
        "Validate structured data using schema testing tools"
    ]
    },
    Content_NLP_Friendly: {
    title: "NLP-Friendly Content Structure",
    whatThisParameterIs: "Checks whether content uses semantic HTML and logical structure for NLP systems.",
    whyItMatters: "Well-structured content improves AI understanding and content extraction.",
    thresholds: {
        good: "Semantic tags, headings, and paragraphs detected",
        needsImprovement: "Missing key semantic elements"
    },
    actualReasonsForFailure: [
        "Missing semantic HTML tags",
        "Improper heading hierarchy",
        "Content not wrapped in paragraphs or lists"
    ],
    howToOvercomeFailure: [
        "Use semantic tags like article, section, main",
        "Maintain proper heading hierarchy",
        "Structure content with paragraphs and lists"
    ]
    },
    Fast_Page_Load: {
    title: "Fast Page Load (AI Crawlers)",
    whatThisParameterIs: "Measures whether the page loads quickly enough for AI crawlers.",
    whyItMatters: "Fast-loading pages are crawled more efficiently by AI and search bots.",
    thresholds: {
        good: "Page load ≤ 2 seconds",
        needsImprovement: "Page load > 2 seconds"
    },
    actualReasonsForFailure: [
        "Heavy scripts or assets",
        "Slow server response"
    ],
    howToOvercomeFailure: [
        "Optimize assets and scripts",
        "Improve server performance"
    ]
    },
    API_Data_Access: {
    title: "API / Data Access",
    whatThisParameterIs: "Checks whether APIs or machine-readable data endpoints are exposed.",
    whyItMatters: "AI systems rely on APIs and structured endpoints to fetch data.",
    thresholds: {
        good: "API or data endpoints detected",
        poor: "No API access points found"
    },
    actualReasonsForFailure: [
        "No API endpoints referenced",
        "No machine-readable data exposed"
    ],
    howToOvercomeFailure: [
        "Expose REST or GraphQL APIs",
        "Provide JSON endpoints or manifests"
    ]
    },
    Keywords_Entities_Annotated: {
    title: "Keyword & Entity Annotation",
    whatThisParameterIs: "Checks whether keywords and entities are defined via headings, alt text, or metadata.",
    whyItMatters: "Explicit entities improve AI understanding of content topics.",
    thresholds: {
        good: "Keywords/entities detected",
        poor: "No keyword or entity signals found"
    },
    actualReasonsForFailure: [
        "Missing headings",
        "Images without alt text",
        "No keyword metadata"
    ],
    howToOvercomeFailure: [
        "Use descriptive headings",
        "Add alt text to images",
        "Annotate key entities clearly"
    ]
    },
    Metadata_Complete: {
    title: "Metadata Completeness",
    whatThisParameterIs: "Checks whether essential SEO and social metadata is present.",
    whyItMatters: "Metadata helps AI summarize and contextualize pages.",
    thresholds: {
        good: "Most metadata present",
        poor: "Essential metadata missing"
    },
    actualReasonsForFailure: [
        "Missing meta description",
        "Missing Open Graph or Twitter tags"
    ],
    howToOvercomeFailure: [
        "Add title and description tags",
        "Include OG and Twitter metadata"
    ]
    },
    Content_Updated_Regularly: {
    title: "Content Freshness",
    whatThisParameterIs: "Checks whether the page shows recent content updates.",
    whyItMatters: "Fresh content signals relevance to AI systems.",
    thresholds: {
        good: "Updated within last 30 days",
        needsImprovement: "Content may be outdated"
    },
    actualReasonsForFailure: [
        "No last-modified date found",
        "Old content updates"
    ],
    howToOvercomeFailure: [
        "Update content regularly",
        "Expose last-modified metadata"
    ]
    },
    Dynamic_Content_Available: {
    title: "Dynamic Content Capability",
    whatThisParameterIs: "Checks whether the page supports dynamic or interactive content loading.",
    whyItMatters: "Dynamic content enables personalized and AI-driven experiences.",
    thresholds: {
        good: "Dynamic content indicators found",
        poor: "No dynamic content detected"
    },
    actualReasonsForFailure: [
        "Static-only content",
        "No client-side rendering or APIs"
    ],
    howToOvercomeFailure: [
        "Implement fetch or API-based updates",
        "Use modern JS frameworks where needed"
    ]
    },
    Behavior_Tracking_Implemented: {
    title: "Behavior Tracking",
    whatThisParameterIs: "Checks whether user behavior tracking tools are installed.",
    whyItMatters: "Behavior data feeds AI-driven optimization and insights.",
    thresholds: {
        good: "Analytics or tracking tools detected",
        poor: "No tracking detected"
    },
    actualReasonsForFailure: [
        "No analytics scripts installed"
    ],
    howToOvercomeFailure: [
        "Integrate analytics tools like GA or Hotjar"
    ]
    },
    Segmentation_Profiling_Ready: {
    title: "User Segmentation Readiness",
    whatThisParameterIs: "Checks whether user profiling or segmentation signals exist.",
    whyItMatters: "Segmentation enables AI-based personalization.",
    thresholds: {
        good: "Segmentation indicators detected",
        poor: "No segmentation signals"
    },
    actualReasonsForFailure: [
        "No user identifiers",
        "No segment-related data attributes"
    ],
    howToOvercomeFailure: [
        "Implement user profiling",
        "Add segmentation data attributes"
    ]
    },
    Internal_Linking_AI_Friendly: {
    title: "AI-Friendly Internal Linking",
    whatThisParameterIs: "Checks whether internal links use descriptive anchor text.",
    whyItMatters: "Descriptive links help AI understand site structure.",
    thresholds: {
        good: "Descriptive internal links detected",
        needsImprovement: "Links lack descriptive text"
    },
    actualReasonsForFailure: [
        "Generic anchor text like 'click here'"
    ],
    howToOvercomeFailure: [
        "Use descriptive anchor text",
        "Improve internal linking strategy"
    ]
    },
    Duplicate_Content_Detection_Ready: {
    title: "Duplicate Content Protection",
    whatThisParameterIs: "Checks whether canonical or noindex signals are present.",
    whyItMatters: "Prevents AI confusion due to duplicate content.",
    thresholds: {
        good: "Canonical or noindex present",
        poor: "No duplication protection"
    },
    actualReasonsForFailure: [
        "Missing canonical tag",
        "No robots directives"
    ],
    howToOvercomeFailure: [
        "Add canonical URLs",
        "Use meta robots where appropriate"
    ]
    }, 
    Multilingual_Support: {
    title: "Multilingual Support",
    whatThisParameterIs: "Checks whether language signals or hreflang tags are present.",
    whyItMatters: "Language signals help AI serve correct audiences.",
    thresholds: {
        good: "Language or hreflang detected",
        poor: "No multilingual signals"
    },
    actualReasonsForFailure: [
        "Missing lang attribute",
        "No hreflang tags"
    ],
    howToOvercomeFailure: [
        "Set HTML lang attribute",
        "Add hreflang links"
    ]
    },
    Event_Goal_Tracking_Integrated: {
    title: "Event & Goal Tracking",
    whatThisParameterIs: "Checks whether events or goals are tracked.",
    whyItMatters: "Event data feeds AI optimization loops.",
    thresholds: {
        good: "Event tracking detected",
        poor: "No event tracking"
    },
    actualReasonsForFailure: [
        "No event scripts or handlers"
    ],
    howToOvercomeFailure: [
        "Implement event tracking",
        "Track key user actions"
    ]
    },
    AB_Testing_Ready: {
    title: "A/B Testing Readiness",
    whatThisParameterIs: "Checks whether A/B testing tools are installed.",
    whyItMatters: "A/B testing enables AI-driven experimentation.",
    thresholds: {
        good: "A/B testing tools detected",
        poor: "No A/B testing found"
    },
    actualReasonsForFailure: [
        "No experimentation tools installed"
    ],
    howToOvercomeFailure: [
        "Integrate A/B testing platforms"
    ]
    },
    User_Feedback_Loops_Present: {
    title: "User Feedback Loops",
    whatThisParameterIs: "Checks whether feedback collection mechanisms exist.",
    whyItMatters: "Feedback improves AI learning and optimization.",
    thresholds: {
        good: "Feedback tools or forms detected",
        poor: "No feedback mechanisms"
    },
    actualReasonsForFailure: [
        "No feedback forms or tools"
    ],
    howToOvercomeFailure: [
        "Add surveys or feedback widgets",
        "Collect user feedback continuously"
    ]
    },

    // Methodologies (AIO Readiness)
    AIO_Readiness_Methodologies: {
        icon: Bot,
        badge: "AIO Readiness",
        title: "AI Optimization (AIO) Readiness",
        guideLink: "https://developers.google.com/search/docs/appearance/structured-data",
        whatThisMetricIs: (
            <div className="space-y-2">
                <p>Measures how well your website is structured, understood, and usable by modern AI systems — including search engines, AI assistants, recommendation engines, and automation tools.</p>
                <p>It evaluates whether your content, data, and tracking signals are accessible, interpretable, and ready for AI-driven discovery and optimization.</p>
            </div>
        ),
        whyItMatters: (
            <div className="space-y-4">
                <p>AI systems increasingly decide what content is surfaced, summarized, recommended, or ignored.</p>

                <div>
                    <span className="font-semibold block mb-1">Websites that are AI-ready:</span>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Are easier for search and AI assistants to understand</li>
                        <li>Appear more accurately in AI-generated answers</li>
                        <li>Enable smarter personalization and automation</li>
                        <li>Adapt faster to future AI-driven platforms</li>
                    </ul>
                </div>

                <p className="font-medium">AI readiness is quickly becoming as important as SEO.</p>
            </div>
        ),
        whatToDoForAGoodScore: (
            <ul className="list-disc pl-5 space-y-4">
                <li>
                    <span className="font-semibold block mb-1">Improve AI understanding of your content:</span>
                    <ul className="list-[circle] pl-5 space-y-1 text-sm">
                        <li>Use structured data (Schema) to clearly describe pages and entities</li>
                        <li>Organize content with semantic HTML and proper headings</li>
                        <li>Ensure text content is clear, well-structured, and machine-readable</li>
                    </ul>
                </li>
                <li>
                    <span className="font-semibold block mb-1">Strengthen metadata and content signals:</span>
                    <ul className="list-[circle] pl-5 space-y-1 text-sm">
                        <li>Provide complete metadata for search and sharing platforms</li>
                        <li>Clearly annotate key topics using headings, image alt text, and page structure</li>
                        <li>Keep content fresh and updated when relevant</li>
                    </ul>
                </li>
                <li>
                    <span className="font-semibold block mb-1">Enable AI-friendly data access:</span>
                    <ul className="list-[circle] pl-5 space-y-1 text-sm">
                        <li>Expose content and data through APIs or structured endpoints</li>
                        <li>Avoid blocking important content behind scripts or inaccessible formats</li>
                        <li>Ensure pages load quickly for automated crawlers</li>
                    </ul>
                </li>
                <li>
                    <span className="font-semibold block mb-1">Support personalization and learning:</span>
                    <ul className="list-[circle] pl-5 space-y-1 text-sm">
                        <li>Implement behavior tracking to understand user interactions</li>
                        <li>Enable segmentation and profiling signals</li>
                        <li>Use dynamic content patterns where appropriate</li>
                    </ul>
                </li>
                <li>
                    <span className="font-semibold block mb-1">Improve AI-driven discovery and indexing:</span>
                    <ul className="list-[circle] pl-5 space-y-1 text-sm">
                        <li>Use descriptive internal links, not generic anchors</li>
                        <li>Prevent duplicate content with canonical or indexing controls</li>
                        <li>Support multilingual discovery when targeting multiple regions</li>
                    </ul>
                </li>
                <li>
                    <span className="font-semibold block mb-1">Close the optimization feedback loop:</span>
                    <ul className="list-[circle] pl-5 space-y-1 text-sm">
                        <li>Track meaningful events and goals</li>
                        <li>Support A/B testing or experimentation</li>
                        <li>Collect user feedback to guide continuous improvement</li>
                    </ul>
                </li>
            </ul>
        ),
        howThisScoreIsCalculated: (
            <div className="space-y-2">
                <p>We analyze multiple AI-readiness signals across content structure, metadata quality, data accessibility, tracking, and optimization infrastructure.</p>
                <p>Each area is weighted by its importance to AI understanding and automation. Strong signals earn full credit, partial readiness earns partial credit, and missing foundations reduce the score.</p>
                <p>An overall AI Readiness badge indicates whether your site meets a minimum baseline for AI compatibility.</p>
            </div>
        ),
        weightage: [
            { param: "Technical AI Foundation", weight: "35%" },
            { param: "Content NLP Readiness", weight: "25%" },
            { param: "Analytics & Tracking", weight: "25%" },
            { param: "Advanced Capabilities", weight: "15%" }
        ]
    },

};

export default InfoDetails;
