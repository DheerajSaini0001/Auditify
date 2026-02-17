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
        whatThisParameterIs: "Largest Contentful Paint (LCP) is a Core Web Vital metric that measures the time it takes for the largest visible element (image or text block) to render within the viewport.",
        whatItCalculates: "We analyze the Lighthouse audit trace to determine the render time of the largest image or text block relative to the page load start.",
        whyItMatters: "A fast LCP helps reassure the user that the page is useful. Poor LCP can lead to higher bounce rates and lower search rankings.",
        thresholds: {
            good: "≤ 2.5s",
            needsImprovement: "2.5s – 4s",
            poor: "> 4s"
        },
        actualReasonsForFailure: [
            "High TTFB delaying initial HTML delivery",
            "Render-blocking scripts or stylesheets",
            "Redirect chains delaying resource fetch",
            "Critical request chains too deep"
        ],
        howToOvercomeFailure: [
            "Optimize backend performance and database queries",
            "Defer non-critical JS/CSS and inline critical styles",
            "Compress and resize images (WebP)",
            "Review network waterfall and reduce main-thread work"
        ]
    },
    INP: {
        title: "Interaction to Next Paint (INP)",
        whatThisParameterIs: "Interaction to Next Paint (INP) is a Core Web Vital metric that measures the latency of every user interaction (clicks, taps, and keyboard inputs) throughout the lifespan of the page.",
        whatItCalculates: "For Lab data, we use Total Blocking Time (TBT) as a proxy. For Field data, we use CrUX 'interaction-to-next-paint' metric which measures real user interaction latency.",
        whyItMatters: "High responsiveness ensures that the page feels alive and reacts instantly to user input, preventing frustration.",
        thresholds: {
            good: "≤ 200ms (Field) / ≤ 3.8s (Lab)",
            needsImprovement: "200ms–500ms (Field) / 3.8s–7.3s (Lab)",
            poor: "> 500ms (Field) / > 7.3s (Lab)"
        },
        actualReasonsForFailure: [
            "Long Tasks (>50ms) blocking main thread",
            "Heavy JavaScript execution during startup",
            "Large DOM causing style calculation delays",
            "Third-party scripts handling input events"
        ],
        howToOvercomeFailure: [
            "Defer heavy JS execution and break up long tasks",
            "Reduce initial JS payload and code-split bundles",
            "Optimize third-party scripts",
            "Reduce DOM size (< 1500 nodes)"
        ]
    },
    CLS: {
        title: "Cumulative Layout Shift (CLS)",
        whatThisParameterIs: "Cumulative Layout Shift (CLS) is a Core Web Vital metric that quantifies how much visible content shifts unexpectedly during the page's lifespan.",
        whatItCalculates: "We analyze the Lighthouse 'cumulative-layout-shift' audit (Lab) and CrUX data (Field) to sum the scores of all unexpected layout shifts.",
        whyItMatters: "Visual stability prevents annoying unexpected movement of content, which can cause reading difficulties or accidental clicks.",
        thresholds: {
            good: "≤ 0.1",
            needsImprovement: "0.1 – 0.25",
            poor: "> 0.25"
        },
        actualReasonsForFailure: [
            "Images missing width/height attributes",
            "Late-loading ads or embeds",
            "FOUT (Flash of Unstyled Text) causing reflow",
            "Dynamic content injected above viewport"
        ],
        howToOvercomeFailure: [
            "Add explicit `width` and `height` attributes to all images",
            "Reserve space for ads/embeds to prevent shifts",
            "Use `font-display: swap` or preload key fonts",
            "Review late-loading dynamic content"
        ]
    },
    FCP: {
        title: "First Contentful Paint (FCP)",
        whatThisParameterIs: "First Contentful Paint (FCP) measures the time from when the page starts loading to when any part of the page's content (text, images, SVGs) is rendered on the screen.",
        whatItCalculates: "We use the Lighthouse 'first-contentful-paint' audit to identify the precise timestamp when the first DOM content (text, image, svg) is rendered.",
        whyItMatters: "A fast FCP provides immediate visual feedback to the user that the server is responding and content is incoming.",
        thresholds: {
            good: "≤ 1.8s",
            needsImprovement: "1.8s – 3s",
            poor: "> 3s"
        },
        actualReasonsForFailure: [
            "Main thread busy parsing/executing JS",
            "Unused CSS/JS delaying rendering",
            "Invisible text during font load",
            "Resources competing for bandwidth"
        ],
        howToOvercomeFailure: [
            "Reduce server response time (TTFB)",
            "Eliminate render-blocking resources",
            "Minimize redirects",
            "Preload critical requests"
        ]
    },
    TTFB: {
        title: "Time to First Byte (TTFB)",
        whatThisParameterIs: "Time to First Byte (TTFB) measures the duration from the user or client making an HTTP request to the first byte of the page being received by the client's browser.",
        whatItCalculates: "We measure the time from the initial request to the receipt of the first byte using Lighthouse 'server-response-time' (Lab) and CrUX 'experimental_time_to_first_byte' (Field).",
        whyItMatters: "A low TTFB is crucial because the browser cannot start rendering any content until it receives the first byte of data.",
        thresholds: {
            good: "≤ 800ms",
            needsImprovement: "800ms – 1.8s",
            poor: "> 1.8s"
        },
        actualReasonsForFailure: [
            "Database queries taking too long",
            "Lack of server-side caching",
            "Multiple redirects before initial response",
            "Server resource exhaustion (CPU/RAM)"
        ],
        howToOvercomeFailure: [
            "Optimize server/database queries",
            "Enable Gzip/Brotli compression",
            "Use a CDN to serve content from edge locations",
            "Reduce redirect chains"
        ]
    },
    TBT: {
        title: "Total Blocking Time (TBT)",
        whatThisParameterIs: "Total Blocking Time (TBT) measures the total amount of time that a page is blocked from responding to user input, such as mouse clicks, screen taps, or keyboard presses.",
        whatItCalculates: "We sum the duration of all 'long tasks' (tasks > 50ms) between First Contentful Paint and Time to Interactive, found in the Main Thread work breakdown.",
        whyItMatters: "Minimizing blocking time ensures the main thread is free to handle user input, keeping the page interactive during load.",
        thresholds: {
            good: "≤ 200ms",
            needsImprovement: "200ms – 600ms",
            poor: "> 600ms"
        },
        actualReasonsForFailure: [
            "Long Tasks (>50ms) on main thread",
            "Heavy script evaluation/parsing",
            "Third-party scripts blocking execution",
            "Hydration of large JS bundles"
        ],
        howToOvercomeFailure: [
            "Break up Long Tasks (>50ms)",
            "Defer non-critical JS",
            "Audit third-party scripts and use facade loading",
            "Optimize script evaluation"
        ]
    },
    SI: {
        title: "Speed Index (SI)",
        whatThisParameterIs: "Speed Index (SI) measures how quickly the contents of a page are visually populated during the page load.",
        whatItCalculates: "We calculate the speed at which the page content is visually populated using the 'speed-index' audit from Lighthouse.",
        whyItMatters: "A low Speed Index signifies that the visible parts of the page serve the user quickly, enhancing perceived performance.",
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
            "Minimize main thread work",
            "Remove unused CSS/JS or defer non-critical assets",
            "Ensure text remains visible during font load",
            "Prioritize critical resources"
        ]
    },

    // Technical Performance - Assets & Server
    Compression: {
        title: "Text Compression",
        whatThisParameterIs: "Text Compression refers to the practice of reducing the size of text-based assets (HTML, CSS, JS) using algorithms like Gzip or Brotli.",
        whatItCalculates: "We analyze the `Content-Encoding` header for `gzip` or `br` and compare original vs. compressed sizes.",
        whyItMatters: "Compressed text resources significantly reduce the number of bytes transferred, leading to faster download times.",
        thresholds: {
            good: "100% resources compressed",
            needsImprovement: "70% – 99% compressed",
            poor: "< 70% compressed"
        },
        actualReasonsForFailure: [
            "Text assets (HTML/CSS/JS) served without compression",
            "Server configuration missing Gzip/Brotli rules",
            "Compression applied only to specific file types"
        ],
        howToOvercomeFailure: [
            "Enable Gzip or Brotli on the web server",
            "Ensure .js and .css files are compressed"
        ]
    },
    Caching: {
        title: "Browser Caching",
        whatThisParameterIs: "Browser Caching allows the browser to store static files locally to avoid downloading them on subsequent visits.",
        whatItCalculates: "We inspect the `Cache-Control` header of all static resources to verify if they have a `max-age` directive greater than 7 days.",
        whyItMatters: "Effective caching policies drastically reduce load times for returning visitors by serving content from their local device.",
        thresholds: {
            good: "≥ 90% resources cached (>7 days)",
            needsImprovement: "50% – 89% resources cached",
            poor: "< 50% resources cached"
        },
        actualReasonsForFailure: [
            "Missing cache-control headers",
            "Short cache expiration time",
            "Dynamic caching applied to static assets"
        ],
        howToOvercomeFailure: [
            "Set a long `max-age` (e.g. 1 year) for static assets",
            "Ensure CDN or server sends correct `Cache-Control` headers"
        ]
    },
    Render_Blocking: {
        title: "Render Blocking Resources",
        whatThisParameterIs: "Render-blocking resources are static files, such as fonts, HTML, CSS, and JavaScript, that prevent a web page from loading or displaying content to the user until they are processed.",
        whatItCalculates: "We identify scripts in the `<head>` without `async` or `defer` attributes and stylesheets without media attributes that delay the first paint.",
        whyItMatters: "Eliminating render-blocking resources allows the browser to paint the page content much sooner.",
        thresholds: {
            good: "0 blocking resources",
            needsImprovement: "1 – 5 blocking resources",
            poor: "> 5 blocking resources"
        },
        actualReasonsForFailure: [
            "<script> tags missing 'async' or 'defer'",
            "<link rel='stylesheet'> missing 'media' attribute",
            "Heavy CSS bundles loading synchronously",
            "External scripts in <head>"
        ],
        howToOvercomeFailure: [
            "Defer non-critical JavaScript",
            "Inline critical CSS",
            "Load non-critical CSS asynchronously"
        ]
    },

    // Technical Performance - SEO & Crawlability
    Resource_Optimization: {
        title: "Resource Optimization",
        whatThisParameterIs: "Resource Optimization in SEO context refers to the practice of refining website assets (images, scripts, styles) to minimize file size and load time without compromising quality.",
        whatItCalculates: "We compare the natural dimensions of images against their display size and check if script URLs contain '.min' or 'cdn'.",
        whyItMatters: "Optimizing assets for SEO prevents slow load times from negatively impacting crawl budget and user engagement signals.",
        thresholds: {
            good: "≥ 90% resources optimized",
            needsImprovement: "50% – 89% resources optimized",
            poor: "< 50% resources optimized"
        },
        actualReasonsForFailure: [
            "Images displayed larger than natural dimensions",
            "JavaScript files not minified (.min.js)",
            "Images missing explicit width/height",
            "Assets not served from a CDN"
        ],
        howToOvercomeFailure: [
            "Resize images to match their specific display dimensions",
            "Minify JavaScript files to reduce payload size"
        ]
    },
    Redirect_Chains: {
        title: "Redirect Chains",
        whatThisParameterIs: "A Redirect Chain is a series of multiple redirects (301 or 302) that occur between the initial URL requested and the final destination URL.",
        whatItCalculates: "We trace the full redirect path using the browser's request interception to count the number of hops.",
        whyItMatters: "Redirect chains increase latency by requiring multiple round-trips to the server before the page can even start loading.",
        thresholds: {
            good: "≤ 1 redirect",
            needsImprovement: "N/A",
            poor: "> 1 redirect"
        },
        actualReasonsForFailure: [
            "Multiple redirects (hops > 1)",
            "Redirect loops",
            "http to https redirects not resolving immediately",
            "Trailing slash redirects"
        ],
        howToOvercomeFailure: [
            "Remove unnecessary redirects",
            "Point links directly to the final destination URL"
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
                    <span className="font-semibold">Master Core Web Vitals (45% of score):</span> Prioritize LCP (load speed), INP (responsiveness), and CLS (visual stability) as they are heavily weighted.
                </li>
                <li>
                    <span className="font-semibold">Optimize Server Response (TTFB):</span> Ensure the server responds in under 800ms using caching and database optimization to build a strong foundation.
                </li>
                <li>
                    <span className="font-semibold">Minimize Main Thread Blocking (TBT):</span> Break up long JavaScript tasks and defer non-critical scripts to keep the page interactive.
                </li>
                <li>
                    <span className="font-semibold">Maximize Asset Optimization:</span> Compress text resources (Gzip/Brotli), cache static assets for &gt;7 days, and resize/compress images.
                </li>
                <li>
                    <span className="font-semibold">Clear the Render Path:</span> Eliminate render-blocking resources and remove unnecessary redirect chains to speed up the first paint.
                </li>
            </ul>
        ),
        howThisScoreIsCalculated: "We calculate a weighted average of Core Web Vitals (45%), Load Speed metrics (22%), and Technical Optimization checks (33%). Lab data from Lighthouse and Field data from CrUX (if available) are combined to provide the most accurate assessment of real-world performance.",
        weightage: [
            { param: "Largest Contentful Paint (LCP)", weight: "15%" },
            { param: "Interaction to Next Paint (INP)", weight: "15%" },
            { param: "Cumulative Layout Shift (CLS)", weight: "15%" },
            { param: "First Contentful Paint (FCP)", weight: "6%" },
            { param: "Time to First Byte (TTFB)", weight: "8%" },
            { param: "Total Blocking Time (TBT)", weight: "8%" },
            { param: "Speed Index (SI)", weight: "8%" },
            { param: "Asset Optimization (Compression, Caching, etc.)", weight: "25%" }
        ]
    },

    // On-Page SEO
    Title: {
        title: "Title Tag",
        whatThisParameterIs: "The Title Tag is an HTML element (<title>) that specifies the title of a web page, which is displayed on search engine results pages (SERPs) and in the browser's title bar.",
        whatItCalculates: "We extract the `<title>` tag content and validate its length is between 30 and 60 characters.",
        whyItMatters: "Title tags are the primary way search engines and users determine the relevance of your page to a search query.",
        thresholds: {
            good: "30–60 characters",
            needsImprovement: "<30 or >60 characters",
            poor: "Missing title tag"
        },
        actualReasonsForFailure: [
            "Title tag missing entirely",
            "Title length < 30 characters (Too Short)",
            "Title length > 60 characters (Too Long)",
            "Title tag empty"
        ],
        howToOvercomeFailure: [
            "Add a <title> tag with a descriptive title inside <head>",
            "Expand short titles to at least 30 characters",
            "Shorten long titles to approx. 60 characters",
            "Include primary keywords and brand name"
        ]
    },
    Meta_Description: {
        title: "Meta Description",
        whatThisParameterIs: "A Meta Description is an HTML attribute that provides a brief summary of a web page's content, often appearing as the snippet text under the title in search engine results.",
        whatItCalculates: "We extract the `<meta name='description'>` content and validate its length is between 50 and 160 characters.",
        whyItMatters: "A compelling meta description acts as an ad for your page in search results, directly influencing click-through rates.",
        thresholds: {
            good: "50–160 characters",
            needsImprovement: "<50 or >160 characters",
            poor: "Missing meta description"
        },
        actualReasonsForFailure: [
            "Meta description missing",
            "Description length < 50 characters (Too Short)",
            "Description length > 160 characters (Too Long)",
            "Description content empty"
        ],
        howToOvercomeFailure: [
            "Add a <meta name='description'> tag to the <head>",
            "Expand description to at least 50 characters",
            "Shorten description to around 155-160 characters",
            "Summarize page content accurately"
        ]
    },
    Canonical: {
        title: "Canonical Tag",
        whatThisParameterIs: "A Canonical Tag (rel='canonical') is an HTML snippet that defines the main version for duplicate, near-duplicate, or similar pages, telling search engines which URL to index.",
        whatItCalculates: "We verify the presence of a single `<link rel='canonical'>` tag and check if it points to a valid, absolute URL that matches the current page (self-referencing).",
        whyItMatters: "Canonical tags tell search engines which URL represents the master copy of a page, preventing duplicate content penalties.",
        thresholds: {
            good: "Single valid canonical tag (1.0)",
            needsImprovement: "Points to external URL (0.5)",
            poor: "Missing or invalid canonical (0)"
        },
        actualReasonsForFailure: [
            "Canonical tag missing",
            "Canonical points to external domain",
            "Multiple canonical tags found",
            "Canonical href is empty"
        ],
        howToOvercomeFailure: [
            "Add a <link rel='canonical'> pointing to the authoritative URL",
            "Ensure only one canonical tag is present",
            "Correct the URL format (absolute URL required)",
            "Point canonical to self if page is master version"
        ]
    },
    URL_Structure: {
        title: "URL Structure",
        whatThisParameterIs: "URL Structure refers to the format, length, and readability of the web address that locates a specific page on the internet.",
        whatItCalculates: "We parse the URL path to check for uppercase letters, underscores, depth (>3 segments), and query parameters.",
        whyItMatters: "Clean, descriptive URLs are easier for users to read and for search engines to crawl and index.",
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
            "Refactor layout to use <header>, <nav>, <main>, <footer>",
            "Convert <div> elements to semantic tags where appropriate",
            "Ensure correct nesting of semantic regions"
        ]
    },
    H1: {
        title: "H1 Tag",
        whatThisParameterIs: "The H1 Tag is the primary heading element in HTML, used to define the main underlying topic of the webpage's content.",
        whatItCalculates: "We count the number of `<h1>` tags on the page to ensure exactly one exists.",
        whyItMatters: "The H1 tag is the most important heading, signaling the main topic of the page to both users and search engines.",
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
            "Add exactly one <h1> tag per page",
            "Consolidate multiple headings into one H1",
            "Ensure H1 describes the main topic"
        ]
    },
    Image: {
        title: "Image Optimization",
        whatThisParameterIs: "Image Optimization is the process of delivering high-quality images in the right format, dimension, and resolution while keeping the smallest possible file size.",
        whatItCalculates: "We scan all `<img>` tags for the presence of `alt` attributes, filter out generic terms (e.g. 'image'), and check if file sizes exceed 150KB.",
        whyItMatters: "Optimized images load faster and, with proper alt text, become accessible to screen readers and indexable by image search.",
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
            "Add descriptive Alt text to all images",
            "Compress large files to under 150KB",
            "Use WebP format recommended"
        ]
    },
    Video: {
        title: "Video Optimization",
        whatThisParameterIs: "Video Optimization refers to the technical configuration of video content (embedding, lazy loading, metadata) to ensure it plays efficiently without slowing down page load.",
        whatItCalculates: "We identify `<video>` and `<iframe>` elements (YouTube/Vimeo) and check for `loading='lazy'` attributes and schema metadata.",
        whyItMatters: "Properly optimized and embedded videos enhance engagement without sacrificing page load speed.",
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
        whatThisParameterIs: "Semantic HTML Tags are HTML elements that clearly provide meaning to the web page structure (e.g., <article>, <nav>, <section>) for browsers and screen readers.",
        whatItCalculates: "We check for the presence of core HTML5 landmarks: `<main>`, `<nav>`, `<header>`, `<footer>`, `<article>`, `<section>`, and `<aside>`.",
        whyItMatters: "Semantic HTML improves accessibility and helps search engines understand the structure and importance of your content.",
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
        whatThisParameterIs: "Contextual Linking refers to the practice of placing hyperlinks within the body text of a webpage that point to other relevant internal content.",
        whatItCalculates: "We identify links within the main content area (excluding navigation menus) and check if they point to internal pages.",
        whyItMatters: "Internal links help distribute page authority and guide users and crawlers to related content.",
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
            "Add internal links naturally within content body",
            "Link to key service/category pages from article text",
            "Use descriptive anchor text for contextual links"
        ]
    },
    Heading_Hierarchy: {
        title: "Heading Hierarchy",
        whatThisParameterIs: "Heading Hierarchy is the logical arrangement of a webpage's headings (H1 to H6) to create a clear, nested structure for the content.",
        whatItCalculates: "We traverse the heading tags (H1-H6) in document order to ensure no levels are skipped (e.g., H2 followed immediately by H4).",
        whyItMatters: "A logical heading structure makes content easier to skim for users and easier to parse for search engines.",
        thresholds: {
            good: "Logical hierarchy (1.0)",
            needsImprovement: "N/A",
            poor: "Skips levels or missing H1 (0)"
        },
        actualReasonsForFailure: [
            "Skipped heading levels",
            "Missing H1 tag",
            "Improper heading order"
        ],
        howToOvercomeFailure: [
            "Fix skipped heading levels (e.g. H2 -> H3)",
            "Start hierarchy with H1",
            "Use H2-H6 for subsections logically"
        ]
    },
    Content_Quality: {
        title: "Content Quality",
        whatThisParameterIs: "Content Quality uses heuristics like word count and sentence repetition to assess the depth and originality of the page content.",
        whatItCalculates: "We count the words in the main content area (aiming for >300) and detect repeated sentences to identify thin or duplicate content.",
        whyItMatters: "High-quality, unique content is the single most important factor for ranking well in search results.",
        thresholds: {
            good: "≥300 words, low repetition",
            needsImprovement: "Some repetition detected",
            poor: "Thin or highly repetitive content"
        },
        actualReasonsForFailure: [
            "Total word count < 300 words (Thin Content)",
            "High sentence repetition ratio (>10%)",
            "Duplicate text blocks detected"
        ],
        howToOvercomeFailure: [
            "Add unique, valuable content (> 300 words)",
            "Rewrite repeated sentences",
            "Ensure content provides depth on the topic"
        ]
    },
    Links: {
        title: "Anchor Text Quality",
        whatThisParameterIs: "Anchor Text is the visible, clickable text in a hyperlink that links one page to another.",
        whatItCalculates: "We analyze anchor text for generic phrases (e.g., 'click here') and calculate the ratio of descriptive links.",
        whyItMatters: "Descriptive anchor text provides context to users and search engines about the destination page's topic.",
        thresholds: {
            good: "≥ 75% descriptive anchors (1.0)",
            needsImprovement: "< 75% descriptive (0.5)",
            poor: "N/A"
        },
        actualReasonsForFailure: [
            "High ratio of generic anchors ('click here')",
            "No internal links found",
            "Links with empty anchor text",
            "Unsafe external links (missing target='_blank')"
        ],
        howToOvercomeFailure: [
            "Update generic link text to be descriptive",
            "Ensure healthy mix of internal/external links",
            "Set target='_blank' for external links"
        ]
    },
    URL_Slugs: {
        title: "URL Slugs",
        whatThisParameterIs: "A URL Slug is the specific part of a URL that identifies a particular page on a website in a human-readable form.",
        whatItCalculates: "We analyze the last segment of the URL path for length (>50 chars), uppercase letters, underscores, and numeric IDs.",
        whyItMatters: "Readable slugs with keywords improve user experience and can provide a slight ranking boost.",
        thresholds: {
            good: "Clean slug (1.0)",
            needsImprovement: "Formatting issues (0.5)",
            poor: "N/A"
        },
        actualReasonsForFailure: [
            "Slug too long",
            "Uppercase letters or underscores",
            "Numbers or IDs in slug"
        ],
        howToOvercomeFailure: [
            "Simplify the URL structure",
            "Use lowercase letters only",
            "Use hyphens instead of underscores",
            "Keep path depth shallow (< 4 segments)"
        ]
    },
    Structured_Data: {
        title: "Structured Data (Schema Markup)",
        whatThisParameterIs: "Structured Data (Schema Markup) is a standardized format for providing information about a page and classifying the page content for search engines.",
        whatItCalculates: "We search for `<script type='application/ld+json'>` blocks and validate their JSON content.",
        whyItMatters: "Structured data enables rich snippets (like stars, prices, or events) in search results, increasing visibility.",
        thresholds: {
            good: "Schema detected (1.0)",
            needsImprovement: "N/A",
            poor: "No schema detected (0)"
        },
        actualReasonsForFailure: [
            "No JSON-LD script found",
            "Invalid JSON syntax in script",
            "Missing required Schema properties",
            "Unrecognized @type"
        ],
        howToOvercomeFailure: [
            "Add relevant JSON-LD schema markup",
            "Validate schema with Google Rich Results Test",
            "Fix JSON syntax errors"
        ]
    },
    Open_Graph: {
        title: "Open Graph Tags",
        whatThisParameterIs: "The Open Graph protocol is a set of meta tags that allows any web page to become a rich object in a social graph, controlling how it looks when shared.",
        whatItCalculates: "We check for the presence of `og:title`, `og:description`, `og:image`, and `og:url` meta tags.",
        whyItMatters: "Open Graph tags ensure your content looks attractive and professional when shared on social media, driving more clicks.",
        thresholds: {
            good: "og:title, og:image, and og:url present",
            needsImprovement: "Some required Open Graph tags missing",
            poor: "No Open Graph tags found"
        },
        actualReasonsForFailure: [
            "Missing 'og:title' or 'og:image'",
            "Missing 'og:url' property",
            "Incomplete set of Open Graph tags",
            "Empty content in OG tags"
        ],
        howToOvercomeFailure: [
            "Add 'og:title', 'og:image', and 'og:url' meta tags",
            "Ensure image URLs are absolute and valid",
            "Fill in missing OG properties"
        ]
    },
    Twitter_Card: {
        title: "Twitter Card Tags",
        whatThisParameterIs: "Twitter Cards are a type of meta tag implementation that allows users to attach rich photos, videos, and media experiences to Tweets.",
        whatItCalculates: "We check for `twitter:card`, `twitter:title`, `twitter:description`, and `twitter:image` meta tags.",
        whyItMatters: "Twitter Cards transform standard links into rich media experiences, increasing engagement and followers from tweets.",
        thresholds: {
            good: "twitter:card and twitter:title present",
            needsImprovement: "Some required Twitter Card tags missing",
            poor: "No Twitter Card tags found"
        },
        actualReasonsForFailure: [
            "Missing 'twitter:card' definition",
            "Missing 'twitter:title'",
            "Missing 'twitter:image'",
            "Empty content in Twitter tags"
        ],
        howToOvercomeFailure: [
            "Add 'twitter:card' and 'twitter:title' meta tags",
            "Ensure twitter:image is present",
            "Validate with Twitter Card Validator"
        ]
    },
    Social_Links: {
        title: "Social Profile Links",
        whatThisParameterIs: "Social Profile Links are hyperlinks on a website that direct users to the entity's official profiles on social networking platforms.",
        whatItCalculates: "We scan all external links to identify URLs matching known social media platforms (Facebook, Twitter, LinkedIn, etc.).",
        whyItMatters: "Linking to social profiles verifies your brand identity and provides users with legitimate ways to connect.",
        thresholds: {
            good: "Social links present (1.0)",
            needsImprovement: "N/A",
            poor: "No social links found (0)"
        },
        actualReasonsForFailure: [
            "No external links to social domains found",
            "Links to social profiles broken",
            "Social links not recognized"
        ],
        howToOvercomeFailure: [
            "Add links to your official social media profiles",
            "Fix broken or incorrect social URLs",
            "Ensure links point to recognized platforms"
        ]
    },

    Robots_Txt: {
        title: "Robots.txt",
        whatThisParameterIs: "The robots.txt file is a text file that resides in the root directory of a site and instructs web crawlers which pages or files they can or cannot request.",
        whatItCalculates: "We attempt to fetch the `/robots.txt` file from the root domain.",
        whyItMatters: "A properly configured robots.txt file helps manage crawl budget and prevents search engines from indexing private or irrelevant sections of your site.",
        thresholds: {
            good: "File exists (1.0)",
            needsImprovement: "N/A",
            poor: "File missing (0)"
        },
        actualReasonsForFailure: [
            "Robots.txt file not found (404)",
            "File exists but is empty",
            "Server error preventing fetch"
        ],
        howToOvercomeFailure: [
            "Create a valid robots.txt file at root domain",
            "Ensure it allows crawling of important content",
            "Fix server errors preventing file access"
        ]
    },
    Sitemap: {
        title: "XML Sitemap",
        whatThisParameterIs: "An XML Sitemap is a file that lists a website's essential pages to make sure search engines can find and crawl them all.",
        whatItCalculates: "We attempt to fetch the `/sitemap.xml` file from the root domain.",
        whyItMatters: "Sitemaps act as a roadmap for search engines, ensuring that newly created or updated pages are found and indexed quickly.",
        thresholds: {
            good: "File exists (1.0)",
            needsImprovement: "N/A",
            poor: "File missing (0)"
        },
        actualReasonsForFailure: [
            "Sitemap.xml not found (404)",
            "Sitemap file is empty",
            "Server error preventing fetch"
        ],
        howToOvercomeFailure: [
            "Generate and upload sitemap.xml to root",
            "Submit sitemap to Google Search Console",
            "Ensure sitemap contains valid URLs"
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
                    <span className="font-semibold">Prioritize High-Weight Content Signals:</span> Focus on unique Page Titles (15%), compelling H1 tags (10%), and high-quality, non-duplicate content (12%).
                </li>
                <li>
                    <span className="font-semibold">Build Strong Internal Connectivity:</span> Ensure contextual links (8%) point to key pages and your URL structure (3%) is clean and descriptive.
                </li>
                <li>
                    <span className="font-semibold">Technical Authority:</span> Implement correct Canonical tags (8%) to prevent duplication and valid Structured Data (6%) for rich snippets.
                </li>
                <li>
                    <span className="font-semibold">Optimize Media & Structure:</span> Ensure all images have Alt text (8%) and follow a logical Heading Hierarchy (3%).
                </li>
                <li>
                    <span className="font-semibold">Ensure Crawlability:</span> Maintain a valid Sitemap (5%) and Robots.txt (4%) to help search engines index your site effectively.
                </li>
            </ul>
        ),
        howThisScoreIsCalculated: (
            <div className="space-y-2">
                <p>The On-Page SEO score is a weighted sum of 18 distinct ranking factors. We prioritize elements that have the highest correlation with search rankings, such as unique content, title tags, and technical crawling directives.</p>
                <p>Content quality and basic metadata make up nearly half the score, while technical elements like canonicals and sitemaps form the backbone of crawlability.</p>
            </div>
        ),
        weightage: [
            { param: "Title Tag", weight: "15%" },
            { param: "Content Quality (Uniqueness)", weight: "12%" },
            { param: "H1 Tag", weight: "10%" },
            { param: "Meta Description", weight: "8%" },
            { param: "Image Optimization", weight: "8%" },
            { param: "Canonical Tag", weight: "8%" },
            { param: "Contextual Linking", weight: "8%" },
            { param: "Structured Data", weight: "6%" },
            { param: "Sitemap & Robots.txt", weight: "9%" },
            { param: "Other Factors (Headings, Social, URLs)", weight: "16%" }
        ]
    },

    // Accessibility
    Color_Contrast: {
        title: "Color Contrast",
        whatThisParameterIs: "Color Contrast is the difference in luminance between foreground text and its background.",
        whatItCalculates: "It computes the contrast ratio of text elements against their computed background color and checks for WCAG AA (4.5:1) compliance.",
        whyItMatters: "Sufficient contrast is vital for users with low vision or color blindness to read content without strain.",
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
        whatThisParameterIs: "Focus Order ensures that the sequence in which elements receive focus is logical and intuitive.",
        whatItCalculates: "It tabulates the order of focusable elements in the DOM and verifies if it matches the visual layout.",
        whyItMatters: "A logical focus order allows keyboard users to navigate the page in a predictable and efficient manner.",
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
        whatThisParameterIs: "Focusable Content checks that all interactive interface components can be accessed via keyboard.",
        whatItCalculates: "It identifies interactive elements (buttons, links, inputs) and verifies they do not have tabindex='-1' unless intended.",
        whyItMatters: "Ensuring all interactive elements are focusable guarantees that keyboard-only users can use your site.",
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
        whatThisParameterIs: "Tabindex Usage controls the order of keyboard navigation for an element.",
        whatItCalculates: "It scans for tabindex attributes, flagging positive values (which disrupt natural order) or unnecessary use on non-interactive elements.",
        whyItMatters: "Proper tabindex usage preserves the natural navigation flow, preventing confusion for keyboard users.",
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
        whatThisParameterIs: "Interactive Element Affordance ensures that clickable elements are visually distinct.",
        whatItCalculates: "It checks computed styles of interactive elements to ensuring they have distinct visual indicators like hover/focus states or standard cursors.",
        whyItMatters: "Clear visual cues for interactive elements help all users, especially those with cognitive disabilities, identifying what is clickable.",
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
        whatThisParameterIs: "Form Labels provide text descriptions for input fields, essential for screen readers.",
        whatItCalculates: "It verifies that every <input>, <select>, and <textarea> has an associated <label>, aria-label, or aria-labelledby attribute.",
        whyItMatters: "Labels are essential for screen readers to identify the purpose of form fields, enabling users to input data correctly.",
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
        whatThisParameterIs: "ARIA Allowed Attributes ensures that ARIA attributes are valid for the element's role.",
        whatItCalculates: "It checks elements with ARIA roles to ensure the attributes used (e.g., aria-checked) are permitted for that specific role.",
        whyItMatters: "Correct ARIA usage prevents technical conflicts that can render assistive technologies unable to interpret the element.",
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
        whatThisParameterIs: "ARIA Roles define the semantic purpose of an element to assistive technologies.",
        whatItCalculates: "It validates role attribute values against the WAI-ARIA specification to ensure they are standard and correctly applied.",
        whyItMatters: "Valid ARIA roles ensure that screen readers correctly announce the purpose and behavior of custom widgets.",
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
        whatThisParameterIs: "ARIA Hidden Focus prevents elements hidden from screen readers from receiving keyboard focus.",
        whatItCalculates: "It identifies elements with aria-hidden='true' and checks if they or their descendants contain focusable elements.",
        whyItMatters: "Hidden focusable elements can trap keyboard users in invisible parts of the page, causing severe usability issues.",
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
        whatThisParameterIs: "Image Alt Text provides a textual alternative for images for users who cannot see them.",
        whatItCalculates: "It checks all <img> elements for the presence of a non-empty alt attribute, unless marked as decorative.",
        whyItMatters: "Alternative text provides the content and function of images to users who cannot see them, including screen reader users.",
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
        whatThisParameterIs: "Skip Links provide a mechanism for users to bypass repeated content (like headers) and jump to the main content.",
        whatItCalculates: "It looks for an internal link at the top of the body that points to the main content area and is visible on focus.",
        whyItMatters: "Skip links are a crucial efficiency feature for keyboard users, allowing them to bypass repetitive navigation menus.",
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
        whatThisParameterIs: "Landmark Roles programmatically identify sections of a page (banner, main, navigation) to aid navigation.",
        whatItCalculates: "It checks for the presence of HTML5 landmark elements or equivalent role attributes on major page sections.",
        whyItMatters: "Landmarks allow screen reader users to jump directly to major sections of the page, significantly improving navigation speed.",
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
        whatThisParameterIs: "HTTPS Usage confirms that the website is communicating over a secure channel.",
        whatItCalculates: "It verifies that the page is loaded via the https protocol scheme.",
        whyItMatters: "HTTPS encrypts data between users and servers, ensuring that sensitive information like passwords and credit card numbers cannot be intercepted.",
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
        whatThisParameterIs: "SSL Connection validates the handshake and establishment of a secure session.",
        whatItCalculates: "It attempts to establish a TLS connection to the server and verifies the handshake succeeds without errors.",
        whyItMatters: "A valid SSL connection is the prerequisite for establishing a secure, encrypted channel between client and server.",
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
        whatThisParameterIs: "SSL Certificate Validity checks the expiration date of the server's security certificate.",
        whatItCalculates: "It inspects the certificate's validTo date field and compares it against the current date.",
        whyItMatters: "An expired certificate triggers scary browser warnings that drive visitors away and breaks the secure connection.",
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
        whatThisParameterIs: "TLS Version indicates the security protocol version used for encryption.",
        whatItCalculates: "It negotiates the connection to determine the protocol version (e.g., TLS 1.2, 1.3) and flags obsolete versions like 1.0/1.1.",
        whyItMatters: "Older TLS versions have known security flaws that can be exploited to decrypt sensitive traffic.",
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
        whatThisParameterIs: "X-Frame-Options Header controls whether the site can be embedded in iframes, preventing clickjacking.",
        whatItCalculates: "It checks HTTP response headers for the presence and value (DENY/SAMEORIGIN) of X-Frame-Options.",
        whyItMatters: "This header prevents your site from being secretly embedded in other sites, protecting users from clickjacking attacks.",
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
        whatThisParameterIs: "X-Content-Type-Options Header prevents browsers from interpreting files as a different MIME type.",
        whatItCalculates: "It checks HTTP response headers for X-Content-Type-Options: nosniff.",
        whyItMatters: "Prevents the browser from being tricked into executing malicious code disguised as a different file type.",
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
        whatThisParameterIs: "HTTP Strict Transport Security (HSTS) instructs browsers to only interact with the site using HTTPS.",
        whatItCalculates: "It checks execution for the Strict-Transport-Security response header and its max-age directive.",
        whyItMatters: "HSTS eliminates the window of vulnerability during the initial HTTP request, forcing a secure connection immediately.",
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
        whatThisParameterIs: "Content Security Policy (CSP) restricts the sources from which content can be loaded.",
        whatItCalculates: "It checks for the Content-Security-Policy header and validates its directives.",
        whyItMatters: "CSP is a powerful defense that restricts the sources of executable scripts, effectively mitigating most XSS attacks.",
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
        whatThisParameterIs: "Secure Cookies Flag ensures that cookies are only transmitted over encrypted HTTPS connections.",
        whatItCalculates: "It iterates through all cookies set by the page and checks if the Secure attribute is present.",
        whyItMatters: "The Secure flag ensures that cookies containing sensitive session IDs are never sent over insecure HTTP connections.",
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
        whatThisParameterIs: "HttpOnly Cookies Flag prevents client-side scripts from accessing cookies, mitigating XSS attacks.",
        whatItCalculates: "It iterates through all cookies and verifies the presence of the HttpOnly attribute.",
        whyItMatters: "The HttpOnly flag protects session cookies from being stolen via XSS vulnerabilities.",
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
        whatThisParameterIs: "SQL Injection Exposure checks for common patterns that indicate database vulnerabilities.",
        whatItCalculates: "It sends test payloads (like ' OR '1'='1) to input fields or URL parameters and analyzes the response for database error messages.",
        whyItMatters: "SQL injection is a critical vulnerability that can allow attackers to steal, delete, or modify your entire database.",
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
        whatThisParameterIs: "Cross-Site Scripting (XSS) Protection involves sanitizing user input and preventing execution of malicious scripts.",
        whatItCalculates: "It simulates input reflection by injecting safe test strings and checking if they are returned unescaped in the HTML response.",
        whyItMatters: "XSS vulnerabilities allow attackers to execute arbitrary scripts in victims' browsers, potentially stealing sessions or data.",
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
        whatThisParameterIs: "Cookie Consent Banner is a mechanism to obtain user permission for tracking cookies.",
        whatItCalculates: "It searches the DOM for common cookie banner text/identifiers or checks for specific cookie consent management platform (CMP) scripts.",
        whyItMatters: "Transparent cookie practices and consent mechanisms are legal requirements in many jurisdictions (GDPR/CCPA).",
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
        whatThisParameterIs: "Privacy Policy Availability ensures users can access information about data handling practices.",
        whatItCalculates: "It scans the page (especially footer links) for anchor tags containing text like 'Privacy Policy' or 'Privacy'.",
        whyItMatters: "A clear privacy policy builds trust by informing users exactly how their personal data is collected and used.",
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
        whatThisParameterIs: "Public Admin Panel Exposure checks if sensitive administrative interfaces are accessible to the public.",
        whatItCalculates: "It probes common administrative paths (e.g., /admin, /wp-admin, /login) to see if they return a 200 OK status accessible to unauthenticated users.",
        whyItMatters: "Hiding admin login pages reduces the risk of brute-force attacks and automated vulnerability scanning.",
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
        whatThisParameterIs: "Multi-Factor Authentication (MFA) Availability checks for indicators that the site supports stronger authentication methods.",
        whatItCalculates: "It detects the presence of SSO (Single Sign-On) options or text indicating '2FA', 'MFA', or 'Authenticator' on login pages.",
        whyItMatters: "MFA significantly reduces the risk of account compromise, even if a password is stolen.",
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
        whatThisParameterIs: "Google Safe Browsing Status indicates if the site is listed in Google's database of unsafe websites.",
        whatItCalculates: "It queries the Google Safe Browsing API with the site's URL to check for malware or phishing flags.",
        whyItMatters: "Being blacklisted by Google Safe Browsing results in a 'Deceptive Site Ahead' warning that blocks almost all traffic.",
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
        whatThisParameterIs: "Domain Blacklist Status checks if the domain is present on major security blocklists.",
        whatItCalculates: "It cross-references the domain against aggregated DNSBL (DNS-based Blackhole List) databases.",
        whyItMatters: "Email and security blacklists can cause your emails to be marked as spam and your site to be blocked by firewalls.",
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
        whatThisParameterIs: "Malware Detection scans the website's public files for signatures of known malicious code.",
        whatItCalculates: "It analyzes response content and external resources for patterns matching known malware signatures or webshells.",
        whyItMatters: "Detecting and removing malware is critical to protecting your users' devices and your site's reputation.",
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
        whatThisParameterIs: "Secure Form Submission ensures that all data entered into forms is sent securely.",
        whatItCalculates: "It parses action attributes of all <form> tags to ensure they start with https:// or are relative paths on an HTTPS site.",
        whyItMatters: "Submitting forms over HTTP exposes user data (passwords, credit cards) to anyone monitoring the network.",
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
        whatThisParameterIs: "GDPR / CCPA Compliance checks for explicit user data rights and consent mechanisms.",
        whatItCalculates: "It looks for text or links related to 'Do Not Sell My Personal Information', 'GDPR', 'CCPA', or 'Cookie Settings'.",
        whyItMatters: "Adhering to privacy laws avoids hefty fines and demonstrates respect for user privacy rights.",
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

    Text_Readability: {
        title: "Text Readability",
        whatThisParameterIs: "Text Readability analysis evaluates the complexity of your content using the Flesch Reading Ease formula.",
        whatItCalculates: "It analyzes sentence length and syllable count to determine a readability score (0-100).",
        whyItMatters: "Content that is easy to read improves user comprehension, engagement, and retention.",
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

    Tap_Target_Size: {
        title: "Tap Target Size",
        whatThisParameterIs: "Tap Target Size checks if interactive elements are large enough for touch interactions.",
        whatItCalculates: "It measures the rendered dimensions of buttons/links and verifies they meet the 48x48px (or similar) guidelines.",
        whyItMatters: "Small tap targets cause frustration and misclicks by users on mobile devices.",
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
        whatThisParameterIs: "Text Font Size ensures that text is legible on mobile devices without zooming.",
        whatItCalculates: "It checks computed font sizes of text elements against a minimum threshold (e.g., 12px or 16px).",
        whyItMatters: "Small text forces users to zoom or squint, harming accessibility and mobile experience.",
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
        whatThisParameterIs: "Horizontal Scroll Check detects if the page content overflows the viewport width.",
        whatItCalculates: "It compares the scrollWidth of the document body against the clientWidth.",
        whyItMatters: "Horizontal scrolling on mobile is a major usability flaw that breaks the user experience.",
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
        whatThisParameterIs: "Sticky Header Analysis checks if fixed headers obstruct too much of the screen.",
        whatItCalculates: "It calculates the height of fixed-position head elements relative to the viewport height.",
        whyItMatters: "Oversized sticky headers reduce the visible area for content, frustrating users.",
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
        whatThisParameterIs: "Navigation Depth measures how many clicks it takes to reach specific pages.",
        whatItCalculates: "It analyzes the URL structure or crawl depth to determine the distance from the homepage.",
        whyItMatters: "Deeply buried content is harder for users and search engines to find.",
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
        whatThisParameterIs: "Intrusive Interstitials Check detects popups that block the main content.",
        whatItCalculates: "It identifies fixed-position elements with high z-index that cover a significant portion of the viewport on load.",
        whyItMatters: "Popups that block content annoy users and can trigger SEO penalties.",
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
        whatThisParameterIs: "Image Stability checks if images have explicit dimensions to prevent layout shifts.",
        whatItCalculates: "It verifies that width and height attributes (or CSS aspect-ratio) are set on image elements.",
        whyItMatters: "Images without dimensions cause the layout to jump as they load, creating a jarring experience.",
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
        whatThisParameterIs: "Breadcrumb Navigation checks for the presence of breadcrumb trails.",
        whatItCalculates: "It looks for structured data (BreadcrumbList) or navigation links matching a breadcrumb pattern.",
        whyItMatters: "Breadcrumbs provide context and an easy way for users to navigate back to parent categories.",
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
        whatThisParameterIs: "Navigation Discoverability ensures menus and search features are easily accessible on mobile.",
        whatItCalculates: "It checks for the presence of a visible 'hamburger' menu icon or search bar in the viewport.",
        whyItMatters: "Hidden or hard-to-find navigation causes users to feel lost and leave the site.",
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
        whatThisParameterIs: "Above-the-Fold Content checks if the primary content is visible without scrolling.",
        whatItCalculates: "It analyzes the content density in the initial viewport compared to headers/banners.",
        whyItMatters: "Users decide in seconds whether to stay; empty visible space leads to high bounce rates.",
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
        whatThisParameterIs: "Click Feedback ensures interactive elements provide visual response states.",
        whatItCalculates: "It checks for :hover and :active CSS styles or cursor changes on clickable elements.",
        whyItMatters: "Visual feedback confirms to the user that their interaction was registered.",
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
        whatThisParameterIs: "Form Validation UX checks for user-friendly validation messages.",
        whatItCalculates: "It tests form submission with invalid data and checks for the appearance of error messages/styles.",
        whyItMatters: "Clear validation helps users correct errors quickly and complete forms successfully.",
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
        whatThisParameterIs: "Loading Feedback checks for visual indicators during wait times.",
        whatItCalculates: "It detects the presence of spinners, skeleton screens, or progress bars during async operations.",
        whyItMatters: "Loading indicators reduce perceived wait time and reassure users the system is working.",
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
        whatThisParameterIs: "Call-to-Action Visibility ensures that your primary conversion buttons are immediately noticeable.",
        whatItCalculates: "It scans the Fold and key sections for button elements with high visual weight (size, color).",
        whyItMatters: "If users can't find the 'Buy' or 'Sign Up' button in seconds, conversion rates drop significantly.",
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
        whatThisParameterIs: "CTA Text Clarity evaluates the language used on buttons to ensure it drives action.",
        whatItCalculates: "It analyzes button text for action verbs (e.g., 'Get', 'Start', 'Join') vs generic text ('Submit', 'Click Here').",
        whyItMatters: "Action-oriented text reduces friction by explicitly telling the user what will happen next.",
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
        whatThisParameterIs: "CTA Color Contrast checks if buttons stand out against their background.",
        whatItCalculates: "It computes the luminance contrast ratio between the button background and the surrounding container.",
        whyItMatters: "High contrast ensures CTAs draw the eye and meet accessibility standards for all users.",
        thresholds: {
            good: "Contrast ratio ≥ 4.5",
            poor: "Low contrast CTAs"
        },
        actualReasonsForFailure: [
            "CTA color blends with background",
            "Low contrast brand colors"
        ],
        howToOvercomeFailure: [
            "Increase contrast ratio between text and background",
            "Test contrast using accessibility tools"
        ]
    },
    CTA_Crowding: {
        title: "CTA Crowding",
        whatThisParameterIs: "CTA Crowding Analysis checks for competing calls-to-action in the same section.",
        whatItCalculates: "It counts the number of primary button elements within a single viewport height.",
        whyItMatters: "Too many choices cause analysis paralysis, resulting in users taking no action at all.",
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
        whatThisParameterIs: "CTA Flow Alignment validates that CTAs appear at logical decision points.",
        whatItCalculates: "It checks the position of CTAs relative to content blocks (e.g., after value props or pricing).",
        whyItMatters: "Asking for a commitment before providing value leads to rejection; timing is key.",
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
        whatThisParameterIs: "Lead Form Presence checks availability of mechanisms for users to convert.",
        whatItCalculates: "It detects <form> elements or input fields specifically associated with lead capture (email, phone).",
        whyItMatters: "Without a functional form, there is no way for interested visitors to become leads.",
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
        whatThisParameterIs: "Form Length Optimization evaluates the friction caused by the number of fields.",
        whatItCalculates: "It counts the number of visible input fields in the primary conversion form.",
        whyItMatters: "Every additional field decreases conversion rates; shorter forms perform significantly better.",
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
        whatThisParameterIs: "Field Requirement Clarity ensures users know which fields are mandatory.",
        whatItCalculates: "It checks for visual indicators (asterisks, 'Optional' text) on form labels.",
        whyItMatters: "Unclear requirements lead to validation errors and frustration, causing abandonment.",
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
        whatThisParameterIs: "Inline Form Validation checks for real-time feedback on user input.",
        whatItCalculates: "It simulates input typing and checks for immediate validity messages (HTML5 or custom JS).",
        whyItMatters: "Correcting errors as they happen is much less frustrating than submitting and getting a list of errors.",
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
        whatThisParameterIs: "Submit Button Clarity checks that the final action button describes the outcome.",
        whatItCalculates: "It analyzes the text of the submit button for specificity (e.g., 'Create Account' vs 'Submit').",
        whyItMatters: "Generic labels like 'Submit' create a disconnect; specific labels reinforce the value proposition.",
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
        whatThisParameterIs: "Testimonial Presence verifies that social proof elements are displayed to build credibility.",
        whatItCalculates: "It scans the page for keywords like 'testimonial', 'review', or 'client says' in section headers.",
        whyItMatters: "User testimonials reduce anxiety and build trust, which are critical for conversion.",
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
        whatThisParameterIs: "Trust Badge Verification checks for security seals or payment icons.",
        whatItCalculates: "It looks for images with alt text containing 'secure', 'ssl', 'visa', 'paypal', or 'guarantee'.",
        whyItMatters: "Visual symbols of security reassure users that their data and money are safe.",
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
        whatThisParameterIs: "Contact Information Availability ensures users can easily reach your business.",
        whatItCalculates: "It searches specifically for phone numbers, email addresses, or a 'Contact Us' link in the header/footer.",
        whyItMatters: "Visible contact details legitimize the business and provide a safety net for hesitant buyers.",
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
        whatThisParameterIs: "Live Chat Availability checks for real-time support options.",
        whatItCalculates: "It detects scripts from known chat providers (Intercom, Drift, Zendesk) or chat widget elements.",
        whyItMatters: "Immediate answers to pre-sales questions can prevent users from abandoning the site.",
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
        whatThisParameterIs: "Lead Magnet Detection looks for high-value free resources offered in exchange for contact info.",
        whatItCalculates: "It identifies potential offers like 'ebook', 'guide', 'whitepaper', or 'free trial'.",
        whyItMatters: "Lead magnets are effective for capturing early-stage prospect emails.",
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
        whatThisParameterIs: "Scarcity & Urgency Signals checks for time-sensitive or limited-stock messaging.",
        whatItCalculates: "It scans for text patterns like 'limited time', 'only X left', 'expires in', or countdown timers.",
        whyItMatters: "Urgency triggers 'Fear Of Missing Out' (FOMO), encouraging faster decision-making.",
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
        whatThisParameterIs: "Autofocus Optimization checks if the first input field is automatically selected on load.",
        whatItCalculates: "It verifies if the autofocus attribute is present on the primary input field of key forms.",
        whyItMatters: "Autofocus saves the user a click and immediately invites them to start typing.",
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
        whatThisParameterIs: "Multi-Step Form Progress checks for indicators in long forms.",
        whatItCalculates: "It looks for ordered lists or progress bar elements associated with <form> containers.",
        whyItMatters: "Knowing how many steps remain reduces anxiety and abandonment in complex forms.",
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
        whatThisParameterIs: "Review & Rating Content checks for structured review data or star ratings.",
        whatItCalculates: "It looks for Schema.org AggregateRating or visual star elements (★★★★★).",
        whyItMatters: "Star ratings provide instant social proof and influence purchasing decisions.",
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
        whatThisParameterIs: "Client Logo Showcase checks for a 'Trusted By' section.",
        whatItCalculates: "It scans for a grid of images in a section labeled 'clients', 'partners', or 'trusted by'.",
        whyItMatters: "Displaying recognizable brand logos leverages the authority of established companies.",
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
        whatThisParameterIs: "Case Study Availability checks for deep-dive success stories.",
        whatItCalculates: "It looks for links with text 'Case Study', 'Success Story', or 'Client Story'.",
        whyItMatters: "Detailed case studies prove the value proposition with real-world evidence.",
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
        whatThisParameterIs: "Exit-Intent Mechanisms checks for functionality that captures abandoning users.",
        whatItCalculates: "It analyzes scripts for mouseleave event listeners or use of exit-intent libraries.",
        whyItMatters: "Exit-intent popups give you one last chance to convert a user before they leave forever.",
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
        whatThisParameterIs: "Interactive Element Usage checks for engagement widgets.",
        whatItCalculates: "It detects calculators, quizzes, sliders, or configuators on the page.",
        whyItMatters: "Interactive tools keep users on-site longer and increase psychological ownership.",
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
        whatThisParameterIs: "Personalization Signal checks for dynamic user-specific content.",
        whatItCalculates: "It looks for elements that might display user names or tailored recommendations (often via data attributes).",
        whyItMatters: "Personalized experiences feel more relevant and significantly boost conversion rates.",
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

    Friendly_Error_Handling: {
        title: "Friendly Error Handling",
        whatThisParameterIs: "Error Message Friendliness evaluates the tone and clarity of form errors.",
        whatItCalculates: "It inspects the DOM for error containers and checks if messages are specific (e.g., 'Email is required') rather than generic.",
        whyItMatters: "Frustrating error messages are a top cause of form abandonment.",
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
        whatThisParameterIs: "Microcopy Quality checks for helpful instructional text in forms.",
        whatItCalculates: "It checks input fields for placeholder attributes or adjacent help text elements.",
        whyItMatters: "Microcopy clarifies ambiguous fields and reduces user error.",
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
        whatThisParameterIs: "Incentive Visibility checks for clear value-add offers.",
        whatItCalculates: "It searches for terms like 'free shipping', 'money-back guarantee', 'bonus', or 'discount'.",
        whyItMatters: "Clear incentives remove friction and provide a reason to buy now.",
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
        whatThisParameterIs: "Smooth Scrolling Behavior checks for pleasant navigation transitions.",
        whatItCalculates: "It verifies if scroll-behavior: smooth is applied in CSS or JS.",
        whyItMatters: "Jarring jumps between sections can disorient users; smooth scrolling maintains context.",
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
        whatThisParameterIs: "Mobile CTA Optimization checks if buttons are sized for thumbs.",
        whatItCalculates: "It compares button dimensions on mobile viewports to ensure they span the full width or are easily tappable.",
        whyItMatters: "Mobile users need larger, easier-to-hit targets to convert comfortably.",
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
        whatThisParameterIs: "Multi-Channel Engagement checks for social or community links.",
        whatItCalculates: "It detects links to major social platforms or community Discords/Slacks.",
        whyItMatters: "Allowing users to follow you elsewhere keeps them in your ecosystem if they aren't ready to buy yet.",
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

    Content_NLP_Friendly: {
        whatThisParameterIs: "NLP Content Structure checks if content is optimized for Natural Language Processing.",
        whatItCalculates: "It analyzes HTML structure (headings, paragraphs, lists) to ensure text is easily extractable by AI bots.",
        whyItMatters: "AI models (like ChatGPT) rely on clean, semantic structure to understand and cite your content.",
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
        whatThisParameterIs: "AI Crawler Speed ensures pages load quickly for time-constrained bots.",
        whatItCalculates: "It measures the Time to First Byte (TTFB) and total resources size specifically for bot user-agents.",
        whyItMatters: "Crawlers have limited crawl budgets; slow pages get indexed less frequently.",
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
        whatThisParameterIs: "Data Accessibility (API) checks if site content is exposed via machine-readable endpoints.",
        whatItCalculates: "It detects references to RSS feeds, JSON endpoints, or public APIs in <link> tags or headers.",
        whyItMatters: "Exposing data structurally allows AI agents to consume your content more accurately than scraping.",
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
        whatThisParameterIs: "Entity & Keyword Annotation checks for explicit semantic tagging.",
        whatItCalculates: "It looks for emphasis tags (<em>, <strong>) highlighting key entities or presence of meta keywords.",
        whyItMatters: "Highlighting key entities helps AI disambiguate terms and understand the core topic.",
        thresholds: {
            good: "Keywords/entities detected",
            poor: "No keyword or entity signals found"
        },
        actualReasonsForFailure: [
            "Missing 'loading=lazy' attribute",
            "Missing Schema.org metadata for video",
            "Videos embedded without iframe/video tag",
            "Autoplay enabled without mute"
        ],
        howToOvercomeFailure: [
            "Use descriptive headings",
            "Add alt text to images",
            "Annotate key entities clearly"
        ]
    },
    Metadata_Complete: {
        whatThisParameterIs: "AI Metadata Completeness checks for tags that summarize content.",
        whatItCalculates: "It verifies the presence of og:description, twitter:description, and description meta tags.",
        whyItMatters: "AI snippets rely on these summaries to represent your page in chat responses.",
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
        whatThisParameterIs: "Content Freshness Verification checks the recency of the page.",
        whatItCalculates: "It extracts dates from last-modified headers or datePublished/dateModified schema.",
        whyItMatters: "AI models prioritize recent information to avoid hallucinating outdated facts.",
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
        whatThisParameterIs: "Dynamic Content Support checks for modern reactive capabilities.",
        whatItCalculates: "It detects libraries like React, Vue, or HTMX that facilitate dynamic updates.",
        whyItMatters: "Dynamic sites can serve personalized AI experiences in real-time.",
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
        whatThisParameterIs: "User Behavior Tracking checks for analytics integration.",
        whatItCalculates: "It identifies scripts for GA4, Mixpanel, or custom telemetry.",
        whyItMatters: "Feeding usage data back into AI models is essential for training optimization algorithms.",
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
        whatThisParameterIs: "Segmentation Readiness checks for data attributes used in personalization.",
        whatItCalculates: "It looks for data-user-segment or similar attributes in the DOM or data layer.",
        whyItMatters: "Segmentation allows serving different content varieties to different AI personas.",
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
        whatThisParameterIs: "Semantic Internal Linking checks link context.",
        whatItCalculates: "It inspects anchor text of internal links for descriptive keywords vs generic 'click here'.",
        whyItMatters: "Descriptive anchors build a knowledge graph that helps AIs understand site topology.",
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
        whatThisParameterIs: "Duplicate Content Prevention checks for canonicalization.",
        whatItCalculates: "It ensures <link rel='canonical'> is present and correct.",
        whyItMatters: "Canonicals prevent AI from learning conflicting information from duplicate pages.",
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
        whatThisParameterIs: "Multilingual Signal Check ensures locale definitions.",
        whatItCalculates: "It checks hreflang tags and lang attributes.",
        whyItMatters: "Explicit language tagging ensures your content feeds the correct language-specific AI models.",
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
        whatThisParameterIs: "Key Event Tracking checks for conversion telemetry.",
        whatItCalculates: "It looks for event triggers on key buttons (e.g. onClick, dataLayer.push).",
        whyItMatters: "Tracking success events enables AI agents to optimize for actual outcomes.",
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
        whatThisParameterIs: "Experimentation Infrastructure checks for A/B testing tools.",
        whatItCalculates: "It detects scripts for Optimizely, VWO, or similar platforms.",
        whyItMatters: "A/B testing provides the ground-truth data needed to validate AI-generated improvements.",
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
        whatThisParameterIs: "Feedback Loop Integration checks for direct user input mechanisms.",
        whatItCalculates: "It finds elements related to ratings, comments, or feedback widgets.",
        whyItMatters: "Direct human feedback is the most valuable signal for reinforcing helpful AI answers.",
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
