// ─────────────────────────────────────────────────────────────────────────────
// Per-PARAMETER importance by site sub-type — the third and finest axis of the
// score, under the per-page tilt (utils/sectionWeights.js) and the per-section
// site profile (config/siteTypeProfiles.js).
//
// Source: Part 5 of docs/reports/Automotive-Site-Type-Parameter-Matrix.html
// (6 Aug 2026), which rates all 164 implemented parameters against the four
// automotive site types. Every row below is that report's rating pattern read
// left to right:
//
//        [ franchise, independent, service, repair ]
//          3 = Most Important   2 = Important   1 = Recommended   null = N/A
//
// ── Why ratings are applied as a RATIO, not as raw weights ───────────────────
//
// The in-section weights already in each metric service (Title 0.10, Canonical
// 0.11, TradeIn_Flow 0.15 …) were tuned against a dealership. Replacing them
// with something derived from these ratings would re-score every dealer audit
// in the product on day one, for no reason — the matrix agrees with those
// weights for dealers; what it adds is how they should differ for OTHER types.
//
// So the FRANCHISE column is the reference. A parameter's multiplier is
// `weight(rating[type]) / weight(rating[franchise])`, which makes a franchise
// dealer's scoring bit-for-bit identical to before this file existed, and moves
// every other type relative to it. Corporate sites and any site whose type the
// detector couldn't resolve get 1.0 — also unchanged.
//
// ── Why the table is keyed by SECTION, not just by parameter key ─────────────
//
// The matrix itself rates one parameter name twice, differently, in two
// sections: `Structured_Content` is 2233 as an AIO ingestion signal (an
// informational nice-to-have for dealers) and 3333 as an AEO signal (a hard
// requirement everywhere, because a spec table rendered as an image is
// invisible to every answer engine). Only the AEO one is carried below — AIO's
// is informational and carries no weight to multiply — so today no key
// actually collides. The section key is a structural guard, not a live fix:
// the next weighted parameter that shares a name across two sections would
// otherwise silently inherit the wrong column.
//
// ── What is deliberately NOT here ────────────────────────────────────────────
//
// Parameters the matrix rates but the engine does not weight anywhere:
// informational composites (WCAG summary, header security grade, the
// per-jurisdiction legal re-slice, brand entity strength, markdown headers, the
// AEO page-speed echo). A rating with nothing at all to multiply would be dead
// config that reads as if it were doing something.
//
// Two blocks below are a deliberate exception to that rule and are flagged in
// place: Technical Performance, whose ratings reach only the two derived
// diagnostics and never the section headline; and `Content_Relevance` in
// On-Page SEO, which is rated but currently commented out of seoMetrics.js's
// weight table. Both are called out where they sit rather than quietly omitted,
// because in both cases the rating is correct and it is the engine that would
// need to change for it to land.
// ─────────────────────────────────────────────────────────────────────────────

/** Column order of every rating row below. */
const SUBTYPE_COLUMN = { franchise: 0, independent: 1, service: 2, repair: 3 };

// Importance tier → relative weight. The gaps are deliberately wide: the matrix
// says a Recommended parameter has "real but low leverage", so a 3-2-1 scale
// compressed into, say, 1.0/0.8/0.6 would encode the ratings and then refuse to
// act on them. 1.0 / 0.6 / 0.3 keeps a two-level swing meaningful (0.3× or
// 3.3×) while a one-level tilt stays proportionate (0.6× or 1.67×).
const TIER_WEIGHT = { 3: 1.0, 2: 0.6, 1: 0.3 };

export const PARAM_IMPORTANCE = {
  // ── A ─────────────────────────────────────────────────────────────────────
  // Almost flat: Core Web Vitals are universal and nobody escapes them. What
  // differs is payload shape and page churn — inventory sites carry 30–50 image
  // galleries and heavy tag stacks, repair sites carry page-builder bloat, and
  // only inventory sites have URLs that die.
  //
  // ⚠ THESE THIRTEEN RATINGS DO NOT MOVE THE SECTION SCORE. Technical
  // Performance is the one section whose headline is not a roll-up of the rows
  // below: `Percentage` is PageSpeed's own Lighthouse category score, computed
  // by Google at fixed weights (LCP 25, TBT 30, CLS 25, FCP 10, SI 10) that no
  // site profile can touch. That is a deliberate product decision — the
  // headline stays directly comparable to a PSI run the customer can repeat
  // themselves.
  //
  // What the ratings DO reach is the two derived numbers built from the same
  // components: `Delivery_Hygiene` (the infoOnly composite card the report
  // shows) and `Graded_Percentage` (the diagnostic blend kept for continuity).
  // They are kept here, rather than deleted, because those two are customer-
  // facing and should reflect the site type — but do not read this block as if
  // it were load-bearing on the score. Where the site type genuinely changes
  // what Technical Performance is worth is the section weight in
  // config/siteTypeProfiles.js (18 for a dealer, 16 for a garage).
  "Technical Performance": {
    LCP:                   [3, 3, 3, 3],
    CLS:                   [3, 3, 2, 2],
    INP:                   [3, 3, 2, 2],
    FCP:                   [2, 2, 2, 2],
    TTFB:                  [3, 3, 2, 2],
    SI:                    [1, 1, 1, 1],
    TBT:                   [2, 2, 2, 2],
    // Highest leverage on repair sites: Wix / GoDaddy / stacked WordPress
    // themes ship several synchronous head resources, and removing them is
    // usually the single biggest speed win available there.
    Render_Blocking:       [2, 2, 2, 3],
    Resource_Optimization: [3, 3, 2, 2],
    Compression:           [2, 2, 2, 2],
    Caching:               [2, 2, 2, 2],
    Redirect_Chains:       [2, 2, 1, 1],
    Sold_Vehicle:          [3, 3, null, null],
  },

  // ── B ─────────────────────────────────────────────────────────────────────
  // The widest spread of any section, almost all of it scale versus locality.
  // Franchise dealers fight duplicate-content and index-bloat problems a garage
  // physically cannot have; garages and service centres fight for geo-modified
  // queries a franchise dealer often wins on brand alone.
  "On Page SEO": {
    Title:                       [3, 3, 3, 3],
    // Templated dealer titles duplicate across thousands of VDPs. A 15-page
    // repair site cannot generate enough pages to have a duplication problem.
    Title_Uniqueness:            [3, 3, 2, 1],
    // The mirror image: a franchise store ranks on brand+geo almost by default
    // ("Toyota dealer Brisbane"); everyone else competes against 20 identical
    // local businesses, so the geo modifier IS the ranking battleground.
    Title_Location_Optimization: [2, 3, 3, 3],
    Meta_Description:            [2, 2, 2, 2],
    Meta_Description_Uniqueness: [3, 2, 1, 1],
    URL_Structure:               [2, 2, 2, 2],
    URL_Slugs:                   [2, 2, 2, 2],
    // The primary defence against faceted-SRP duplicates. A garage with 15
    // pages has almost nothing to canonicalise.
    Canonical:                   [3, 3, 2, 1],
    H1:                          [3, 3, 3, 3],
    Heading_Hierarchy:           [2, 2, 2, 2],
    Image:                       [3, 3, 2, 2],
    Semantic_Tags:               [2, 2, 2, 2],
    // Crawl-depth-to-inventory is a real constraint at 40,000 URLs. On a
    // 15-page site every page is one click from home regardless.
    Links:                       [3, 2, 2, 1],
    // ⚠ Currently inert: `Content_Relevance: 0.06` is commented out of
    // seoMetrics.js's weight table (hidden 2026-07-07 by product decision,
    // pending a redesign — the check still runs and its card is hidden in
    // On_Page_SEO.jsx). The rating is kept because it is the single
    // highest-value re-enable available: it is rated Most Important for exactly
    // the two site types it currently does nothing for, on the matrix's
    // reasoning that a garage has to explain a mechanical problem to a
    // non-mechanic before it can sell the fix, while dealer copy is
    // specification data that is read rather than comprehended.
    Content_Relevance:           [2, 2, 3, 3],
    Robots_Txt:                  [3, 3, 2, 2],
    Open_Graph:                  [2, 2, 2, 2],
    Twitter_Card:                [1, 1, 1, 1],
    // Entity disambiguation: a franchise dealer is already resolvable via the
    // OEM's locator; a garage named "Precision Auto" needs the GBP↔Facebook↔Yelp
    // chain to be identified at all.
    Social_Links:                [2, 2, 3, 3],
    // Service and repair traffic is overwhelmingly mobile and often urgent
    // ("mechanic near me", from the roadside).
    Viewport:                    [2, 2, 3, 3],
    VDP_Content_Uniqueness:      [3, 3, null, null],
    SRP_Index_Control:           [3, 2, null, null],
    SRP_To_VDP_Links:            [3, 2, null, null],
  },

  // ── C ─────────────────────────────────────────────────────────────────────
  // Differentiated legally, not commercially. Dealership websites are one of
  // the most-sued verticals under ADA Title III, and a page collecting
  // financial PII makes a missing label a blocking defect. Mobile-first
  // criteria flip the other way — service and repair traffic is phone-dominated.
  "Accessibility": {
    Color_Contrast:                [3, 3, 3, 3],
    // On a credit application an unlabelled field is a blocking failure.
    // Many repair sites have no form at all — just a phone number.
    Label:                         [3, 3, 3, 2],
    Html_Has_Lang:                 [2, 2, 2, 2],
    Keyboard_Navigation:           [3, 3, 2, 2],
    Focus_Order:                   [2, 2, 2, 1],
    Focusable_Content:             [2, 2, 2, 1],
    Tab_Index:                     [2, 2, 2, 1],
    Aria_Hidden_Focus:             [2, 2, 2, 1],
    Image_Alt:                     [3, 3, 2, 2],
    Link_Name:                     [2, 2, 2, 2],
    Button_Name:                   [2, 2, 2, 2],
    Aria_Roles:                    [2, 2, 2, 1],
    Aria_Allowed_Attr:             [2, 2, 2, 1],
    Document_Title:                [2, 2, 2, 2],
    // Disabling zoom on a mobile-dominant, often older customer base is a
    // direct barrier — service and repair skew both mobile and older.
    Meta_Viewport:                 [2, 2, 3, 3],
    // "Book" and "Call" ARE the funnel on service and repair, tapped
    // one-handed on a phone. A sub-24px target loses the lead.
    Target_Size:                   [2, 2, 3, 3],
    Reflow:                        [2, 2, 2, 2],
    Heading_Order:                 [1, 1, 1, 1],
    Landmarks:                     [2, 2, 2, 2],
    List:                          [1, 1, 1, 1],
    Skip_Links:                    [1, 1, 1, 1],
    Interactive_Element_Affordance: [2, 2, 2, 2],
  },

  // ── D ─────────────────────────────────────────────────────────────────────
  // The most sharply differentiated section after Conversion, and the
  // difference is regulatory rather than technical. Anyone taking a credit
  // application handles SSNs under the GLBA Safeguards Rule; anyone advertising
  // APR or a lease payment is under Reg-Z / Reg-M. A garage advertising a $99
  // brake special carries almost none of that. Transport and reputation stay
  // Critical for everyone because they are gates.
  "Security/Compliance": {
    HTTPS:                    [3, 3, 3, 3],
    SSL:                      [3, 3, 3, 3],
    SSL_Expiry:               [2, 2, 2, 2],
    TLS_Version:              [2, 2, 2, 2],
    HSTS:                     [2, 2, 2, 1],
    // Franchise dealer sites run the heaviest third-party tag stack in local
    // retail — chat, CRM, inventory widget, trade tool, several tag managers —
    // on the same origin as the credit application.
    CSP:                      [3, 2, 2, 1],
    X_Frame_Options:          [2, 2, 1, 1],
    X_Content_Type_Options:   [2, 2, 1, 1],
    Referrer_Policy:          [2, 2, 1, 1],
    Permissions_Policy:       [1, 1, 1, 1],
    Cookie_Flags:             [2, 2, 2, 1],
    Third_Party_Cookies:      [2, 2, 1, 1],
    Reputation:               [3, 3, 3, 3],
    // Inventory search takes user input into a database query — the one
    // genuinely dynamic surface these sites have. Servicing sites are static.
    SQLi_Exposure:            [2, 2, 1, 1],
    XSS:                      [2, 2, 1, 1],
    Forms_Use_HTTPS:          [3, 3, 3, 2],
    Weak_Default_Credentials: [2, 2, 2, 2],
    // Repair and small service sites are the most likely to be self-built
    // WordPress with /wp-admin wide open and no rate limiting.
    Admin_Panel_Public:       [2, 2, 2, 3],
    Cookie_Consent:           [2, 2, 2, 2],
    Privacy_Policy:           [3, 3, 2, 2],
    Privacy_Compliance:       [3, 3, 2, 2],
    Finance_Form_Security:    [3, 3, null, null],
    Legal_Disclaimers:        [3, 3, 2, 1],
  },

  // ── E ─────────────────────────────────────────────────────────────────────
  // Splits along task complexity. Dealers ask the visitor to search, filter and
  // compare, so navigation and filtering carry the section. Service and repair
  // ask the visitor to understand a problem and then call, so readability and
  // above-the-fold clarity carry it instead.
  "UX & Content Structure": {
    // Service and repair have to explain a mechanical problem to a non-mechanic
    // before they can sell the fix. Dealer copy is specification data.
    Text_Readability:           [2, 2, 3, 3],
    Intrusive_Interstitials:    [3, 3, 2, 2],
    Navigation_Discoverability: [3, 3, 2, 2],
    Above_the_Fold_Content:     [3, 3, 3, 3],
    // Inventory churn manufactures dead links continuously — every sold
    // vehicle orphans links from SRPs, blog posts and specials pages.
    Broken_Links:               [3, 3, 2, 2],
    Mobile_Experience:          [3, 3, 3, 3],
    Interactive_Click_Feedback: [1, 1, 1, 1],
    Loading_Feedback:           [2, 2, 1, 1],
    Hierarchy_Flow_Clarity:     [2, 2, 2, 2],
    Content_Density_Balance:    [1, 1, 1, 1],
    Layout_Consistency:         [2, 2, 1, 1],
    Sticky_Header_Usage:        [2, 2, 2, 2],
    In_Page_Navigation:         [2, 2, 2, 2],
    // Depth navigation matters most where the path is
    // Home → SRP → filtered SRP → VDP. A garage's deepest path is two levels.
    Breadcrumbs:                [3, 2, 2, 1],
    Inventory_Filtering:        [3, 3, null, null],
    No_Results_UX:              [3, 3, null, null],
    Vehicle_Image_Gallery:      [3, 3, null, null],
  },

  // ── F ─────────────────────────────────────────────────────────────────────
  // The most differentiated section in the product, and the reason a single
  // automotive profile cannot serve all four types. The lead mechanism is
  // genuinely different: a form for dealers, a scheduler for service, the
  // telephone for repair. Trust inverts too — a franchise dealer borrows the
  // OEM's credibility, everyone else has to manufacture it.
  "Conversion & Lead Flow": {
    CTA_Presence:               [3, 3, 3, 3],
    CTA_Clarity:                [3, 3, 3, 3],
    // A dealer VDP routinely stacks eight competing primary CTAs in one
    // viewport. Choice paralysis is a dealer-specific disease.
    CTA_Crowding:               [3, 3, 2, 1],
    CTA_Flow_Alignment:         [3, 3, 2, 2],
    // On a repair site the ABSENCE of a form is often the correct choice —
    // the phone is the funnel.
    Form_Presence:              [3, 3, 3, 2],
    Form_Length:                [3, 3, 2, 2],
    Required_vs_Optional_Fields:[2, 2, 2, 2],
    Inline_Validation:          [2, 2, 2, 1],
    Submit_Button_Clarity:      [2, 2, 2, 2],
    MultiStep_Form_Progress:    [2, 2, 1, 1],
    Friendly_Error_Handling:    [2, 2, 2, 1],
    Microcopy_Clarity:          [2, 2, 2, 1],
    Thank_You_Pages:            [2, 2, 2, 1],
    // Independent lots need visible security and accreditation marks next to a
    // PII form more than a franchise store already trading on the OEM badge.
    Trust_Badges:               [2, 3, 2, 2],
    Testimonials:               [2, 3, 3, 3],
    Reviews:                    [3, 3, 3, 3],
    Client_Logos:               [1, 2, 2, 2],
    // Body shops and specialist mechanics convert on before-and-after work
    // galleries — the closest thing to a case study in this vertical.
    Case_Studies_Accessibility: [1, 1, 1, 2],
    // ASE / I-CAR / RAA / MTA / VACC approval is the core credibility currency
    // in service and repair: a customer cannot evaluate mechanical competence
    // directly, so they use accreditation as a proxy.
    Certifications_Awards:      [2, 2, 3, 3],
    Pricing_Transparency:       [3, 3, 3, 3],
    Vehicle_History:            [2, 3, null, null],
    // The phone is the primary conversion mechanism for service and repair.
    Click_To_Call:              [2, 3, 3, 3],
    Chat_Experience:            [2, 2, 2, 1],
    Lead_Magnets:               [1, 1, 1, 1],
    GA4_Installed:              [3, 3, 3, 2],
    GTM_Configuration:          [2, 2, 2, 1],
    Conversion_Tracking:        [3, 3, 3, 2],
    CRM_Integration:            [2, 2, 2, 1],
    TradeIn_Flow:               [3, 3, null, null],
    Financing_Flow:             [3, 3, null, null],
    Finance_Calculator:         [3, 2, null, null],
    // The entire funnel for service and repair. A franchise dealer has a
    // service department so it matters secondarily; an independent lot has none.
    Appointment_Booking:        [2, 1, 3, 3],
    // OEM incentives for franchise stores, service coupons for service
    // centres. Independent lots and garages run fewer time-bound offers.
    Incentives_Displayed:       [3, 2, 3, 2],
  },

  // ── G ─────────────────────────────────────────────────────────────────────
  // Machine ingestibility. The universal failure is identical across all four —
  // content that only exists after client-side JavaScript is invisible to
  // crawlers that do not render. Beyond that, dealers need entity precision and
  // freshness; service and repair need answer-shaped structure, because their
  // queries are questions.
  "AIO (AI-Optimization) Readiness": {
    Structured_Data:              [3, 3, 3, 3],
    Content_NLP_Friendly:         [3, 3, 3, 3],
    Answer_Oriented_Structure:    [2, 2, 3, 3],
    // Independent lots carry mixed-brand inventory with inconsistent
    // make/model/trim naming from multiple feeds — exactly what breaks entity
    // extraction. Franchise stores inherit a consistent OEM vocabulary.
    Keywords_Entities_Annotated:  [2, 3, 2, 2],
    // Inventory turns weekly, so dateModified carries genuine information on a
    // dealer site. A service menu changes twice a year.
    Content_Updated_Regularly:    [3, 3, 2, 2],
    Internal_Linking_AI_Friendly: [3, 2, 2, 1],
    Topical_Focus_Clarity:        [2, 2, 3, 3],
    AI_Agentic_Browsing:          [2, 2, 2, 1],
  },

  // ── H ─────────────────────────────────────────────────────────────────────
  // The section where service and repair systematically outrank dealers. Their
  // customers ask questions answer engines now answer directly, and a local
  // business with no brand equity gains the most from being the cited source.
  // Dealers gain from schema and index coverage — being PRESENT as structured
  // inventory — more than from being quoted.
  "AEO (Answer Engine Optimization)": {
    Schema_Markup:            [3, 3, 3, 3],
    Answer_First_Structure:   [2, 2, 3, 3],
    Bot_Access:               [3, 3, 3, 3],
    // Note the contrast with AIO's informational row of the same name: a spec
    // table rendered as an image is invisible to every answer engine, so here
    // it is Critical on all four.
    Structured_Content:       [3, 3, 3, 3],
    FAQ_QA_Blocks:            [2, 2, 3, 3],
    // A franchise dealer is already an established entity via the OEM's
    // locator. Everyone else must establish identity themselves.
    Entity_Recognition:       [2, 3, 3, 3],
    Citation_NAP_Consistency: [2, 3, 3, 3],
    Citations_Attribution:    [1, 1, 2, 2],
    Topical_Authority:        [2, 2, 3, 3],
    // At 40,000 URLs with faceted duplicates this is a genuine and frequently
    // failing constraint; a 15-page site is either indexed or has a much
    // simpler problem.
    Index_Coverage:           [3, 2, 2, 2],
    SameAs_Validation:        [2, 2, 3, 3],
    // For a repair shop this is technician credentials, years in trade and
    // workshop accreditation — the only defence against being replaced by a
    // generic AI answer. Dealers carry OEM authority instead.
    EEAT_Composite:           [2, 2, 3, 3],
    Llms_Txt:                 [1, 1, 1, 1],
  },
};

/**
 * Build the weight multiplier lookup for one section.
 *
 * Returns `(paramKey, siteSubType) => number`. Always 1 for a franchise dealer,
 * for corporate sites, for a sub-type the detector couldn't resolve, and for
 * any parameter with no rating on file — so every one of those scores exactly
 * as it did before this file existed.
 *
 * @param {string} section  a SECTION_ORDER name, e.g. "Conversion & Lead Flow"
 */
export function importanceFor(section) {
  const table = PARAM_IMPORTANCE[section] || {};
  return (paramKey, siteSubType) => {
    const col = SUBTYPE_COLUMN[siteSubType];
    if (col === undefined) return 1;
    const row = table[paramKey];
    if (!row) return 1;

    const base = TIER_WEIGHT[row[0]];
    if (!base) return 1;                       // franchise column itself is N/A — nothing to scale against

    const tier = TIER_WEIGHT[row[col]];
    return tier === undefined ? 0 : tier / base;  // N/A → 0, which drops it from the denominator
  };
}

/**
 * Guard for the invariants this file has to hold. Called from the test suite.
 * Exported rather than run at import time so a bad edit surfaces as a failing
 * assertion instead of a boot loop.
 */
export function assertImportanceValid() {
  let rows = 0;
  for (const [section, table] of Object.entries(PARAM_IMPORTANCE)) {
    for (const [key, row] of Object.entries(table)) {
      rows++;
      if (!Array.isArray(row) || row.length !== 4) {
        throw new Error(`[parameterImportance] ${section}.${key} has ${row?.length} columns, expected 4`);
      }
      for (const v of row) {
        if (v !== null && !(v in TIER_WEIGHT)) {
          throw new Error(`[parameterImportance] ${section}.${key} has rating ${v}; expected 3, 2, 1 or null`);
        }
      }
      // A parameter that is N/A for a dealer but scoreable for a garage would
      // have no franchise reference to scale against, and nothing in the matrix
      // is shaped that way — every N/A in the report is inventory-scoped.
      if (row[0] === null && row.some((v) => v !== null)) {
        throw new Error(`[parameterImportance] ${section}.${key} is N/A for franchise but rated elsewhere — no reference column`);
      }
    }
  }
  return rows;
}
