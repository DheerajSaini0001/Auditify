// ─────────────────────────────────────────────────────────────────────────────
// Locale pack — United States.
//
// This file is DATA, not logic. Every list here answers one question: "when the
// engine compares the page against a reference list, what belongs on that list
// in this market?" The checks that consume it live in metricServices and are
// market-agnostic by construction — they ask the locale for a list and grade
// against whatever comes back.
//
// The US pack is the REFERENCE pack: every threshold and every check was
// originally tuned against a US dealership, so this file's job is to say what
// the engine was ALREADY doing, in data form.
//
// ── Where US results do move, and why ────────────────────────────────────────
//
// Two kinds of change were unavoidable, and both make a US audit more correct
// rather than merely different:
//
//   1. Lists that were incomplete rather than American. CTA_Clarity graded
//      against eleven verbs and did not include "contact", "call", "request",
//      "schedule" or "apply" — so a US page whose only CTA was "Contact Us"
//      scored zero for vague CTAs. Filling that gap can only move such a page
//      up.
//   2. Checks whose US norm was itself mis-stated. Cookie_Consent scored a US
//      site 0 for having no banner, but there is no US banner mandate — the
//      obligation is an opt-out link plus Global Privacy Control. That check
//      now grades against the real requirement in both markets.
//
// Everything else is a rename or a relabel and leaves US numbers untouched.
// Thresholds never move: WCAG criteria, Core Web Vitals and OWASP baselines are
// global constants and belong to the check, never to a locale pack.
//
// See config/locale/au.js for the Australian counterpart and config/locale/
// index.js for the shape both must satisfy.
// ─────────────────────────────────────────────────────────────────────────────

/** The 50 states + DC, keyed by the 2-letter postal abbreviation. */
const STATES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia",
};

export default {
  code: "US",
  name: "United States",
  demonym: "American",

  // ── Formats ───────────────────────────────────────────────────────────────
  language: "en-US",
  languageBase: "en",
  currency: "USD",
  currencySymbols: ["$", "us$", "usd"],

  units: {
    distance: "miles",
    distanceAbbrev: ["mi", "miles", "mile"],
    distanceSchemaCode: "SMI",
    fuelEconomy: "MPG",
    fuelEconomyPattern: /\bmpg\b|miles per gallon/i,
    fuelLabel: "EPA fuel economy label",
  },

  // Visible dates read month-first. ISO 8601 is machine-side in both markets, so
  // only the human-visible order differs.
  date: { order: "MDY", visibleExample: "MM/DD/YYYY" },

  phone: {
    // libphonenumber region code — the only thing the normaliser actually needs.
    region: "US",
    // A real national number is 10 digits. There is no short-code equivalent of
    // Australia's 6-digit 13-numbers, so no exception list.
    nationalDigits: [10],
    shortCodePatterns: [],
    tollFreePattern: /^\+?1?\s*\(?8(00|33|44|55|66|77|88)\)?/,
    example: "tel:+15551234567",
  },

  address: {
    states: STATES,
    // "City, ST 12345" — the state is comma-separated and the postal code is 5
    // digits (optionally +4).
    postcodePattern: /\b\d{5}(?:-\d{4})?\b/,
    postcodeLabel: "ZIP code",
    postcodeDigits: 5,
    stateLabel: "state",
    // Locality and region are separated by a comma; the region precedes the code.
    localityRegionSeparator: ",",
    formatHint: "City, ST 12345",
  },

  // ── Vocabulary ────────────────────────────────────────────────────────────
  // `native` is what a correctly-localised page in this market says. `foreign`
  // is the OTHER market's vocabulary — its presence on a page audited for this
  // market is the locale-contamination signal, not a scoring input on its own.
  vocabulary: {
    native: [
      "msrp", "sticker price", "out-the-door", "out the door", "doc fee",
      "documentation fee", "destination charge", "trade-in", "pre-owned",
      "certified pre-owned", "gas", "gasoline", "trunk", "hood", "windshield",
      "tire", "tires", "license plate", "lot", "dealership", "miles", "mileage",
      "mpg", "vin", "title", "lien", "apr", "lease", "money factor",
      "zip code", "zip", "carfax", "autocheck", "blue book",
    ],
    foreign: [
      "drive away", "drive-away", "driveaway", "no more to pay", "on-road costs",
      "on road costs", "roadworthy", "rwc", "ppsr", "rego", "registration transfer",
      "stamp duty", "comparison rate", "novated lease", "ute", "petrol", "boot",
      "bonnet", "windscreen", "tyre", "tyres", "kilometres", "kilometers", "km",
      "l/100km", "car yard", "second-hand", "redbook", "lmct", "abn",
    ],
  },

  // ── Vehicle taxonomy ──────────────────────────────────────────────────────
  // Only the market-DISTINCTIVE part. Global marques (Toyota, Ford, BMW…) are
  // shared and live in config/locale/index.js so neither pack repeats them.
  vehicle: {
    trimWord: "trim",
    trimSynonyms: ["trim", "trim level", "package", "edition"],
    distinctiveModels: [
      "f-150", "f150", "silverado", "sierra", "ram 1500", "tacoma", "tundra",
      "explorer", "tahoe", "suburban", "escalade", "wrangler", "gladiator",
      "bronco", "grand cherokee", "pilot", "highlander", "camry", "accord",
      "civic", "corolla", "malibu", "impala", "mustang", "camaro", "charger",
      "challenger", "corvette", "equinox", "traverse", "expedition",
    ],
    distinctiveMakes: [
      "chevrolet", "gmc", "buick", "cadillac", "chrysler", "dodge", "ram",
      "jeep", "lincoln", "rivian", "lucid",
    ],
  },

  // ── Reference lists ───────────────────────────────────────────────────────
  directories: [
    "google business profile", "gbp", "yelp", "cars.com", "dealerrater",
    "edmunds", "kelley blue book", "kbb", "carfax", "autotrader.com",
    "cargurus", "truecar", "bbb.org", "better business bureau",
    "apple maps", "bing places",
  ],
  directoryDomains: [
    "yelp.com", "cars.com", "dealerrater.com", "edmunds.com", "kbb.com",
    "autotrader.com", "cargurus.com", "truecar.com", "bbb.org",
    "google.com/maps", "carfax.com",
  ],

  // Credentials that establish a dealer's or workshop's credibility. Consumed by
  // EEAT_Composite, Trust_Badges and Certifications_Awards — one shared asset.
  credentials: [
    "ase certified", "ase-certified", "ase master", "i-car", "i-car gold",
    "napa autocare", "aaa approved auto repair", "nada", "bbb accredited",
    "better business bureau", "accredited business", "google guaranteed",
    "certified pre-owned", "manufacturer certified", "master technician",
    "dealer of the year", "president's award", "mark of excellence",
    "dealerrater award", "carfax advantage",
  ],
  // A business identifier that is publicly resolvable. The US has no displayed
  // equivalent of Australia's ABN, so this is deliberately empty — a check that
  // asks for it must treat an empty list as "not applicable here".
  businessIdentifiers: [],

  // Vehicle-history providers. Used by Vehicle_History on used/CPO pages.
  historyProviders: {
    names: ["carfax", "autocheck"],
    domains: ["carfax.com", "autocheck.com"],
    label: "CARFAX / AutoCheck",
    // Phrases that signal a history report is being offered even without a badge.
    language: [
      "vehicle history report", "free vehicle history", "free history",
      "history report", "accident-free", "accident free", "no accidents",
      "one-owner", "one owner", "1-owner", "clean title", "clean carfax",
      "clean history",
    ],
    registryNote: "NMVTIS title-brand data",
  },

  // Trade-in valuation providers. Used by TradeIn_Flow.
  valuationProviders: {
    names: [
      "kelley blue book", "kbb", "instant cash offer", "black book",
      "j.d. power", "jd power", "nada guides", "edmunds appraisal",
      "trade-in value", "trade in value",
    ],
    domains: ["kbb.com", "blackbook.com", "jdpower.com", "edmunds.com"],
    label: "KBB / Black Book / J.D. Power",
    // Market-specific friction the flow should address, if any.
    payoutCheck: null,
  },

  // Outbound sources that count as authoritative attribution.
  authorities: {
    names: [
      "nhtsa", "national highway traffic safety administration", "epa",
      "environmental protection agency", "iihs", "insurance institute for highway safety",
      "fueleconomy.gov", "safercar.gov", "kelley blue book", "edmunds",
    ],
    domains: [
      "nhtsa.gov", "epa.gov", "iihs.org", "fueleconomy.gov", "safercar.gov",
      "kbb.com", "edmunds.com",
    ],
  },

  // ── Conversion surface ────────────────────────────────────────────────────
  // Action verbs that make a CTA "clear". The shared global verbs live in
  // index.js; these are the ones that are market-idiomatic.
  ctaVerbs: [
    "get eprice", "eprice", "value your trade", "check availability",
    "get pre-qualified", "pre-qualify", "schedule service", "shop now",
    "view inventory", "estimate payment",
  ],

  // Navigation sections a dealer site is expected to expose.
  navExpected: [
    { label: "New", terms: ["new", "new vehicles", "new inventory"] },
    { label: "Used", terms: ["used", "pre-owned", "preowned", "used vehicles"] },
    { label: "Certified Pre-Owned", terms: ["certified", "cpo", "certified pre-owned"] },
    { label: "Service", terms: ["service", "schedule service", "service center"] },
    { label: "Parts", terms: ["parts", "accessories"] },
    { label: "Finance", terms: ["finance", "financing", "apply", "credit"] },
    { label: "Specials", terms: ["specials", "offers", "deals", "incentives"] },
    { label: "About", terms: ["about", "about us", "contact", "our team"] },
  ],

  // Facets an inventory search page is expected to offer.
  inventoryFacets: [
    { label: "Make", terms: ["make", "brand"] },
    { label: "Model", terms: ["model"] },
    { label: "Trim", terms: ["trim", "package"] },
    { label: "Year", terms: ["year"] },
    { label: "Price", terms: ["price", "payment", "budget"] },
    { label: "Mileage", terms: ["mileage", "miles", "odometer"] },
    { label: "Body style", terms: ["body", "body style", "type", "suv", "sedan", "truck"] },
    { label: "Fuel", terms: ["fuel", "gas", "hybrid", "electric"] },
    { label: "Transmission", terms: ["transmission", "automatic", "manual"] },
    { label: "Drivetrain", terms: ["drivetrain", "awd", "4wd", "fwd", "rwd"] },
    { label: "Colour", terms: ["color", "colour", "exterior color"] },
    { label: "Distance from ZIP", terms: ["distance", "zip", "near me", "radius"] },
  ],

  // Photographs a VDP is expected to carry.
  galleryShots: [
    { label: "Exterior angles", terms: ["front", "rear", "side", "exterior"] },
    { label: "Interior", terms: ["interior", "dashboard", "seats", "cabin"] },
    { label: "Odometer", terms: ["odometer", "mileage", "miles"] },
    { label: "VIN plate", terms: ["vin", "vin plate"] },
    { label: "Window sticker", terms: ["window sticker", "monroney", "sticker"] },
  ],

  // Questions buyers in this market actually ask. Consumed by FAQ_QA_Blocks.
  faqTopics: [
    { label: "Financing / APR", terms: ["financing", "finance", "apr", "interest rate", "credit"] },
    { label: "Trade-in", terms: ["trade-in", "trade in", "appraisal", "value my car"] },
    { label: "Warranty", terms: ["warranty", "coverage", "extended warranty"] },
    { label: "Service", terms: ["service", "maintenance", "oil change"] },
    { label: "Delivery", terms: ["delivery", "shipping", "pick up"] },
    { label: "Vehicle history", terms: ["carfax", "autocheck", "vehicle history", "accident"] },
    { label: "Fees", terms: ["doc fee", "documentation fee", "dealer fee", "out-the-door"] },
  ],

  // ── Pricing & finance law ─────────────────────────────────────────────────
  pricing: {
    // The headline model: a price plus separately-disclosed fees and taxes.
    model: "component-plus-fees",
    basis: "FTC Act s5 — advertised prices must not be misleading. Fee rules are set at state level.",
    // Terms that show the page discloses what sits on top of the advertised price.
    feeDisclosureTerms: [
      "doc fee", "documentation fee", "dealer fee", "processing fee",
      "destination charge", "destination fee", "no hidden fees", "no dealer fees",
      "plus tax", "plus tax and", "plus fees", "out-the-door", "out the door",
      "price includes", "price excludes", "additional fees may", "tax, title",
      "title and license", "excludes tax", "does not include",
    ],
    // Terms that constitute the market's "total price" concept, if it has one.
    totalPriceTerms: ["out-the-door", "out the door", "otd price"],
    // Is a prominent all-in total legally required? US: no.
    totalPriceRequired: false,
    transparencyTerms: [
      "no hidden fees", "no dealer fees", "no surprise", "transparent pricing",
      "upfront pricing", "no markup",
    ],
  },

  finance: {
    // Disclosure required wherever a rate or repayment is advertised.
    rateDisclosure: {
      // Reg Z: stating a triggering term forces the full terms, including APR.
      requiredTerms: ["apr", "annual percentage rate"],
      supportingTerms: [
        "with approved credit", "on approved credit", "w.a.c", "wac", "o.a.c",
        "finance charge", "qualified buyers", "qualified credit",
        "subject to credit approval", "amount financed", "total of payments",
      ],
      label: "APR / Reg-Z finance terms",
      basis: "Truth in Lending Act / Reg Z 1026.24 — a stated triggering term (down payment, payment amount, term or finance charge) requires full terms including the APR.",
    },
    // A licence number that must appear wherever credit is arranged. US: none.
    licenceDisclosure: null,
    leaseDisclosure: {
      requiredTerms: [
        "due at signing", "capitalized cost", "cap cost", "residual",
        "money factor", "total of payments", "lease term", "lessee",
        "acquisition fee", "disposition fee", "excess mileage", "security deposit",
      ],
      label: "Lease terms (Reg-M)",
      basis: "Consumer Leasing Act / Reg M.",
    },
  },

  // ── Privacy & consent law ─────────────────────────────────────────────────
  privacy: {
    regime: "CCPA / CPRA + state comprehensive laws",
    regulator: "FTC, state Attorneys General, CPPA",
    // Text that evidences the market's own rights notice.
    //
    // The first ten entries are the pre-locale-pack keyword list from
    // securityCompliance.checkGDPRCCPA, kept verbatim and in order so a US audit
    // returns exactly what it returned before this pack existed. GDPR is on the
    // list deliberately: it binds a US site that offers goods or services to EU
    // or UK visitors, so its presence is real evidence of a rights notice.
    // Everything after the divider is additive — CPRA-era wording the original
    // list predated and that only ever finds MORE, never less.
    rightsTerms: [
      "gdpr", "ccpa", "california consumer privacy act",
      "general data protection regulation",
      "do not sell my personal information", "don't sell my personal information",
      "cookie preferences", "manage cookies", "legal notice", "imprint",
      // ── additive ──
      "cpra", "do not sell or share my personal information",
      "your privacy choices", "limit the use of my sensitive personal information",
      "global privacy control", "opt out of sale", "opt-out of sale",
    ],
    // Selectors for consent/preference widgets that satisfy the market's rules.
    // Same rule as above: the original eight first, additive ones after.
    rightsSelectors: [
      "[id*='gdpr']", "[class*='gdpr']", "[id*='ccpa']", "[class*='ccpa']",
      "[data-ccpa]", "#onetrust-pc-btn-handler", ".fc-preference-consent",
      "[aria-label*='privacy settings']",
      // ── additive ──
      "[href*='do-not-sell']", "[href*='donotsell']", "[href*='privacy-choices']",
    ],
    // Prescribed content the policy is expected to carry.
    policyContent: [
      { label: "Categories of information collected", terms: ["categories of personal information", "information we collect", "personal information we collect"] },
      { label: "Purposes of use", terms: ["how we use", "purpose", "why we collect"] },
      { label: "Disclosure to third parties", terms: ["share", "disclose", "third part", "service provider"] },
      { label: "Consumer rights", terms: ["your rights", "right to delete", "right to know", "right to opt out", "access your"] },
      { label: "Notice at collection", terms: ["notice at collection", "at or before the point of collection"] },
    ],
    // Is a cookie banner itself a legal requirement in this market?
    consentBannerRequired: false,
    // What the market actually requires in place of / alongside a banner.
    consentModel: "opt-out",
    consentBasis: "There is no cookie-banner mandate. The requirement is an opt-out: a \"Do Not Sell or Share\" link, a sensitive-information limit control, and honouring Global Privacy Control in the states that require it.",
    // Marketing email consent model — CAN-SPAM permits pre-ticked boxes.
    marketingConsent: { model: "opt-out", preTickedAllowed: true, unsubscribeDays: 10, basis: "CAN-SPAM Act." },
    // Does the market require the policy to name overseas recipients?
    overseasDisclosureRequired: false,
  },

  // ── Accessibility ─────────────────────────────────────────────────────────
  accessibility: {
    // The frameworks in accessibilityLegal.js that apply here, by id.
    frameworkIds: ["WCAG_2_2_AA", "ADA", "SECTION_508"],
    citeAs: "ADA Title III / Section 508",
    enforcementNote:
      "High-volume private litigation and demand letters, concentrated in NY, FL and CA. In California the Unruh Civil Rights Act adds statutory damages with a $4,000 minimum per violation.",
  },

  // ── Security ──────────────────────────────────────────────────────────────
  security: {
    tlsStandard: "NIST SP 800-52 Rev 2",
    baselineStandard: "NIST CSF 2.0 / OWASP",
    // Where the finance-form obligations come from.
    financeFormBasis:
      "GLBA Safeguards Rule (16 CFR 314) — written information security program, encryption in transit and at rest, MFA, access control, vendor oversight and incident response.",
    mfaBasis:
      "The FTC Safeguards Rule requires MFA for anyone accessing customer information and names auto dealers as covered financial institutions.",
  },
};
