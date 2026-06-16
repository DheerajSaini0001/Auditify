// ============================================================================
// Dealer / Developer parameter classification (FRONTEND copy)
// ----------------------------------------------------------------------------
// DEALER_PARAMS = parameter keys shown in "Dealer" mode (business-outcome
// focused). In "Developer" mode every parameter is shown.
//
// IMPORTANT: keep this list in sync with the backend copy at
// Backend/config/parameterAudience.js — both must agree so the on-screen view
// and the downloaded PDF contain the same parameters.
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
    // Page speed the shopper actually feels + the headline scores a dealer recognizes.
    // (Raw Core Web Vitals — LCP/INP/CLS/FCP/TBT/SI — and dev internals like lazy
    // loading, third-party scripts, JS execution, caching → developer.)
    "Inventory_Load_Time", "Service_Load_Time",
    "PageSpeed_Score", "Mobile_Load_Speed", "Rendering_Performance",

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

// Returns true if a parameter `key` should be visible in the given `mode`.
// Developer mode shows everything; Dealer mode shows only DEALER_PARAMS.
export const isVisibleForAudience = (key, mode) =>
    mode === "developer" || DEALER_PARAMS.has(key);

// ── Actionable (non-technical) parameters ────────────────────────────────────
// A param is "actionable" when a non-technical dealer can act on it themselves
// (write copy, add testimonials, show pricing, enable a CTA, etc.). ONLY these show
// the "View Details" and "AI Summary" buttons.
//
// Technical params — those that need a developer to fix (page speed, color contrast,
// security, image/meta optimization, page structure, integrations) — DO NOT show
// those buttons, EVEN IF they're dealer-visible (e.g. Color_Contrast, HTTPS show on
// the dealer report for awareness, but the dealer can't self-serve the fix).
// Every actionable param is also a dealer param (a subset of DEALER_PARAMS).
export const ACTIONABLE_PARAMS = new Set([
    // On-Page SEO — content & copy the dealer/marketing team can edit
    "Title", "Meta_Description", "Title_Location_Optimization",
    "Content_Relevance", "Content_Freshness", "Service_Content_Quality",
    "Content_Depth_Quality", "EEAT", "Local_SEO", "Social_Links",

    // UX & Content — content/marketing decisions (not layout/code)
    "Text_Readability", "Intrusive_Interstitials",
    "Pricing_Transparency", "Vehicle_History", "Certifications_Awards", "Staff_Profiles",

    // Conversion & Lead Flow — business features & marketing the dealer drives
    "CTA_Presence", "CTA_Clarity", "CTA_Crowding", "CTA_Flow_Alignment",
    "Form_Presence", "Form_Length", "Submit_Button_Clarity",
    "Lead_Magnets", "Incentives_Displayed", "Thank_You_Pages",
    "Click_To_Call", "Chat_Experience", "Appointment_Booking",
    "TradeIn_Flow", "Financing_Flow", "Finance_Calculator",
    "Testimonials", "Reviews", "Trust_Badges", "Client_Logos", "Case_Studies_Accessibility",
    // NOT actionable (technical, need a developer — buttons hidden even though some
    // are dealer-visible): Image, Video, Open_Graph, Twitter_Card, Inventory_Load_Time,
    // Service_Load_Time, WCAG_AA_Compliance, Color_Contrast, Image_Alt,
    // Navigation_Discoverability, Inventory_Filtering, No_Results_UX, Mobile_Experience,
    // Mobile_Usability, Above_the_Fold_Content, Broken_Links, Layout_Consistency,
    // Breadcrumbs, Sticky_Header_Usage, HTTPS, SSL, Google_Safe_Browsing, Blacklist,
    // Malware_Scan, Privacy_Policy, Cookie_Consent, GDPR_CCPA, CRM_Integration,
    // Finance_Form_Security — plus every developer-only param.
]);

// True if `key` is dealer-actionable (non-technical). Gates the "View Details" and
// "AI Summary" buttons — technical params (dealer- or developer-classified) hide them.
export const isActionableParam = (key) => ACTIONABLE_PARAMS.has(key);

// Section (sidebar menu key) → every parameter key it can render. Used to hide a
// whole section in Dealer mode when none of its params are dealer-relevant.
// Keep these lists in sync if parameters are added/removed from a section.
export const SECTION_PARAMS = {
    technicalPerformance: [
        "LCP", "INP", "FID", "CLS", "FCP", "TTFB", "TBT", "SI",
        "Inventory_Load_Time", "Service_Load_Time", "Compression", "Caching",
        "Redirect_Chains", "Render_Blocking", "Resource_Optimization",
        "PageSpeed_Score", "Mobile_Load_Speed", "Rendering_Performance",
        "Lazy_Loading", "Third_Party_Optimization", "JS_Execution",
    ],
    onPageSEO: [
        "Title", "H1", "Meta_Description", "Content_Relevance", "Content_Freshness",
        "Contextual_Linking", "Service_Content_Quality", "Content_Depth_Quality",
        "EEAT", "Canonical", "Robots_Txt", "Sitemap", "Title_Uniqueness",
        "Meta_Description_Uniqueness", "Title_Keyword_Optimization",
        "Title_Location_Optimization", "Structured_Data", "URL_Structure",
        "URL_Slugs", "Image", "Video", "Heading_Hierarchy", "Semantic_Tags",
        "Links", "Open_Graph", "Twitter_Card", "Social_Links", "Local_SEO",
    ],
    accessibility: [
        "WCAG_AA_Compliance", "Color_Contrast", "Image_Alt", "Meta_Viewport",
        "Keyboard_Navigation", "Focusable_Content", "Focus_Order", "Tab_Index",
        "Skip_Links", "Interactive_Element_Affordance", "Aria_Hidden_Focus",
        "Label", "Button_Name", "Link_Name", "Aria_Roles", "Landmarks",
        "Document_Title", "Html_Has_Lang", "List", "Heading_Order", "Aria_Allowed_Attr",
    ],
    securityOrCompliance: [
        "HTTPS", "SSL", "TLS_Version", "HSTS", "SQLi_Exposure", "XSS",
        "Google_Safe_Browsing", "Blacklist", "Malware_Scan", "Weak_Default_Credentials",
        "MFA_Enabled", "Admin_Panel_Public", "Forms_Use_HTTPS", "CSP",
        "X_Frame_Options", "X_Content_Type_Options", "Cookies_Secure", "Cookies_HttpOnly",
        "Cookie_Consent", "GDPR_CCPA", "Privacy_Policy", "Data_Collection",
        "Third_Party_Cookies", "CRM_Integration", "Finance_Form_Security",
        "GA4_Installed", "GTM_Configuration", "Conversion_Tracking",
    ],
    UXOrContentStructure: [
        "Text_Readability", "UX_Content_Hierarchy_Clarity", "Section_Labeling_Clarity",
        "Content_Density_Balance", "Navigation_Discoverability", "Inventory_Filtering",
        "No_Results_UX", "Breadcrumbs", "In_Page_Navigation", "Page_to_Page_Flow",
        "Interactive_Click_Feedback", "Loading_Feedback", "Broken_Links",
        "Mobile_Experience", "Mobile_Usability", "Above_the_Fold_Content",
        "Sticky_Header_Usage", "Intrusive_Interstitials", "Layout_Consistency",
        "Certifications_Awards", "Pricing_Transparency", "Vehicle_History", "Staff_Profiles",
    ],
    conversionAndLeadFlow: [
        "CTA_Presence", "CTA_Clarity", "CTA_Crowding", "CTA_Flow_Alignment",
        "Submit_Button_Clarity", "Link_Relevance", "GA4_Installed", "GTM_Configuration",
        "Conversion_Tracking", "Form_Presence", "Lead_Magnets", "Incentives_Displayed",
        "Form_Length", "Testimonials", "Reviews", "Trust_Badges", "Client_Logos",
        "Case_Studies_Accessibility", "Required_vs_Optional_Fields", "Inline_Validation",
        "Friendly_Error_Handling", "Microcopy_Clarity", "MultiStep_Form_Progress",
        "Progress_Indicators", "Thank_You_Pages", "TradeIn_Flow", "Financing_Flow",
        "Finance_Calculator", "Appointment_Booking", "Click_To_Call", "Chat_Experience",
    ],
    aioReadiness: [
        "Structured_Data", "Duplicate_Content_Detection_Ready", "Internal_Linking_AI_Friendly",
        "Content_Updated_Regularly", "Content_NLP_Friendly", "Keywords_Entities_Annotated",
        "Topical_Focus_Clarity", "Terminology_Consistency", "Content_Completeness",
        "Answer_Oriented_Structure", "Content_Chunking", "Lists_Structured_Blocks",
        "Author_Source_Attribution", "Fact_Vs_Opinion",
        // AEO "Core Signal Breakdown" signals
        "aeoSchema", "botAccess", "markdownHeaders", "llmsTxt", "structuredContent",
        "citations", "indexCoverage", "entityRecognition", "brandEntityStrength",
        "citationConsistency", "topicalAuthority", "experienceSignals",
        "expertiseSignals", "authoritySignals",
    ],
};

// True if a section (by sidebar menu key) has any param visible in the given mode.
// Developer mode → always true; Dealer mode → true only if the section has ≥1 dealer param.
export const isSectionVisibleForAudience = (sectionKey, mode) => {
    if (mode === "developer") return true;
    return (SECTION_PARAMS[sectionKey] || []).some((k) => DEALER_PARAMS.has(k));
};

// Param keys in a section that are HIDDEN in dealer mode (developer-only). Used to
// offer a "switch to Developer mode to see N more parameters" prompt on mixed sections
// (those that show some dealer params but also have developer-only ones).
export const developerOnlyParamsInSection = (sectionKey) =>
    (SECTION_PARAMS[sectionKey] || []).filter((k) => !DEALER_PARAMS.has(k));
