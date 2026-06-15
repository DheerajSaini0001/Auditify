// ============================================================================
// Dealer / Developer parameter classification (BACKEND copy)
// ----------------------------------------------------------------------------
// DEALER_PARAMS = parameter keys included in a "Dealer" PDF (business-outcome
// focused). A "Developer" PDF includes every parameter.
//
// IMPORTANT: keep this list in sync with the frontend copy at
// Frontend/src/config/parameterAudience.js — both must agree so the on-screen
// view and the downloaded PDF contain the same parameters.
// ============================================================================

// Dealer focus = non-technical parameters that move the needle on:
//   • Leads & sales conversions   • Service bookings & F&I revenue
//   • Local search visibility (Maps/Pack)   • Plain-language executive reporting
// Anything technical (Core Web Vitals, accessibility/ARIA, security headers, AI/AEO
// schema, SEO tags) is developer-only — so Technical Performance, Accessibility,
// and AIO/AEO have NO dealer params.
export const DEALER_PARAMS = new Set([
    // ── On-Page SEO ──────────────────────────────────────────────────────────
    // Local search visibility (Maps/Pack), how the dealer appears in Google, plus
    // customer-facing content, images, video & social-share previews.
    "Title", "Meta_Description", "Title_Location_Optimization", // search appearance & local
    "Local_SEO", "Social_Links",                 // local / Maps visibility & presence
    "Content_Relevance", "Content_Freshness",    // relevant, current content
    "Service_Content_Quality",                   // service-department pages
    "Content_Depth_Quality", "EEAT",             // content quality & trust (E-E-A-T)
    "Image", "Video",                            // optimized images & video
    "Open_Graph", "Twitter_Card",                // social-share link previews
    // (Canonical, robots, sitemap, structured-data schema, headings, semantic tags,
    //  URL structure/slugs, title/meta uniqueness, internal linking → developer.)

    // ── Technical Performance ────────────────────────────────────────────────
    // Page speed the shopper actually feels on key pages. (Core Web Vitals metrics —
    // LCP/INP/CLS/FCP/TBT/SI — and asset/caching/render internals → developer.)
    "Inventory_Load_Time", "Service_Load_Time",

    // ── Accessibility ────────────────────────────────────────────────────────
    // Understandable, ADA-relevant basics. (ARIA roles, keyboard/focus order, tab
    // index, landmarks, skip links & other screen-reader internals → developer.)
    "WCAG_AA_Compliance",                        // overall accessibility / ADA grade
    "Color_Contrast", "Image_Alt",               // readable text & described images

    // ── UX & Content ─────────────────────────────────────────────────────────
    // Shopper experience that drives conversions & service bookings.
    "Text_Readability", "Navigation_Discoverability", "Inventory_Filtering",
    "No_Results_UX", "Mobile_Experience", "Mobile_Usability", "Above_the_Fold_Content",
    "Intrusive_Interstitials", "Broken_Links", "Layout_Consistency",
    "Breadcrumbs", "Sticky_Header_Usage",
    "Pricing_Transparency", "Vehicle_History",   // shopper trust & transparency
    "Certifications_Awards", "Staff_Profiles",   // dealership credibility

    // ── Security / Compliance ────────────────────────────────────────────────
    // Trust & safety a customer notices + privacy compliance + lead delivery.
    // (Security headers, TLS version, CSP, cookie flags, injection scans → developer.)
    "HTTPS", "SSL",                              // secure padlock / certificate
    "Google_Safe_Browsing", "Blacklist", "Malware_Scan", // site is safe / not flagged
    "Privacy_Policy", "Cookie_Consent", "GDPR_CCPA",     // privacy & legal compliance
    "CRM_Integration",                           // leads actually reach the dealer
    "Finance_Form_Security",                     // secure financing applications (F&I)

    // ── Conversion & Lead Flow (the dealer's core section) ───────────────────
    // Leads, sales, service bookings, F&I revenue, trust. (Analytics plumbing —
    // GA4/GTM/Conversion_Tracking — and granular form internals → developer.)
    "CTA_Presence", "CTA_Clarity", "CTA_Crowding", "CTA_Flow_Alignment", // CTA effectiveness
    "Form_Presence", "Form_Length", "Submit_Button_Clarity",            // lead-capture forms
    "Lead_Magnets", "Incentives_Displayed", "Thank_You_Pages",          // lead incentives & follow-up
    "Click_To_Call", "Chat_Experience", "Appointment_Booking",          // instant contact & bookings
    "TradeIn_Flow", "Financing_Flow", "Finance_Calculator",             // F&I / sales paths
    "Testimonials", "Reviews", "Trust_Badges", "Client_Logos",          // social proof
    "Case_Studies_Accessibility",
]);

// Returns true if a parameter `key` should be included for the given `mode`.
// Developer mode includes everything; Dealer mode includes only DEALER_PARAMS.
export const isVisibleForAudience = (key, mode) =>
    mode === "developer" || DEALER_PARAMS.has(key);
