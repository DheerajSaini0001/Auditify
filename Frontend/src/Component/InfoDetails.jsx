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

    // Technical Performance
    LCP: {
        title: "Largest Contentful Paint (LCP)",
        whatThisParameterIs: "LCP (Largest Contentful Paint) measures how quickly the main part of your page shows up. It tells us when the largest image or text block is finally visible to the visitor.",
        whatItCalculates: "We analyze the Lighthouse audit trace to determine the render time of the largest image or text block relative to the page load start.",
        whyItMatters: "Fast loading keeps visitors happy. If your main content takes too long to appear, people will give up and leave, which also hurts your ranking on Google.",
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
        whatThisParameterIs: "INP (Interaction to Next Paint) measures how fast your site reacts when a user clicks or taps something. It's like a 'responsiveness' check for your website.",
        whatItCalculates: "For Lab data, we use Total Blocking Time (TBT) as a proxy. For Field data, we use CrUX 'interaction-to-next-paint' metric which measures real user interaction latency.",
        whyItMatters: "Nobody likes a site that feels 'laggy.' Instant reactions to clicks make your website feel alive, professional, and easy to use.",
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
        whatThisParameterIs: "CLS (Cumulative Layout Shift) measures how much the page content jumps around while loading. A stable page prevents accidental clicks and frustration.",
        whatItCalculates: "We analyze the Lighthouse 'cumulative-layout-shift' audit (Lab) and CrUX data (Field) to sum the scores of all unexpected layout shifts.",
        whyItMatters: "It's incredibly annoying when you're about to click a button and the page jumps, making you click the wrong thing. A stable page builds trust.",
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
        whatThisParameterIs: "FCP (First Contentful Paint) marks the exact moment when the very first piece of content—like text or an image—appears on the screen.",
        whatItCalculates: "We use the Lighthouse 'first-contentful-paint' audit to identify the precise timestamp when the first DOM content (text, image, svg) is rendered.",
        whyItMatters: "FCP is the 'first impression' of your site's speed. Fast feedback tells visitors that your site is working and content is on its way.",
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
        whatThisParameterIs: "TTFB (Time to First Byte) measures how long your server takes to send back the very first bit of data after someone tries to visit your site.",
        whatItCalculates: "We measure the time from the initial request to the receipt of the first byte using Lighthouse 'server-response-time' (Lab) and CrUX 'experimental_time_to_first_byte' (Field).",
        whyItMatters: "Everything else waits for this. If your server is slow to respond, your entire website feels slow, no matter how optimized your code is.",
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
        whatThisParameterIs: "TBT (Total Blocking Time) calculates how long the page is 'frozen' while loading, which prevents users from clicking or scrolling.",
        whatItCalculates: "We sum the duration of all 'long tasks' (tasks > 50ms) between First Contentful Paint and Time to Interactive, found in the Main Thread work breakdown.",
        whyItMatters: "If your page is frozen while loading, users can't do anything. Reducing blocking time makes your site feel snappy and responsive immediately.",
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
        whatThisParameterIs: "Speed Index tells you how quickly the visible parts of your page are filled with content. It's all about how fast the page 'feels' to a user.",
        whatItCalculates: "We calculate the speed at which the page content is visually populated using the 'speed-index' audit from Lighthouse.",
        whyItMatters: "A low Speed Index means your visitors aren't staring at a blank screen. It's about making the wait feel as short as possible.",
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
    Compression: {
        title: "Text Compression",
        whatThisParameterIs: "Text compression shrinks the size of your website's code (like HTML and CSS) so it travels faster across the internet to your visitors.",
        whatItCalculates: "We analyze the `Content-Encoding` header for `gzip` or `br` and compare original vs. compressed sizes.",
        whyItMatters: "Smaller files travel faster. Compressing text is one of the easiest ways to speed up your site for people on slow or mobile connections.",
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
        whatThisParameterIs: "Browser caching stores parts of your site on the visitor's device so they don't have to download everything again the next time they visit.",
        whatItCalculates: "We inspect the `Cache-Control` header of all static resources to verify if they have a `max-age` directive greater than 7 days.",
        whyItMatters: "Repeat visitors shouldn't have to wait. Caching makes your site load almost instantly for people who have visited you before.",
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
        whatThisParameterIs: "Render-blocking resources are files that force the browser to stop and wait before it can show anything on the screen.",
        whatItCalculates: "We identify scripts in the `<head>` without `async` or `defer` attributes and stylesheets without media attributes that delay the first paint.",
        whyItMatters: "Removing these 'roadblocks' allows your site to show its face much sooner, keeping visitors engaged from the very first second.",
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
    Resource_Optimization: {
        title: "Resource Optimization",
        whatThisParameterIs: "Resource optimization means making your images and scripts as small and efficient as possible without losing quality.",
        whatItCalculates: "We compare the natural dimensions of images against their display size and check if script URLs contain '.min' or 'cdn'.",
        whyItMatters: "Search engines favor efficient sites. Optimized assets save bandwidth and ensure that a slow image doesn't ruin your visitor's experience.",
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
        whatThisParameterIs: "A redirect chain is when one URL leads to another, which leads to another. This creates unnecessary delays before the page even starts loading.",
        whatItCalculates: "We trace the full redirect path using the browser's request interception to count the number of hops.",
        whyItMatters: "Every redirect is a detour. TheseDetours add up quickly, making your site feel sluggish before a single pixel even appears.",
        thresholds: {
            good: "≤ 1 redirect",
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
        whatThisMetricIs: "A comprehensive health check of your website's speed, responsiveness, and 'smoothness.' It tells you how well your site performs for real people in the real world.",
        whyItMatters: "First impressions are everything. A fast, stable site makes your brand look professional, keeps visitors from leaving in frustration, and is rewarded with much better rankings by search engines like Google.",
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
        whatThisParameterIs: "The Title Tag is the headline of your webpage that appears in search results and at the top of your browser tab.",
        whatItCalculates: "We extract the `<title>` tag content and validate its length is between 30 and 60 characters.",
        whyItMatters: "Your title is the first thing people see in Google. A great title gets more clicks and tells search engines exactly what you're offering.",
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
        whatThisParameterIs: "A Meta Description is a short summary of your page that appears under your title in search results, helping users decide to click.",
        whatItCalculates: "We extract the `<meta name='description'>` content and validate its length is between 50 and 160 characters.",
        whyItMatters: "This is your 'sales pitch' in search results. A good description convinces people that your page has the answer they're looking for.",
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
        whatThisParameterIs: "A Canonical Tag tells search engines which version of a page is the 'master copy,' avoiding confusion if you have similar content on different URLs.",
        whatItCalculates: "We verify the presence of a single `<link rel='canonical'>` tag and check if it points to a valid, absolute URL that matches the current page (self-referencing).",
        whyItMatters: "It prevents search engines from getting confused. By pointing to one 'main' version, you ensure that all your ranking power goes to the right page.",
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
        whatThisParameterIs: "URL Structure is the layout of your web address. A clean address is easier for both people and search engines to understand.",
        whatItCalculates: "We parse the URL path to check for uppercase letters, underscores, depth (>3 segments), and query parameters.",
        whyItMatters: "Clean web addresses are much more likely to be clicked and shared. They also help search engines index your site more effectively.",
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
        whatThisParameterIs: "The H1 Tag is the main heading of your page. It's like a book title that tells everyone what the content is about.",
        whatItCalculates: "We count the number of `<h1>` tags on the page to ensure exactly one exists.",
        whyItMatters: "The H1 is the 'main headline.' It's the strongest signal to search engines about what the most important topic on your page is.",
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
        whatThisParameterIs: "Image Optimization ensures your pictures are the right size and have hidden 'alt text' so everyone (including search engines) knows what's in them.",
        whatItCalculates: "We scan all `<img>` tags for the presence of `alt` attributes, filter out generic terms (e.g. 'image'), and check if file sizes exceed 150KB.",
        whyItMatters: "Optimized images aren't just faster—they help you show up in Image Search and ensure visually impaired users know what's in your photos.",
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
        whatThisParameterIs: "Video Optimization makes sure your videos play smoothly and don't slow down the rest of your page while it's loading.",
        whatItCalculates: "We identify `<video>` and `<iframe>` elements (YouTube/Vimeo) and check for `loading='lazy'` attributes and schema metadata.",
        whyItMatters: "Videos are great for engagement, but they are heavy. Proper setup keeps your site fast while still offering rich media to your visitors.",
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
        whatThisParameterIs: "Semantic tags are labels in your code (like 'header' or 'article') that help search engines and screen readers understand how your page is organized.",
        whatItCalculates: "We check for the presence of core HTML5 landmarks: `<main>`, `<nav>`, `<header>`, `<footer>`, `<article>`, `<section>`, and `<aside>`.",
        whyItMatters: "Think of these as the 'chapters' of your book. They help search engines and accessibility tools navigate and understand your content with ease.",
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
        whatThisParameterIs: "Contextual linking means adding helpful links within your text that point to other related pages on your website.",
        whatItCalculates: "We identify links within the main content area (excluding navigation menus) and check if they point to internal pages.",
        whyItMatters: "Internal links help visitors (and search bots) discover more of your great content, keeping people on your site longer.",
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
        whatThisParameterIs: "Heading Hierarchy is the logical order of your titles (H1, H2, H3). It creates an easy-to-follow outline for your readers.",
        whatItCalculates: "We traverse the heading tags (H1-H6) in document order to ensure no levels are skipped (e.g., H2 followed immediately by H4).",
        whyItMatters: "A logical outline makes your site easy to skim. Readers can quickly find the section they need without getting lost in a mess of text.",
        thresholds: {
            good: "Logical hierarchy (1.0)",
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
        whatThisParameterIs: "Content Quality checks if your page has enough unique and useful information to be valuable to your visitors.",
        whatItCalculates: "We count the words in the main content area (aiming for >300) and detect repeated sentences to identify thin or duplicate content.",
        whyItMatters: "Unique, helpful information is the #1 way to rank higher. Search engines love sites that provide real value instead of just copying others.",
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
        whatThisParameterIs: "Anchor text is the clickable word or phrase in a link. Using descriptive words helps people know where the link will take them.",
        whatItCalculates: "We analyze anchor text for generic phrases (e.g., 'click here') and calculate the ratio of descriptive links.",
        whyItMatters: "Clear link text like 'See Our Pricing' is much better than 'Click Here.' It tells users (and Google) exactly where the link leads.",
        thresholds: {
            good: "≥ 75% descriptive anchors (1.0)",
            needsImprovement: "< 75% descriptive (0.5)"
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
        whatThisParameterIs: "A URL slug is the last part of your web address that identifies the specific page in a way that's easy for humans to read.",
        whatItCalculates: "We analyze the last segment of the URL path for length (>50 chars), uppercase letters, underscores, and numeric IDs.",
        whyItMatters: "Short, readable slugs are much more welcoming. They look professional in social media shares and are easy for search engines to read.",
        thresholds: {
            good: "Clean slug (1.0)",
            needsImprovement: "Formatting issues (0.5)"
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
        whatThisParameterIs: "Structured Data (Schema) is hidden code that helps search engines show 'extra' info like star ratings or prices directly in search results.",
        whatItCalculates: "We search for `<script type='application/ld+json'>` blocks and validate their JSON content.",
        whyItMatters: "Structured data helps you stand out. Things like star ratings and prices in search results can greatly increase the number of people who click your link.",
        thresholds: {
            good: "Schema detected (1.0)",
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
        whatThisParameterIs: "Open Graph tags control how your page looks when someone shares a link to it on social media platforms like Facebook or LinkedIn.",
        whatItCalculates: "We check for the presence of `og:title`, `og:description`, `og:image`, and `og:url` meta tags.",
        whyItMatters: "When your links look professional on Facebook or LinkedIn with a great image and title, people are much more likely to share and click them.",
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
        whatThisParameterIs: "Twitter Cards are special tags that make your links look like rich, attractive posts when they are shared on Twitter.",
        whatItCalculates: "We check for `twitter:card`, `twitter:title`, `twitter:description`, and `twitter:image` meta tags.",
        whyItMatters: "Twitter Cards turn a boring link into a beautiful 'card' with a big photo, making your content stand out in a busy Twitter feed.",
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
        whatThisParameterIs: "Social Profile Links connect your website to your official social media pages, helping visitors find your community.",
        whatItCalculates: "We scan all external links to identify URLs matching known social media platforms (Facebook, Twitter, LinkedIn, etc.).",
        whyItMatters: "These links show you are a real brand with a real community. They make it easy for your most loyal fans to follow you everywhere.",
        thresholds: {
            good: "Social links present (1.0)",
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
        whatThisParameterIs: "The Robots.txt file is a set of instructions for search engine 'crawlers' telling them which parts of your site they are allowed to visit.",
        whatItCalculates: "We attempt to fetch the `/robots.txt` file from the root domain.",
        whyItMatters: "This file is like a 'keep out' or 'welcome' sign for search bots. It ensures they don't waste time on parts of your site that don't need to be indexed.",
        thresholds: {
            good: "File exists (1.0)",
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
        whatThisParameterIs: "An XML Sitemap is like a map of your website that helps search engines find and index all your important pages quickly.",
        whatItCalculates: "We attempt to fetch the `/sitemap.xml` file from the root domain.",
        whyItMatters: "A sitemap ensures Google doesn't miss any of your pages. It's the fastest way to get your new content found and shown to the world.",
        thresholds: {
            good: "File exists (1.0)",
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
        whatThisMetricIs: "Analyzes how well search engines can read and understand your website. It's like checking the 'labels' on your digital products to ensure the right customers can find them when they search.",
        whyItMatters: "If search engines can't find you, neither can your customers. Superior On-Page SEO makes your website stand out, turning it into a powerful magnet for high-quality traffic and new business opportunities.",
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


    Color_Contrast: {
        title: "Color Contrast",
        whatThisParameterIs: "Color Contrast is the difference in brightness between text and its background. High contrast makes your words easy for everyone to read.",
        whatItCalculates: "We evaluate the contrast ratio of text elements against their background colors using the WCAG 2.0 algorithm.",
        whyItMatters: "Good contrast ensures your content is readable for everyone, including those with visual impairments or people viewing your site in bright sunlight.",
        thresholds: {
            good: "Ratio ≥ 4.5:1 (normal text), ≥ 3:1 (large text)",
            needsImprovement: "Ratio < 4.5:1 but readable",
            poor: "Ratio < 3:1 (illegible)"
        },
        actualReasonsForFailure: [
            "Text elements do not have enough contrast against their background colors",
            "Background images interfering with text readability",
            "Low opacity text colors"
        ],
        howToOvercomeFailure: [
            "Increase the contrast between text and background colors",
            "Aim for at least 4.5:1 for normal text and 3:1 for large text",
            "Use a contrast checker tool during design"
        ]
    },
    Focus_Order: {
        title: "Focus Order",
        whatThisParameterIs: "Focus Order is the path someone takes through your site using only their keyboard. A logical path helps them navigate without a mouse.",
        whatItCalculates: "We verify that the tab order of interactive elements follows a logical sequence that matches the visual layout of the page.",
        whyItMatters: "A logical focus order makes your site predictable and easy to use. It ensures keyboard users aren't left 'jumping' all over the place to find a link.",
        thresholds: {
            good: "Tab order matches visual layout",
            needsImprovement: "Minor deviations in order",
            poor: "Focus jumps randomly across the page"
        },
        actualReasonsForFailure: [
            "The tab order does not match the visual layout",
            "Elements receiving focus in an illogical sequence",
            "DOM order significantly different from visual presentation"
        ],
        howToOvercomeFailure: [
            "Rearrange DOM elements to match the visual order",
            "Use tabindex='0' to insert elements into the natural tab flow",
            "Avoid positive tabindex values which disrupt natural order"
        ]
    },
    Focusable_Content: {
        title: "Focusable Content",
        whatThisParameterIs: "Focusable Content are parts of your site—like links and buttons—that people can reach and use using just their keyboard.",
        whatItCalculates: "We check if all interactive elements (buttons, links, inputs) can be reached and activated using keyboard navigation.",
        whyItMatters: "If a user can't select a button, they can't use your site. Focusability is the difference between a working website and an broken experience for many users.",
        thresholds: {
            good: "All interactive elements are focusable",
            needsImprovement: "Some elements skipped",
            poor: "Critical controls inaccessible via keyboard"
        },
        actualReasonsForFailure: [
            "Interactive elements (like custom buttons) cannot be reached using the Tab key",
            "Click handlers bound to non-interactive elements (div/span)",
            "Elements hidden from focus using incorrect tabindex"
        ],
        howToOvercomeFailure: [
            "Use semantic HTML elements (<button>, <a>) whenever possible",
            "Add tabindex='0' to custom interactive elements",
            "Ensure all clickable elements are in the tab order"
        ]
    },
    Tab_Index: {
        title: "Tabindex Usage",
        whatThisParameterIs: "The Tabindex setting tells the browser the order in which items should be selected when a user presses the 'Tab' key.",
        whatItCalculates: "We scan for elements using positive tabindex values (> 0), which override the natural DOM order.",
        whyItMatters: "Messing with the tab order is like rearranging the keys on someone's keyboard—it makes navigation confusing and unpredictable.",
        thresholds: {
            good: "No positive tabindex usage",
            poor: "Positive tabindex values detected"
        },
        actualReasonsForFailure: [
            "Elements with tabindex > 0 disrupt the natural tab order",
            "Tabindex used to force an illogical navigation flow"
        ],
        howToOvercomeFailure: [
            "Remove positive tabindex values completely",
            "Rely on the natural document source order for navigation",
            "Use tabindex='0' for focusability or '-1' to remove from flow"
        ]
    },
    Interactive_Element_Affordance: {
        title: "Interactive Element Affordance",
        whatThisParameterIs: "Interactive cues (like colors or hover effects) show users which parts of your page are 'clickable' buttons or links.",
        whatItCalculates: "We check if interactive elements (buttons, links) have appropriate roles and visual indicators identifying them as interactive.",
        whyItMatters: "Clear visual cues remove the guesswork, letting users feel confident that they know what to click to get what they need.",
        thresholds: {
            good: "All interactive elements have correct roles",
            needsImprovement: "Some elements lack roles",
            poor: "Clickable elements indistinguishable from text"
        },
        actualReasonsForFailure: [
            "Clickable elements (like divs with onclick) lack semantic roles",
            "Buttons or links missing accessible names or roles",
            "Interactive elements missing standard visual cues"
        ],
        howToOvercomeFailure: [
            "Add role='button' or role='link' to custom interactive elements",
            "Ensure tabindex='0' is present on custom controls",
            "Prefer native <button> and <a> elements"
        ]
    },
    Label: {
        title: "Form Labels",
        whatThisParameterIs: "Form Labels are text descriptions attached to input boxes, telling screen reader users exactly what they need to type in each field.",
        whatItCalculates: "We verify that every form input field has a programmatically associated label element or descriptive attribute.",
        whyItMatters: "Without labels, screen readers might just say 'Edit Box' instead of 'Enter Your Email.' Good labels ensure everyone knows exactly what to do.",
        thresholds: {
            good: "100% of inputs labeled",
            needsImprovement: "Minor omissions",
            poor: "Critical inputs missing labels"
        },
        actualReasonsForFailure: [
            "Inputs without labels are inaccessible to screen readers",
            "Placeholder text used as a substitute for a true label",
            "Labels not correctly associated via 'for' attribute"
        ],
        howToOvercomeFailure: [
            "Associate a <label for='id'> with every input element",
            "Use aria-label or aria-labelledby if a visible label is not possible",
            "Ensure labels describe the purpose of the field clearly"
        ]
    },
    Aria_Allowed_Attr: {
        title: "ARIA Allowed Attributes",
        whatThisParameterIs: "ARIA Attributes are special labels that give extra information to screen readers about how your website's features work.",
        whatItCalculates: "We check if the ARIA attributes used on an element are permitted for its assigned role according to the WAI-ARIA specification.",
        whyItMatters: "Valid attributes ensure that the helpful descriptions you add actually work correctly for people using assistive tools.",
        thresholds: {
            good: "All ARIA attributes valid",
            poor: "Invalid attribute-role combinations"
        },
        actualReasonsForFailure: [
            "Attributes are not permitted for the element's role (e.g., aria-checked on a generic div)",
            "Using ARIA attributes on elements that don't support them",
            "Typographical errors in attribute names"
        ],
        howToOvercomeFailure: [
            "Remove invalid attributes for the specific role",
            "Change the element's role to one that supports the attribute",
            "Consult the WAI-ARIA specification for valid combinations"
        ]
    },
    Aria_Roles: {
        title: "ARIA Roles",
        whatThisParameterIs: "ARIA Roles tell assistive tools exactly what an element does—for example, 'this is a button' or 'this is a navigation menu'.",
        whatItCalculates: "We validate that all 'role' attribute values used on the page exist in the WAI-ARIA specification.",
        whyItMatters: "Correct roles are like signposts for screen readers, helping users understand if they are interacting with a menu, a slider, or a simple button.",
        thresholds: {
            good: "All roles are valid WAI-ARIA roles",
            poor: "Non-existent or abstract roles used"
        },
        actualReasonsForFailure: [
            "Elements use non-existent or abstract ARIA roles",
            "Typos in role values",
            "Using roles that are not part of the ARIA standard"
        ],
        howToOvercomeFailure: [
            "Start with native HTML elements (button, nav, main) before adding roles",
            "Check role spelling against the WAI-ARIA specification",
            "Remove invalid role attributes"
        ]
    },
    Aria_Hidden_Focus: {
        title: "ARIA Hidden Focus",
        whatThisParameterIs: "This check ensures that invisible parts of your site don't accidentally 'trap' a user who is navigating with their keyboard.",
        whatItCalculates: "We identify elements marked with aria-hidden='true' that still contain focusable children.",
        whyItMatters: "This prevents 'keyboard traps' where a user can select something they can't even see or hear, leading to major frustration.",
        thresholds: {
            good: "No hidden focusable elements",
            poor: "Focusable content hidden from screen readers"
        },
        actualReasonsForFailure: [
            "User can tab to elements that screen readers will ignore",
            "aria-hidden='true' applied to a container with interactive links/buttons",
            "Focus execution not managed when hiding content"
        ],
        howToOvercomeFailure: [
            "Remove aria-hidden from focusable elements",
            "Add tabindex='-1' to elements that should be hidden but are focusable",
            "Ensure hidden content is truly removed from the focus order"
        ]
    },
    Image_Alt: {
        title: "Image Alt Text",
        whatThisParameterIs: "Alt Text is a hidden description for your images. It helps visually impaired users (and search engines) understand what's in the picture.",
        whatItCalculates: "We check every <img> tag to ensure it has an alt attribute, either with descriptive text or empty (alt='') if decorative.",
        whyItMatters: "Alt text is the only way some users can 'see' your images. It also helps Google understand your photos for its search results.",
        thresholds: {
            good: "All images have alt attributes",
            poor: "Images missing alt attributes"
        },
        actualReasonsForFailure: [
            "Images without alt text are invisible to screen readers",
            "Decorative images missing the empty alt attribute",
            "Alt text is the filename (e.g., image.jpg) instead of a description"
        ],
        howToOvercomeFailure: [
            "Add descriptive alt text that conveys the image's meaning",
            "Use alt='' (empty string) for purely decorative images",
            "Ensure complex images have detailed descriptions"
        ]
    },
    Skip_Links: {
        title: "Skip Links",
        whatThisParameterIs: "A Skip Link is a hidden shortcut that allows keyboard users to jump straight to your main content, skipping over the menus.",
        whatItCalculates: "We verify the presence of a 'Skip to Content' link at the top of the page that correctly targets a main content area ID.",
        whyItMatters: "Imagine having to listen to the same menu items on every single page. Skip links let users get straight to the 'good stuff' quickly.",
        thresholds: {
            good: "Valid, working skip link present",
            needsImprovement: "Link present but target broken",
            poor: "No skip link found"
        },
        actualReasonsForFailure: [
            "No 'Skip to Content' link found on the page",
            "Clicking the skip link does nothing (broken target ID)",
            "Skip link is not the first focusable element"
        ],
        howToOvercomeFailure: [
            "Add a link with text 'Skip to Content' pointing to <main id='content'>",
            "Ensure the target ID exists in the DOM",
            "Make sure the skip link becomes visible when it receives focus"
        ]
    },
    Landmarks: {
        title: "Landmark Roles",
        whatThisParameterIs: "Landmark Roles are like digital signposts (like 'Header' or 'Main Content') that help people navigate your page structure efficiently.",
        whatItCalculates: "We check for the presence of primary HTML5 structural landmarks: <main>, <nav>, <header>, and <footer>.",
        whyItMatters: "Landmarks are like the 'Home' or 'Menu' buttons on a phone—they give users a quick way to find their way around your page's structure.",
        thresholds: {
            good: "Primary landmarks (Main, Nav, Header) present",
            needsImprovement: "Some landmarks missing",
            poor: "No semantic landmarks found"
        },
        actualReasonsForFailure: [
            "Page structure is difficult to navigate (missing <main> or <nav>)",
            "Content structured entirely with generic <div>s",
            "Roles not properly defined"
        ],
        howToOvercomeFailure: [
            "Use HTML5 semantic elements (main, nav, header, footer) instead of divs",
            "Add role attributes (role='main') if semantic tags cannot be used",
            "Ensure every page has exactly one <main> landmark"
        ]
    },
    Link_Name: {
        title: "Link Name",
        whatThisParameterIs: "A Link Name is the text that describes where a link goes. Clear labels help users know exactly what will happen when they click.",
        whatItCalculates: "We verify that every link (<a>) has discernible text content or an accessible label.",
        whyItMatters: "A link called 'Learn More' can be confusing if there are 10 of them. Specific names like 'View Pricing' tell users exactly where they're headed.",
        thresholds: {
            good: "All links have discernible text",
            poor: "Links with no accessible name"
        },
        actualReasonsForFailure: [
            "Empty links or icon-only links without labels are confusing",
            "Links containing only non-text formatting",
            "Images inside links missing alt text"
        ],
        howToOvercomeFailure: [
            "Add meaningful text content to the link",
            "Use aria-label for icon-only links",
            "Ensure images inside links have alt text"
        ]
    },
    Button_Name: {
        title: "Button Name",
        whatThisParameterIs: "A Button Name is the label that describes what a button does (like 'Submit' or 'Search'), making it clear for screen reader users.",
        whatItCalculates: "We verify that every button has discernible text content or an accessible label.",
        whyItMatters: "Every button needs a voice. A clear name ensures that everyone understands what will happen when they click or tap it.",
        thresholds: {
            good: "All buttons have discernible text",
            poor: "Buttons with no accessible name"
        },
        actualReasonsForFailure: [
            "Icon buttons or empty buttons without labels are unusable",
            "Buttons rely on visual cues alone",
            "Text inside button is hidden from screen readers"
        ],
        howToOvercomeFailure: [
            "Add text content inside the <button> tag",
            "Use aria-label for icon-only buttons",
            "Ensure the label clearly describes the button's action"
        ]
    },
    Document_Title: {
        title: "Document Title",
        whatThisParameterIs: "The Document Title is the name of your page shown in browser tabs. It's the first thing a screen reader says to describe your page.",
        whatItCalculates: "We check the <head> section to ensure a non-empty <title> tag is present.",
        whyItMatters: "The title is the very first thing a screen reader announces. It gives users immediate confirmation that they've landed on the right page.",
        thresholds: {
            good: "Non-empty <title> present",
            poor: "Title is missing or empty"
        },
        actualReasonsForFailure: [
            "Document title is missing or empty",
            "Title tag exists but contains no text"
        ],
        howToOvercomeFailure: [
            "Add a <title> element to the <head> of the page",
            "Ensure the title provides a concise summary of the page content",
            "Make sure the title is unique for each page"
        ]
    },
    Html_Has_Lang: {
        title: "HTML Language Attribute",
        whatThisParameterIs: "The Language Attribute tells browsers and screen readers which language your site is written in, so they use the right accent.",
        whatItCalculates: "We check that the <html> element has a valid 'lang' attribute.",
        whyItMatters: "It ensures that a screen reader doesn't try to read English text with a French accent, making your site easy to listen to and understand.",
        thresholds: {
            good: "Valid lang attribute present",
            poor: "Lang attribute missing or invalid"
        },
        actualReasonsForFailure: [
            "Missing lang attribute on <html> element",
            "Lang attribute is empty or contains an invalid code"
        ],
        howToOvercomeFailure: [
            "Add lang='en' (or your language code) to the <html> tag",
            "Ensure the language code conforms to BCP 47 standards"
        ]
    },
    Meta_Viewport: {
        title: "Meta Viewport",
        whatThisParameterIs: "The Viewport tag controls how your site looks on mobile. It should always allow users to 'pinch-to-zoom' for better readability.",
        whatItCalculates: "We check the meta viewport tag to ensure it does not restrict user zooming/scaling.",
        whyItMatters: "For many users, being able to zoom in is the only way to read small text. Blocking this feature is an unnecessary hurdle for your visitors.",
        thresholds: {
            good: "Zooming is enabled",
            poor: "User scaling is disabled"
        },
        actualReasonsForFailure: [
            "Viewport meta tag restricts zooming (user-scalable=no)",
            "Maximum-scale is set to 1.0, preventing zoom"
        ],
        howToOvercomeFailure: [
            "Remove 'user-scalable=no' from the viewport tag",
            "Avoid setting maximum-scale to 1.0",
            "Ensure users can scale the content up to at least 200%"
        ]
    },
    List: {
        title: "List Structure",
        whatThisParameterIs: "List Structure uses proper coding for bulleted lists, allowing screen readers to tell users exactly how many items are in the list.",
        whatItCalculates: "We check that list elements (<ul>, <ol>) only contain <li> elements (or script/template tags).",
        whyItMatters: "Correct list coding ensures that visitors aren't just hearing a long string of items without knowing where the list starts and ends.",
        thresholds: {
            good: "Lists only contain <li> items",
            poor: "Lists usually invalid children"
        },
        actualReasonsForFailure: [
            "Lists (ul/ol) must only contain li elements",
            "Text or other elements found directly inside <ul>/<ol>"
        ],
        howToOvercomeFailure: [
            "Ensure <ul> and <ol> only contain <li> elements directly",
            "Move non-list content outside the list container",
            "Wrap orphaned <li> elements in a valid list parent"
        ]
    },
    Heading_Order: {
        title: "Heading Order",
        whatThisParameterIs: "Heading Order is the logical flow of your titles. Keeping them in sequence (H1, then H2, then H3) makes your page easy to follow.",
        whatItCalculates: "We verify that heading steps are sequential (e.g., h1 -> h2) and do not skip levels (e.g., h1 -> h3).",
        whyItMatters: "A logical title flow is like a clear table of contents. It helps everyone—including search engines—understand how your content is built.",
        thresholds: {
            good: "Headings follow logical order",
            needsImprovement: "Minor skips",
            poor: "Major structural skips"
        },
        actualReasonsForFailure: [
            "Headings that skip levels (e.g., h1 to h3)",
            "Multiple H1 tags or missing H1"
        ],
        howToOvercomeFailure: [
            "Ensure headings are sequential (h1 followed by h2, etc.)",
            "Do not skip heading levels for visual effect",
            "Use CSS classes for styling instead of choosing heading tags based on size"
        ]
    },
    Multilingual_Support: {
        title: "Multilingual Support",
        whatThisParameterIs: "Multilingual Support ensures your site correctly identifies different languages, helping global users and translation tools.",
        whatItCalculates: "It checks hreflang tags and lang attributes on the HTML element.",
        whyItMatters: "Explicit language tagging ensures your site speaks the 'right language' to every visitor, making the experience seamless for everyone.",
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

    // Methodologies (Accessibility)
    Accessibility_Methodology: {
        icon: Eye,
        badge: "Accessibility",
        title: "Accessibility",
        guideLink: "https://www.w3.org/WAI/standards-guidelines/wcag/",
        whatThisMetricIs: "Evaluates how easy it is for *everyone* to use your website, including those with vision or hearing challenges. It’s about 'Digital Inclusion'—making sure your content is open to all.",
        whyItMatters: "An accessible website is a welcoming website. By removing barriers, you show that you value every visitor, expand your reach to millions of people, and create a more inclusive, professional brand image.",
        whatToDoForAGoodScore: (
            <ul className="list-disc pl-5 space-y-2">
                <li>
                    <span className="font-semibold">Ensure meaningful text alternatives:</span> Give all images descriptive alt text and ensure buttons and links have discernible names describing their purpose.
                </li>
                <li>
                    <span className="font-semibold">Guarantee keyboard operability:</span> Verify that all interactive elements are focusable, have a visible focus indicators, and follow a logical tab order.
                </li>
                <li>
                    <span className="font-semibold">Maintain sufficient color contrast:</span> Ensure text and interactive elements stand out clearly against their backgrounds (aim for a 4.5:1 ratio).
                </li>
                <li>
                    <span className="font-semibold">Label all form inputs:</span> Every input field must have a visible label or accessible name to be usable by assistive technologies.
                </li>
                <li>
                    <span className="font-semibold">Structure content logically:</span> Use proper heading hierarchy (H1–H6), landmarks (main, nav), and lists to help screen readers navigate efficiently.
                </li>
                <li>
                    <span className="font-semibold">Define page context:</span> Set a unique document title and correct HTML language attribute to help users orient themselves immediately.
                </li>
                <li>
                    <span className="font-semibold">Use ARIA with care:</span> Only use ARIA roles and attributes when native HTML cannot achieve the desired result, and ensure they are valid.
                </li>
            </ul>
        ),
        howThisScoreIsCalculated: (
            <div className="space-y-2">
                <p>The Accessibility score is a weighted average of 19 distinct checks, prioritizing high-impact issues like color contrast, keyboard navigation, and form labeling.</p>
                <p>Each check contributes to the total score based on the severity of findings: Passing checks earn 100%, warnings (moderate issues) earn 50%, and critical failures earn 0%.</p>
            </div>
        ),
        weightage: [
            { param: "Visual Labels & Contrast", weight: "34%" },
            { param: "Navigation & Focus Order", weight: "31%" },
            { param: "Interactive Elements & Names", weight: "18%" },
            { param: "ARIA Roles & Semantics", weight: "17%" }
        ]
    },

    // Security & Compliance
    HTTPS: {
        title: "HTTPS Usage",
        whatThisParameterIs: "HTTPS is a secure way for your browser to talk to a website, ensuring that your connection is always private and safe.",
        whatItCalculates: "It verifies that the page is loaded via the https protocol scheme.",
        whyItMatters: "HTTPS creates a private and secure connection between your visitor and the server, making it impossible for hackers to snoop on sensitive information.",
        thresholds: {
            good: "HTTPS enabled",
            poor: "HTTP only"
        },
        actualReasonsForFailure: [
            "The website is served over HTTP instead of HTTPS",
            "Automatic redirect to HTTPS is missing",
            "Internal resources are being loaded over insecure connections (mixed content)"
        ],
        howToOvercomeFailure: [
            "Obtain and install a valid SSL certificate",
            "Enforce HTTPS by redirecting all HTTP traffic to HTTPS",
            "Ensure all internal scripts, styles, and images use HTTPS URLs"
        ]
    },
    SSL: {
        title: "SSL Connection",
        whatThisParameterIs: "An SSL connection is a secure handshake between your browser and the website that starts an encrypted session.",
        whatItCalculates: "It attempts to establish a TLS connection to the server and verifies the handshake succeeds without errors.",
        whyItMatters: "A valid SSL connection is like a digital 'green light' that tells browsers your website is authentic and safe for users to visit.",
        thresholds: {
            good: "SSL connection established successfully",
            needsImprovement: "Certificate nearing expiry (less than 30 days)",
            poor: "SSL connection failed"
        },
        actualReasonsForFailure: [
            "SSL connection failed or handshake failure",
            "The SSL certificate has expired or is invalid",
            "The certificate is valid but nearing expiration (less than 30 days)"
        ],
        howToOvercomeFailure: [
            "Check the SSL certificate status and server security configuration",
            "Renew the SSL certificate immediately if expired or nearing expiry",
            "Ensure the server is configured to support modern TLS handshakes"
        ]
    },
    TLS_Version: {
        title: "TLS Version",
        whatThisParameterIs: "TLS is the technology that powers your secure connection. Using the latest version ensures you have the strongest protection against modern hackers.",
        whatItCalculates: "It negotiates the connection to determine the protocol version (e.g., TLS 1.2, 1.3) and flags obsolete versions.",
        whyItMatters: "Using the latest security protocols is like having the latest home security system—it protects you against the newest tricks used by intruders.",
        thresholds: {
            good: "TLS 1.2 or TLS 1.3",
            poor: "Obsolete TLS version (1.0 or 1.1) or no security details"
        },
        actualReasonsForFailure: [
            "The server supports older, insecure TLS versions (e.g., TLS 1.0 or 1.1)",
            "Unable to determine the TLS version due to missing security details",
            "The server does not respond to security protocol probes"
        ],
        howToOvercomeFailure: [
            "Disable TLS 1.0/1.1 and enable TLS 1.2 or TLS 1.3 on your web server",
            "Update server security settings to use modern cipher suites",
            "Ensure the server is reachable and supports standard security handshakes"
        ]
    },
    X_Frame_Options: {
        title: "X-Frame-Options Header",
        whatThisParameterIs: "The X-Frame-Options setting prevents other websites from 'stealing' your site's appearance to trick users into clicking things they shouldn't.",
        whatItCalculates: "It checks HTTP response headers for the presence and value of the 'X-Frame-Options' header.",
        whyItMatters: "This header stops a sneaky trick where hackers 'layer' your site under theirs to fool people into clicking buttons they can't see.",
        thresholds: {
            good: "X-Frame-Options header present",
            poor: "X-Frame-Options header missing or no response"
        },
        actualReasonsForFailure: [
            "The X-Frame-Options header is missing, making the site vulnerable to clickjacking",
            "No response was received from the server during the header check",
            "The header is misconfigured or not recognized by modern browsers"
        ],
        howToOvercomeFailure: [
            "Set the 'X-Frame-Options' header to 'DENY' or 'SAMEORIGIN' on your server",
            "Configure security headers at the web server (Nginx/Apache) or CDN level",
            "Verify the presence of headers using browser developer tools"
        ]
    },
    X_Content_Type_Options: {
        title: "X-Content-Type-Options Header",
        whatThisParameterIs: "This security setting prevents browsers from trying to 'guess' what kind of file they are loading, which stops certain types of malicious attacks.",
        whatItCalculates: "It checks for the 'X-Content-Type-Options: nosniff' response header.",
        whyItMatters: "It prevents browsers from being tricked into running a dangerous script when it was supposed to be a regular picture or text file.",
        thresholds: {
            good: "X-Content-Type-Options: nosniff present",
            poor: "X-Content-Type-Options header missing or no response"
        },
        actualReasonsForFailure: [
            "The X-Content-Type-Options header is missing from the server response",
            "No response was received from the server to verify the header",
            "The header value is not set specifically to 'nosniff'"
        ],
        howToOvercomeFailure: [
            "Add the 'X-Content-Type-Options: nosniff' header to all server responses",
            "Configure this header at the web server level to prevent MIME type sniffing",
            "Verify header configuration using a security header scanner"
        ]
    },
    HSTS: {
        title: "HTTP Strict Transport Security (HSTS)",
        whatThisParameterIs: "HSTS is an a 'force-secure' command that tells browsers to never use an insecure connection when visiting your website.",
        whatItCalculates: "It checks for the 'Strict-Transport-Security' response header and its configuration.",
        whyItMatters: "HSTS closes a tiny but dangerous gap where a hacker could try to redirect your visitors to an unencrypted version of your site.",
        thresholds: {
            good: "HSTS header present",
            poor: "HSTS header missing or no response"
        },
        actualReasonsForFailure: [
            "The HTTP Strict Transport Security (HSTS) header is missing",
            "No response was received from the server for the HSTS check",
            "The HSTS header is missing a required max-age directive"
        ],
        howToOvercomeFailure: [
            "Add the 'Strict-Transport-Security' header to enforce secure HTTPS connections",
            "Configure a long max-age (e.g., 31536000 seconds) for the HSTS header",
            "Consider adding the 'includeSubDomains' and 'preload' directives"
        ]
    },
    CSP: {
        title: "Content Security Policy (CSP)",
        whatThisParameterIs: "A Content Security Policy (CSP) is a set of rules that tells the browser which sources are safe to load content from, stopping unauthorized scripts.",
        whatItCalculates: "It checks for the 'Content-Security-Policy' response header.",
        whyItMatters: "Think of CSP as a 'security guard' for your site's code, ensuring only trusted scripts are allowed to run on your page.",
        thresholds: {
            good: "CSP header present",
            poor: "CSP header missing or no response"
        },
        actualReasonsForFailure: [
            "The Content-Security-Policy (CSP) header is missing from the response",
            "No response was received from the server during the CSP probe",
            "The CSP header is present but empty or overly permissive"
        ],
        howToOvercomeFailure: [
            "Implement a robust 'Content-Security-Policy' header to prevent XSS and data injection",
            "Start with a strict policy and use 'report-only' mode during initial testing",
            "Restrict the 'script-src' directive to trusted sources only"
        ]
    },
    Cookies_Secure: {
        title: "Secure Cookies",
        whatThisParameterIs: "The 'Secure' flag tells the browser to only send cookies over an encrypted HTTPS connection.",
        whatItCalculates: "It verifies if all cookies set by the page have the 'Secure' attribute.",
        whyItMatters: "Marking cookies as 'Secure' ensures that sensitive login data is never sent over an unencrypted connection where it could be stolen.",
        thresholds: {
            good: "All cookies are secure",
            poor: "Some cookies missing 'Secure' flag"
        },
        actualReasonsForFailure: [
            "One or more cookies are set without the 'Secure' flag",
            "Cookies are being sent over an unencrypted (HTTP) connection",
            "Session cookies are exposed to interception"
        ],
        howToOvercomeFailure: [
            "Ensure all application cookies are set with the 'Secure' attribute",
            "Enforce HTTPS site-wide so that secure cookies are always transmittable",
            "Audit third-party scripts that may be setting insecure cookies"
        ]
    },
    Cookies_HttpOnly: {
        title: "HttpOnly Cookies",
        whatThisParameterIs: "The 'HttpOnly' flag prevents website scripts from touching your sensitive cookies, adding an extra layer of protection.",
        whatItCalculates: "It verifies if all cookies set by the page have the 'HttpOnly' attribute.",
        whyItMatters: "The 'HttpOnly' flag acts as a shield, preventing scripts from stealing your session cookies even if a hacker finds a way to run code on your page.",
        thresholds: {
            good: "All cookies are HttpOnly",
            poor: "Some cookies missing 'HttpOnly' flag"
        },
        actualReasonsForFailure: [
            "Some cookies are set without the 'HttpOnly' flag, making them accessible to JavaScript",
            "Potentially sensitive session identifiers are accessible to client-side scripts",
            "Insecure cookie configuration increases risk of session hijacking"
        ],
        howToOvercomeFailure: [
            "Set the 'HttpOnly' attribute on all sensitive cookies, especially session IDs",
            "Limit the scope of cookies using the 'Path' and 'Domain' attributes",
            "Configure your application framework to default to HttpOnly for all cookies"
        ]
    },
    SQLi_Exposure: {
        title: "SQL Injection Exposure",
        whatThisParameterIs: "This check looks for 'holes' in your website that could allow hackers to sneak into your database and steal information.",
        whatItCalculates: "It sends test payloads to input fields and analyzes the response for database errors or significant length differences.",
        whyItMatters: "A single 'hole' could let a hacker see your entire customer list. Fixing these ensures your private data stays private.",
        thresholds: {
            good: "No SQL injection indicators detected",
            poor: "Exposed database error or significant response length change"
        },
        actualReasonsForFailure: [
            "An exposed database error message was detected in response to a test payload",
            "A significant difference in response length was found, suggesting potential blind SQL injection",
            "The application does not properly sanitize user-provided input parameters"
        ],
        howToOvercomeFailure: [
            "Use parameterized queries (Prepared Statements) for all database interactions",
            "Ensure strict input validation and sanitization on all user-controlled data",
            "Handle database errors gracefully and avoid returning detailed error messages to the client"
        ]
    },
    XSS: {
        title: "Cross-Site Scripting (XSS)",
        whatThisParameterIs: "XSS protection stops hackers from 'injecting' their own malicious code into your website to steal user data or take over accounts.",
        whatItCalculates: "It injects a script payload and checks if it executes (triggering a dialog) or is reflected unescaped in the HTML.",
        whyItMatters: "XSS is like a Trojan horse—it sneaks malicious code into your site to trick your users. Stopping it protects both you and your visitors.",
        thresholds: {
            good: "No execution or reflection of script payload",
            needsImprovement: "Payload reflected but not executed",
            poor: "Script payload executed (dialog triggered)"
        },
        actualReasonsForFailure: [
            "The test script payload was successfully executed by the browser (XSS confirmed)",
            "The script payload was reflected unescaped in the response, creating a high risk of XSS",
            "The application lacks proper output encoding for user-provided reflections"
        ],
        howToOvercomeFailure: [
            "Implement strict, context-sensitive output encoding for all user-generated content",
            "Adopt a robust Content Security Policy (CSP) to block unauthorized script execution",
            "Avoid using 'dangerouslySetInnerHTML' or similar functions without extreme caution"
        ]
    },
    Cookie_Consent: {
        title: "Cookie Consent Banner",
        whatThisParameterIs: "A Cookie Consent banner asks visitors for permission before tracking them, which is required by modern privacy laws.",
        whatItCalculates: "It searches the DOM for common cookie consent banner patterns, selectors, and visibility.",
        whyItMatters: "A clear cookie banner builds trust by being upfront with your visitors, showing them that you respect their data and their choices.",
        thresholds: {
            good: "Visible cookie consent banner found",
            poor: "No visible cookie consent banner matching common patterns"
        },
        actualReasonsForFailure: [
            "No visible element matching common cookie consent banner patterns was detected",
            "The cookie consent banner is present but not visible to the user",
            "The banner does not follow standard compliance patterns used by audit engines"
        ],
        howToOvercomeFailure: [
            "Implement a clearly visible cookie consent banner that loads on initial page entry",
            "Ensure the banner is compliant with GDPR, CCPA, and other relevant privacy regulations",
            "Verify the banner is not hidden by CSS (e.g., display: none or zero opacity)"
        ]
    },
    Privacy_Policy: {
        title: "Privacy Policy",
        whatThisParameterIs: "A clear Privacy Policy tells your visitors exactly how you handle their personal data, building trust and meeting legal requirements.",
        whatItCalculates: "It scans all visible links on the page for anchor tags related to 'Privacy Policy' or 'Privacy'.",
        whyItMatters: "A clear policy is a huge sign of professionalism. It tells users you take their privacy seriously and have nothing to hide.",
        thresholds: {
            good: "Visible privacy policy link found",
            poor: "No visible privacy policy link matching patterns found"
        },
        actualReasonsForFailure: [
            "No visible link matching 'Privacy Policy' text or URL patterns was found",
            "The privacy policy link is present but hidden from view or non-functional",
            "The link exists but its text is not recognizable as a privacy policy disclosure"
        ],
        howToOvercomeFailure: [
            "Ensure a clearly visible 'Privacy Policy' link is present on every page, typically in the footer",
            "Verify the link text is recognizable (e.g., 'Privacy Policy' or 'Data Policy')",
            "Ensure the policy page is reachable and provides comprehensive privacy disclosures"
        ]
    },
    Admin_Panel_Public: {
        title: "Public Admin Panel Exposure",
        whatThisParameterIs: "This check ensures your website's 'control center' isn't visible to the public, preventing hackers from trying to break in.",
        whatItCalculates: "It probes common administrative paths and checks for successful responses containing admin-related keywords.",
        whyItMatters: "Hiding these 'backdoors' makes it much harder for automated hacker programs to find a way into your website's private areas.",
        thresholds: {
            good: "No public admin panels detected",
            poor: "Public admin panel exposed or accessible"
        },
        actualReasonsForFailure: [
            "An administrative panel was detected at a common path (e.g., /admin, /wp-admin)",
            "The admin panel is publicly accessible without proper authentication or IP restrictions",
            "Common admin keywords were found in a page that should be restricted"
        ],
        howToOvercomeFailure: [
            "Restrict access to administrative panels using IP whitelisting or VPNs",
            "Move admin interfaces to non-standard, non-public URLs",
            "Enforce strong authentication (MFA) on all administrative entry points"
        ]
    },
    MFA_Enabled: {
        title: "Multi-Factor Authentication (MFA)",
        whatThisParameterIs: "MFA (Multi-Factor Authentication) adds an extra layer of security beyond just a password, like a code sent to your phone.",
        whatItCalculates: "It scans the page for MFA-related input fields, specific keywords ('2FA', 'OTP'), or SSO/Federated login indicators.",
        whyItMatters: "Even if someone steals your password, MFA ensures they still can't get in. It's the ultimate protection for your most sensitive accounts.",
        thresholds: {
            good: "MFA or SSO indicators detected on the login page",
            poor: "No visible MFA or SSO indicators found"
        },
        actualReasonsForFailure: [
            "No explicit Multi-Factor Authentication (MFA) or SSO options were detected on the entry page",
            "The login form appears to use single-factor authentication only",
            "MFA indicators are missing from visible page text and input attributes"
        ],
        howToOvercomeFailure: [
            "Ensure MFA is available and enforced for all user accounts, especially sensitive ones",
            "Provide modern authentication options like SSO (Google, Microsoft) or Authenticator apps",
            "Display clear indicators on the login page if MFA is required in a subsequent step"
        ]
    },
    Google_Safe_Browsing: {
        title: "Google Safe Browsing",
        whatThisParameterIs: "Google Safe Browsing checks if your site has been 'red-flagged' by Google for containing dangerous software or scams.",
        whatItCalculates: "It queries the Google Safe Browsing API to check for active threat flags against the URL.",
        whyItMatters: "If Google flags your site as dangerous, they will block almost all your traffic with a giant warning—fixing this protects your reputation and traffic.",
        thresholds: {
            good: "URL not flagged by Google Safe Browsing",
            poor: "URL flagged as unsafe (Malware/Phishing)"
        },
        actualReasonsForFailure: [
            "The URL is currently flagged as unsafe (malware or phishing) in Google's database",
            "The API request to Google Safe Browsing failed, preventing a definitive check",
            "Matches for social engineering or unwanted software were found for this domain"
        ],
        howToOvercomeFailure: [
            "Check the 'Security Issues' report in Google Search Console for specific details",
            "Remove all malicious content, injected scripts, and compromised files immediately",
            "Request a security review from Google after the site has been fully cleaned"
        ]
    },
    Blacklist: {
        title: "Domain Blacklist Status",
        whatThisParameterIs: "Domain Blacklist Status shows if your website has been added to a 'do not visit' list used by security companies worldwide.",
        whatItCalculates: "It cross-references the domain and URL against aggregated reputation and security databases.",
        whyItMatters: "Being blacklisted means your site is marked as 'untrustworthy' by the internet's security systems, which can kill your traffic and business.",
        thresholds: {
            good: "Domain not present on major security blacklists",
            poor: "Domain or URL found in one or more blacklists"
        },
        actualReasonsForFailure: [
            "The domain or URL is listed in the Google Safe Browsing or VirusTotal blacklist",
            "One or more security vendors have flagged this domain as malicious",
            "The domain has been associated with past malware hosting or phishing activity"
        ],
        howToOvercomeFailure: [
            "Review detailed security reports from Google and VirusTotal to find the root cause",
            "Remove any malicious files or server configurations that triggered the blacklist",
            "Request delisting from each service individually after resolving the security issues"
        ]
    },
    Malware_Scan: {
        title: "Malware Detection",
        whatThisParameterIs: "Malware Detection scans your site for hidden 'viruses' or digital traps that could harm your visitors' computers.",
        whatItCalculates: "It queries the VirusTotal API to check for malicious or suspicious detections from dozens of security vendors.",
        whyItMatters: "Regular scans ensure your site isn't secretly spreading viruses to your visitors, which would permanently damage their trust in your brand.",
        thresholds: {
            good: "No malicious signatures detected",
            poor: "Malicious signatures detected by security vendors"
        },
        actualReasonsForFailure: [
            "One or more security vendors have flagged the domain as containing malicious content",
            "The scan detected signatures consistent with malware, trojans, or webshells",
            "The domain is listed as 'malicious' or 'suspicious' by VirusTotal vendors"
        ],
        howToOvercomeFailure: [
            "Investigate the specific detections listed on VirusTotal for your domain",
            "Conduct a full server-side scan of your files and database for malicious code",
            "Harden your server security and update all CMS, themes, and plugins"
        ]
    },
    Forms_Use_HTTPS: {
        title: "Secure Form Submission",
        whatThisParameterIs: "Secure Form Submission ensures that any info someone types into your forms (like a password) is sent safely and privately.",
        whatItCalculates: "It parses the 'action' attributes of all <form> tags to ensure they use the HTTPS protocol scheme.",
        whyItMatters: "When users send you their info, they expect it to be private. Secure forms ensure that hackers can't 'listen in' on what your users are typing.",
        thresholds: {
            good: "All forms submit data over HTTPS",
            poor: "One or more forms use insecure HTTP for submission"
        },
        actualReasonsForFailure: [
            "One or more forms on the page are configured to submit data over an unencrypted (HTTP) connection",
            "The form action URL uses 'http://' instead of 'https://'",
            "Mixed content issues are preventing secure form submission paths"
        ],
        howToOvercomeFailure: [
            "Update the 'action' attribute of all <form> tags to use absolute HTTPS URLs",
            "Ensure the entire page is served over HTTPS to avoid protocol mismatch",
            "Use relative paths for form actions if your entire site is forced to HTTPS"
        ]
    },
    GDPR_CCPA: {
        title: "GDPR / CCPA Compliance",
        whatThisParameterIs: "This check looks for signs that your site respects global privacy laws, giving users control over their data.",
        whatItCalculates: "It scans page text for keywords like 'GDPR' or 'CCPA' and detects standard compliance widgets (CMPs).",
        whyItMatters: "Following privacy laws isn't just about avoiding fines—it's about showing your global audience that you respect their personal rights.",
        thresholds: {
            good: "GDPR/CCPA notice or standard compliance widgets detected",
            poor: "No GDPR/CCPA mention or compliant widgets found"
        },
        actualReasonsForFailure: [
            "No specific text mentioning GDPR, CCPA, or user data rights was found on the page",
            "Standard compliance widgets or platform selectors were not detected",
            "Information about data rights is missing or not easily discoverable"
        ],
        howToOvercomeFailure: [
            "Ensure your site explicitly mentions GDPR and CCPA compliance in its privacy sections",
            "Implement a compliant Consent Management Platform (CMP) or visible link to 'Do Not Sell'",
            "Clear and explicit mention of data handling rights should be accessible to all users"
        ]
    },
    Data_Collection: {
        title: "Data Collection Disclosure",
        whatThisParameterIs: "Data Collection Disclosure ensures you are being honest with your visitors about what information you are collecting from them.",
        whatItCalculates: "It scans visible links and headings for explicit mentions of 'Data Collection' or 'Information We Collect'.",
        whyItMatters: "Honesty is the best policy. Being clear about what data you collect builds a strong, honest relationship with your customers.",
        thresholds: {
            good: "Explicit data collection disclosure found",
            poor: "No visible details about data collection were found"
        },
        actualReasonsForFailure: [
            "No visible links or headings were found that explicitly mention data collection or usage",
            "Disclosure is buried or missing standard keywords like 'Information We Collect'",
            "The site lacks a dedicated section explaining its data gathering practices"
        ],
        howToOvercomeFailure: [
            "Add a clearly marked section in your privacy policy detailing what data is collected",
            "Ensure that headers or links related to 'Data Usage' are visible in the footer or menu",
            "Be transparent about third-party data sharing and cookie collection"
        ]
    },
    Weak_Default_Credentials: {
        title: "Weak or Default Credentials",
        whatThisParameterIs: "This check looks for 'obvious' passwords (like 'admin' or '1234') that make it easy for hackers to take control of your site.",
        whatItCalculates: "It scans page text for default credentials and attempts a test login using common 'admin/admin' patterns.",
        whyItMatters: "Weak passwords are an open invitation for hackers. Using strong, unique credentials is the simplest way to keep your site safe.",
        thresholds: {
            good: "No default or weak credential indicators detected",
            poor: "Credentials mentioned in text or weak login attempt succeeded"
        },
        actualReasonsForFailure: [
            "Default credentials (e.g., 'admin/admin') were explicitly found in the page text",
            "The application was successfully accessed during an automated test with weak credentials",
            "A login form exists but does not appear to enforce strong credential requirements"
        ],
        howToOvercomeFailure: [
            "Remove any mention of default usernames or passwords from your public pages",
            "Change all default administrative credentials immediately after installation",
            "Enforce a strong password policy and implement account lockout for failed attempts"
        ]
    },
    Third_Party_Cookies: {
        title: "Third-Party Cookies",
        whatThisParameterIs: "This check identifies 'outside' trackers that are following your visitors, which can impact privacy and load times.",
        whatItCalculates: "It compares the domain of each cookie with the main hostname to identify external sources.",
        whyItMatters: "Reducing 'outsider' tracking makes your site feel more private and often helps it load faster for your visitors.",
        thresholds: {
            good: "No third-party cookies detected",
            poor: "One or more third-party cookies identified"
        },
        actualReasonsForFailure: [
            "Cookies from external domains are being stored, posing potential privacy risks",
            "Tracking or advertising scripts are setting cookies without explicit first-party scope",
            "Sensitive user data could be shared with external domains via cookie storage"
        ],
        howToOvercomeFailure: [
            "Audit all third-party scripts (ads, analytics, social) to see if they are necessary",
            "Use cookie-free alternatives for simple tracking wherever possible",
            "Ensure that all third-party cookie usage complies with GDPR and CCPA regulations"
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
                <p>This audit acts as a digital safety check for your website. It analyzes whether your site is a safe place for visitors to browse, share information, and do business.</p>
                <p>We scan everything from your encryption strength and 'hacker-proof' settings to how well you protect user privacy and guard against malicious software.</p>
            </div>
        ),
        whyItMatters: (
            <div className="space-y-4">
                <p>In today's world, security is the 'entrance fee' for doing business online. If visitors don't feel safe on your site, they won't stay, they won't buy, and they certainly won't return.</p>

                <div>
                    <span className="font-semibold block mb-1">A secure website gives you and your users:</span>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li><strong>Peace of Mind:</strong> Knowing that sensitive data (like passwords and credit cards) is locked behind industrial-strength encryption.</li>
                        <li><strong>Instant Trust:</strong> Showing the 'Secure' padlock that tells visitors their connection is private and authentic.</li>
                        <li><strong>Brand Protection:</strong> Preventing your site from being flagged as 'Dangerous' or 'Not Secure' by browsers and search engines.</li>
                        <li><strong>Legal Safety:</strong> Meeting essential privacy standards (like GDPR) to avoid fines and show respect for user rights.</li>
                        <li><strong>Hacker Resilience:</strong> Stopping digital intruders before they can cause damage to your site or reputation.</li>
                    </ul>
                </div>

                <p className="font-medium">A secure site isn't just a technical requirement—it's a commitment to your customers' safety.</p>
            </div>
        ),
        whatToDoForAGoodScore: (
            <ul className="list-disc pl-5 space-y-2">
                <li>
                    <span className="font-semibold">Secure your site with HTTPS and valid SSL:</span> Ensure your site uses HTTPS, has a valid SSL certificate (not nearing expiry), and supports modern encryption protocols (TLS 1.2+).
                </li>
                <li>
                    <span className="font-semibold">Identify and Patch Critical Vulnerabilities:</span> Use tools to scan for and fix issues like SQL Injection, Cross-Site Scripting (XSS), and exposed database errors.
                </li>
                <li>
                    <span className="font-semibold">Harden Security Headers:</span> Implement robust headers like Content Security Policy (CSP), HSTS, X-Frame-Options, and X-Content-Type-Options to stop code injection and clickjacking.
                </li>
                <li>
                    <span className="font-semibold">Monitor Malware and Domain Reputation:</span> Regularly check against Google Safe Browsing and global blacklists to ensure your site hasn't been compromised or flagged as malicious.
                </li>
                <li>
                    <span className="font-semibold">Protect Administrative Access:</span> Ensure administrative panels are not publicly accessible and that all login systems avoid weak or default credentials.
                </li>
                <li>
                    <span className="font-semibold">Secure Cookies and Authentication:</span> Sensitive cookies must have 'Secure' and 'HttpOnly' flags, and multi-factor authentication (MFA) should be supported where possible.
                </li>
                <li>
                    <span className="font-semibold">Ensure Compliance and Privacy:</span> Maintain a visible Privacy Policy, display clear Cookie Consent banners, and adhere to global data protection laws like GDPR and CCPA.
                </li>
            </ul>
        ),
        howThisScoreIsCalculated: (
            <div className="space-y-2">
                <p>We calculate this score by performing an automated security audit that cross-references your site against 20+ critical security parameters and vulnerability databases.</p>
                <p>Each check is assigned a weight based on its severity—from critical threats like SQL Injection and Malware (high weight) to best-practice headers and privacy signals (lower weight). The final score reflects the overall risk profile of your web environment.</p>
            </div>
        ),
        weightage: [
            { param: "Critical Vulnerabilities & Malware", weight: "30%" },
            { param: "Encryption & Transport Security", weight: "20%" },
            { param: "Authentication & Access Control", weight: "20%" },
            { param: "Browser Hardening & Security Headers", weight: "19%" },
            { param: "Data Privacy & Legal Compliance", weight: "11%" }
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
            "Very long sentences with complex grammatical structures",
            "Vocabulary with high syllable counts and technical jargon",
            "Dense paragraphs without adequate white space or breaks"
        ],
        howToOvercomeFailure: [
            "Use shorter, more direct sentences (avg 15-20 words)",
            "Replace complex terminology with simpler alternatives",
            "Break dense blocks of text into smaller, digestible paragraphs",
            "Use an active voice and clear headings to guide the reader"
        ]
    },

    Tap_Target_Size: {
        title: "Tap Target Size",
        whatThisParameterIs: "Tap Target Size checks if interactive elements are large enough for comfortable touch interactions.",
        whatItCalculates: "It measures the rendered dimensions of buttons/links and verifies they meet the minimum 48x48px recommended guideline.",
        whyItMatters: "Small tap targets cause frustration, misclicks, and accessibility barriers for mobile users.",
        thresholds: {
            good: "≥ 90% tap targets meet size requirements",
            needsImprovement: "Some targets are too small or close together",
            poor: "Many interactive elements are too small for touch"
        },
        actualReasonsForFailure: [
            "Buttons or interactive elements are smaller than the recommended 48px size",
            "Links or menu items are placed too close together, causing misclicks",
            "Small icons are used as primary navigation without adequate touch area"
        ],
        howToOvercomeFailure: [
            "Increase the size of all buttons and clickable elements to at least 48x48px",
            "Ensure a minimum of 8px spacing (padding or margin) between interactive targets",
            "Add padding around small links and icons to expand their hit area"
        ]
    },
    Text_Font_Size: {
        title: "Text Font Size",
        whatThisParameterIs: "Text Font Size ensures that content is legible on mobile devices without requiring the user to zoom.",
        whatItCalculates: "It checks computed font sizes against a minimum legibility threshold (typically 12px or 16px).",
        whyItMatters: "Small text content causes eye strain and forces users to zoom, harming the mobile experience.",
        thresholds: {
            good: "≥ 90% text meets minimum size (e.g., 16px)",
            needsImprovement: "Some text elements are too small to read easily",
            poor: "The majority of the page uses illegible font sizes"
        },
        actualReasonsForFailure: [
            "Base font size is below the recommended 16px for primary content",
            "Overuse of small captions or fine print (below 12px) for functional text",
            "Inconsistent font scaling that makes some labels difficult to read"
        ],
        howToOvercomeFailure: [
            "Increase global base font size in your CSS (16px is standard)",
            "Avoid font sizes below 12px for any user-facing instructions or content",
            "Use clear, high-contrast typography to improve mobile legibility"
        ]
    },
    Horizontal_Scroll_Check: {
        title: "Horizontal Scrolling",
        whatThisParameterIs: "Horizontal Scroll Check detects if the page content overflows the viewport width on mobile devices.",
        whatItCalculates: "It compares the total scrollWidth of the document against the window width to detect overflow.",
        whyItMatters: "Unintended horizontal scrolling is a major mobile usability flaw that breaks navigation and layouts.",
        thresholds: {
            good: "No horizontal scroll detected",
            poor: "Horizontal scroll detected on the primary viewport"
        },
        actualReasonsForFailure: [
            "Fixed-width containers or elements (divs, tables) forced to exceed viewport width",
            "Large images or media assets not properly constrained to 100% width",
            "Wide margins or absolute positioning pushing elements outside of the view"
        ],
        howToOvercomeFailure: [
            "Use responsive, percentage-based widths or Flexbox/Grid layouts",
            "Ensure all images and videos have 'max-width: 100%' set in CSS",
            "Remove fixed pixel widths and use relative units like vw, % or rem"
        ]
    },
    Sticky_Header_Usage: {
        title: "Sticky Header Analysis",
        whatThisParameterIs: "Sticky Header Analysis checks if fixed or sticky headers obstruct an excessive portion of the screen.",
        whatItCalculates: "It measures the height of fixed-position head elements and compares it to the viewport height.",
        whyItMatters: "Oversized sticky headers reduce the reading area and clutter the UI on smaller screens.",
        thresholds: {
            good: "Sticky header height within a reasonable limit",
            poor: "Header is too tall and obstructs content"
        },
        actualReasonsForFailure: [
            "Large fixed headers occupying more than 15-20% of the screen height",
            "Multiple stacked sticky elements (e.g., promo bar + main navigation)",
            "Headers that do not collapse or shrink upon scrolling down"
        ],
        howToOvercomeFailure: [
            "Reduce the vertical height of your fixed header on mobile devices",
            "Implement a 'hide on scroll' behavior for the header to maximize screen space",
            "Combine multiple sticky elements into a single, compact navigation bar"
        ]
    },
    Navigation_Depth: {
        title: "Navigation Depth",
        whatThisParameterIs: "Navigation Depth measures the number of clicks required for a user to reach specific pages from the homepage.",
        whatItCalculates: "It analyzes the URL path structure to determine the distance in 'clicks' from the root domain.",
        whyItMatters: "Content buried too deep is difficult for users to discover and harder for search engines to index.",
        thresholds: {
            good: "≥ 80% links within 3 clicks of the homepage",
            needsImprovement: "Significant content buried 4+ levels deep",
            poor: "Most primary content is extremely deep in the hierarchy"
        },
        actualReasonsForFailure: [
            "Overly nested URL structures (e.g., more than 4 levels of subfolders)",
            "A complex or inaccessible menu structure that hides important landing pages",
            "Core content missing direct links from parent or category pages"
        ],
        howToOvercomeFailure: [
            "Flatten your site's navigation hierarchy to ensure content is reached in 3 clicks or less",
            "Improve internal linking strategy by adding 'Related Content' or category sidebars",
            "Simplify the main menu to focus on high-level navigation paths"
        ]
    },
    Intrusive_Interstitials: {
        title: "Intrusive Interstitials",
        whatThisParameterIs: "Intrusive Interstitials detection identifies popups or overlays that obstruct the user's view of the main content.",
        whatItCalculates: "It searches for large elements with high z-index that cover a significant portion of the viewport on load.",
        whyItMatters: "aggressive popups frustrate users, increase bounce rates, and can trigger SEO ranking penalties.",
        thresholds: {
            good: "No intrusive interstitials detected",
            poor: "Intrusive elements or full-page overlays identified"
        },
        actualReasonsForFailure: [
            "Full-screen popups or 'splash' pages that block content immediately upon load",
            "Scroll-blocking modals that prevent interaction with the underlying page",
            "Oversized 'Install App' or 'Subscribe' banners that dominate the screen"
        ],
        howToOvercomeFailure: [
            "Use non-intrusive banners or toast notifications that only cover a small part of the screen",
            "Delay the appearance of popups until the user has spent time on the page or scrolled down",
            "Ensure 'Close' buttons are prominent, easy to hit, and clear on all screen sizes"
        ]
    },
    Image_Stability: {
        title: "Image Stability",
        whatThisParameterIs: "Image Stability checks if media elements have predefined dimensions to prevent layout shifts during page load.",
        whatItCalculates: "It verifies the presence of 'width' and 'height' attributes or CSS 'aspect-ratio' on images.",
        whyItMatters: "Images without dimensions cause 'Cumulative Layout Shift', which makes the page jump around as content loads.",
        thresholds: {
            good: "≥ 90% images are stable with explicit dimensions",
            poor: "Many unstable images causing layout shifts"
        },
        actualReasonsForFailure: [
            "Missing explicit 'width' and 'height' attributes on <img> tags",
            "No 'aspect-ratio' defined in CSS to reserve space for dynamically loaded media",
            "Background images without containing elements that maintain their space"
        ],
        howToOvercomeFailure: [
            "Always include explicit 'width' and 'height' attributes for all static images",
            "Use the 'aspect-ratio' property in CSS for responsive images to reserve vertical space",
            "Use placeholders or skeleton loaders for large media assets"
        ]
    },
    Breadcrumbs: {
        title: "Breadcrumb Navigation",
        whatThisParameterIs: "Breadcrumb Navigation checks for the presence of a hierarchical trail to help users understand their location.",
        whatItCalculates: "It scans for structured data (BreadcrumbList) or navigation elements matching breadcrumb patterns.",
        whyItMatters: "Breadcrumbs improve navigation usability and help search engines crawl and understand your site structure.",
        thresholds: {
            good: "Breadcrumb trail or Schema markup detected",
            poor: "No visible breadcrumbs found for multi-level paths"
        },
        actualReasonsForFailure: [
            "No visible breadcrumb navigation trail detected on internal or deep pages",
            "Missing 'BreadcrumbList' structured data (JSON-LD or Microdata) for SEO enrichment",
            "Breadcrumbs are present but non-functional or not linked to parent categories"
        ],
        howToOvercomeFailure: [
            "Add a visible breadcrumb trail at the top of all pages except the homepage",
            "Implement correct 'BreadcrumbList' Schema.org markup to enhance search results",
            "Ensure the breadcrumb trail accurately reflects the current hierarchical location of the page"
        ]
    },
    Navigation_Discoverability: {
        title: "Navigation Discoverability",
        whatThisParameterIs: "Navigation Discoverability ensures menus and search features are easily accessible on mobile.",
        whatItCalculates: "It checks for the presence of a visible 'hamburger' menu icon or search bar in the viewport.",
        whyItMatters: "Hidden or hard-to-find navigation causes users to feel lost and leave the site.",
        thresholds: {
            good: "Nav menu, hamburger, and search available",
            needsImprovement: "One or more missing",
            poor: "No navigation elements found"
        },
        actualReasonsForFailure: [
            "Missing main navigation menu",
            "No hamburger menu on mobile",
            "No visible search option"
        ],
        howToOvercomeFailure: [
            "Use <nav> or role='navigation' for main menu",
            "Ensure hamburger menu is visible on mobile",
            "Add a search bar or icon"
        ]
    },
    Above_the_Fold_Content: {
        title: "Above-the-Fold Content",
        whatThisParameterIs: "Above-the-Fold Content checks if the primary content is visible without scrolling.",
        whatItCalculates: "We calculate the Weighted ATF Score by comparing the weighted sum of important elements visible in the initial viewport against the total weighted sum of important elements on the entire page. Important elements include Headings (H1-H3, weight 4-5), Media (Img/Video, weight 3), Interactive elements (Buttons/Inputs, weight 2-3), and substantial text blocks.",
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
        whatItCalculates: "We identify all interactive elements (buttons, links, inputs, etc.) and verify if they exhibit visual changes (color, background, shadow, transform, opacity, etc.) on :hover for Desktop or :active for Mobile. The score represents the percentage of interactive elements that provide this visual feedback.",
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
    Broken_Links: {
        title: "Broken Links",
        whatThisParameterIs: "Scans for hyperlinks that point to non-existent pages (404 errors) or unreachable servers.",
        whyItMatters: "Broken links frustrate users, interrupt navigation, and negatively impact search engine rankings.",
        thresholds: {
            good: "0 broken links",
            warning: "1 broken link",
            poor: "> 1 broken link"
        },
        actualReasonsForFailure: [
            "Mistyped URLs",
            "Linked content has been deleted or moved",
            "Server errors on destination site"
        ],
        howToOvercomeFailure: [
            "Correct the URL",
            "Remove the link if content is gone",
            "Set up 301 redirects for moved content"
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
    CTA_Presence: {
        title: "CTA Presence",
        whatThisParameterIs: "We check if your main 'action buttons' (like Buy or Sign Up) are easy to see and haven't been missed.",
        whatItCalculates: "We scan the page for prominent buttons and links specifically designed as Calls-to-Action (buttons, .cta, .btn, etc.).",
        whyItMatters: "If users can't spot the 'Buy' or 'Sign Up' button in seconds, they will leave without acting.",
        thresholds: {
            good: "One or more clear CTAs present",
            poor: "No prominent CTAs detected"
        },
        actualReasonsForFailure: [
            "No elements matching common CTA patterns (buttons, primary links) were detected",
            "Buttons lack standard CTA class names or identifiable attributes",
            "CTAs are hidden or styled like normal text"
        ],
        howToOvercomeFailure: [
            "Add at least one clear Call-to-Action button like 'Get Started' or 'Contact Us'",
            "Ensure your main buttons use standard HTML buttons or classes like .btn or .cta",
            "Make CTAs consistently visible and prominent"
        ]
    },
    CTA_Clarity: {
        title: "CTA Text Clarity",
        whatThisParameterIs: "We check if your button text is clear and tells people exactly what happens when they click.",
        whatItCalculates: "We analyze the text labels of your buttons to ensure they use strong, action-oriented verbs (e.g., 'Buy', 'Download', 'Join').",
        whyItMatters: "Vague buttons like 'Submit' cause hesitation. Clear words like 'Get Started' give users confidence to click.",
        thresholds: {
            good: "CTAs use clear action verbs",
            poor: "CTA text is vague or generic"
        },
        actualReasonsForFailure: [
            "Buttons or links use passive or ambiguous labels (e.g., 'Click Here', 'More Info')",
            "Button text does not contain strong action verbs",
            "Labels are too long or confusing"
        ],
        howToOvercomeFailure: [
            "Use action-oriented verbs like 'Buy Now', 'Download', or 'Register' to drive engagement",
            "Replace generic labels with specific value propositions",
            "Keep CTA text short and punchy"
        ]
    },

    CTA_Crowding: {
        title: "CTA Crowding",
        whatThisParameterIs: "We check if you have too many buttons close together, which can confuse visitors.",
        whatItCalculates: "We count the total number of primary Calls-to-Action on the page to ensure users aren't overwhelmed with too many choices.",
        whyItMatters: "Too many choices confuse users. When people are overwhelmed, they often choose nothing at all.",
        thresholds: {
            good: "1–3 CTAs (Optimal)",
            warning: "More than 3 CTAs (Potential Clutter)",
            poor: "No CTAs found"
        },
        actualReasonsForFailure: [
            "The number of CTA elements exceeds the recommended limit, potentially causing choice paralysis",
            "Multiple primary actions competing for attention",
            "Lack of a clear primary goal"
        ],
        howToOvercomeFailure: [
            "Focus on one or two primary actions to guide the user effectively",
            "Reduce the number of competing buttons in a single view",
            "Differentiate visually between primary and secondary actions"
        ]
    },
    Link_Relevance: {
        title: "Link Relevance",
        whatThisParameterIs: "We check if your buttons lead users to the right pages (like a checkout page) instead of a random blog post.",
        whatItCalculates: "We scan buttons with keywords like 'Buy', 'Sign Up', or 'Register' and verify their links point to conversion-focused pages (e.g., 'checkout', 'pricing', 'product') rather than informational pages (e.g., 'blog', 'about', 'faq').",
        whyItMatters: "If a user clicks 'Buy Now' and lands on an About page, the momentum is lost. Direct paths to conversion reduce drop-offs.",
        thresholds: {
            good: "CTAs link to relevant pages",
            warning: "Mismatch detected (e.g. 'Buy' -> 'Blog')"
        },
        actualReasonsForFailure: [
            "High-intent buttons (Buy/Sign Up) link to informational pages (Blog, About, FAQ)",
            "CTAs lead to generic pages instead of specific conversion steps",
            "Link destinations do not match the user's intent"
        ],
        howToOvercomeFailure: [
            "Ensure 'Buy' buttons link directly to Checkout, Cart, or Product pages",
            "Point 'Sign Up' buttons to Registration or Pricing pages",
            "Avoid linking conversion buttons to Blog, About, or Contact pages"
        ]
    },
    CTA_Flow_Alignment: {
        title: "CTA Flow Alignment",
        whatThisParameterIs: "We check if your buttons are placed at the most natural points where a visitor is ready to act.",
        whatItCalculates: "We check the position of your primary Call-to-Action relative to the rest of the page content to ensure it appears at the right moment.",
        whyItMatters: "Asking for a commitment before explaining the value is pushy. Asking too late means they might miss it.",
        thresholds: {
            good: "CTA well-positioned (10-90% of page)",
            warning: "CTA too early (<10%) or too late (>90%)",
            poor: "No flow-aligned CTA found"
        },
        actualReasonsForFailure: [
            "Primary CTA is placed at the extreme top (too early) or bottom (too late) of the content",
            "No CTAs with strong keywords found in the main content flow",
            "User is asked to commit before understanding the value"
        ],
        howToOvercomeFailure: [
            "Position CTAs where users have enough context to make a decision, typically after a value proposition",
            "Distribute CTAs evenly throughout long pages",
            "Ensure a CTA is visible at the moment of highest interest"
        ]
    },
    Form_Presence: {
        title: "Lead Form Presence",
        whatThisParameterIs: "We check if you have a contact or signup form so visitors can easily get in touch.",
        whatItCalculates: "We scan the page for standard HTML <form> elements to ensure there's a way for visitors to convert.",
        whyItMatters: "You can't get leads if there's no form to fill out. It's the front door to your business.",
        thresholds: {
            good: "At least one form present",
            poor: "No forms detected"
        },
        actualReasonsForFailure: [
            "The page does not contain any <form> elements for lead capture",
            "Forms might be hidden or loaded via inaccessible scripts",
            "No direct method for user input found"
        ],
        howToOvercomeFailure: [
            "Add a contact or lead generation form to capture visitor information directly",
            "Ensure forms are rendered as proper HTML elements",
            "Make sure at least one form is easily accessible"
        ]
    },
    Form_Length: {
        title: "Form Length Optimization",
        whatThisParameterIs: "We check if your forms are short and sweet, or if they're too long and scaring people away.",
        whatItCalculates: "We count the number of visible input fields in your forms to ensure they aren't too long or intimidating.",
        whyItMatters: "Each extra question gives users another reason to quit. Shorter forms almost always convert better.",
        thresholds: {
            good: "Concise form (< 7 fields)",
            warning: "Long form (≥ 7 fields)",
            pass: "No forms to analyze"
        },
        actualReasonsForFailure: [
            "One or more forms have many fields (7+), which can discourage completions",
            "Forms appear cluttered or demanding to the user",
            "Requesting unnecessary information upfront"
        ],
        howToOvercomeFailure: [
            "Reduce the number of required fields to the absolute minimum",
            "Break long forms into multiple steps (multi-step form)",
            "Collect enriched data later in the user journey"
        ]
    },
    Required_vs_Optional_Fields: {
        title: "Required vs Optional Fields",
        whatThisParameterIs: "We check if you've clearly marked which boxes *must* be filled in, so visitors don't get frustrated.",
        whatItCalculates: "We check if form fields clearly indicate whether they are required or optional using asterisks (*) or text labels.",
        whyItMatters: "Guessing games frustrate users. If they get an error for a field they thought was optional, they are likely to give up.",
        thresholds: {
            good: "Requirements clearly marked",
            warning: "No visual distinction found",
            pass: "No inputs to analyze"
        },
        actualReasonsForFailure: [
            "Form fields do not use visual indicators (like *) or labels ('optional') to guide the user",
            "Missing 'required' attributes on mandatory inputs",
            "Users cannot easily distinguish mandatory fields"
        ],
        howToOvercomeFailure: [
            "Clearly mark required fields with an asterisk (*) or 'Required' label",
            "Explicitly label optional fields (e.g., '(Optional)')",
            "Ensure visual cues match the underlying HTML validation"
        ]
    },
    Inline_Validation: {
        title: "Inline Form Validation",
        whatThisParameterIs: "We check if your form gives helpful 'instant feedback' (like a green checkmark) as people type.",
        whatItCalculates: "We check for standard HTML5 validation attributes (like required, pattern, type='email') that provide immediate feedback.",
        whyItMatters: "Waiting until the end to see errors is annoying. Instant feedback helps users fix mistakes quickly and finish the form.",
        thresholds: {
            good: "Inline validation detected",
            poor: "No validation attributes found"
        },
        actualReasonsForFailure: [
            "Form inputs lack HTML5 validation attributes (e.g., 'required', 'pattern')",
            "Users can submit empty or invalid data without immediate feedback",
            "Lack of client-side validation logic"
        ],
        howToOvercomeFailure: [
            "Add HTML5 'required' and 'pattern' attributes to form inputs",
            "Use specific input types like 'email' or 'tel' to trigger browser validation",
            "Implement real-time JS validation for complex fields"
        ]
    },
    Submit_Button_Clarity: {
        title: "Submit Button Clarity",
        whatThisParameterIs: "We check if your final 'Send' button clearly explains what will happen next (e.g., 'Get My Quote').",
        whatItCalculates: "We analyze the text of your form submission buttons to see if they use clear, encouraging language.",
        whyItMatters: "A button saying 'Submit' is boring. Specific text like 'Get My Quote' implies a reward and excites the user.",
        thresholds: {
            good: "Clear, action-oriented text",
            warning: "Generic label (e.g. 'Submit')",
            pass: "No submit buttons found"
        },
        actualReasonsForFailure: [
            "Submit buttons use generic labels like 'Submit' instead of specific actions",
            "Button text is vague or missing",
            "Failed to reinforce the value of the action"
        ],
        howToOvercomeFailure: [
            "Use specific text like 'Get My Quote', 'Join Now', or 'Send Message'",
            "Avoid generic labels like 'Submit', 'Go', or 'Enter'",
            "Clearly state what happens next in the button text"
        ]
    },
    Testimonials: {
        title: "Testimonials",
        whatThisParameterIs: "We look for real stories or quotes from happy customers that prove people love your brand.",
        whatItCalculates: "We scan for sections or elements identified as testimonials, reviews, or client feedback using standard keywords.",
        whyItMatters: "People trust other people more than they trust brands. Authentic reviews reduce anxiety about buying.",
        thresholds: {
            good: "Testimonials section detected",
            poor: "No testimonials found"
        },
        actualReasonsForFailure: [
            "No section or elements were found that indicate client testimonials or success stories",
            "Testimonial classes or IDs matching common patterns were not found",
            "Lack of social proof content"
        ],
        howToOvercomeFailure: [
            "Add at least 2-3 customer testimonials to build credibility",
            "Use class names like 'testimonial' or 'client-review' to help identification",
            "Include photos and names with testimonials for authenticity"
        ]
    },
    Trust_Badges: {
        title: "Trust Badges",
        whatThisParameterIs: "We check for trust symbols (like secure payment icons) that help visitors feel safe sharing their info.",
        whatItCalculates: "We search for images that represent security, payment methods, or trust guarantees (e.g., 'SSL', 'Verified', 'Secure').",
        whyItMatters: "Users are wary of online scams. Visual trust signals reassure them that their data and money are safe.",
        thresholds: {
            good: "Trust badges visible",
            poor: "No trust badges detected"
        },
        actualReasonsForFailure: [
            "No trust-related images (security, SSL, verified) were detected",
            "Trust badges might be background images or SVG icons without descriptive text",
            "Missing visual signals of security"
        ],
        howToOvercomeFailure: [
            "Include icons for security or industry certifications (e.g., SSL, ISO)",
            "Ensure trust badge images have descriptive content or alt text",
            "Place badges near sensitive areas like forms or checkout"
        ]
    },

    Lead_Magnets: {
        title: "Lead Magnets",
        whatThisParameterIs: "We check if you're offering something valuable for free (like a guide) to encourage people to sign up.",
        whatItCalculates: "We look for text indicating high-value free resources like 'ebook', 'guide', 'whitepaper', or 'download'.",
        whyItMatters: "Most visitors aren't ready to buy yet. A freebie captures their information so you can follow up later.",
        thresholds: {
            good: "Lead magnet detected",
            warning: "No lead magnets found"
        },
        actualReasonsForFailure: [
            "No high-value offers like ebooks, guides, or whitepapers were detected in the text",
            "Keywords related to downloadable resources are missing",
            "Offer is not clearly communicated"
        ],
        howToOvercomeFailure: [
            "Offer a relevant lead magnet (e.g., a PDF guide or checklist)",
            "Use clear text like 'Download our Free Guide' or 'Get the Ebook'",
            "Make the exchange of value clear to the user"
        ]
    },

    MultiStep_Form_Progress: {
        title: "Multi-Step Form Progress",
        whatThisParameterIs: "We check if you've broken long forms into easy steps that feel less overwhelming to finish.",
        whatItCalculates: "We check for progress indicators or step labels often used in multi-page forms.",
        whyItMatters: "A huge list of questions is intimidating. Breaking it up into small steps makes it feel easier to finish.",
        thresholds: {
            good: "Progress indicators present",
            pass: "No multi-step form detected"
        },
        actualReasonsForFailure: [
            "No progress bars or step indicators were found on a potential multi-step form",
            "Multi-step forms lack visual cues for the user's journey",
            "Steps are not clearly labeled"
        ],
        howToOvercomeFailure: [
            "Add a progress bar or step counter (e.g., 'Step 1 of 3') for longer processes",
            "Use standard class names like '.step' or '.progress' for detection",
            "Clearly show the user where they are in the process"
        ]
    },
    Progress_Indicators: {
        title: "Progress Indicators",
        whatThisParameterIs: "We check for a 'progress bar' that shows visitors exactly how close they are to the finish line.",
        whatItCalculates: "We look for general progress bars or step indicators that guide users through any process.",
        whyItMatters: "People are motivated to finish what they start. Seeing '50% Complete' encourages them to keep going.",
        thresholds: {
            good: "Progress indicators detected",
            warning: "No progress indicators found"
        },
        actualReasonsForFailure: [
            "No elements matching progress bar, step, or progress patterns were found",
            "Users may feel lost in complex flows without status updates",
            "Missing visual feedback on process completion"
        ],
        howToOvercomeFailure: [
            "Add progress indicators for any multi-stage processes",
            "Use standard HTML <progress> elements or identifiable classes",
            "Keep the user informed of their status"
        ]
    },
    Reviews: {
        title: "User Reviews & Ratings",
        whatThisParameterIs: "We look for star ratings or customer scores that give visitors confidence in your business.",
        whatItCalculates: "We search for visual elements representing user ratings, stars, or customer reviews.",
        whyItMatters: "Social proof is powerful. Seeing 5 stars instantly builds credibility and makes users want to buy.",
        thresholds: {
            good: "Reviews/Ratings detected",
            poor: "No reviews found"
        },
        actualReasonsForFailure: [
            "No aggregate ratings or specific user review elements were detected",
            "Keywords like 'review', 'rating', or 'stars' were not found in class names or IDs",
            "Star ratings are missing or hidden"
        ],
        howToOvercomeFailure: [
            "Display star ratings or numerical scores prominently",
            "Use standard class names for review sections",
            "Ensure reviews are visible and not hidden in tabs"
        ]
    },
    Client_Logos: {
        title: "Client / Partner Logos",
        whatThisParameterIs: "We look for a 'Trusted By' section with logos of companies you've worked with to show authority.",
        whatItCalculates: "We scan for sections showcasing client or partner logos to establish authority.",
        whyItMatters: "Proprietary authority helps. Showing that you work with established brands makes you look professional and safe.",
        thresholds: {
            good: "Client/Partner logos detected",
            warning: "No client logos detected"
        },
        actualReasonsForFailure: [
            "The page does not prominently feature logos of partners or previous clients",
            "Selectors related to client logos returned no results",
            "Missing visual trust signals"
        ],
        howToOvercomeFailure: [
            "Display a 'Logos' or 'Trusted By' section with well-known brands",
            "Use descriptive class names like '.client-logo' or '.partner-logo'",
            "Include logos near conversion points"
        ]
    },
    Case_Studies_Accessibility: {
        title: "Case Studies & Success Stories",
        whatThisParameterIs: "We check for detailed success stories that prove you can deliver real results for your clients.",
        whatItCalculates: "We search the page content for mentions of 'case study', 'success story', or 'client success'.",
        whyItMatters: "Claims are easy to make; proof is hard. Case studies prove you can deliver results, which builds massive trust.",
        thresholds: {
            good: "Case studies detected",
            warning: "No case studies found"
        },
        actualReasonsForFailure: [
            "No textual references to 'case studies' or 'success stories' were found in the content",
            "Detailed proof of results or success is missing",
            "Links to case studies are not clearly labeled"
        ],
        howToOvercomeFailure: [
            "Showcase real-world examples through detailed case studies or success stories",
            "Feature a dedicated 'Success Stories' section",
            "Link to case studies from relevant product/service pages"
        ]
    },


    Friendly_Error_Handling: {
        title: "Friendly Error Handling",
        whatThisParameterIs: "We check if your error messages are kind and helpful, guiding users to fix mistakes easily.",
        whatItCalculates: "We check for the presence of error message containers or validation attributes that help users fix mistakes.",
        whyItMatters: "Blaming the user feels bad. Helpful hints like 'Please include an @ in your email' make the user feel supported.",
        thresholds: {
            good: "Error handling indicators detected",
            warning: "No explicit error cues found"
        },
        actualReasonsForFailure: [
            "No clear error message containers or validation attributes were identified",
            "Users lack guidance when inputting invalid data",
            "Validation feedback is missing"
        ],
        howToOvercomeFailure: [
            "Design and implement clear, helpful error messages",
            "Ensure input fields have validation states (e.g., aria-invalid)",
            "Guide users to fix mistakes in real-time"
        ]
    },
    Microcopy_Clarity: {
        title: "Microcopy Clarity",
        whatThisParameterIs: "We check for small helpful hints inside your form fields that make them effortless to fill out.",
        whatItCalculates: "We look for helpful text like input placeholders or helper text that explains what to type.",
        whyItMatters: "Tiny clarifications prevent big confusions. They make the form feel effortless to fill out.",
        thresholds: {
            good: "Helper text/placeholders detected",
            warning: "Limited microcopy found"
        },
        actualReasonsForFailure: [
            "Form inputs lack placeholders or descriptive helper text",
            "Fields are ambiguous or lack context for the user",
            "User has to guess the required format"
        ],
        howToOvercomeFailure: [
            "Add descriptive microcopy and meaningful placeholders",
            "Include small helper text below complex fields",
            "Anticipate user questions with instructional text"
        ]
    },
    Incentives_Displayed: {
        title: "Incentives & Offers",
        whatThisParameterIs: "We look for exciting offers—like 'Free Shipping' or a 'Limited Time Discount'—that encourage action.",
        whatItCalculates: "We scan the text for promotional keywords like 'free', 'discount', 'offer', or 'guarantee'.",
        whyItMatters: "Everyone loves a deal. A clear incentive gives users a logical reason to act *now*.",
        thresholds: {
            good: "Incentives detected",
            warning: "No incentives found"
        },
        actualReasonsForFailure: [
            "No promotional language or special offers were detected in the content",
            "Value propositions like discounts or bonuses are missing",
            "Offers are hidden or not text-based"
        ],
        howToOvercomeFailure: [
            "Highlight special offers, discounts, or 'risk-free' trials",
            "Use words like 'Free', 'Save', or 'Bonus' to attract attention",
            "Make incentives visible near Calls-to-Action"
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
                <p>This score checks if your website is good at turning visitors into customers.</p>
                <p>We look at the key things that make people subscribe or buy: clear buttons, simple forms, and proof that your business can be trusted.</p>
            </div>
        ),
        whyItMatters: (
            <div className="space-y-2">
                <p>Traffic is vanity; sales are sanity. You don't just want visitors, you want results.</p>
                <p>If people can't figure out where to click or get frustrated by long forms, they leave. A good conversion flow guides them effortlessly to the finish line.</p>
            </div>
        ),
        whatToDoForAGoodScore: (
            <ul className="list-disc pl-5 space-y-4">
                <li>
                    <span className="font-semibold block mb-1">Make your buttons impossible to miss:</span>
                    <ul className="list-[circle] pl-5 space-y-1 text-sm">
                        <li>Design buttons to look clickable, using standard classes like <strong>.btn</strong> or <strong>.cta</strong>.</li>
                        <li>Use exciting words on buttons (e.g. "Get Started", "Join Now") instead of just "Submit".</li>
                        <li>Don't overwhelm users. Stick to 1-3 main buttons per section.</li>
                        <li>Place buttons where people are reading—not hidden at the very top or bottom.</li>
                    </ul>
                </li>
                <li>
                    <span className="font-semibold block mb-1">Make forms easy to finish:</span>
                    <ul className="list-[circle] pl-5 space-y-1 text-sm">
                        <li>Include at least one clear signup or contact form using standard HTML tags.</li>
                        <li>Short forms convert better. Try to ask for fewer than 7 things.</li>
                        <li>Clearly mark which fields are <strong>Required (*)</strong> so users don't guess.</li>
                        <li>Use specific input types (like "email") so mobile keyboards render correctly.</li>
                        <li>Make the final button describe the result, like "Get My Quote".</li>
                    </ul>
                </li>
                <li>
                    <span className="font-semibold block mb-1">Show that you can be trusted:</span>
                    <ul className="list-[circle] pl-5 space-y-1 text-sm">
                        <li>Add a section titled <strong>"Testimonials"</strong> or <strong>"Reviews"</strong> to show social proof.</li>
                        <li>Display security badges (like SSL icons) to reassure visitors your site is safe.</li>
                        <li>Show off your partners in a section labeled "Clients" or "Trusted By".</li>
                        <li>Offer something valuable for free (like a <strong>Guide</strong> or <strong>Ebook</strong>).</li>
                    </ul>
                </li>
                <li>
                    <span className="font-semibold block mb-1">Remove roadblocks:</span>
                    <ul className="list-[circle] pl-5 space-y-1 text-sm">
                        <li>Add helpful hints inside form boxes (placeholders) to guide typing.</li>
                        <li>If your form is long, use a progress bar to show how much is left.</li>
                        <li>Make sure error messages are friendly and help users fix mistakes.</li>
                        <li>Mention perks like "Free Shipping" or "Discount" near your buttons.</li>
                    </ul>
                </li>
            </ul>
        ),
        howThisScoreIsCalculated: (
            <div className="space-y-2">
                <p>Think of this score as a "mystery shopper" report for your website. We automatically scan your page to see how easy it is for a stranger to become a customer.</p>
                <p>We give top points for the essentials—like clear buttons and short forms—because these matter most. We also look for trust signals like reviews and security badges.</p>
                <p>If your forms are too long, your buttons are hidden, or users can't tell if you're trustworthy, your score goes down.</p>
            </div>
        ),
        weightage: [
            { param: "Call-to-Actions & Forms", weight: "50%" },
            { param: "Trust & Credibility", weight: "25%" },
            { param: "User Flow & Experience", weight: "25%" }
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
            "No emphasis tags used for keywords",
            "Missing meta keywords",
            "Content lacks structured entity references"
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
