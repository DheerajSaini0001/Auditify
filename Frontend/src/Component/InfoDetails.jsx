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
        whatThisMetricIs: "Measures the difference in brightness between text and its background.",
        whyItMatters: "Text that blends into the background is impossible to read for many users, especially on mobile screens in sunlight.",
        thresholds: "Good: Ratio ≥ 4.5:1 (AA), Poor: Ratio < 3:1",
        actualReasonsForFailure: "Text color is too light or background is too dark (or vice versa), leading to low contrast ratio.",
        howToOvercomeFailure: "Darken text color or lighten background color to ensure sufficient contrast (WCAG AA standard)."
    },
    Focus_Order: {
        title: "Focus Order",
        whatThisMetricIs: "The sequence in which elements receive focus when tabbing through the page.",
        whyItMatters: "If the 'Tab' key jumps around randomly, keyboard users get lost and cannot navigate your site.",
        thresholds: "Good: Logical Order, Poor: Random Jumps",
        actualReasonsForFailure: "DOM order does not match visual order, causing tab focus to jump unexpectedly.",
        howToOvercomeFailure: "Rearrange HTML elements to match the visual layout or use CSS Flexbox/Grid carefully to maintain order."
    },
    Focusable_Content: {
        title: "Focusable Content",
        whatThisMetricIs: "Ensures all interactive elements (buttons, links, inputs) can be reached via keyboard.",
        whyItMatters: "If a button can't be selected with a keyboard, it effectively doesn't exist for many users.",
        thresholds: "Good: All Reachable, Poor: Unreachable Elements",
        actualReasonsForFailure: "Using <div> or <span> as buttons without tabindex='0'.",
        howToOvercomeFailure: "Use semantic <button> and <a> tags, or add tabindex='0' to custom interactive elements."
    },
    Tab_Index: {
        title: "Tab Index",
        whatThisMetricIs: "The tabindex attribute controls whether an element is focusable.",
        whyItMatters: "Positive tab values break the natural flow, forcing users to jump around unpredictably.",
        thresholds: "Good: 0 or -1, Poor: Positive Values (>0)",
        actualReasonsForFailure: "Using positive tabindex values (e.g., tabindex='1') which overrides natural DOM order.",
        howToOvercomeFailure: "Remove positive tabindex values. Rely on DOM order or use tabindex='0' / '-1' only."
    },
    Interactive_Element_Affordance: {
        title: "Clickable Targets",
        whatThisMetricIs: "Visual indicators that an element is interactive (e.g., cursor pointer, hover styles).",
        whyItMatters: "Users shouldn't have to guess what's clickable. Confusion leads to frustration.",
        thresholds: "Good: Visible States, Poor: No Visual Feedback",
        actualReasonsForFailure: "Removing default outline without replacing it, or missing hover/focus styles.",
        howToOvercomeFailure: "Ensure all interactive elements have visible :hover and :focus states (e.g., change color, underline)."
    },
    Label: {
        title: "Form Labels",
        whatThisMetricIs: "HTML labels associated with form input fields.",
        whyItMatters: "Without labels, a screen reader user has no idea what information to type into a form field.",
        thresholds: "Good: All Inputs Labeled, Poor: Missing Labels",
        actualReasonsForFailure: "Form inputs missing associated <label> elements or aria-label attributes.",
        howToOvercomeFailure: "Link a <label> to every input using the 'for' attribute, or use aria-label for visual-only designs."
    },
    Aria_Allowed_Attr: {
        title: "ARIA Attributes",
        whatThisMetricIs: "Checks if ARIA attributes used are valid for the element's role.",
        whyItMatters: "Using the wrong accessibility code breaks the experience instead of fixing it.",
        thresholds: "Good: Valid Attributes, Poor: Invalid/Unsupported",
        actualReasonsForFailure: "Using ARIA attributes that are not supported by the element's role (e.g., aria-label on a span).",
        howToOvercomeFailure: "Only use ARIA attributes supported by the HTML element or its assigned role."
    },
    Aria_Roles: {
        title: "ARIA Roles",
        whatThisMetricIs: "Attributes that define what an element is (e.g., role='button').",
        whyItMatters: "Misleading roles confuse screen readers (e.g., telling a user an image is a button).",
        thresholds: "Good: Valid Roles, Poor: Abstract/Invalid Roles",
        actualReasonsForFailure: "Using abstract roles or misspelling role names.",
        howToOvercomeFailure: "Use standard HTML5 elements (nav, main, button) where possible, or use valid WAI-ARIA roles."
    },
    Aria_Hidden_Focus: {
        title: "Hidden Focus",
        whatThisMetricIs: "Ensures elements hidden with aria-hidden='true' are not focusable.",
        whyItMatters: "Focusing on a hidden element confuses users as they cannot see where they are.",
        thresholds: "Good: Hidden is Unfocusable, Poor: Focus Trapped",
        actualReasonsForFailure: "Interactive elements (links, buttons) have aria-hidden='true' but are still in tab order.",
        howToOvercomeFailure: "Add tabindex='-1' to hidden elements or use 'display: none' / 'visibility: hidden' to remove them from tab order."
    },
    Image_Alt: {
        title: "Alternative Text",
        whatThisMetricIs: "Text alternatives for non-text content (images).",
        whyItMatters: "Blind users rely on descriptions to understand images. Without them, they miss context.",
        thresholds: "Good: Present, Poor: Missing",
        actualReasonsForFailure: "Image tags missing the 'alt' attribute.",
        howToOvercomeFailure: "Add descriptive 'alt' text to every image tag that conveys meaning."
    },
    Skip_Links: {
        title: "Skip Links",
        whatThisMetricIs: "Hidden links at the top of the page to jump to main content.",
        whyItMatters: "Imagine listening to the entire main menu on every single page load. Skip links let users jump to the content.",
        thresholds: "Good: Present & Working, Poor: Missing",
        actualReasonsForFailure: "No link exists to bypass the main navigation menu.",
        howToOvercomeFailure: "Add a 'Skip to Content' link as the first focusable element on the page."
    },
    Landmarks: {
        title: "Landmarks",
        whatThisMetricIs: "Semantic regions (main, nav, banner, complementary).",
        whyItMatters: "Landmarks act like a table of contents, letting screen readers jump between major sections.",
        thresholds: "Good: Landmarks Defined, Poor: No Regions",
        actualReasonsForFailure: "Page lacks structural tags like <main>, <nav>, or <header>.",
        howToOvercomeFailure: "Use HTML5 landmark elements to clearly define the main regions of your page."
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
        title: "HTTPS Encryption",
        whatThisMetricIs: "Hypertext Transfer Protocol Secure (HTTPS) uses TLS to encrypt communication.",
        whyItMatters: "Prevents eavesdropping. Without it, anyone on the network can read the data your users send.",
        whatToDoForAGoodScore: "Install an SSL certificate and force your site to load over 'https://'.",
        howThisScoreIsCalculated: "We check if your site is securely served over an encrypted connection."
    },
    SSL: {
        title: "SSL Certificate",
        whatThisMetricIs: "Verifies that the website has a valid, trusted SSL/TLS certificate.",
        whyItMatters: "Verifies your identity. Users trust the padlock icon; a warning scares them away immediately.",
        whatToDoForAGoodScore: "Ensure your security certificate is valid, trusted, and up to date.",
        howThisScoreIsCalculated: "We verify the validity and chain of trust of your SSL certificate."
    },
    SSL_Expiry: {
        title: "SSL Expiry",
        whatThisMetricIs: "Checks the expiration date of the SSL certificate.",
        whyItMatters: "An expired certificate triggers a 'Not Secure' warning, blocking users from entering your site.",
        thresholds: "Good: > 30 Days, Poor: < 30 Days or Expired",
        actualReasonsForFailure: "Certificate is expired or expiring very soon (within 30 days).",
        howToOvercomeFailure: "Set up auto-renewal (e.g., Certbot) or renew your certificate manually before it expires."
    },
    HSTS: {
        title: "HSTS Header",
        whatThisMetricIs: "HTTP Strict Transport Security tells browsers to ONLY use HTTPS.",
        whyItMatters: "Stops attacks that try to downgrade your secure connection to an insecure one.",
        thresholds: "Good: Enabled (max-age > 1yr), Poor: Missing",
        actualReasonsForFailure: "Header missing or max-age is too short.",
        howToOvercomeFailure: "Add 'Strict-Transport-Security' header with 'max-age=31536000; includeSubDomains'."
    },
    TLS_Version: {
        title: "TLS Protocol",
        whatThisMetricIs: "Checks the version of Transport Layer Security protocol used.",
        whyItMatters: "Old security protocols have holes that hackers can exploit.",
        thresholds: "Good: TLS 1.2/1.3, Poor: TLS 1.0/1.1 or SSL",
        actualReasonsForFailure: "Server supports deprecated protocols (TLS 1.0, 1.1) which are vulnerable.",
        howToOvercomeFailure: "Disable TLS 1.0/1.1 in your server configuration and enforce TLS 1.2 or higher."
    },
    X_Frame_Options: {
        title: "X-Frame-Options",
        whatThisMetricIs: "Controls whether the site can be embedded in an <iframe>.",
        whyItMatters: "Prevents hackers from putting your site inside an invisible frame to trick users (Clickjacking).",
        thresholds: "Good: DENY/SAMEORIGIN, Poor: Missing",
        actualReasonsForFailure: "Header missing, allowing the site to be embedded in malicious iframes.",
        howToOvercomeFailure: "Set 'X-Frame-Options' header to 'DENY' or 'SAMEORIGIN'."
    },
    CSP: {
        title: "Content Security Policy",
        whatThisMetricIs: "Whitelists sources of approved content (scripts, styles, images).",
        whyItMatters: "A strong shield that stops unauthorized scripts from running on your page.",
        thresholds: "Good: Strong Rules, Poor: Missing/Weak",
        actualReasonsForFailure: "Header missing or configured with wildcards used too broadly.",
        howToOvercomeFailure: "Implement a restrictive 'Content-Security-Policy' header allowing only trusted domains."
    },
    X_Content_Type_Options: {
        title: "MIME Sniffing",
        whatThisMetricIs: "Prevents browsers from interpreting files as a different MIME type.",
        whyItMatters: "Stops browsers from being tricked into running a file as a script when it shouldn't be.",
        thresholds: "Good: nosniff, Poor: Missing",
        actualReasonsForFailure: "Header missing.",
        howToOvercomeFailure: "Add 'X-Content-Type-Options: nosniff' header."
    },
    Cookies_Secure: {
        title: "Secure Cookies",
        whatThisMetricIs: "Ensures cookies are only sent over encrypted HTTPS connections.",
        whyItMatters: "Ensures cookies (like login sessions) are only sent over secure channels.",
        thresholds: "Good: Secure Flag Set, Poor: Missing",
        actualReasonsForFailure: "Cookies set without the 'Secure' flag.",
        howToOvercomeFailure: "Set the 'Secure' flag on all cookies (requires HTTPS)."
    },
    Cookies_HttpOnly: {
        title: "HttpOnly Cookies",
        whatThisMetricIs: "Prevents client-side scripts (JavaScript) from accessing cookies.",
        whyItMatters: "Prevents malicious scripts from stealing your users' login cookies.",
        thresholds: "Good: HttpOnly Flag Set, Poor: Missing",
        actualReasonsForFailure: "Cookies set without the 'HttpOnly' flag, making them accessible to JS.",
        howToOvercomeFailure: "Set the 'HttpOnly' flag on session cookies to prevent XSS theft."
    },
    Google_Safe_Browsing: {
        title: "Safe Browsing",
        whatThisMetricIs: "Checks if the domain is listed in Google's database of unsafe sites.",
        whyItMatters: "If Google thinks your site is unsafe, they will show a giant red warning screen to users.",
        thresholds: "Good: Clean, Poor: Listed",
        actualReasonsForFailure: "Domain is flagged for hosting malware or phishing.",
        howToOvercomeFailure: "Clean your site of malware/phishing content and request a review in Google Search Console."
    },
    Blacklist: {
        title: "Domain Blacklist",
        whatThisMetricIs: "Checks multiple DNS blacklists (spam, malware).",
        whyItMatters: "Being blacklisted ruins your reputation and causes your emails to go to spam.",
        thresholds: "Good: Not Listed, Poor: Listed",
        actualReasonsForFailure: "Domain found on one or more DNSBLs (spam/malware lists).",
        howToOvercomeFailure: "Identify the cause (e.g., infected site, spam emails), fix it, and request delisting."
    },
    Malware_Scan: {
        title: "Malware Detection",
        whatThisMetricIs: "Scans page content for known malicious signatures or obfuscated code.",
        whyItMatters: "Malware steals user data and destroys trust. It can get your site banned.",
        thresholds: "Good: Clean, Poor: Infected",
        actualReasonsForFailure: "Malicious scripts, iframes, or obfuscated code detected on the page.",
        howToOvercomeFailure: "Remove malicious code, update all plugins/themes, and restore from a clean backup."
    },
    SQLi_Exposure: {
        title: "SQL Injection",
        whatThisMetricIs: "Checks if inputs can manipulate database queries.",
        whyItMatters: "A major hole that lets attackers steal or delete your entire database.",
        thresholds: "Good: Protected, Poor: Vulnerable",
        actualReasonsForFailure: "Form inputs or URL parameters perform database operations without sanitization.",
        howToOvercomeFailure: "Use prepared statements (parameterized queries) for all database interaction."
    },
    XSS: {
        title: "XSS Protection",
        whatThisMetricIs: "Checks if user input is properly escaped before rendering.",
        whyItMatters: "Allows attackers to inject malicious scripts that can steal accounts or deface your site.",
        thresholds: "Good: Protected, Poor: Vulnerable",
        actualReasonsForFailure: "User input is reflected on the page without proper escaping/sanitization.",
        howToOvercomeFailure: "Sanitize and escape all user inputs before rendering them to HTML or JavaScript."
    },
    Cookie_Consent: {
        title: "Cookie Consent",
        whatThisMetricIs: "Verifies if a cookie consent banner is present.",
        whyItMatters: "Required by law (GDPR/CCPA). Ignoring it can lead to heavy fines.",
        thresholds: "Good: Banner Present, Poor: Missing",
        actualReasonsForFailure: "No cookie consent mechanism detected on the page.",
        howToOvercomeFailure: "Implement a Consent Management Platform (CMP) or simple banner."
    },
    Privacy_Policy: {
        title: "Privacy Policy",
        whatThisMetricIs: "Checks for the existence of a privacy policy page.",
        whyItMatters: "Building trust is key. Users and laws require you to explain how you handle data.",
        thresholds: "Good: Page Found, Poor: Missing",
        actualReasonsForFailure: "No link to a Privacy Policy page found in footer/navigation.",
        howToOvercomeFailure: "Create a clear Privacy Policy page and link to it globally (usually in the footer)."
    },
    Forms_Use_HTTPS: {
        title: "Secure Forms",
        whatThisMetricIs: "Ensures login and contact forms submit data over HTTPS.",
        whyItMatters: "Sending passwords or messages over an insecure connection allows hackers to read them.",
        thresholds: "Good: Secure Action, Poor: Insecure Action",
        actualReasonsForFailure: "Form 'action' attribute points to an HTTP URL.",
        howToOvercomeFailure: "Update all form action URLs to use HTTPS."
    },
    GDPR_CCPA: {
        title: "GDPR/CCPA",
        whatThisMetricIs: "Checks for signs of data privacy regulation compliance.",
        whyItMatters: "Protects user rights. Users want to know they can control their personal data.",
        thresholds: "Good: Compliant links, Poor: Missing",
        actualReasonsForFailure: "Missing 'Do Not Sell My Info' or data deletion request mechanisms.",
        howToOvercomeFailure: "Add clear links/forms for users to exercise their data rights under GDPR/CCPA."
    },
    Data_Collection: {
        title: "Data Collection",
        whatThisMetricIs: "Identifies if the site collects sensitive data.",
        whyItMatters: "Users are wary of giving info. Transparency increases likelihood of conversion.",
        thresholds: "Good: Transparent, Poor: Opaque",
        actualReasonsForFailure: "Collecting sensitive data (email, phone, location) without clear purpose or disclosure.",
        howToOvercomeFailure: "For every data point collected, explain 'why' in the UI and link to your Privacy Policy."
    },
    Weak_Default_Credentials: {
        title: "Default Credentials",
        whatThisMetricIs: "Checks for exposed default login paths or credentials.",
        whyItMatters: "Leaving default passwords (like 'admin') is the easiest way to get hacked.",
        whatToDoForAGoodScore: "Change all default usernames and passwords immediately after installation.",
        howThisScoreIsCalculated: "We check if common default admin pages are accessible."
    },
    MFA_Enabled: {
        title: "MFA Status",
        whatThisMetricIs: "Checks if MFA is enforced for sensitive areas.",
        whyItMatters: "The single most effective way to prevent unauthorized account access.",
        whatToDoForAGoodScore: "Enable Two-Factor Authentication (2FA) for all administrator accounts.",
        howThisScoreIsCalculated: "We look for signs that extra login security is required for admin areas."
    },
    Admin_Panel_Public: {
        title: "Admin Exposure",
        whatThisMetricIs: "Checks if admin login pages are publicly accessible.",
        whyItMatters: "Exposing your login page to the whole world invites brute-force attacks.",
        whatToDoForAGoodScore: "Hide your admin login page or restrict access to trusted IP addresses.",
        howThisScoreIsCalculated: "We check if your administrative login page is visible to the public."
    },
    HTML_Doctype: {
        title: "Doctype",
        whatThisMetricIs: "Specifies the HTML version to the browser.",
        whyItMatters: "Tells the browser which version of code you are using. Prevents layout errors.",
        whatToDoForAGoodScore: "Start every HTML file with the standard DOCTYPE declaration.",
        howThisScoreIsCalculated: "We verify that your document starts with the correct type declaration."
    },
    Character_Encoding: {
        title: "Charset",
        whatThisMetricIs: "Specifies how characters are represented.",
        whyItMatters: "Without this, special characters (like emojis or accents) will look like broken symbols.",
        whatToDoForAGoodScore: "Set your encoding to 'UTF-8' so text displays correctly in all languages.",
        howThisScoreIsCalculated: "We check if you have declared the correct text character set."
    },
    Browser_Console_Errors: {
        title: "Console Errors",
        whatThisMetricIs: "Checks for JavaScript errors in the browser console.",
        whyItMatters: "Errors in the code indicate broken features that frustrate users.",
        whatToDoForAGoodScore: "Check your browser console and fix any red error messages.",
        howThisScoreIsCalculated: "We monitor the browser console for errors that occur while the page loads."
    },
    Geolocation_Request: {
        title: "Geolocation",
        whatThisMetricIs: "Checks if the site requests location data immediately on load.",
        whyItMatters: "Asking for location immediately annoys users and leads to high 'Block' rates.",
        whatToDoForAGoodScore: "Only ask for location when the user actually taps a button (like 'Find Store').",
        howThisScoreIsCalculated: "We check if your site requests location access without user interaction."
    },
    Input_Paste_Allowed: {
        title: "Paste Check",
        whatThisMetricIs: "Checks if pasting is blocked in password fields.",
        whyItMatters: "Blocking paste forces users to type long passwords, leading to typos and frustration.",
        whatToDoForAGoodScore: "Allow users to paste into password fields. It improves security (password managers).",
        howThisScoreIsCalculated: "We verify that you have not disabled the 'paste' functionality on forms."
    },
    Notification_Request: {
        title: "Notifications",
        whatThisMetricIs: "Checks for push notification prompts on load.",
        whyItMatters: "Popups asking for notifications on load are universally hated and usually blocked.",
        whatToDoForAGoodScore: "Ask for permission only after the user requests to be notified.",
        howThisScoreIsCalculated: "We check if your site interrupts the user with a notification prompt immediately."
    },
    Third_Party_Cookies: {
        title: "3rd Party Cookies",
        whatThisMetricIs: "Cookies set by domains other than the website itself.",
        whyItMatters: "Tracking users across the web is becoming restricted and lowers trust.",
        whatToDoForAGoodScore: "Focus on first-party data. Reduce reliance on external advertising trackers.",
        howThisScoreIsCalculated: "We identify cookies set by other domains that track user behavior."
    },
    Deprecated_APIs: {
        title: "Deprecated APIs",
        whatThisMetricIs: "Checks for usage of old, insecure browser features.",
        whyItMatters: "Using old, removed code features can make your site stop working in new browsers.",
        whatToDoForAGoodScore: "Update your codebase to use modern, standard browser features.",
        howThisScoreIsCalculated: "We scan your code for outdated features that browsers are removing."
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
    Viewport_Meta_Tag: {
        title: "Viewport Meta Tag",
        whatThisMetricIs: "Controls layout on mobile browsers to fit the screen width.",
        whyItMatters: "Without this tag, your site looks like a tiny, zoomed-out desktop version on mobile options.",
        thresholds: "Good: Present & Correct, Poor: Missing",
        actualReasonsForFailure: "Tag missing or configured incorrectly (e.g., fixed width).",
        howToOvercomeFailure: "Add <meta name='viewport' content='width=device-width, initial-scale=1'> to the <head>."
    },
    Horizontal_Scroll: {
        title: "Horizontal Scroll",
        whatThisMetricIs: "Checks if content overflows the screen width, causing awkward scrolling.",
        whyItMatters: "Horizontal scrolling is annoying and usually accidental on mobile. It feels broken.",
        thresholds: "Good: None, Poor: Detected",
        actualReasonsForFailure: "Elements with fixed widths wider than the viewport (e.g., large tables, unscaled images).",
        howToOvercomeFailure: "Use CSS 'max-width: 100%' on containers and images. Avoid fixed pixel widths."
    },
    Sticky_Header_Height: {
        title: "Sticky Header",
        whatThisMetricIs: "Measures how much screen space the sticky header occupies.",
        whyItMatters: "Big sticky headers eat up valuable screen space, making reading hard on phones.",
        thresholds: "Good: < 15% Screen Height, Poor: > 20%",
        actualReasonsForFailure: "Header is too tall or does not shrink on scroll.",
        howToOvercomeFailure: "Reduce header height on mobile or hide it when scrolling down."
    },
    Navigation_Depth: {
        title: "Navigation Depth",
        whatThisMetricIs: "Measures clicks required to reach deep pages.",
        whyItMatters: "If users have to click 4 times to find something, they usually give up.",
        thresholds: "Good: < 4 Clicks, Poor: > 4 Clicks",
        actualReasonsForFailure: "Content buried deep in nested menus or categories.",
        howToOvercomeFailure: "Flatten site structure so important pages are accessible in 3 clicks or fewer."
    },
    Breadcrumbs: {
        title: "Breadcrumbs",
        whatThisMetricIs: "Secondary navigation scheme showing user's location.",
        whyItMatters: "Users get lost easily. Breadcrumbs act like a 'Back' button for categories.",
        thresholds: "Good: Present, Poor: Missing",
        actualReasonsForFailure: "No breadcrumb navigation found on sub-pages.",
        howToOvercomeFailure: "Add breadcrumb links (Home > Category > Page) to the top of your pages."
    },
    Navigation_Discoverability: {
        title: "Nav Discoverability",
        whatThisMetricIs: "Checks if the navigation menu is easy to find and use.",
        whyItMatters: "If users can't find the menu, they can't explore your site.",
        thresholds: "Good: Standard Location, Poor: Hidden/Non-standard",
        actualReasonsForFailure: "Menu button is small, low contrast, or placed in an unusual location.",
        howToOvercomeFailure: "Place navigation in standard locations (top left/right) and use standard icons (hamburger)."
    },
    Tap_Target_Size: {
        title: "Tap Targets",
        whatThisMetricIs: "Checks if buttons and links are large enough to touch.",
        whyItMatters: "Tiny buttons cause 'fat finger' errors. Frustrated users leave.",
        thresholds: "Good: > 48x48px, Poor: < 48x48px",
        actualReasonsForFailure: "Interactive elements are too small or too close to neighbors.",
        howToOvercomeFailure: "Increase width/height of touch targets to at least 48px and add spacing."
    },
    Text_Readability: {
        title: "Readability Score",
        whatThisMetricIs: "Analyzes sentence length and word complexity (Flesch-Kincaid).",
        whyItMatters: "If your text is too complicated, people stop reading. Simple language sells.",
        thresholds: "Good: Grade 8 or lower, Poor: Grade 12+",
        actualReasonsForFailure: "Long sentences, complex vocabulary, passive voice, or jargon.",
        howToOvercomeFailure: "Simplify language, break up long sentences, and aim for an 8th-grade reading level."
    },
    Text_Font_Size: {
        title: "Font Legibility",
        whatThisMetricIs: "Checks if text size is readable without zooming.",
        whyItMatters: "Small text forces users to squint or zoom. It's a major usability fail.",
        thresholds: "Good: Base ≥ 16px, Poor: < 12px",
        actualReasonsForFailure: "Base font size is set too small.",
        howToOvercomeFailure: "Set the body font-size to at least 16px (1rem) for mobile devices."
    },
    Cumulative_Layout_Shift: {
        title: "Visual Stability (CLS)",
        whatThisMetricIs: "Measures how much page content shifts while loading.",
        whyItMatters: "It's annoying when you try to click a button and it moves. It feels glitchy.",
        thresholds: "Good: Stable, Poor: Shifting",
        actualReasonsForFailure: "Images/Ads loading late without reserved space.",
        howToOvercomeFailure: "Set fixed width/height for media and ads to reserve space before loading."
    },
    Image_Stability: {
        title: "Image Stability",
        whatThisMetricIs: "Checks if images have defined dimensions.",
        whyItMatters: "Images without sizes cause the layout to jump as they load.",
        thresholds: "Good: Dimensions Set, Poor: Missing Dimensions",
        actualReasonsForFailure: "Image tags missing 'width' and 'height' attributes.",
        howToOvercomeFailure: "Always specify width and height attributes on <img> tags."
    },
    Intrusive_Interstitials: {
        title: "Popups & Modals",
        whatThisMetricIs: "Checks for popups that block content immediately.",
        whyItMatters: "Popups that block the screen immediately annoy users and Google.",
        thresholds: "Good: None, Poor: Detected",
        actualReasonsForFailure: "Full-screen popups appearing immediately on load.",
        howToOvercomeFailure: "Use smaller banners or delay popups until the user is engaged."
    },
    Above_The_Fold_Content: {
        title: "Above the Fold",
        whatThisMetricIs: "Checks what users see first.",
        whyItMatters: "You have 3 seconds to impress. If the top of your page is empty, users bounce.",
        thresholds: "Good: Content Visible, Poor: Empty/Ads",
        actualReasonsForFailure: "Initial screen area is empty or dominated by ads/headers.",
        howToOvercomeFailure: "Place your main value proposition (headline + image) clearly at the top."
    },
    Click_Feedback: {
        title: "Interaction Feedback",
        whatThisMetricIs: "Visual response when clicking/tapping elements.",
        whyItMatters: "If buttons don't react, users think the app is frozen.",
        thresholds: "Good: Visible Feedback, Poor: Static",
        actualReasonsForFailure: "No CSS :active or :focus styles defined for interactive elements.",
        howToOvercomeFailure: "Add ':active' scale or color change effects to buttons."
    },
    Form_Validation: {
        title: "Form Validation",
        whatThisMetricIs: "Real-time feedback for user inputs.",
        whyItMatters: "Waiting until the end to see errors is frustrating.",
        thresholds: "Good: Inline & Clear, Poor: Submit-only",
        actualReasonsForFailure: "Validation only happens after submit, or error messages are generic.",
        howToOvercomeFailure: "Validate fields as users type and provide specific, helpful error strings."
    },
    Loading_Feedback: {
        title: "Loading States",
        whatThisMetricIs: "Indicators like spinners or skeletons during waits.",
        whyItMatters: "Staring at a blank screen makes users think the site is broken.",
        thresholds: "Good: Spinners/Skeletons, Poor: Blank Screen",
        actualReasonsForFailure: "No UI feedback during async data loading.",
        howToOvercomeFailure: "Display loading spinners or skeleton screens while fetching data."
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
        whatThisMetricIs: "Checks if the Call to Action button is above the fold and distinguishable.",
        whyItMatters: "If users can't find the 'Buy' button instantly, they can't buy. It's that simple.",
        thresholds: "Good: Above Fold, Poor: Below Fold",
        actualReasonsForFailure: "Primary CTA hidden in footer or pushed down by large hero images/text.",
        howToOvercomeFailure: "Place your main CTA in the hero section (top 600px visible area)."
    },
    CTA_Clarity: {
        title: "CTA Clarity",
        whatThisMetricIs: "Analyzes button text for action-oriented language.",
        whyItMatters: "Vague buttons like 'Submit' kill curiosity. Clear buttons like 'Get My Free Guide' drive action.",
        thresholds: "Good: Action-Oriented, Poor: Vague",
        actualReasonsForFailure: "Using generic words like 'Submit', 'Click Here', or 'Go'.",
        howToOvercomeFailure: "Use specific, value-driven verbs (e.g., 'Get Started', 'Download PDF', 'Join Now')."
    },
    CTA_Contrast: {
        title: "CTA Contrast",
        whatThisMetricIs: "Measures color contrast ratio against the background.",
        whyItMatters: "Buttons that blend in get ignored. Your primary action must pop off the screen.",
        thresholds: "Good: High Contrast, Poor: Low Contrast",
        actualReasonsForFailure: "Button color matches background or branding too closely, lacking visual pop.",
        howToOvercomeFailure: "Use a complementary color (e.g., Orange on Blue) that stands out strongly."
    },
    CTA_Crowding: {
        title: "CTA Crowding",
        whatThisMetricIs: "Checks proximity of other clickable elements to the CTA.",
        whyItMatters: "Too many choices confuse users. When faced with clutter, people choose nothing.",
        thresholds: "Good: Isolated, Poor: Cluttered",
        actualReasonsForFailure: "CTA surrounded by links, text, or other buttons, reducing its impact.",
        howToOvercomeFailure: "Add ample whitespace (padding/margin) around your primary button."
    },
    CTA_Flow_Alignment: {
        title: "Flow Alignment",
        whatThisMetricIs: "Checks if CTAs appear logically after value propositions.",
        whyItMatters: "Asking for a sale before explaining the value is like proposing on the first date.",
        thresholds: "Good: Logical, Poor: Premature",
        actualReasonsForFailure: "CTA appears before value proposition or explanation.",
        howToOvercomeFailure: "Place your Call-to-Action immediately after explaining the 'Why'."
    },
    Form_Presence: {
        title: "Lead Capture Form",
        whatThisMetricIs: "Detects input forms on the landing page.",
        whyItMatters: "You can't get leads if you don't ask. No form means no way to follow up.",
        thresholds: "Good: Found, Poor: Missing",
        actualReasonsForFailure: "No form or email capture input found on the page.",
        howToOvercomeFailure: "Add a simple email signup form or lead capture section."
    },
    Form_Length: {
        title: "Form Length",
        whatThisMetricIs: "Counts the number of input fields in the form.",
        whyItMatters: "Every extra field you ask for cuts your conversion rate significantly.",
        thresholds: "Good: 3-5 Fields, Poor: > 7 Fields",
        actualReasonsForFailure: "Asking for too much information (phone, address, company) upfront.",
        howToOvercomeFailure: "Reduce fields to the absolute minimum (often just Name and Email)."
    },
    Required_vs_Optional_Fields: {
        title: "Field Requirements",
        whatThisMetricIs: "Checks if required fields are clearly marked (asterisks or labels).",
        whyItMatters: "Users hate guessing. Error messages frustrate them and cause drop-offs.",
        thresholds: "Good: Marked, Poor: Unmarked",
        actualReasonsForFailure: "Required fields not visually distinguished from optional ones.",
        howToOvercomeFailure: "Mark required fields with asterisks (*) or '(optional)' labels."
    },
    Inline_Validation: {
        title: "Inline Validation",
        whatThisMetricIs: "Checks if the form gives feedback as the user types.",
        whyItMatters: "Waiting until the end to say 'Error' is annoying. Real-time feedback feels superior.",
        thresholds: "Good: Real-time, Poor: On Submit",
        actualReasonsForFailure: "Errors only appear after clicking submit, not while typing.",
        howToOvercomeFailure: "Validate inputs on blur or change and show green checkmarks for success."
    },
    Submit_Button_Clarity: {
        title: "Submit Button",
        whatThisMetricIs: "Checks the text of the form submit button.",
        whyItMatters: "'Submit' is boring technical jargon. It feels like filing taxes, not getting value.",
        thresholds: "Good: Specific, Poor: Generic",
        actualReasonsForFailure: "Button uses generic text like 'Submit' or 'Send'.",
        howToOvercomeFailure: "Change text to benefit-driven phrases like 'Join the Club' or 'Start Now'."
    },
    AutoFocus_Field: {
        title: "Auto-Focus",
        whatThisMetricIs: "Checks if the first input is auto-focused on load.",
        whyItMatters: "Autofocus invites the user to type immediately, reducing friction.",
        thresholds: "Good: Enabled, Poor: Disabled",
        actualReasonsForFailure: "User has to manually click the input field to start typing.",
        howToOvercomeFailure: "Add the 'autofocus' attribute to your most important input field."
    },
    MultiStep_Form_Progress: {
        title: "Multi-step Progress",
        whatThisMetricIs: "Detects progress bars for long forms.",
        whyItMatters: "Long forms feel endless without a map. Users quit if they don't know how far they have to go.",
        thresholds: "Good: Visible, Poor: Hidden",
        actualReasonsForFailure: "Multi-page form lacks a progress indicator (Step 1 of 3).",
        howToOvercomeFailure: "Add a visual progress bar or step counter for multi-step flows."
    },
    Testimonials: {
        title: "Testimonials",
        whatThisMetricIs: "Scans for testimonial sections or quotes.",
        whyItMatters: "People trust other people more than they trust brands. Social proof is a powerful persuader.",
        thresholds: "Good: Found, Poor: Missing",
        actualReasonsForFailure: "No customer quotes or testimonials found on the page.",
        howToOvercomeFailure: "Add a dedicated section for customer testimonials/quotes."
    },
    Reviews: {
        title: "Reviews",
        whatThisMetricIs: "Checks for star ratings or review widgets.",
        whyItMatters: "Zero reviews looks suspicious. 5-star reviews drive sales.",
        thresholds: "Good: Found, Poor: Missing",
        actualReasonsForFailure: "No 3rd party review widgets (Google, Trustpilot) or star ratings.",
        howToOvercomeFailure: "Embed authentic reviews/ratings from trusted third-party platforms."
    },
    Trust_Badges: {
        title: "Trust Badges",
        whatThisMetricIs: "Scans for security seals, guarantees, or partner logos.",
        whyItMatters: "Badges reduce anxiety. They tell users 'your money and data are safe here'.",
        thresholds: "Good: Found, Poor: Missing",
        actualReasonsForFailure: "No security seals, money-back guarantees, or certification badges.",
        howToOvercomeFailure: "Display recognized trust badges (SSL, 30-Day Money Back, Norton, etc.)."
    },
    Client_Logos: {
        title: "Client Logos",
        whatThisMetricIs: "Checks for a 'Trusted By' logo strip.",
        whyItMatters: "If big brands trust you, new visitors will too. It's borrowed credibility.",
        thresholds: "Good: Found, Poor: Missing",
        actualReasonsForFailure: "No 'Trusted By' or partner logo section detected.",
        howToOvercomeFailure: "Add a logo strip of known clients or partners to build authority."
    },
    Case_Studies_Accessibility: {
        title: "Case Studies",
        whatThisMetricIs: "Checks for links to 'Case Studies' or 'Success Stories'.",
        whyItMatters: "Claims are cheap. Proof is valuable. Case studies show exactly how you deliver results.",
        thresholds: "Good: Linked, Poor: Missing",
        actualReasonsForFailure: "No dedicated section or links to detailed customer success stories.",
        howToOvercomeFailure: "Create a 'Case Studies' page and link to it from the main menu or footer."
    },
    Exit_Intent_Triggers: {
        title: "Exit Intent",
        whatThisMetricIs: "Checks for scripts that trigger on mouse leaving the window.",
        whyItMatters: "Most visitors leave and never come back. An exit popup gives you one last chance.",
        thresholds: "Good: Active, Poor: Missing",
        actualReasonsForFailure: "No mechanism to capture leads when they attempt to close the tab.",
        howToOvercomeFailure: "Implement an exit-intent popup offering a discount or lead magnet."
    },
    Lead_Magnets: {
        title: "Lead Magnet",
        whatThisMetricIs: "Checks for downloadable resources (PDFs, Ebooks).",
        whyItMatters: "Visitors rarely give their email for free. You need to offer something valuable in return.",
        thresholds: "Good: Offered, Poor: None",
        actualReasonsForFailure: "Forms ask for email without offering any immediate value in return.",
        howToOvercomeFailure: "Offer a free PDF guide, checklist, or discount code in exchange for signup."
    },
    Contact_Info_Visibility: {
        title: "Contact Info",
        whatThisMetricIs: "Checks for phone number, email, or physical address.",
        whyItMatters: "Hiding your contact info makes you look like a scam. Transparency builds trust.",
        thresholds: "Good: Visible, Poor: Hidden",
        actualReasonsForFailure: "Phone number/Email not found in header or footer.",
        howToOvercomeFailure: "Place your contact email or phone number in the global footer."
    },
    Chatbot_Presence: {
        title: "Live Chat",
        whatThisMetricIs: "Detects live chat widgets (Intercom, Drift).",
        whyItMatters: "Customers have questions now. If they have to wait, they go to a competitor.",
        thresholds: "Good: Active, Poor: Inactive",
        actualReasonsForFailure: "No live chat or automated support widget detected.",
        howToOvercomeFailure: "Install a live chat widget (e.g., Intercom, Tawk.to) to answer questions."
    },
    Interactive_Elements: {
        title: "Interactivity",
        whatThisMetricIs: "Checks for calculators, quizzes, or interactive demos.",
        whyItMatters: "Passive reading is boring. Quizzes and calculators engage users and capture leads.",
        thresholds: "Good: Engaging, Poor: Static",
        actualReasonsForFailure: "Page contains only static text and images.",
        howToOvercomeFailure: "Add an ROI calculator, quiz, or interactive slider tool."
    },
    Personalization: {
        title: "Personalization",
        whatThisMetricIs: "Checks for dynamic text replacement or personalized greetings.",
        whyItMatters: "Generic messages get generic results. Speaking 'to' the user converts better.",
        thresholds: "Good: Personalized, Poor: Generic",
        actualReasonsForFailure: "Content is static and identical for all visitors.",
        howToOvercomeFailure: "Use URL parameters or cookies to personalize headlines (e.g., 'Hello, [Name]')."
    },
    Progress_Indicators: {
        title: "Progress Indicators",
        whatThisMetricIs: "Checks for step visualizers in funnels.",
        whyItMatters: "Seeing progress (Step 1 -> 2) motivates users to finish what they started.",
        thresholds: "Good: Visual Steps, Poor: Text Only",
        actualReasonsForFailure: "Multi-step processes described in paragraph text without visual cues.",
        howToOvercomeFailure: "Use numbered step indicators (1, 2, 3) or a progress bar."
    },
    Friendly_Error_Handling: {
        title: "Error Messages",
        whatThisMetricIs: "Checks if error messages are helpful vs generic.",
        whyItMatters: "Technical errors scare users away. Friendly help keeps them on track.",
        thresholds: "Good: Human, Poor: Technical",
        actualReasonsForFailure: "Error messages are technical or generic (e.g., 'Error 400', 'Invalid').",
        howToOvercomeFailure: "Rewrite errors to be helpful (e.g., 'Please use format name@example.com')."
    },
    Microcopy_Clarity: {
        title: "Microcopy",
        whatThisMetricIs: "Checks for small instructional text under fields.",
        whyItMatters: "Tiny text can remove big fears. 'No credit card required' is a powerful friction remover.",
        thresholds: "Good: Supportive, Poor: Absent",
        actualReasonsForFailure: "Input fields lack helper text to reassure users.",
        howToOvercomeFailure: "Add reassuring text under inputs for sensitive data (e.g., 'No spam')."
    },
    Incentives_Displayed: {
        title: "Incentives",
        whatThisMetricIs: "Checks for 'Free Shipping', 'Bonus', 'Discount' keywords.",
        whyItMatters: "Everyone loves a deal. A clear bonus can be the tipping point for a decision.",
        thresholds: "Good: Prominent, Poor: Hidden",
        actualReasonsForFailure: "Incentives buried in wall of text.",
        howToOvercomeFailure: "Highlight 'Free Shipping' or 'Bonus' near the CTA with bold text/icons."
    },
    Scarcity_Urgency: {
        title: "Urgency Signals",
        whatThisMetricIs: "Checks for countdown timers or 'Limited Stock' warnings.",
        whyItMatters: "Procrastination kills sales. Genuine urgency forces a decision now.",
        thresholds: "Good: Honest Urgency, Poor: None",
        actualReasonsForFailure: "No reason given for user to act immediately.",
        howToOvercomeFailure: "Use 'Limited Time' offers or show stock availability (if genuine)."
    },
    Smooth_Scrolling: {
        title: "Smooth Scroll",
        whatThisMetricIs: "Checks for 'scroll-behavior: smooth' in CSS.",
        whyItMatters: "Jerky movement feels cheap. Smooth movement feels premium.",
        thresholds: "Good: Enabled, Poor: Jerky",
        actualReasonsForFailure: "Default browser anchor jumping is abrupt.",
        howToOvercomeFailure: "Set 'html { scroll-behavior: smooth; }' in your CSS."
    },
    Mobile_CTA_Adaptation: {
        title: "Mobile Sticky CTA",
        whatThisMetricIs: "Checks if a sticky CTA exists on mobile screens.",
        whyItMatters: "Mobile screens are small. Don't make users scroll for miles to find the button.",
        thresholds: "Good: Sticky, Poor: Scrolls Away",
        actualReasonsForFailure: "CTA scrolls off-screen on long mobile pages.",
        howToOvercomeFailure: "Implement a sticky footer bar with a 'Buy' or 'Contact' button on mobile."
    },
    MultiChannel_FollowUp: {
        title: "Retargeting",
        whatThisMetricIs: "Checks for retargeting pixels (FB Pixel, LinkedIn Insight).",
        whyItMatters: "97% of visitors don't buy the first time. You need a way to bring them back.",
        thresholds: "Good: Pixels Found, Poor: None",
        actualReasonsForFailure: "No retargeting pixels (Facebook/Google) detected.",
        howToOvercomeFailure: "Install Facebook Pixel and Google Ads Tag to retarget visitors."
    },

    //// Methodologies (Conversion & Lead Flow)
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
    AIO_Structured_Data: {
        title: "Structured Data",
        whatThisMetricIs: "Schema markup (JSON-LD) explicitly tells machines what the content means.",
        whyItMatters: "Structured data is like a translator for search engines. It turns your content into answers.",
        thresholds: "Good: Valid JSON-LD, Poor: Missing",
        actualReasonsForFailure: "Review/Product/FAQ data present but not wrapped in Schema markup.",
        howToOvercomeFailure: "Implement Schema.org JSON-LD for all key content types."
    },
    Metadata_Complete: {
        title: "Meta Tags",
        whatThisMetricIs: "Checks for title, description, and social meta tags.",
        whyItMatters: "AI bots read your meta tags first. If they are missing, you risk being ignored.",
        thresholds: "Good: Complete, Poor: Missing",
        actualReasonsForFailure: "Missing OpenGraph, Twitter Cards, or basic description tags.",
        howToOvercomeFailure: "Ensure every page has unique Title, Description, and Social Optimization tags."
    },
    Fast_Page_Load: {
        title: "Load Speed",
        whatThisMetricIs: "Fast loading pages are easier and cheaper for AI bots to crawl.",
        whyItMatters: "Slow sites are expensive for AI to crawl. If you're slow, you get indexed less.",
        thresholds: "Good: < 2.5s, Poor: > 5s",
        actualReasonsForFailure: "Server response > 1s or unoptimized assets delaying load.",
        howToOvercomeFailure: "Use caching, CDNs, and image optimization to serve content instantly."
    },
    API_Data_Access: {
        title: "API Access",
        whatThisMetricIs: "Detects if content is accessible via JSON/XML APIs.",
        whyItMatters: "Advanced AI agents prefer raw data over messy HTML. An API makes you AI-ready.",
        thresholds: "Good: Documented, Poor: None",
        actualReasonsForFailure: "Data locked in HTML structure, hard for bots to extract cleanly.",
        howToOvercomeFailure: "Provide a public API or JSON endpoints for your content."
    },
    Dynamic_Content_Available: {
        title: "Dynamic Content",
        whatThisMetricIs: "Checks if content changes based on user interaction.",
        whyItMatters: "Static sites are boring. Dynamic sites can adapt to who is visiting.",
        thresholds: "Good: Adaptive, Poor: Static",
        actualReasonsForFailure: "Site serves identical static HTML to every user/bot.",
        howToOvercomeFailure: "Use server-side rendering or edge functions to adapt content."
    },
    Multilingual_Support: {
        title: "Multilingual",
        whatThisMetricIs: "Verifies headers and HTML tags for language declaration.",
        whyItMatters: "AI is global. If you only speak English, you miss 80% of the world.",
        thresholds: "Good: Hreflang Found, Poor: English Only",
        actualReasonsForFailure: "No language declarations or hreflang tags found.",
        howToOvercomeFailure: "Implement hreflang tags and provide localized content versions."
    },
    Content_NLP_Friendly: {
        title: "NLP Friendly",
        whatThisMetricIs: "Checks sentence structure and semantic HTML.",
        whyItMatters: "If your sentences are too complex, AI gets confused. Simple writing wins.",
        thresholds: "Good: Simple, Poor: Complex",
        actualReasonsForFailure: "Sentences are too long (> 20 words) or structure is convoluted.",
        howToOvercomeFailure: "Write in plain English (Grade 8), use short sentences, and clear headings."
    },
    Keywords_Entities_Annotated: {
        title: "Entity Annotation",
        whatThisMetricIs: "Checks if entities are tagged (e.g., using specific HTML attributes).",
        whyItMatters: "Keywords are good, but 'Entities' are better. They help AI understand context.",
        thresholds: "Good: Tagged, Poor: Plain Text",
        actualReasonsForFailure: "Important entities (People, Places) are just plain text.",
        howToOvercomeFailure: "Use semantic tags or Schema to identify key entities."
    },
    Content_Updated_Regularly: {
        title: "Freshness",
        whatThisMetricIs: "Checks last-modified headers.",
        whyItMatters: "Old news is no news. AI loves fresh, up-to-date information.",
        thresholds: "Good: < 1 Month, Poor: > 1 Year",
        actualReasonsForFailure: "Last-Modified header is missing or older than 6 months.",
        howToOvercomeFailure: "Update content regularly and ensure server sends correct Last-Modified headers."
    },
    Internal_Linking_AI_Friendly: {
        title: "Internal Linking",
        whatThisMetricIs: "Checks link depth and anchor text.",
        whyItMatters: "Links are the roads AI travels. No links mean dead ends. Generic links confuse context.",
        thresholds: "Good: Descriptive, Poor: 'Click Here'",
        actualReasonsForFailure: "Internal links use generic anchor text like 'Read More' or 'Click Here'.",
        howToOvercomeFailure: "Use descriptive keywords in anchor text (e.g., 'View Pricing Plans' instead of 'Click Here')."
    },
    Duplicate_Content_Detection_Ready: {
        title: "Duplicate Check",
        whatThisMetricIs: "Verifies canonical tags.",
        whyItMatters: "Duplicate content confuses AI. It doesn't know which page is the 'real' one.",
        thresholds: "Good: Canonicalized, Poor: Duplicates",
        actualReasonsForFailure: "Missing canonical tags, leading to potential duplicate content penalties.",
        howToOvercomeFailure: "Add self-referencing canonical tags to all unique pages."
    },
    Behavior_Tracking_Implemented: {
        title: "Behavior Tracking",
        whatThisMetricIs: "Checks for analytics scripts.",
        whyItMatters: "You receive what you measure. Tracking helps AI learn what users like.",
        thresholds: "Good: Active, Poor: Missing",
        actualReasonsForFailure: "No standard analytics tracking (GA4, Mixpanel) detected.",
        howToOvercomeFailure: "Install an analytics tracking script to gather user behavior data."
    },
    Segmentation_Profiling_Ready: {
        title: "Segmentation",
        whatThisMetricIs: "Checks if users can be grouped by attributes.",
        whyItMatters: "Treating everyone the same is inefficient. Segments allow for targeted AI responses.",
        thresholds: "Good: Ready, Poor: None",
        actualReasonsForFailure: "No data collection strategy to segment users by interest/behavior.",
        howToOvercomeFailure: "Implement mechanisms to tag users based on viewed content or actions."
    },
    Event_Goal_Tracking_Integrated: {
        title: "Goal Tracking",
        whatThisMetricIs: "Checks if conversion goals are defined.",
        whyItMatters: "AI needs a goal. Tell it what 'success' looks like.",
        thresholds: "Good: Goals Set, Poor: None",
        actualReasonsForFailure: "No specific conversion events (signup, purchase) are being tracked.",
        howToOvercomeFailure: "Define and track key conversion events in your analytics platform."
    },
    AB_Testing_Ready: {
        title: "A/B Testing",
        whatThisMetricIs: "Detects testing frameworks.",
        whyItMatters: "Guessing is risky. Testing is smart. AI can auto-optimize if you let it.",
        thresholds: "Good: Active, Poor: Inactive",
        actualReasonsForFailure: "No infrastructure detected for running experiments or A/B tests.",
        howToOvercomeFailure: "Integrate an A/B testing tool or feature flag system."
    },
    User_Feedback_Loops_Present: {
        title: "Feedback Loops",
        whatThisMetricIs: "Checks for rating widgets or comment sections.",
        whyItMatters: "Feedback trains the AI. A simple 'thumbs up' can improve results.",
        thresholds: "Good: Active, Poor: None",
        actualReasonsForFailure: "No way for users to provide feedback on content quality.",
        howToOvercomeFailure: "Add simple feedback widgets (Stars, Thumbs) to articles or products."
    },
    Dynamic_Personalization: {
        title: "Dynamic Personalization",
        whatThisMetricIs: "Verifies ability to change content dynamically.",
        whyItMatters: "Personalization increases relevance. Relevance increases sales.",
        thresholds: "Good: Active, Poor: Static",
        actualReasonsForFailure: "Site experience is identical for all users regardless of history.",
        howToOvercomeFailure: "Adopt personalization tools to tailor content to user segments."
    },
    AI_Content_Distribution: {
        title: "AI Distribution",
        whatThisMetricIs: "Checks for RSS/Atom feeds.",
        whyItMatters: "Don't wait for users to come to you. Push content to AI where it lives.",
        thresholds: "Good: Feeds Found, Poor: Siloed",
        actualReasonsForFailure: "Content locked to browser only; no machine-readable feeds.",
        howToOvercomeFailure: "Generate RSS/Atom feeds for your blog, products, or news."
    },
    AI_Friendly_Structure: {
        title: "AI Friendly Structure",
        whatThisMetricIs: "Verifies logical hierarchy.",
        whyItMatters: "A messy room is hard to clean. A messy code structure is hard for AI to read.",
        thresholds: "Good: Semantic, Poor: Div Soup",
        actualReasonsForFailure: "Overuse of generic <div> tags instead of semantic HTML5 elements.",
        howToOvercomeFailure: "Use semantic tags like <main>, <article>, <section>, <header>, <footer>."
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

    Hreflang: {
        title: "Hreflang Tags",
        whatThisParameterIs: "Signifies the language and geographical targeting of a webpage.",
        whyItMatters: "Ensures that users see the correct version of your site based on their language and location, preventing duplicate content issues.",
        thresholds: {
            good: "Valid hreflang tags present",
            needsImprovement: "Hreflang present but with errors",
            poor: "No hreflang tags found"
        },
        actualReasonsForFailure: [
            "Missing hreflang tags on multilingual sites",
            "Incorrect language or country codes",
            "Missing self-referencing hreflang tag",
            "Hreflang tags pointing to broken URLs"
        ],
        howToOvercomeFailure: [
            "Add valid hreflang tags to the <head> section",
            "Use correct ISO language and country codes",
            "Ensure every page has a self-referencing tag",
            "Validate tags using Google Search Console"
        ]
    },
    Image_Compression: {
        title: "Image Compression",
        whatThisParameterIs: "Measures the file size of images to ensure they are optimized for web.",
        whyItMatters: "Large images slow down page load times, consuming bandwidth and hurting SEO rankings.",
        thresholds: {
            good: "All images < 150KB",
            needsImprovement: "Some images > 150KB",
            poor: "Many large, unoptimized images"
        },
        actualReasonsForFailure: [
            "Uploading raw or high-resolution images directly",
            "Not using modern formats like WebP or AVIF",
            "Lack of server-side image optimization"
        ],
        howToOvercomeFailure: [
            "Compress images using tools like TinyPNG or Squoosh",
            "Serve images in WebP or AVIF formats",
            "Implement lazy loading for off-screen images",
            "Use responsive images with srcset"
        ]
    },
};

export default InfoDetails;
