// ─────────────────────────────────────────────────────────────────────────────
// Locale pack — Australia.
//
// Same shape as config/locale/us.js. Where the US pack is the reference, this
// pack is the one that changes answers: every list here replaces an American
// list that produced a wrong result on an Australian site — CARFAX on a market
// where CARFAX does not operate, ASE/NADA/BBB credentials that do not exist,
// a 10-digit phone rule that rejects a 13-number, a "City, ST 12345" address
// parser that cannot read "Fortitude Valley QLD 4006".
//
// Two rules held throughout:
//   1. No threshold moves. WCAG criteria, Core Web Vitals and OWASP baselines
//      are global constants — see docs/reports/US-vs-AU-Norms-Implementation-
//      Status.html §08. Market awareness lives in WHICH parameters apply, WHICH
//      list is compared against, and WHAT the finding says. Never in the bar.
//   2. Findings are observations about the page, never legal conclusions. The
//      basis strings below exist so a finding can cite the right authority, not
//      so the product can assert compliance.
// ─────────────────────────────────────────────────────────────────────────────

/** States and territories, keyed by the code used in postal addresses. */
const STATES = {
  NSW: "New South Wales",
  VIC: "Victoria",
  QLD: "Queensland",
  WA: "Western Australia",
  SA: "South Australia",
  TAS: "Tasmania",
  ACT: "Australian Capital Territory",
  NT: "Northern Territory",
};

export default {
  code: "AU",
  name: "Australia",
  demonym: "Australian",

  // ── Formats ───────────────────────────────────────────────────────────────
  language: "en-AU",
  languageBase: "en",
  currency: "AUD",
  currencySymbols: ["$", "a$", "au$", "aud"],

  units: {
    distance: "kilometres",
    distanceAbbrev: ["km", "kms", "kilometres", "kilometers"],
    distanceSchemaCode: "KMT",
    fuelEconomy: "L/100km",
    fuelEconomyPattern: /\bl\s*\/\s*100\s*km\b|litres per 100/i,
    fuelLabel: "Green Vehicle Guide fuel-consumption label (ADR 81/02)",
  },

  date: { order: "DMY", visibleExample: "DD/MM/YYYY" },

  phone: {
    region: "AU",
    // Landline (07) 3000 1234, mobile 04xx xxx xxx and 1300/1800 numbers are all
    // 10 national digits. A 13-number is SIX — "13 12 34". The old
    // last-10-digits rule rejected every one of them, which is why Click_To_Call
    // and Citation_NAP_Consistency both mis-scored on AU sites.
    nationalDigits: [10, 6],
    shortCodePatterns: [/^13\s?\d{2}\s?\d{2}$/, /^13\d{4}$/],
    tollFreePattern: /^\+?61?\s*1(800|300)/,
    example: "tel:+61730001234",
  },

  address: {
    states: STATES,
    // Four digits, and crucially NOT comma-separated from the locality:
    // "Fortitude Valley QLD 4006", not "Fortitude Valley, QLD 4006".
    postcodePattern: /\b\d{4}\b/,
    postcodeLabel: "postcode",
    postcodeDigits: 4,
    stateLabel: "state or territory",
    localityRegionSeparator: " ",
    formatHint: "Suburb STATE 4000",
  },

  // ── Vocabulary ────────────────────────────────────────────────────────────
  vocabulary: {
    native: [
      "drive away", "drive-away", "driveaway", "no more to pay",
      "on-road costs", "on road costs", "excluding on-road costs",
      "roadworthy", "roadworthy certificate", "rwc", "safety certificate",
      "ppsr", "rego", "registration transfer", "stamp duty", "comparison rate",
      "novated lease", "ute", "petrol", "boot", "bonnet", "windscreen",
      "tyre", "tyres", "kilometres", "km", "l/100km", "car yard",
      "second-hand", "second hand", "redbook", "lmct", "abn",
      "statutory warranty", "cooling-off", "cooling off", "ancap",
      "compliance plate", "build date", "demo", "demonstrator",
    ],
    foreign: [
      "msrp", "sticker price", "out-the-door", "out the door", "doc fee",
      "documentation fee", "destination charge", "gasoline", "trunk", "hood",
      "windshield", "license plate", "zip code", "carfax", "autocheck",
      "blue book", "kelley blue book", "mpg", "miles per gallon",
      "ase certified", "better business bureau", "bbb accredited",
    ],
  },

  // ── Vehicle taxonomy ──────────────────────────────────────────────────────
  vehicle: {
    // AU inventory calls a trim a "variant" or a "badge". A US-tuned entity
    // recogniser looking for "trim" misses the field entirely.
    trimWord: "variant",
    trimSynonyms: ["variant", "badge", "series", "trim"],
    distinctiveModels: [
      "hilux", "ranger", "d-max", "dmax", "triton", "bt-50", "navara",
      "amarok", "colorado", "landcruiser", "land cruiser", "prado",
      "everest", "pajero", "pajero sport", "mu-x", "musso",
      "commodore", "falcon", "territory", "captiva", "barina", "astra",
      "i30", "asx", "outlander", "x-trail", "qashqai", "cx-5", "cx-3",
      "hiace", "transit custom", "master", "sprinter",
    ],
    distinctiveMakes: [
      "holden", "ldv", "gwm", "haval", "great wall", "chery", "mg", "byd",
      "isuzu ute", "isuzu", "ssangyong", "kgm", "ram trucks australia",
    ],
  },

  // ── Reference lists ───────────────────────────────────────────────────────
  // Yelp, Cars.com, DealerRater and BBB are absent by design — none of them is
  // meaningful in Australia, and expecting them penalised AU dealers for missing
  // platforms that do not exist locally.
  directories: [
    "google business profile", "gbp", "carsales", "carsales.com.au",
    "autotrader", "autotrader.com.au", "carsguide", "drive.com.au",
    "productreview", "productreview.com.au", "yellow pages", "yellowpages.com.au",
    "true local", "truelocal", "hotfrog", "localsearch", "abn lookup",
    "carexpert", "whichcar",
  ],
  directoryDomains: [
    "carsales.com.au", "autotrader.com.au", "carsguide.com.au", "drive.com.au",
    "productreview.com.au", "yellowpages.com.au", "truelocal.com.au",
    "hotfrog.com.au", "localsearch.com.au", "abr.business.gov.au",
    "carexpert.com.au", "whichcar.com.au", "google.com/maps",
  ],

  credentials: [
    // Statutory credibility first — a dealer licence number is the strongest
    // trust signal an Australian dealer can display, and the old US list could
    // not see it at all.
    "lmct", "licensed motor car trader", "motor dealer licence",
    "dealer licence", "dealer license", "licence no", "licence number",
    "abn", "australian business number", "acn",
    "aada", "australian automotive dealer association",
    "vacc", "mta", "mta-nsw", "mta nsw", "mta-qld", "mta qld",
    "mta-sa", "mta sa", "mta-wa", "mta wa", "motor traders association",
    "racv", "nrma", "racq", "raa", "ract", "racwa",
    "racv approved", "nrma approved", "racq approved", "raa approved",
    "aaaa member", "capricorn member", "repco authorised",
    "authorised dealer", "manufacturer authorised", "ancap",
    "ppsr checked", "ppsr certificate",
    "certificate iii in light vehicle", "certificate iii light vehicle",
  ],
  // The ABN is a public, resolvable government identifier — exactly the kind of
  // grounding an answer engine rewards, and the US has no displayed equivalent.
  businessIdentifiers: [
    { label: "ABN", pattern: /\bABN[:\s]*(\d{2}\s?\d{3}\s?\d{3}\s?\d{3})\b/i, digits: 11, lookup: "https://abr.business.gov.au" },
    { label: "ACN", pattern: /\bACN[:\s]*(\d{3}\s?\d{3}\s?\d{3})\b/i, digits: 9, lookup: null },
    { label: "Dealer licence", pattern: /\b(?:LMCT|LMD|MD|MVD|licence\s*(?:no\.?|number))[:\s#]*([0-9]{3,8})\b/i, digits: null, lookup: null },
  ],

  historyProviders: {
    // CARFAX does not operate in Australia. The PPSR certificate is the direct
    // analogue and the single most requested trust artefact by AU used buyers.
    names: ["ppsr", "personal property securities register", "carhistory", "revs check", "revs"],
    domains: ["ppsr.gov.au", "carhistory.com.au"],
    label: "PPSR certificate",
    language: [
      "ppsr", "ppsr check", "ppsr checked", "ppsr certificate", "ppsr clear",
      "revs check", "encumbrance check", "finance owing", "not encumbered",
      "written-off", "written off check", "not written off", "stolen check",
      "clear title", "vehicle history report", "carhistory",
    ],
    registryNote: "PPSR under the Personal Property Securities Act 2009 — finance encumbrance, written-off and stolen status",
  },

  valuationProviders: {
    names: [
      "redbook", "red book", "glass's guide", "glasses guide", "glass's",
      "trade-in valuation", "trade in valuation", "car valuation",
      "what's my car worth", "value my car",
    ],
    domains: ["redbook.com.au", "glassguide.com.au"],
    label: "RedBook / Glass's Guide",
    // An encumbered trade-in must have its PPSR payout settled. AU sites
    // routinely omit this and it is a real friction point in the flow.
    payoutCheck: {
      label: "Existing finance payout",
      terms: ["payout", "pay out your loan", "finance owing", "encumbrance", "settle your finance", "existing finance"],
      note: "An encumbered trade-in needs its existing finance settled before transfer. There is no US analogue — and no trade-in tax credit either, since stamp duty is calculated on the purchase price.",
    },
  },

  authorities: {
    names: [
      "ancap", "ancap safety", "green vehicle guide", "ppsr", "redbook",
      "accc", "australian competition and consumer commission", "asic",
      "vehicle recalls australia", "product safety australia",
      "service nsw", "vicroads", "transport for nsw",
      "department of transport and main roads", "tmr",
      "australian design rules", "adr",
    ],
    domains: [
      "ancap.com.au", "greenvehicleguide.gov.au", "ppsr.gov.au",
      "redbook.com.au", "accc.gov.au", "asic.gov.au",
      "vehiclerecalls.gov.au", "productsafety.gov.au",
      "service.nsw.gov.au", "vicroads.vic.gov.au", "nsw.gov.au",
      "tmr.qld.gov.au", "infrastructure.gov.au",
    ],
  },

  // ── Conversion surface ────────────────────────────────────────────────────
  // "Enquire" is the dominant Australian lead verb and was absent from the verb
  // list entirely, so nearly every AU dealer's primary CTA scored as unclear.
  ctaVerbs: [
    "enquire", "enquire now", "make an enquiry", "send enquiry",
    "book a test drive", "book test drive", "book a service",
    "get a drive away price", "get drive away price", "drive away price",
    "trade-in valuation", "trade in valuation", "value my trade",
    "check availability", "view stock", "browse stock",
  ],

  navExpected: [
    { label: "New", terms: ["new", "new cars", "new vehicles", "new stock"] },
    // "Demo" is a distinct AU inventory class with no US equivalent. Penalising
    // an AU site for missing "Certified Pre-Owned" was a false finding; missing
    // "Demo" is a real gap.
    { label: "Demo", terms: ["demo", "demonstrator", "demo cars", "demo vehicles"] },
    { label: "Used", terms: ["used", "used cars", "pre-owned", "second hand", "second-hand"] },
    { label: "Service", terms: ["service", "book a service", "servicing"] },
    { label: "Parts", terms: ["parts", "accessories", "genuine parts"] },
    { label: "Finance", terms: ["finance", "financing", "apply", "credit"] },
    { label: "Specials", terms: ["specials", "offers", "deals", "run out", "run-out"] },
    { label: "About", terms: ["about", "about us", "contact", "our team"] },
  ],

  inventoryFacets: [
    { label: "Make", terms: ["make", "brand"] },
    { label: "Model", terms: ["model"] },
    { label: "Badge / variant", terms: ["badge", "variant", "series", "trim"] },
    { label: "Year", terms: ["year", "build year"] },
    { label: "Price", terms: ["price", "payment", "budget", "drive away"] },
    { label: "Kilometres", terms: ["kilometres", "kilometers", "km", "odometer"] },
    { label: "Body type", terms: ["body", "body type", "ute", "wagon", "hatch", "suv", "sedan"] },
    { label: "Fuel", terms: ["fuel", "petrol", "diesel", "hybrid", "electric"] },
    { label: "Transmission", terms: ["transmission", "automatic", "manual"] },
    // Drivetrain is a far more prominent filter in AU than in the US.
    { label: "Drivetrain (4x4 / AWD / 2WD)", terms: ["4x4", "4wd", "awd", "2wd", "drivetrain", "drive type"] },
    { label: "Colour", terms: ["colour", "color", "exterior colour"] },
    { label: "ANCAP rating", terms: ["ancap", "safety rating"] },
    { label: "Condition (new/demo/used)", terms: ["new", "demo", "used", "condition"] },
    { label: "Location by suburb/state", terms: ["location", "suburb", "state", "postcode", "near me"] },
  ],

  galleryShots: [
    { label: "Exterior angles", terms: ["front", "rear", "side", "exterior"] },
    { label: "Interior", terms: ["interior", "dashboard", "seats", "cabin"] },
    { label: "Odometer", terms: ["odometer", "kilometres", "km"] },
    { label: "Compliance plate", terms: ["compliance plate", "build plate", "vin plate"] },
    // No Monroney sticker exists in Australia — requiring one was a false
    // finding. The AU artefacts buyers look for are these.
    { label: "Rego label / service book", terms: ["rego", "registration", "service book", "logbook", "log book"] },
    { label: "Fuel-consumption label", terms: ["fuel consumption", "fuel label", "green vehicle"] },
  ],

  faqTopics: [
    { label: "Drive-away price / on-road costs", terms: ["drive away", "drive-away", "on-road costs", "on road costs", "no more to pay"] },
    { label: "Comparison rate", terms: ["comparison rate", "interest rate", "finance"] },
    { label: "PPSR check", terms: ["ppsr", "encumbrance", "written off", "revs check"] },
    { label: "Roadworthy / safety certificate", terms: ["roadworthy", "rwc", "safety certificate", "roadworthy certificate"] },
    { label: "Statutory warranty / cooling-off", terms: ["statutory warranty", "cooling-off", "cooling off", "warranty"] },
    { label: "Rego transfer", terms: ["rego", "registration transfer", "transfer registration"] },
    { label: "Stamp duty", terms: ["stamp duty", "duty", "on-road costs"] },
    { label: "Trade-in valuation", terms: ["trade-in", "trade in", "redbook", "valuation"] },
    { label: "Novated leasing", terms: ["novated", "novated lease", "salary packaging"] },
  ],

  // ── Pricing & finance law ─────────────────────────────────────────────────
  pricing: {
    // ACL s48 single-price rule: the total minimum price, GST included, must be
    // stated at least as prominently as any component of it. This is a hard
    // legal rule, not a customer convention — which is why the US model of
    // "price plus disclosed fees" cannot simply be translated.
    model: "single-total-price",
    basis: "Australian Consumer Law s48 — where a price is advertised, the single total minimum price including GST must be stated at least as prominently as any component of it. The ACCC enforces this actively in automotive.",
    feeDisclosureTerms: [
      "drive away", "drive-away", "driveaway", "no more to pay",
      "on-road costs", "on road costs", "excluding on-road costs",
      "excludes on-road costs", "plus on-road costs", "including gst",
      "inc gst", "incl gst", "gst inclusive", "stamp duty", "registration",
      "dealer delivery", "no hidden fees", "price includes", "price excludes",
    ],
    totalPriceTerms: [
      "drive away", "drive-away", "driveaway", "no more to pay",
      "drive away price", "total price", "including gst", "inc gst",
    ],
    totalPriceRequired: true,
    // A component shown WITHOUT an equally prominent total is the actual defect.
    componentOnlyTerms: [
      "plus on-road costs", "plus on road costs", "excluding on-road costs",
      "excludes on-road costs", "ex on-road costs", "plus orc", "+ orc",
    ],
    transparencyTerms: [
      "no hidden fees", "no more to pay", "transparent pricing",
      "upfront pricing", "drive away, no more to pay",
    ],
  },

  finance: {
    rateDisclosure: {
      // Advertising a rate for fixed-term consumer credit requires a comparison
      // rate plus the prescribed warning. Deterministic string check, no US
      // analogue.
      requiredTerms: ["comparison rate"],
      supportingTerms: [
        "warning: this comparison rate", "this comparison rate is true only",
        "comparison rate warning", "approval subject to lending criteria",
        "subject to lending criteria", "fees and charges apply",
        "terms and conditions apply", "credit criteria",
      ],
      label: "Comparison rate + prescribed warning",
      basis: "National Credit Code — advertising an interest rate for fixed-term consumer credit requires a comparison rate and the prescribed warning statement. ASIC RG 234 governs the advertising itself.",
    },
    // Arranging finance is "credit assistance" under the NCCP Act, which
    // requires an Australian Credit Licence and disclosure of its number.
    // Present or absent — no judgement required, so it is a high-confidence
    // DOM check with no US equivalent.
    licenceDisclosure: {
      label: "Australian Credit Licence number",
      terms: ["australian credit licence", "australian credit license", "credit licence", "acl no", "acl number"],
      pattern: /\b(?:australian\s+credit\s+licen[cs]e|credit\s+licen[cs]e|ACL)\s*(?:number|no\.?|#)?[:\s]*(\d{6})\b/i,
      basis: "NCCP Act 2009 — arranging finance is credit assistance and requires an Australian Credit Licence or authorised-representative status, with the licence number disclosed. Responsible-lending obligations apply; ASIC regulates.",
    },
    // Australia has no separate consumer-lease disclosure regime equivalent to
    // Reg M, so lease-specific grading is not applicable here.
    leaseDisclosure: null,
  },

  // ── Privacy & consent law ─────────────────────────────────────────────────
  privacy: {
    regime: "Privacy Act 1988 (Cth) + 13 Australian Privacy Principles",
    regulator: "OAIC",
    rightsTerms: [
      "australian privacy principles", "privacy principles", "app 1", "app 5",
      "privacy act 1988", "privacy act", "oaic",
      "office of the australian information commissioner",
      "notifiable data breach", "notifiable data breaches",
      "access and correction", "how to complain", "make a complaint",
      "privacy officer", "privacy policy",
    ],
    rightsSelectors: [
      "[href*='privacy-policy']", "[href*='privacy']",
      "[id*='privacy']", "[class*='privacy']",
      "#onetrust-pc-btn-handler", "[aria-label*='privacy settings']",
    ],
    policyContent: [
      { label: "Kinds of information collected", terms: ["kinds of personal information", "information we collect", "what we collect", "personal information we collect"] },
      { label: "How it is collected and held", terms: ["how we collect", "how we hold", "how it is stored", "we store"] },
      { label: "Purposes of use", terms: ["purpose", "how we use", "why we collect"] },
      { label: "Access and correction", terms: ["access and correction", "access your personal information", "correct your", "request correction"] },
      { label: "Complaints / OAIC escalation", terms: ["complaint", "how to complain", "oaic", "information commissioner"] },
      // The AU-specific one that is almost universally missing on dealer sites
      // running a US-hosted CRM, chat widget or analytics tag.
      { label: "Overseas disclosure and countries", terms: ["overseas", "outside australia", "overseas recipients", "countries in which", "disclosed overseas", "cross-border"] },
    ],
    // Australia has no cookie law. Scoring an AU site down for having no banner
    // was the single largest false-positive risk in the product.
    consentBannerRequired: false,
    consentModel: "notify-at-collection",
    consentBasis: "Australia has no cookie law. Obligations come from the APPs: notify at collection (APP 5), collect only what is reasonably necessary (APP 3), and obtain consent for sensitive information. A banner is good practice, not a legal requirement — but the privacy policy must disclose tracking and any overseas disclosure.",
    // The Spam Act is opt-in: a pre-ticked marketing box is not valid consent.
    marketingConsent: { model: "opt-in", preTickedAllowed: false, unsubscribeDays: 5, basis: "Spam Act 2003 — express or inferred consent is required before sending, the sender must be identified, and unsubscribe requests must be honoured within 5 business days. Pre-ticked consent boxes are not valid consent." },
    overseasDisclosureRequired: true,
    overseasDisclosureBasis: "APP 1.3(f) — the policy must state whether personal information is likely to be disclosed to overseas recipients and, if so, the countries in which they are located.",
  },

  // ── Accessibility ─────────────────────────────────────────────────────────
  accessibility: {
    frameworkIds: ["WCAG_2_2_AA", "DDA"],
    citeAs: "Disability Discrimination Act 1992 / AHRC / AS EN 301 549",
    enforcementNote:
      "Complaint-driven conciliation through the Australian Human Rights Commission, escalating to the Federal Court if unresolved. Precedent: Maguire v SOCOG (2000). Far lower volume than US litigation — the business case is complaint and reputational risk, not immediate financial exposure.",
  },

  // ── Security ──────────────────────────────────────────────────────────────
  security: {
    tlsStandard: "ACSC Information Security Manual",
    baselineStandard: "ACSC Essential Eight / OWASP",
    financeFormBasis:
      "APP 11 reasonable steps plus NCCP conduct obligations on credit assistance providers and ASIC conduct rules. Credit applications capture identity documents — driver licence data — which raises the APP 11 bar. The Notifiable Data Breaches scheme applies to any breach.",
    mfaBasis:
      "Not named in statute for dealers. APP 11 requires reasonable steps and the ACSC Essential Eight lists MFA as a core mitigation, so it is de facto expected and framed as reasonableness rather than a hard requirement.",
  },
};
