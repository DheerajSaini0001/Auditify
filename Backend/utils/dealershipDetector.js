// =============================================================================
// SITE TYPE DETECTION (dealer / service / corporate / unknown)
// Autonomous | 4-Way Classification + Sub-Type | Zero Human Interaction
//
// Classifies an audited site as one of:
//   "dealer"    — an individual dealership (has inventory/VIN/trade-in/finance)
//   "service"   — a servicing business with no vehicle sales inventory of its
//                 own (service centre/chain, or a repair garage/body shop)
//   "corporate" — an OEM/manufacturer or multi-dealer corporate site (dealer
//                 locator, build & price configurator, press/investor pages —
//                 no per-vehicle inventory of its own)
//   "unknown"   — inconclusive, or a marketplace/media/non-automotive site.
//                 Callers reject "unknown" at the discovery/audit gate.
//
// and returns a `siteSubType` alongside it — the four columns of
// docs/reports/Automotive-Site-Type-Parameter-Matrix.html:
//   dealer    -> "franchise"   (manufacturer-appointed, new + used + CPO)
//             -> "independent" (no franchise, mixed-brand used inventory)
//   service   -> "service"     (service centre or chain, multi-location)
//             -> "repair"      (single-location garage, body shop, mechanic)
//   corporate -> "corporate"
//   unknown   -> null
//
// The sub-type is what the scoring pipeline keys parameter APPLICABILITY and
// the section-weight tilt off (see Backend/config/siteTypeProfiles.js) — the 12
// inventory-scoped parameters are renormalised out of the denominator on the
// two servicing types rather than scored as failures.
//
// Decision order (disqualifiers ALWAYS first):
//   1. Inaccessible / bot-challenge page        -> unknown (inconclusive)
//   2. D2/D3 marketplace or media domain        -> unknown
//   3. D1 OEM domain                            -> corporate (fast path)
//   4. 3+ matched signals (Group A + B)         -> dealer
//   5. 2+ matched signals (Group C)             -> corporate
//   6. 2+ matched signals (Group S) + anchor    -> service
//   7. Otherwise                                -> unknown
//
// NOTE: a single signal is intentionally NOT enough for "dealer". A site must
// match at least THREE parameters total (combining dealership-exclusive Group A
// signals and supporting Group B signals) before it is confirmed as a dealer.
// This makes the gate strict and avoids false positives from one stray
// keyword/path. Group C (corporate) signals are already automotive/dealer-network
// specific on their own, so 2 of them is enough.
// =============================================================================

import logger from "./logger.js";

// --- Disqualifier domain lists (D1–D3) -------------------------------------
const OEM_DOMAINS = [
  "toyota.com", "ford.com", "bmw.com", "bmwusa.com", "honda.com", "chevrolet.com", "nissanusa.com",
  "nissan.com", "hyundaiusa.com", "hyundai.com", "kia.com", "mazdausa.com", "mazda.com",
  "subaru.com", "volkswagen.com", "vw.com", "audi.com", "audiusa.com", "mercedes-benz.com", "mbusa.com",
  "lexus.com", "acura.com", "infinitiusa.com", "jeep.com", "dodge.com", "ram trucks.com",
  "ramtrucks.com", "gmc.com", "buick.com", "cadillac.com", "volvocars.com", "porsche.com",
  "porscheusa.com", "jaguar.com", "jaguarusa.com", "landrover.com", "landroverusa.com",
  "tesla.com", "chrysler.com", "mini.com", "miniusa.com", "fiatusa.com",
  "mitsubishicars.com", "genesis.com", "lincoln.com", "alfaromeousa.com", "gm.com",
];

const MARKETPLACE_DOMAINS = [
  "cars.com", "autotrader.com", "carmax.com", "carvana.com", "cargurus.com",
  "truecar.com", "vroom.com", "carsdirect.com", "autolist.com", "iseecars.com",
  "shift.com", "carfax.com",
];

const MEDIA_DOMAINS = [
  "edmunds.com", "motortrend.com", "caranddriver.com", "kbb.com", "jdpower.com",
  "thecarconnection.com", "roadandtrack.com", "automobilemag.com", "jalopnik.com",
];

// --- Group A signal vocabularies -------------------------------------------
const DEALER_PLATFORM_HOSTS = [
  "dealer.com", "dealerinspire.com", "dealeron.com", "cdkglobal.com",
  "carsforsale.com", "autoconx.com", "dealersocket.com", "vinsolutions.com",
  "dealerfire.com", "fox dealer.com", "foxdealer.com", "naked lime.com",
];

const INVENTORY_PATHS = [
  "/inventory",
  "/new-inventory",
  "/used-inventory",
  "/new-vehicles",
  "/used-vehicles",
  "/cars-for-sale",
  "/search-inventory",
  "/vehicle-details",
  "/vdp/",
  "/new-cars",
  "/used-cars",
  "/pre-owned",
  "/certified-pre-owned",
  "/cpo",
  "/all-inventory",
  "/available-vehicles",
  "/vehicle-inventory",
  "/browse-inventory",
  "/shop-inventory",
  "/view-inventory",
  "/inventory-search",
  "/inventory-listing",
  "/inventory-results",
  "/vehicle-search",
  "/vehicle-finder",
  "/find-a-vehicle",
  "/vehicles",
  "/cars",
  "/trucks",
  "/suvs",
  "/sedans",
  "/crossovers",
  "/commercial-vehicles",
  "/fleet",
  "/specials",
  "/new",
  "/used",
  "/preowned",
  "/certified",
  "/certified-used",
  "/certified-preowned",
  "/featured-vehicles",
  "/featured-inventory",
  "/manager-specials",
  "/dealer-specials",
  "/clearance",
  "/sale",
  "/inventory/new",
  "/inventory/used",
  "/inventory/certified",
  "/inventory/all",
  "/inventory/search",
  "/inventory/results",
  "/inventory/details",
  "/inventory/vehicle-details",
  "/inventory/new-vehicles",
  "/inventory/used-vehicles",
  "/new-vehicle-inventory",
  "/used-vehicle-inventory",
  "/new-cars-for-sale",
  "/used-cars-for-sale",
  "/vehicles-for-sale",
  "/auto-inventory",
  "/car-inventory",
  "/dealer-inventory",
  "/showroom",
  "/virtual-showroom",
  "/models",
  "/research",
  "/model-research",
  "/compare-vehicles",
  "/vehicle-showroom",
  // RV / towable / powersports / marine inventory categories. A dealer in these
  // segments (e.g. rvcountry.com) may never use a car-style "/inventory" path —
  // its inventory lives under body-type category URLs like these instead.
  "/rvs-for-sale",
  "/rvs",
  "/rv-inventory",
  "/travel-trailers",
  "/fifth-wheels",
  "/motorhomes",
  "/toy-haulers",
  "/class-a",
  "/class-b",
  "/class-c",
  "/campers",
  "/pop-ups",
  "/destination-trailers",
  "/park-models",
  "/truck-campers",
  "/motorcycles",
  "/powersports",
  "/atvs",
  "/utvs",
  "/side-by-sides",
  "/boats-for-sale",
  "/pontoons"
];

const LISTING_FIELD_KEYWORDS = [
  // Vehicle Identification
  "vin",
  "stock number",
  "stock #",
  "stock#",
  "vehicle id",
  "inventory id",

  // Pricing
  "msrp",
  "internet price",
  "sale price",
  "dealer price",
  "asking price",
  "cash price",
  "special price",
  "our price",
  "price",
  "finance price",
  "lease payment",
  "monthly payment",

  // Vehicle Details
  "year",
  "make",
  "model",
  "trim",
  "body style",
  "vehicle overview",
  "vehicle details",
  "vehicle description",

  // Mileage
  "mileage",
  "odometer",
  "miles",
  "km",

  // Colors
  "exterior color",
  "interior color",
  "color",

  // Powertrain
  "engine",
  "engine size",
  "horsepower",
  "torque",
  "transmission",
  "drivetrain",
  "fuel type",
  "fuel economy",
  "mpg",
  "city mpg",
  "highway mpg",

  // Vehicle Status
  "new",
  "used",
  "pre-owned",
  "certified pre-owned",
  "cpo",
  "one owner",

  // Features
  "features",
  "options",
  "equipment",
  "packages",
  "safety features",
  "technology features",

  // Dealer Actions
  "schedule test drive",
  "get e-price",
  "check availability",
  "contact dealer",
  "reserve vehicle",
  "value your trade",
  "trade-in value",
  "apply for financing",
  "payment calculator",

  // Vehicle History
  "carfax",
  "autocheck",
  "vehicle history report",
  "accident free",

  // Media
  "vehicle photos",
  "gallery",
  "photo gallery",
  "video walkaround",

  // Availability
  "in transit",
  "available now",
  "sold",
  "pending sale",
  "coming soon",

  // Dealer Specific
  "dealer notes",
  "dealer comments",
  "dealer specials",
  "special offer",
  "manufacturer incentives",
  "rebates"
];

// Strong, unambiguously-automotive subset of the listing fields. Used to gate
// A2 so that a generic retail page (which has "price"/"year"/"make"/"model")
// cannot be mistaken for a vehicle inventory listing. Every term here is
// specific to selling cars — a clothing/electronics store would not carry them.
const STRONG_LISTING_FIELD_KEYWORDS = [
  "stock number", "stock #", "stock#",
  "msrp", "odometer", "exterior color", "interior color",
  "fuel economy", "city mpg", "highway mpg",
  "vehicle history report", "carfax", "autocheck",
  "value your trade", "schedule test drive", "vehicle overview",
  // NOTE: "drivetrain" was removed. It is a COMPONENT, not a listing field —
  // it turns up in ordinary prose wherever anyone discusses how a machine is
  // driven, which is not confined to vehicle listings or even to cars. It fired
  // A2 (and so a DEALER verdict) on halfords.com, whose "drivetrain" is a
  // BICYCLE drivetrain, and on christianbrothersautomotive.com, a repair-only
  // franchise describing a service it performs. Every other entry in this list
  // is a field name off a spec table or a body type, which is the bar here.
  // RV / towable / powersports body-type names. Each of these is unambiguously
  // a recreational-vehicle listing term — a clothing/electronics/real-estate
  // store would never carry them — so they're safe to gate A2 alongside an
  // inventory path (added for rvcountry.com, an RV dealer whose listings carry
  // none of the car-specific fields above but are full of these). NOTE: generic
  // words that also mean something else ("floorplan" → real estate, "sleeps")
  // are deliberately left out; only RV-exclusive vehicle names are here.
  // (Bare "motorhome" is likewise gone: it reads as an ordinary noun in any
  // copy aimed at RV owners, and fired A2 on garmin.com, which sells satnavs
  // FOR motorhomes. The qualified class-A/B/C forms are listing terms.)
  "travel trailer", "fifth wheel", "5th wheel", "toy hauler",
  "class a motorhome", "class b motorhome", "class c motorhome",
  "truck camper", "pop-up camper", "destination trailer", "park model",
];

const TRADE_IN_PATHS = [
  "/trade-in",
  "/trade-in-value",
  "/trade-in-appraisal",
  "/value-your-trade",
  "/value-my-trade",
  "/get-trade-value",
  "/trade-evaluation",
  "/trade-assessment",
  "/sell-your-car",
  "/sell-my-car",
  "/sell-us-your-car",
  "/vehicle-appraisal",
  "/car-appraisal",
  "/instant-cash-offer",
  "/cash-offer",
  "/instant-offer",
  "/buy-your-car",
  "/we-buy-cars",
  "/car-buying-center",
  "/vehicle-buyback",
  "/vehicle-purchase",
  "/vehicle-acquisition",
  "/trade",
  "/trade-center",
  "/trade-tool",
  "/trade-calculator",
  "/trade-form",
  "/trade-request",
  "/trade-valuation",
  "/vehicle-valuation",
  "/car-valuation",
  "/vehicle-value",
  "/appraise-my-vehicle",
  "/appraise-your-vehicle",
  "/appraisal",
  "/online-appraisal",
  "/used-car-value",
  "/my-car-value",
  "/what-is-my-car-worth",
  "/car-worth",
  "/vehicle-worth",
  "/trade-and-sell",
  "/exchange-your-vehicle",
  "/upgrade-your-vehicle",
  "/upgrade-program"
];
const TRADE_IN_KEYWORDS = [
  // Trade-In Core Terms
  "trade-in",
  "trade in",
  "trade appraisal",
  "trade evaluation",
  "trade assessment",
  "trade request",
  "trade offer",
  "trade quote",
  "trade value",
  "trade-in value",
  "vehicle trade-in",
  "car trade-in",

  // Vehicle Valuation
  "value your trade",
  "value my trade",
  "value your vehicle",
  "value my vehicle",
  "vehicle valuation",
  "car valuation",
  "vehicle value",
  "car value",
  "what is my car worth",
  "how much is my car worth",
  "appraise my vehicle",
  "appraise your vehicle",
  "vehicle appraisal",
  "car appraisal",
  "online appraisal",

  // Sell Car
  "sell your car",
  "sell my car",
  "sell us your car",
  "we buy cars",
  "cash for cars",
  "vehicle buyback",
  "car buying center",
  "buy your car",

  // Cash Offer
  "instant cash offer",
  "cash offer",
  "instant offer",
  "guaranteed offer",
  "purchase offer",
  "vehicle offer",
  "buyback offer",

  // Kelley Blue Book
  "kelley blue book",
  "kbb",
  "kbb instant cash offer",
  "kbb value",
  "blue book value",

  // Edmunds
  "edmunds appraisal",
  "edmunds trade-in",
  "edmunds value",

  // CARFAX
  "carfax value",
  "carfax trade-in",
  "carfax history report",

  // Dealer CTAs
  "get trade value",
  "get your trade value",
  "estimate trade value",
  "check trade value",
  "calculate trade value",
  "trade calculator",
  "trade tool",
  "vehicle worth",
  "car worth",
  "upgrade your vehicle",
  "exchange your vehicle",

  // Common Form Labels
  "year make model",
  "vehicle condition",
  "current mileage",
  "vehicle mileage",
  "license plate",
  "vehicle information",
  "vehicle details",
  "trade information",
  "trade details"
];

const FINANCE_PATHS = [
  "/finance",
  "/financing",
  "/finance-center",
  "/finance-department",
  "/finance-options",
  "/finance-specials",
  "/finance-tools",
  "/finance-application",
  "/online-finance-application",

  "/get-pre-approved",
  "/pre-approval",
  "/preapproved",
  "/get-approved",
  "/apply-for-credit",
  "/apply-for-financing",
  "/apply-online",

  "/credit-application",
  "/online-credit-application",
  "/secure-credit-application",
  "/credit-center",
  "/credit-form",

  "/auto-loans",
  "/auto-loan",
  "/car-loan",
  "/car-loans",
  "/vehicle-loan",
  "/vehicle-financing",

  "/loan-application",
  "/loan-calculator",
  "/payment-calculator",
  "/car-payment-calculator",
  "/finance-calculator",

  "/lease",
  "/leasing",
  "/lease-specials",
  "/lease-offers",
  "/lease-deals",
  "/vehicle-leasing",

  "/bad-credit-financing",
  "/special-financing",
  "/first-time-buyer",
  "/college-graduate-program",
  "/military-discount",

  "/payment-estimator",
  "/monthly-payment-calculator",
  "/estimate-payments",

  "/finance-faq",
  "/finance-resources",
  "/buy-vs-lease",
  "/finance-vs-lease",

  "/dealer-financing",
  "/financing-options",
  "/automotive-financing",
  "/vehicle-finance",

  "/instant-credit-approval",
  "/instant-approval",
  "/credit-prequalification",
  "/prequalify",

  "/get-financed",
  "/easy-financing",
  "/car-financing",
  "/auto-financing"
];
const FINANCE_KEYWORDS = [
  // Credit Applications
  "credit application",
  "online credit application",
  "secure credit application",
  "finance application",
  "loan application",
  "apply for credit",
  "apply online",

  // Financing
  "apply for financing",
  "get financing",
  "auto financing",
  "car financing",
  "vehicle financing",
  "dealer financing",
  "special financing",
  "financing options",
  "financing available",

  // Pre-Approval
  "get pre-approved",
  "pre-approved",
  "pre approval",
  "pre-approval",
  "instant approval",
  "instant credit approval",
  "credit prequalification",
  "pre-qualify",
  "prequalify",
  "pre-qualification",

  // Loans
  "auto loan",
  "auto loans",
  "car loan",
  "car loans",
  "vehicle loan",
  "vehicle loans",
  "low interest financing",
  "loan calculator",

  // Leasing
  "lease offer",
  "lease offers",
  "lease special",
  "lease specials",
  "lease deal",
  "lease deals",
  "vehicle lease",
  "car lease",
  "leasing options",
  "buy vs lease",

  // Finance Center
  "finance center",
  "finance department",
  "finance team",
  "finance specialist",
  "finance manager",
  "finance resources",

  // Payment Tools
  "payment calculator",
  "car payment calculator",
  "monthly payment calculator",
  "payment estimator",
  "estimate your payment",
  "calculate payments",

  // Special Programs
  "bad credit financing",
  "first time buyer",
  "college graduate program",
  "military rebate",
  "special finance offers",

  // Incentives & Offers
  "finance specials",
  "finance offer",
  "finance offers",
  "cash rebate",
  "manufacturer incentives",
  "special APR",
  "low APR financing",
  "0% financing",

  // Common Dealer CTAs
  "get approved today",
  "start your application",
  "apply now",
  "check your eligibility",
  "secure financing",
  "get financed today"
];

// --- Group B signal vocabularies -------------------------------------------
const TEST_DRIVE_KEYWORDS = [
  // Test Drive
  "schedule test drive",
  "schedule a test drive",
  "book test drive",
  "book a test drive",
  "test drive",
  "request test drive",
  "reserve test drive",
  "test drive appointment",
  "schedule your test drive",
  "book your test drive",

  // Vehicle Reservation
  "reserve vehicle",
  "reserve this vehicle",
  "vehicle reservation",
  "hold this vehicle",
  "hold vehicle",
  "reserve car",
  "reserve this car",

  // Vehicle Availability (NOTE: bare "check availability"/"available now"/
  // "confirm availability" were removed — testing against real non-automotive
  // sites (banks, retailers) showed those alone false-positive constantly;
  // every entry below explicitly says vehicle/inventory)
  "vehicle availability",
  "is this vehicle available",
  "check vehicle availability",
  "inventory availability",

  // Vehicle Contact & Inquiry (bare "request information"/"send inquiry"/
  // "ask a question" removed — too generic, matches any contact form)
  "vehicle inquiry",
  "contact dealer",
  "contact us about this vehicle",

  // Vehicle Interest Actions — automotive-specific jargon
  "get e-price",
  "unlock price",
  "get today's price",
  "get internet price",

  // Purchase Intent (vehicle-specific; bare "buy online"/"start purchase"/
  // "express checkout"/"start buying process" removed — generic e-commerce)
  "purchase vehicle",
  "save vehicle",
  "favorite vehicle",

  // Common Dealer CTAs (vehicle-specific; "learn more"/"i'm interested"/
  // "contact sales"/"speak with a specialist"/"schedule appointment"/
  // "book appointment"/"meet with sales" removed — proven false positives on
  // Apple/Wells Fargo/Bank of America, none of them mention a vehicle at all)
  "interested in this vehicle",
  "vehicle details request"
];
const PAYMENT_KEYWORDS = [
  // Payment Calculators
  "payment calculator",
  "calculate payment",
  "calculate payments",
  "monthly payment",
  "estimate payment",
  "estimate payments",
  "payment estimator",
  "car payment calculator",
  "auto payment calculator",
  "vehicle payment calculator",
  "loan calculator",
  "auto loan calculator",
  "car loan calculator",
  "finance calculator",

  // Monthly Payment Terms
  "estimated monthly payment",
  "monthly payments",
  "your monthly payment",
  "payment estimate",
  "estimated payment",
  "payment amount",
  "payment options",

  // Loan & Finance Terms
  "loan amount",
  "finance amount",
  "amount financed",
  "loan term",
  "loan length",
  "finance term",
  "interest rate",
  "apr",
  "annual percentage rate",
  "finance rate",
  "down payment",
  "trade-in value",
  "trade allowance",

  // Lease Payments
  "lease payment",
  "monthly lease payment",
  "lease calculator",
  "estimate lease payment",
  "lease estimator",

  // Affordability Tools
  "can i afford",
  "affordability calculator",
  "budget calculator",
  "payment planning",
  "payment breakdown",

  // Dealer CTAs
  "calculate your payment",
  "estimate your payment",
  "customize payments",
  "view payment options",
  "get payment quote",
  "payment quote",

  // Common Labels
  "sales price",
  "vehicle price",
  "purchase price",
  "term months",
  "loan duration",
  "monthly cost",
  "estimated cost"
];
const SERVICE_PATHS = [
  "/service",
  "/service-center",
  "/service-department",
  "/auto-service",
  "/vehicle-service",
  "/car-service",

  "/schedule-service",
  "/schedule-auto-service",
  "/service-scheduler",
  "/book-service",
  "/book-appointment",
  "/service-appointment",
  "/schedule-appointment",

  "/maintenance",
  "/vehicle-maintenance",
  "/car-maintenance",
  "/preventative-maintenance",

  "/oil-change",
  "/tire-service",
  "/tire-center",
  "/brake-service",
  "/battery-service",
  "/wheel-alignment",

  "/repair",
  "/auto-repair",
  "/collision-center",
  "/body-shop",
  "/collision-repair",

  "/parts",
  "/parts-center",
  "/parts-department",
  "/order-parts",
  "/genuine-parts",
  "/oem-parts",
  "/accessories",

  "/service-specials",
  "/parts-specials",
  "/service-coupons",
  "/service-offers",

  "/express-service",
  "/quick-service",
  "/certified-service",

  "/service-financing",
  "/maintenance-plans",
  "/extended-warranty",

  "/recall-check",
  "/vehicle-recalls",
  "/service-faq",

  "/valet-service",
  "/pickup-and-delivery",
  "/service-hours"
];
const SERVICE_KEYWORDS = [
  // Service Scheduling
  "schedule service",
  "book service",
  "service appointment",
  "schedule appointment",
  "book appointment",
  "request service",
  "service scheduler",
  "service center",
  "service department",

  // Maintenance Services
  "oil change",
  "synthetic oil change",
  "tire rotation",
  "tire service",
  "wheel alignment",
  "brake service",
  "brake inspection",
  "battery replacement",
  "battery service",
  "multi-point inspection",
  "vehicle inspection",
  "maintenance service",
  "factory maintenance",
  "scheduled maintenance",

  // Repair Services
  "auto repair",
  "vehicle repair",
  "engine repair",
  "transmission service",
  "cooling system service",
  "air conditioning service",
  "ac repair",
  "diagnostic service",
  "check engine light",

  // Parts
  "oem parts",
  "genuine parts",
  "factory parts",
  "original equipment manufacturer",
  "parts department",
  "parts center",
  "order parts",
  "auto parts",
  "replacement parts",
  "vehicle accessories",

  // Collision & Body Shop
  "collision center",
  "collision repair",
  "body shop",
  "dent repair",
  "paint repair",
  "accident repair",

  // Service Offers
  "service specials",
  "service coupons",
  "service offers",
  "maintenance specials",
  "parts specials",
  "service discount",

  // Warranty
  "warranty repair",
  "extended warranty",
  "service contract",
  "recall service",
  "factory warranty",

  // Dealer CTAs
  "schedule your service",
  "contact service department",
  "certified technicians",
  "factory trained technicians",
  "service advisor",
  "service team",
  "vehicle care",

  // Common Dealer Services
  "pickup and delivery",
  "express service",
  "quick lube",
  "loaner vehicle",
  "complimentary inspection",
  "maintenance plan"
];

// --- Group S vocabularies (service centre / repair shop) --------------------
// SERVICE_PATHS/SERVICE_KEYWORDS above deliberately stay dealer-flavoured: a
// franchise store's service department trips them, which is why B4 alone was
// never allowed to mean "this is a service business". The lists below are the
// opposite — language a site only uses when servicing IS the business, not a
// department attached to a showroom.

// S1 — the site describes ITSELF as a garage / body shop / mechanic. These are
// self-descriptions ("we are an independent repair shop"), not service-menu
// items, so a dealership's service page does not match them.
const REPAIR_SHOP_KEYWORDS = [
  "auto repair shop", "automotive repair shop", "car repair shop", "repair shop",
  "auto body shop", "body shop", "collision center", "collision centre",
  "collision repair center", "collision repair centre", "accident repair centre",
  "independent garage", "auto garage", "car garage", "repair garage",
  "mobile mechanic", "local mechanic", "independent mechanic", "master mechanic",
  "auto mechanic", "car mechanic", "mechanic shop", "mechanical repairs",
  "automotive workshop", "repair workshop", "service garage",
  "smash repairs", "panel beater", "panel beating", "spray painting",
  "tyre shop", "tire shop", "tyre centre", "tire center", "muffler shop",
  "transmission shop", "engine rebuild", "engine rebuilding",
  "mot test", "mot testing", "smog check", "smog test", "emissions testing",
  "roadworthy certificate", "safety inspection", "pink slip",
];
const REPAIR_SHOP_PATHS = [
  "/auto-repair", "/car-repair", "/repairs", "/body-shop", "/bodyshop",
  "/collision", "/collision-center", "/collision-centre", "/panel-beating",
  "/smash-repairs", "/mechanic", "/mechanical", "/workshop", "/garage",
  "/mot", "/smog", "/roadworthy", "/emissions", "/diagnostics",
];

// S2 — an actual booking funnel, not a "call us to schedule" line. Service and
// repair convert through this (driver D2 in the matrix), so it is the strongest
// single positive signal for the two servicing types.
const BOOKING_SCHEDULER_KEYWORDS = [
  "book online", "book your service", "book an appointment", "book a service",
  "book now", "schedule online", "schedule your appointment", "online booking",
  "booking form", "request an appointment", "make an appointment",
  "choose a date", "select a date", "pick a time", "available times",
  "appointment request", "service booking", "book my car in", "get a quote online",
];
const BOOKING_SCHEDULER_PATHS = [
  "/book", "/booking", "/book-online", "/book-now", "/book-a-service",
  "/appointment", "/appointments", "/make-appointment", "/request-appointment",
  "/schedule", "/scheduler", "/online-booking",
];

// S3 — a published service menu with prices. The matrix rates pricing
// transparency Most Important for both servicing types precisely because a
// dealer service department almost never publishes flat pricing and an
// independent shop competes on it.
const SERVICE_MENU_KEYWORDS = [
  "service menu", "service pricing", "price list", "our prices", "pricing guide",
  "labour rate", "labor rate", "hourly rate", "flat rate pricing",
  "free quote", "free estimate", "instant quote", "get an estimate",
  "upfront pricing", "transparent pricing", "no hidden fees", "fixed price servicing",
  "capped price servicing", "logbook servicing", "log book service",
  "minor service", "major service", "interim service", "full service",
];

// S4 — trade accreditation. A garage has no OEM badge to borrow (driver D5),
// so third-party accreditation IS the trust mechanism. Deliberately split by
// market (US / UK / AU) because the matrix's country config already exists.
const TRADE_ACCREDITATION_KEYWORDS = [
  // US
  "ase certified", "ase-certified", "ase master", "national institute for automotive service excellence",
  "i-car", "i-car gold", "icar gold class", "napa autocare", "aaa approved auto repair",
  "bosch car service", "bosch service", "carquest", "technet professional",
  // UK / IE
  "good garage scheme", "motor codes", "the motor ombudsman", "imi accredited",
  "rmi approved", "trustmark approved", "vosa approved", "dvsa approved",
  // AU / NZ
  "vacc member", "mta member", "mta approved", "racv approved", "raa approved",
  "nrma approved", "aaaa member", "repco authorised", "capricorn member",
];

// S5 — tyres / parts retail, the other common servicing-business shape (fast-fit
// chains). Kept separate from the dealer parts-counter language in
// SERVICE_KEYWORDS so it can support a service verdict on its own.
// Every entry names a vehicle part or a vehicle-only fitting job — bare "spare
// parts" was deliberately left out because industrial and appliance suppliers
// use it verbatim, and this list has to be strong enough to anchor a verdict
// on its own (see STRONG_SERVICE_ANCHORS in the decision step).
const TYRE_PARTS_RETAIL_KEYWORDS = [
  "tyre fitting", "tire fitting", "wheel balancing", "puncture repair",
  "tyre pressure", "new tyres", "new tires", "tyre brands", "tire brands",
  "exhaust fitting", "battery fitting", "windscreen repair", "windshield repair",
  "auto parts store", "car parts", "aftermarket parts",
];

// S7 — named workshop OPERATIONS performed on a vehicle. This is the signal a
// pure servicing chain actually carries, and before it existed such a chain
// could not anchor a verdict at all: jiffylube.com (2,000+ locations) tripped
// only S6 + B4 and fell through to "unknown", i.e. was refused an audit
// outright. The vocabulary that identifies it best — "oil change", "wheel
// alignment", "tire rotation" — lived only in SERVICE_KEYWORDS, which feeds B4,
// and STEP 5 deliberately demotes B4 to padding because a DEALER's service
// department trips it too.
//
// Safe to anchor on, for a structural reason rather than a vocabulary one:
// STEP 5 is only reached once the dealer AND corporate tests have both failed,
// so by construction there is no own-inventory evidence here. A dealer saying
// "oil change" has already been classified as a dealer long before this point.
//
// Deliberately restricted to OPERATIONS (a job a technician performs), never
// part NAMES ("brake pads", "timing belt", "spark plugs") — an auto-parts
// e-commerce retailer sells the parts without servicing anything, and naming
// parts here would reclassify it as a service business. Generic inspection
// language ("vehicle inspection", "safety inspection") is left out for the same
// reason: an insurer uses it verbatim.
const SERVICE_WORK_KEYWORDS = [
  // Routine maintenance
  "oil change", "synthetic oil change", "quick lube", "lube service",
  "tire rotation", "tyre rotation", "wheel alignment", "wheel balancing",
  "tire installation", "tyre installation", "tire mounting", "flat tire repair",
  "coolant flush", "transmission flush", "multi-point inspection",
  // Diagnostics & repair
  "auto repair", "car repair", "vehicle repair", "automotive repair",
  "brake service", "brake repair", "brake inspection",
  "transmission service", "transmission repair",
  "engine repair", "engine diagnostics", "check engine light",
  "radiator repair", "exhaust repair", "muffler repair", "suspension repair",
  "air conditioning service", "ac recharge", "a/c recharge",
  "vehicle diagnostics", "car diagnostics", "auto diagnostics",
  // Body / collision
  "collision repair", "dent repair", "paintless dent repair", "accident repair",
  // Statutory testing (market-specific, same split as S4)
  "smog check", "emissions test", "mot test", "mot testing",
  // Fleet / plan servicing
  "fleet maintenance", "scheduled servicing", "logbook servicing",
];
// The same operations as NAV PATHS. A chain that puts each job behind its own
// landing page often never names it in homepage prose: bigotires.com links
// /oil-change, /tire-service and /wheel-alignment while its visible copy says
// none of those words, so a keyword-only S7 missed it entirely. Deliberately
// excludes the generic "/service" and "/repair" (already B4's job) — every
// entry here names a specific job done to a vehicle.
const SERVICE_WORK_PATHS = [
  "/oil-change", "/wheel-alignment", "/tire-rotation", "/tyre-rotation",
  "/brake-service", "/brake-repair", "/brakes", "/transmission-repair",
  "/engine-repair", "/engine-diagnostics", "/check-engine-light",
  "/tire-service", "/tyre-service", "/tire-repair", "/tyre-repair",
  "/exhaust-repair", "/muffler-repair", "/suspension-repair", "/radiator-repair",
  "/ac-service", "/air-conditioning-service", "/collision-repair",
  "/dent-repair", "/auto-repair", "/car-repair", "/vehicle-repair",
  "/smog-check", "/emissions-test", "/mot-test", "/fleet-maintenance",
];

// S6 — multi-location operator. The matrix's own split between columns 3 and 4
// is "service centre or CHAIN" versus "single-location garage", so this is the
// discriminator between them. Deliberately generic (not the dealer-locator
// vocabulary in C1, which is about finding OTHER companies' dealerships).
const MULTI_LOCATION_KEYWORDS = [
  "our locations", "all locations", "find a location", "find your nearest",
  "nearest branch", "our branches", "our centres", "our centers", "our stores",
  "store locator", "location finder", "branch finder", "centre finder",
  "select a location", "choose your location", "locations near you",
  // A chain's locator is as often phrased around a "store"/"shop" as a
  // "location" — midas.com (~1,000 franchises) carried none of the phrases
  // above and was therefore read as a SINGLE-location garage.
  "find a store", "find a shop", "find your store", "nearest store",
  "nearest location", "our shops", "shop locator", "book at your local",
];
const MULTI_LOCATION_PATHS = [
  "/locations", "/our-locations", "/branches", "/centres", "/centers",
  "/store-locator", "/find-a-location", "/find-us",
  // "/store" (singular) is midas.com's locator path. Safe to add now that
  // anyPath is segment-aware: it no longer also swallows "/stores-and-more",
  // and an online-merch "/store" on a single-location shop is a far rarer
  // shape than a chain's store finder.
  "/store", "/stores", "/store-finder", "/find-a-store", "/shops",
];

// --- Franchise vs independent discriminators -------------------------------
// Both are dealers; the matrix splits them on the manufacturer relationship,
// because that is what changes the parameter set (OEM boilerplate on VDPs, lease
// programmes and Reg-Z/Reg-M exposure, a real service department, brand halo).
// A franchise store says so explicitly and repeatedly — it is contractually
// required to — so explicit self-identification is the reliable signal here.
const FRANCHISE_KEYWORDS = [
  "authorized dealer", "authorised dealer", "factory authorized", "factory authorised",
  "official dealer", "official retailer", "authorized retailer", "authorised retailer",
  "franchise dealer", "franchised dealer", "new car dealer", "new vehicle dealer",
  "manufacturer certified", "factory certified", "certified by the manufacturer",
  "lease specials", "lease offers", "current lease", "lease deals", "apr financing",
  "factory incentives", "manufacturer rebates", "oem parts", "genuine parts",
  "factory trained technicians", "factory warranty", "recall service",
];

// The counterpart: language that only an independent lot uses. Buy-here-pay-here
// and "all makes and models" are the two most reliable — a franchise store is
// contractually a single-brand new-car retailer and never advertises either.
const INDEPENDENT_DEALER_KEYWORDS = [
  "buy here pay here", "buy-here-pay-here", "bhph", "in house financing",
  "in-house financing", "we finance", "no credit check", "bad credit",
  "subprime", "second chance financing", "credit rebuild",
  "all makes and models", "all makes", "quality used cars", "quality pre-owned",
  "used car lot", "used car dealer", "independent dealer", "family owned dealership",
  "wholesale prices", "cars under", "budget cars",
];

const CPO_PATHS = [
  "/certified-pre-owned",
  "/certified-used",
  "/pre-owned-certified",
  "/used-certified",
  "/certified-cpo",
  "/certified-manufacturer",
  "/factory-certified",
  "/certified-by-manufacturer",
  "/certified-preowned",
  "/certified-used-cars",
  "/cpo-vehicles",
  "/cpo-inventory",
  "/certified-inventory",

  // Brand-specific CPO paths
  "/toyota-certified",
  "/honda-certified",
  "/ford-certified",
  "/bmw-certified",
  "/mercedes-certified",
  "/lexus-certified",
  "/audi-certified",
  "/acura-certified",
  "/nissan-certified",
  "/subaru-certified",
  "/volkswagen-certified",
  "/chevrolet-certified",
  "/chevy-certified",
  "/hyundai-certified",
  "/kia-certified",
  "/mazda-certified",
  "/gmc-certified",
  "/buick-certified",
  "/jeep-certified",
  "/dodge-certified",
  "/ram-certified",
  "/cadillac-certified",
  "/chrysler-certified",
  "/volvo-certified",

  // CPO programs
  "/toyota-certified-pre-owned",
  "/honda-certified-pre-owned",
  "/ford-certified-pre-owned",
  "/bmw-certified-pre-owned",
  "/mercedes-benz-certified-pre-owned",
  "/lexus-certified-pre-owned",
  "/audi-certified-pre-owned",
  "/acura-certified-pre-owned",
  "/nissan-certified-pre-owned",
  "/subaru-certified-pre-owned",
  "/volkswagen-certified-pre-owned",
  "/chevrolet-certified-pre-owned",
  "/chevy-certified-pre-owned",
  "/hyundai-certified-pre-owned",
  "/kia-certified-pre-owned",
  "/mazda-certified-pre-owned",
  "/gmc-certified-pre-owned",
  "/buick-certified-pre-owned",
  "/jeep-certified-pre-owned",
  "/dodge-certified-pre-owned",
  "/ram-certified-pre-owned",
  "/cadillac-certified-pre-owned",
  "/chrysler-certified-pre-owned",
  "/volvo-certified-pre-owned",

  // CPO landing pages
  "/cpo-program",
  "/cpo-benefits",
  "/cpo-warranty",
  "/certified-advantage",
  "/certified-plus",
  "/certified-warranty-benefits",
  "/cpo-inspection",
  "/cpo-inspection-process",
  "/vehicle-certification",
  "certified pre-owned",
  "certified pre owned",
  "cpo",
  "manufacturer certified",
  "factory certified",
  "certified used",
  "certified vehicle",
  "certified inventory",

  // OEM Certification Terms
  "manufacturer-backed warranty",
  "factory-backed warranty",
  "manufacturer warranty",
  "factory warranty",
  "certified warranty",
  "extended certified warranty",

  // Inspection Terms
  "multi-point inspection",
  "vehicle inspection",
  "certification inspection",
  "quality inspection",
  "rigorous inspection",
  "factory inspection",
  "certified inspection",

  // Benefits
  "roadside assistance",
  "vehicle history report",
  "carfax vehicle history",
  "limited warranty",
  "powertrain warranty",
  "extended coverage",
  "warranty coverage",

  // Inventory Labels
  "certified inventory",
  "certified vehicles",
  "certified cars",
  "certified used cars",
  "certified pre-owned inventory",
  "certified pre-owned vehicles",
  "cpo inventory",
  "cpo vehicles",

  // Common OEM Programs
  "toyota certified",
  "ford blue advantage",
  "honda certified",
  "acura precision certified",
  "lexus certified",
  "bmw certified",
  "mercedes-benz certified",
  "audi certified",
  "volkswagen certified",
  "nissan certified",
  "hyundai certified",
  "kia certified",
  "subaru certified",
  "chevrolet certified",
  "gmc certified",
  "buick certified",
  "cadillac certified",

  // Dealer CTAs
  "shop certified vehicles",
  "browse certified inventory",
  "view cpo inventory",
  "find certified vehicles",
  "certified specials"

];
const CPO_KEYWORDS = [
  // Core CPO Terms
  "certified pre-owned",
  "certified pre owned",
  "cpo",
  "manufacturer certified",
  "factory certified",
  "certified used",
  "certified vehicle",
  "certified inventory",

  // OEM Certification Terms
  "manufacturer-backed warranty",
  "factory-backed warranty",
  "manufacturer warranty",
  "factory warranty",
  "certified warranty",
  "extended certified warranty",

  // Inspection Terms
  "multi-point inspection",
  "vehicle inspection",
  "certification inspection",
  "quality inspection",
  "rigorous inspection",
  "factory inspection",
  "certified inspection",

  // Benefits
  "roadside assistance",
  "vehicle history report",
  "carfax vehicle history",
  "limited warranty",
  "powertrain warranty",
  "extended coverage",
  "warranty coverage",

  // Inventory Labels
  "certified inventory",
  "certified vehicles",
  "certified cars",
  "certified used cars",
  "certified pre-owned inventory",
  "certified pre-owned vehicles",
  "cpo inventory",
  "cpo vehicles",

  // Common OEM Programs
  "toyota certified",
  "ford blue advantage",
  "honda certified",
  "acura precision certified",
  "lexus certified",
  "bmw certified",
  "mercedes-benz certified",
  "audi certified",
  "volkswagen certified",
  "nissan certified",
  "hyundai certified",
  "kia certified",
  "subaru certified",
  "chevrolet certified",
  "gmc certified",
  "buick certified",
  "cadillac certified",

  // Dealer CTAs
  "shop certified vehicles",
  "browse certified inventory",
  "view cpo inventory",
  "find certified vehicles",
  "certified specials"
];
const SPECIALS_PATHS = [
  // General Specials
  "/specials",
  "/special-offers",
  "/offers",
  "/promotions",
  "/dealer-specials",
  "/monthly-specials",

  // New Vehicle Specials
  "/new-specials",
  "/new-vehicle-specials",
  "/new-car-specials",
  "/new-offers",
  "/new-vehicle-offers",
  "/new-inventory-specials",

  // Used Vehicle Specials
  "/used-specials",
  "/used-vehicle-specials",
  "/used-car-specials",
  "/pre-owned-specials",
  "/certified-specials",
  "/cpo-specials",

  // Finance & Lease Specials
  "/finance-specials",
  "/lease-specials",
  "/lease-offers",
  "/finance-offers",
  "/apr-specials",
  "/financing-offers",

  // Service & Parts Specials
  "/service-specials",
  "/service-coupons",
  "/service-offers",
  "/parts-specials",
  "/parts-coupons",
  "/parts-offers",

  // Incentives & Rebates
  "/incentives",
  "/manufacturer-incentives",
  "/rebates",
  "/cash-back-offers",
  "/employee-pricing",

  // Clearance & Featured
  "/clearance",
  "/clearance-vehicles",
  "/featured-specials",
  "/featured-vehicles",
  "/manager-specials",
  "/hot-deals",
  "/best-deals",

  // OEM Programs
  "/military-discount",
  "/college-graduate-program",
  "/first-responder-offers",
  "/loyalty-offers",

  // Misc
  "/current-offers",
  "/vehicle-specials",
  "/inventory-specials",
  "/sales-event",
  "/limited-time-offers"
];
const SPECIALS_KEYWORDS = [
  // General Specials
  "specials",
  "dealer specials",
  "vehicle specials",
  "inventory specials",
  "special offers",
  "current offers",
  "limited time offer",
  "limited time offers",
  "promotional offer",
  "promotions",

  // New Vehicle Specials
  "new vehicle specials",
  "new car specials",
  "new inventory specials",
  "new vehicle offers",
  "new car offers",

  // Used Vehicle Specials
  "used vehicle specials",
  "used car specials",
  "pre-owned specials",
  "certified specials",
  "cpo specials",

  // Finance Specials
  "finance specials",
  "finance offer",
  "finance offers",
  "special financing",
  "low apr financing",
  "0% apr financing",
  "0% financing",
  "cash rebate",
  "finance incentive",

  // Lease Specials
  "lease specials",
  "lease offer",
  "lease offers",
  "lease deal",
  "lease deals",
  "low monthly lease",
  "lease incentive",

  // Manufacturer Incentives
  "manufacturer incentives",
  "factory incentives",
  "customer cash",
  "bonus cash",
  "conquest cash",
  "loyalty rebate",
  "military rebate",
  "college graduate rebate",
  "employee pricing",

  // Service Specials
  "service specials",
  "service coupons",
  "service offers",
  "oil change special",
  "maintenance specials",

  // Parts Specials
  "parts specials",
  "parts coupons",
  "parts offers",
  "accessory specials",

  // Sales Events
  "sales event",
  "clearance sale",
  "manager specials",
  "featured specials",
  "holiday sales event",
  "year-end sales event",
  "memorial day sale",
  "labor day sale",
  "black friday sale",

  // Dealer CTAs
  "view specials",
  "browse specials",
  "claim offer",
  "unlock offer",
  "see offer details",
  "save on your next vehicle"
];
const MANUFACTURER_DEALER_KEYWORDS = [
  // Generic Dealer Terms
  "authorized dealer",
  "authorized dealership",
  "franchise dealer",
  "franchise dealership",
  "official dealer",
  "certified dealer",
  "new vehicle dealer",
  "automotive dealership",

  // Toyota
  "toyota dealer",
  "toyota dealership",
  "toyota certified dealer",

  // Honda / Acura
  "honda dealer",
  "honda dealership",
  "acura dealer",
  "acura dealership",

  // Ford / Lincoln
  "ford dealer",
  "ford dealership",
  "lincoln dealer",
  "lincoln dealership",

  // GM Brands
  "chevrolet dealer",
  "chevrolet dealership",
  "chevy dealer",
  "chevy dealership",
  "gmc dealer",
  "gmc dealership",
  "buick dealer",
  "buick dealership",
  "cadillac dealer",
  "cadillac dealership",

  // Stellantis Brands
  "jeep dealer",
  "jeep dealership",
  "dodge dealer",
  "dodge dealership",
  "ram dealer",
  "ram dealership",
  "chrysler dealer",
  "chrysler dealership",

  // Nissan / Infiniti
  "nissan dealer",
  "nissan dealership",
  "infiniti dealer",
  "infiniti dealership",

  // Hyundai / Kia / Genesis
  "hyundai dealer",
  "hyundai dealership",
  "kia dealer",
  "kia dealership",
  "genesis dealer",
  "genesis dealership",

  // Mazda / Subaru / Mitsubishi
  "mazda dealer",
  "mazda dealership",
  "subaru dealer",
  "subaru dealership",
  "mitsubishi dealer",
  "mitsubishi dealership",

  // Volkswagen Group
  "volkswagen dealer",
  "volkswagen dealership",
  "vw dealer",
  "vw dealership",
  "audi dealer",
  "audi dealership",
  "porsche dealer",
  "porsche dealership",

  // BMW Group
  "bmw dealer",
  "bmw dealership",
  "mini dealer",
  "mini dealership",

  // Mercedes-Benz
  "mercedes-benz dealer",
  "mercedes-benz dealership",
  "mercedes dealer",
  "mercedes dealership",
  "smart dealer",

  // Toyota Luxury
  "lexus dealer",
  "lexus dealership",

  // Volvo
  "volvo dealer",
  "volvo dealership",

  // Jaguar / Land Rover
  "jaguar dealer",
  "jaguar dealership",
  "land rover dealer",
  "land rover dealership",
  "range rover dealer",

  // Luxury Brands
  "bentley dealer",
  "rolls-royce dealer",
  "maserati dealer",
  "ferrari dealer",
  "lamborghini dealer",
  "aston martin dealer",
  "mclaren dealer",

  // EV Brands
  "rivian dealer",
  "lucid dealer",
  "electric vehicle dealer",
  "ev dealer",

  // Dealer Page CTAs
  "shop new vehicles",
  "shop used vehicles",
  "browse inventory",
  "visit our dealership",
  "new vehicle inventory",
  "used vehicle inventory",

  // RV / towable / powersports / marine dealer self-descriptions. Gives B7 a
  // way to fire (a second automotive anchor) for recreational-vehicle dealers,
  // whose brands never appear in the car-only lists above. Every phrase names
  // the dealer's own franchise/segment explicitly.
  "rv dealer",
  "rv dealership",
  "rv sales",
  "recreational vehicle dealer",
  "motorhome dealer",
  "travel trailer dealer",
  "camper dealer",
  "powersports dealer",
  "powersports dealership",
  "motorcycle dealer",
  "motorcycle dealership",
  "boat dealer",
  "marine dealer",
  "atv dealer",
  "utv dealer"
];

// --- Group C signal vocabularies (corporate / OEM sites) --------------------
// Unlike Group B, every Group C signal is already automotive/dealer-network
// specific on its own — none of these overlap with generic e-commerce language —
// so no separate "anchor" requirement is needed for the corporate verdict.
// NOTE: deliberately EXCLUDES generic store-finder language ("/find-a-store",
// "/store-locator", "find a store", "find a retailer") — every non-automotive
// retail chain (Target, Starbucks, Home Depot, …) has a store locator too, and
// testing against real sites showed those exact terms false-positiving C1 into
// firing for them. Every entry here contains the word "dealer" explicitly.
const DEALER_LOCATOR_PATHS = [
  "/find-a-dealer", "/find-dealer", "/dealer-locator", "/locate-a-dealer",
  "/find-a-dealership", "/dealers", "/dealer-locations", "/locations/dealers",
];
const DEALER_LOCATOR_KEYWORDS = [
  "find a dealer", "find a dealer near you", "find a dealer near me",
  "locate a dealer", "dealer locator", "find your nearest dealer",
  "search dealers", "dealer near you",
];

// NOTE: "/build-your-own" and "/design-yours" paths, and "build your own"/
// "design your own" keywords, were removed — testing against real non-
// automotive sites showed these false-positive on ANY build-your-own product
// customizer (confirmed on chipotle.com's burrito/bowl builder). "build and
// price"/"build & price"/"configure your [vehicle]" are distinctly automotive
// dealer/configurator phrasing and don't have that problem.
const CONFIGURATOR_PATHS = [
  "/build-and-price", "/build-price", "/configurator",
  "/configure", "/build-and-price-your",
  // Bare "/build" is the per-model configurator path on truck OEMs
  // (macktrucks.com ships /trucks/anthem/build/, /trucks/granite/build/ …) and
  // was the one Group C signal it had, leaving it a single signal short of a
  // corporate verdict. This does NOT reopen the chipotle.com "build your own"
  // hole the note above describes: anyPath is segment-aware now, so "/build"
  // matches only a complete "/build" segment and never "/build-your-own".
  "/build",
];
const CONFIGURATOR_KEYWORDS = [
  "build and price", "build & price", "configure your",
  "customize your vehicle", "build & price your",
];

const PRESS_PATHS = [
  "/newsroom", "/press", "/press-room", "/press-releases", "/media-center",
  "/media-room", "/corporate-news",
];
const PRESS_KEYWORDS = [
  "newsroom", "press room", "press release", "press releases", "media center",
  "media centre", "for immediate release", "corporate news",
];

// C5 — Investor relations (split out from Press: a large corporate/OEM parent
// almost always has this even when it has no consumer-facing "newsroom" copy).
const INVESTOR_RELATIONS_PATHS = [
  "/investor-relations", "/investors", "/ir", "/shareholders", "/annual-report",
];
const INVESTOR_RELATIONS_KEYWORDS = [
  "investor relations", "shareholder", "shareholders", "annual report",
  "financial results", "ir library", "ir information", "earnings release",
  "annual general meeting", "annual meeting",
];

// C6 — Sustainability / CSR / ESG reporting — a hallmark of a large corporate
// parent, essentially never present on a single-location dealership's site.
const SUSTAINABILITY_PATHS = [
  "/sustainability", "/csr", "/esg", "/corporate-responsibility", "/environment",
];
const SUSTAINABILITY_KEYWORDS = [
  "sustainability", "corporate social responsibility", "csr report", "esg",
  "sustainability report", "environmental responsibility", "carbon neutral", "net zero",
];

// C7 — Corporate philosophy / vision / governance pages.
const CORPORATE_PHILOSOPHY_PATHS = [
  "/philosophy", "/our-philosophy", "/corporate-governance", "/governance", "/vision",
];
const CORPORATE_PHILOSOPHY_KEYWORDS = [
  "corporate philosophy", "our philosophy", "philosophy and vision", "corporate governance",
  "code of conduct", "management philosophy", "mission and values",
];

// C8 — Multi-region/country site selector — a hallmark of a multinational
// corporate parent (regional dealer sites don't have "choose your country").
const GLOBAL_SITE_SELECTOR_KEYWORDS = [
  "global sites", "regional sites", "select your region", "select your country",
  "worldwide sites", "product site selector", "choose your region", "choose your country",
  "select your location",
];

// General vehicle-industry vocabulary (NOT dealer-network-specific). Group C's
// non-automotive-anchor signals (press, investor relations, sustainability,
// philosophy, site selector) are hallmarks of ANY large multinational — a bank
// or tech company has all of them too. Without also seeing evidence the
// business is actually automotive/vehicle-related, those signals alone would
// misclassify an unrelated Fortune-500 site as an automotive "corporate" site.
const AUTOMOTIVE_CONTEXT_KEYWORDS = [
  "automotive", "automobile", "automobiles", "vehicle", "vehicles",
  "motorcycle", "motorcycles", "motorbike", "motorbikes", "scooter", "scooters",
  "moped", "mopeds", "atv", "atvs", "side-by-side", "personal watercraft",
  "outboard motor", "outboard engine", "marine engine", "car manufacturer",
  "car maker", "auto manufacturer", "automaker", "mobility solutions",
  // NOTE: bare "electric vehicle" was removed — a big-box retailer selling EV
  // home chargers (a real, common product line at e.g. Home Depot) mentions
  // "electric vehicle" in that context without being an automotive company.
  // Require the phrase to be about the vehicles themselves, not accessories.
  "electric vehicle lineup", "electric vehicle models", "all-electric lineup",
  "powersports", "recreational vehicle",
  // Added after making automotive context REQUIRED (not just a fallback) for
  // every corporate verdict exposed a real coverage gap: truck OEMs
  // (Freightliner, Peterbilt) and ultra-luxury car brands (Ferrari, Aston
  // Martin) don't necessarily say "vehicle"/"automotive" at all — they say
  // "truck"/"trucks" or bare "car"/"sports car"/"supercar". Bare "car" was
  // previously left out over collision-risk concerns, but that risk is now
  // covered by the word-boundary fix to anyKeyword() (no more "cart"/"care"
  // substring matches) plus the fact that hasAutomotiveContext alone was
  // never sufficient to begin with — it always needs an anchor or rich
  // commerce signals alongside it.
  "truck", "trucks", "semi truck", "semi-truck", "commercial vehicle", "commercial vehicles",
  "car", "cars", "supercar", "supercars", "sports car", "sports cars",
];

// Corporate-facing dealer-NETWORK language ("we operate a network of dealers"),
// distinct from MANUFACTURER_DEALER_KEYWORDS (a dealer describing itself, e.g.
// "toyota dealer" on its own homepage).
const DEALER_NETWORK_KEYWORDS = [
  "find a dealer", "our dealer network", "authorized dealers near you",
  "become a dealer", "dealer inquiries", "dealer network", "our dealers",
  "authorized dealer network", "become an authorized dealer", "dealer partners",
];

// VIN: 17 chars, excludes I/O/Q. Anchored to a VIN label to avoid false positives.
// B9 — the site states, in its own <title>/<h1>, that it sells vehicles. This
// is the single most direct statement a dealer makes about itself, and it was
// going entirely unread: byrider.com is titled "Used Cars, Trucks, SUVs and
// Vans for Sale – Buy and Finance | Byrider" and still failed the dealer test,
// because its homepage carries no VIN, no listing fields and no dealer-platform
// script — all of that lives behind /inventory — so the only signals left were
// generic (finance, payment calculator, CPO) and none of them anchor.
//
// Precision comes from requiring a VEHICLE noun next to a SALES word in a
// heading. Two guards keep it honest:
//   • the noun list is vehicles only — lesschwab.com's "Tires and Wheels for
//     Sale" and garmin.com's product titles do not match;
//   • it is a Group B anchor, never a GENUINE_DEALER_ANCHOR, so it still needs
//     the full 3 signals and still loses to a strong corporate signature the
//     same way the other B-signals do (an OEM titled "…cars for sale" would
//     resolve through the corporate override, not around it).
// Marketplaces that would match (cars.com, autotrader) never reach this code —
// STEP 1's domain disqualifiers retire them first.
const VEHICLE_SALES_HEADLINE_RE = new RegExp(
  "\\b(?:new|used|pre-?owned|certified)?\\s*" +
  "(?:cars?|vehicles?|trucks?|suvs?|vans?|motorcycles?|rvs?)\\s+" +
  "(?:for\\s+sale|dealer(?:ship)?s?)\\b" +
  "|\\b(?:car|auto|automobile|truck|vehicle|motorcycle)\\s+dealer(?:ship)?s?\\b" +
  "|\\bdealership\\b",
  "i"
);

// D5 — the business names itself an INSURER in its own headings. Motor insurers
// are the most persistent false positive in this whole file, and for a real
// reason: they legitimately talk about vehicles, approved repairers, collision
// repair, claims booking and parts, so they accumulate Group S evidence without
// ever repairing or selling anything. geico.com reached a SERVICE verdict off
// "Auto Repair Xpress" (S7) plus a claims scheduler (S2); progressive.com had
// already done the same through a different route.
//
// Their own <title>/<h1> settles it — "An Insurance Company You Can Rely On",
// "State Farm® | An Insurance Company Valued For Over 100 Years", "Get an
// Insurance Quote" — while no dealer or garage in the corpus describes itself
// that way (they say "Dealer", "Cars for Sale", "Auto Repair & Service"). The
// check requires the insurance word to sit in a HEADING, not in body copy, so a
// dealership's F&I page or a garage's "we bill your insurer" line is unaffected.
const INSURANCE_HEADLINE_RE = /\b(?:insurance|insurer|assurance)\s+(?:company|companies|quote|quotes|agency|agent|agents|group|services)\b|\b(?:auto|car|vehicle|motor|home|life|health)\s+insurance\b|\binsurance\s+(?:for|from)\b/i;

const VIN_LABELLED_RE = /\b(?:vin|vehicle\s+identification\s+number)\b\s*[:#]*\s*([A-HJ-NPR-Z0-9]{17})\b/i;
// Strict standalone VIN (uppercase, must mix letters and digits).
const VIN_STANDALONE_RE = /\b(?=[A-HJ-NPR-Z0-9]{17}\b)(?=[A-HJ-NPR-Z]*[0-9])(?=[0-9]*[A-HJ-NPR-Z])[A-HJ-NPR-Z0-9]{17}\b/;

// --- helpers ----------------------------------------------------------------
const domainMatches = (hostname, list) =>
  list.some((d) => {
    const clean = d.replace(/\s+/g, "");
    return hostname === clean || hostname.endsWith("." + clean);
  });

// Word-boundary matching, not bare substring — a naive .includes() lets a
// short/ambiguous keyword like "atv" match inside unrelated text ("latvija",
// or "eat" + "vows" losing its space during whitespace collapse and becoming
// "eatvows"). Confirmed false-positive source on hp.com (matched "atv" inside
// "Latvia" in a country picker) and nytimes.com (matched inside a
// concatenation artifact). \b treats hyphens/spaces/punctuation as boundaries
// already, so multi-word phrases like "trade-in value" are unaffected.
const keywordCache = new Map();
const anyKeyword = (text, keywords) =>
  keywords.some((k) => {
    let re = keywordCache.get(k);
    if (!re) {
      re = new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      keywordCache.set(k, re);
    }
    return re.test(text);
  });
// Path tokens need the same boundary discipline anyKeyword got, for the same
// reason: a bare .includes() lets a short token match a DIFFERENT, longer path
// segment that merely starts with it. Confirmed false positives, each of which
// produced a wrong verdict on a real site:
//   "/new"   matched "/media-center/blog/categories/news/"  (a repair-only
//            franchise scored as a DEALER — A2 fired on a blog link)
//   "/fleet" matched "/our-services/fleet-services/"        (same site)
//   "/mot"   matched "https://www.progressive.com/motorcycle/" (a car INSURER
//            scored as a repair shop — the token is the UK MOT test)
// A token therefore has to end where a path segment really ends: a slash, a
// query/fragment/extension delimiter, whitespace (hrefs are space-joined into
// one haystack) or end of string. A following letter, digit, hyphen or
// underscore means we are inside a longer, different word.
//
// A pure hard boundary is very slightly TOO strict, though: real sites hang
// automotive nouns off these tokens in combinations no list can enumerate, and
// hgreglux.com's genuine SRP at "/used-car" (singular) stopped matching "/used"
// and lost its A2 anchor. So a token may also be followed by a short run of
// hyphenated AUTOMOTIVE nouns before the boundary. That readmits "/used-car"
// and "/new-vehicle-search" while still rejecting "/fleet-services" and
// "/news" — the distinction being whether what follows names a vehicle or
// names a different business entirely.
const PATH_NOUN_TAIL = "(?:-(?:car|cars|vehicle|vehicles|truck|trucks|van|vans|suv|suvs|inventory|stock|listing|listings|search|results))*";
const pathCache = new Map();
const anyPath = (haystack, paths) =>
  paths.some((p) => {
    let re = pathCache.get(p);
    if (!re) {
      re = new RegExp(`${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}${PATH_NOUN_TAIL}(?=[/?#.]|\\s|$)`, "i");
      pathCache.set(p, re);
    }
    return re.test(haystack);
  });

// Scan ONE page's DOM for Group A/B/C signals. Pulled out of detectSiteType so
// it can be called once for the homepage and again for any extra "probe" pages
// (see extraPages below) — dealer signals like VIN/stock# almost always live on
// a VDP/SRP subpage, not the homepage, so a homepage-only scan under-detects.
function collectPageSignals(url, $) {
  let rawHtml = "";
  try { rawHtml = ($ ? $.html() : "") || ""; } catch (_) { rawHtml = ""; }
  const lowerHtml = rawHtml.toLowerCase();

  let urlPath = "";
  try { urlPath = (new URL(url).pathname || "").toLowerCase(); } catch (_) { /* malformed url */ }

  // Visible text only (strip scripts/styles) — used for text/keyword signals.
  let visibleText = "";
  try {
    const $body = $("body").clone();
    $body.find("script, style, noscript, template").remove();
    visibleText = ($body.text() || "").replace(/\s+/g, " ").toLowerCase();
  } catch (_) {
    visibleText = lowerHtml;
  }

  // Links / form actions (paths) and script sources (resource hosts).
  //
  // Reduced to PATHNAMES, not whole hrefs. These vocabularies are path lists,
  // and leaving the scheme+host in let a token match inside a HOSTNAME:
  // "https://shops.start2finish.app/" — a third-party booking widget — matched
  // "/shops" and marked a single-location body shop as a multi-location chain.
  // Same class of error as the substring bug above, one level up.
  //
  // ownPathHaystack additionally drops CROSS-ORIGIN links. Most signals should
  // keep counting those (a dealer's inventory legitimately lives on a platform
  // domain), but a claim about the SHAPE of this business must not be read off
  // somebody else's site: echopark.com, which sells used cars only, links its
  // parent group's "sonicautomotive.com/new-inventory/" and was classified a
  // FRANCHISE off that one href.
  const hrefs = [];
  const ownHrefs = [];
  let ownOrigin = "";
  try { ownOrigin = new URL(url).origin.toLowerCase(); } catch (_) { /* malformed url */ }
  try {
    $("a[href], link[href], form[action]").each((_, el) => {
      const raw = ($(el).attr("href") || $(el).attr("action") || "").trim();
      if (!raw) return;
      let path = raw.toLowerCase();
      let sameOrigin = !/^[a-z][a-z0-9+.-]*:|^\/\//i.test(raw);   // relative => same origin
      try {
        const abs = new URL(raw, url || undefined);
        path = (abs.pathname + abs.search).toLowerCase();
        sameOrigin = abs.origin.toLowerCase() === ownOrigin;
      } catch (_) { /* unparseable (mailto:, tel:, javascript:) — keep raw */ }
      hrefs.push(path);
      if (sameOrigin) ownHrefs.push(path);
    });
  } catch (_) { /* ignore */ }
  const pathHaystack = (urlPath + " " + hrefs.join(" ")).toLowerCase();
  const ownPathHaystack = (urlPath + " " + ownHrefs.join(" ")).toLowerCase();

  const scriptResources = [];
  try {
    $("script[src], link[href]").each((_, el) => {
      const v = ($(el).attr("src") || $(el).attr("href") || "").toLowerCase();
      if (v) scriptResources.push(v);
    });
  } catch (_) { /* ignore */ }
  const resourceHaystack = (scriptResources.join(" ") + " " + lowerHtml).toLowerCase();

  // JSON-LD + microdata @type extraction.
  const schemaTypes = [];
  const schemaProps = [];
  try {
    $('script[type="application/ld+json"]').each((_, el) => {
      const txt = $(el).contents().text();
      if (!txt) return;
      try {
        const collect = (node) => {
          if (!node || typeof node !== "object") return;
          if (Array.isArray(node)) return node.forEach(collect);
          if (node["@type"]) {
            [].concat(node["@type"]).forEach((t) => schemaTypes.push(String(t).toLowerCase()));
          }
          Object.keys(node).forEach((k) => {
            schemaProps.push(k.toLowerCase());
            if (typeof node[k] === "object") collect(node[k]);
          });
        };
        collect(JSON.parse(txt));
      } catch (_) { /* malformed JSON-LD — skip */ }
    });
    $("[itemtype]").each((_, el) => {
      const t = ($(el).attr("itemtype") || "").toLowerCase();
      if (t) schemaTypes.push(t);
    });
  } catch (_) { /* ignore */ }

  // ---- GROUP A (any ONE confirms) ----
  const groupA = [];

  // A1 — VIN number
  const labelledVin = VIN_LABELLED_RE.test(rawHtml);
  const standaloneVin = VIN_STANDALONE_RE.test($("body").text() || "") && /\bvin\b/i.test(visibleText);
  if (labelledVin || standaloneVin) groupA.push("A1 - VIN Detected");

  // A2 — live vehicle inventory listing (inventory path + listing fields)
  // Listing fields must be GENUINELY automotive — generic retail words like
  // "price", "year", "make", "model", "new", "features" appear on any shop and
  // caused false positives (e.g. an e-commerce homepage with a "/new" link).
  // We require a strong, vehicle-specific field instead.
  const hasInventoryPath = anyPath(pathHaystack, INVENTORY_PATHS);
  const hasListingFields = anyKeyword(visibleText, STRONG_LISTING_FIELD_KEYWORDS) || labelledVin || standaloneVin;
  if (hasInventoryPath && hasListingFields) groupA.push("A2 - Inventory Listing");

  // A3 — dealer platform scripts (self-confirming)
  if (DEALER_PLATFORM_HOSTS.some((h) => resourceHaystack.includes(h.replace(/\s+/g, "")))) {
    groupA.push("A3 - Dealer Platform Script");
  }

  // A4 — automotive vehicle schema
  const hasVehicleType = schemaTypes.some((t) => /(^|\/)(car|vehicle)$/.test(t) || t.endsWith("/car") || t.endsWith("/vehicle") || t === "car" || t === "vehicle");
  const hasVehicleProps = ["vehicleengine", "mileagefromodometer", "vehicletransmission", "fueltype"]
    .some((p) => schemaProps.includes(p));
  if (hasVehicleType && hasVehicleProps) groupA.push("A4 - Vehicle Schema");

  // A5 — trade-in valuation tool
  if (anyPath(pathHaystack, TRADE_IN_PATHS) || anyKeyword(visibleText, TRADE_IN_KEYWORDS)) {
    groupA.push("A5 - Trade-In Tool");
  }

  // A6 — finance / credit application
  if (anyPath(pathHaystack, FINANCE_PATHS) || anyKeyword(visibleText, FINANCE_KEYWORDS)) {
    groupA.push("A6 - Finance/Credit Application");
  }

  // ---- GROUP B (supporting signals) ----
  const groupB = [];

  // B1 — test drive CTA
  if (anyKeyword(visibleText, TEST_DRIVE_KEYWORDS)) groupB.push("B1 - Test Drive CTA");

  // B2 — new AND used inventory separation in navigation. Own pages only: this
  // is the heaviest input to the franchise-vs-independent split (selling NEW
  // requires a franchise), so a link to somebody else's new-car inventory is
  // exactly the wrong evidence — see ownPathHaystack above.
  const hasNew = /\/new-(inventory|vehicles|cars)/.test(ownPathHaystack) || /\bnew (inventory|vehicles)\b/.test(visibleText);
  const hasUsed = /\/(used-(inventory|vehicles|cars)|pre-owned)/.test(ownPathHaystack) || /\b(used (inventory|vehicles)|pre-owned)\b/.test(visibleText);
  if (hasNew && hasUsed) groupB.push("B2 - New/Used Separation");

  // B3 — payment calculator
  if (anyKeyword(visibleText, PAYMENT_KEYWORDS)) groupB.push("B3 - Payment Calculator");

  // B4 — service scheduling
  if (anyPath(pathHaystack, SERVICE_PATHS) || anyKeyword(visibleText, SERVICE_KEYWORDS)) groupB.push("B4 - Service Scheduling");

  // B5 — certified pre-owned
  if (anyKeyword(visibleText, CPO_KEYWORDS)) groupB.push("B5 - Certified Pre-Owned");

  // B9 — the page's own headings say it sells vehicles. Title + h1 only: the
  // same words buried in body copy ("we buy used cars") are far weaker, and
  // restricting to headings is what keeps this from firing on every blog post.
  let headline = "";
  try {
    headline = [$("title").first().text(), ...$("h1").map((_, el) => $(el).text()).get()].join(" ").replace(/\s+/g, " ");
  } catch (_) { /* ignore */ }
  if (VEHICLE_SALES_HEADLINE_RE.test(headline)) groupB.push("B9 - Vehicle Sales Declaration");
  const declaresInsurance = INSURANCE_HEADLINE_RE.test(headline);

  // B6 — dealer specials pages
  if (anyPath(pathHaystack, SPECIALS_PATHS) || anyKeyword(visibleText, SPECIALS_KEYWORDS)) groupB.push("B6 - Dealer Specials");

  // B7 — manufacturer dealer keyword
  if (anyKeyword(visibleText, MANUFACTURER_DEALER_KEYWORDS)) groupB.push("B7 - Manufacturer Dealer Keyword");

  // B8 — inventory API requests (approximated from inline/script references)
  if (resourceHaystack.includes("dealerinventory") || (lowerHtml.includes("stocknumber") && lowerHtml.includes("msrp"))) {
    groupB.push("B8 - Inventory API");
  }

  // ---- GROUP C (corporate / OEM signals) ----
  // C1/C2/C4 are automotive-specific on their own (an unrelated company would
  // never have a "find a dealer" tool or "dealer network"). C3/C5-C8 are
  // hallmarks of ANY large multinational (a bank has investor relations and a
  // sustainability report too) — see hasAutomotiveContext below, which the
  // decision step requires alongside them so an unrelated big company can't
  // score as automotive "corporate" just from generic corporate-site scaffolding.
  const groupC = [];
  if (anyPath(pathHaystack, DEALER_LOCATOR_PATHS) || anyKeyword(visibleText, DEALER_LOCATOR_KEYWORDS)) {
    groupC.push("C1 - Dealer Locator Tool");
  }
  if (anyPath(pathHaystack, CONFIGURATOR_PATHS) || anyKeyword(visibleText, CONFIGURATOR_KEYWORDS)) {
    groupC.push("C2 - Build & Price Configurator");
  }
  if (anyPath(pathHaystack, PRESS_PATHS) || anyKeyword(visibleText, PRESS_KEYWORDS)) {
    groupC.push("C3 - Press/Newsroom");
  }
  if (anyKeyword(visibleText, DEALER_NETWORK_KEYWORDS)) {
    groupC.push("C4 - Dealer Network Language");
  }
  if (anyPath(pathHaystack, INVESTOR_RELATIONS_PATHS) || anyKeyword(visibleText, INVESTOR_RELATIONS_KEYWORDS)) {
    groupC.push("C5 - Investor Relations");
  }
  if (anyPath(pathHaystack, SUSTAINABILITY_PATHS) || anyKeyword(visibleText, SUSTAINABILITY_KEYWORDS)) {
    groupC.push("C6 - Sustainability/CSR");
  }
  if (anyPath(pathHaystack, CORPORATE_PHILOSOPHY_PATHS) || anyKeyword(visibleText, CORPORATE_PHILOSOPHY_KEYWORDS)) {
    groupC.push("C7 - Corporate Philosophy/Governance");
  }
  if (anyKeyword(visibleText, GLOBAL_SITE_SELECTOR_KEYWORDS)) {
    groupC.push("C8 - Global/Regional Site Selector");
  }

  // ---- GROUP S (service centre / repair shop signals) ----
  // These describe a business whose product is LABOUR, not vehicles. A dealer's
  // service department trips B4 but not these — S1 is self-description, S4 is
  // third-party accreditation a franchise store has no need of, and S3 is
  // published flat pricing a dealer service department almost never shows.
  const groupS = [];
  if (anyPath(pathHaystack, REPAIR_SHOP_PATHS) || anyKeyword(visibleText, REPAIR_SHOP_KEYWORDS)) {
    groupS.push("S1 - Repair Shop Self-Description");
  }
  if (anyPath(pathHaystack, BOOKING_SCHEDULER_PATHS) || anyKeyword(visibleText, BOOKING_SCHEDULER_KEYWORDS)) {
    groupS.push("S2 - Booking Scheduler");
  }
  if (anyKeyword(visibleText, SERVICE_MENU_KEYWORDS)) {
    groupS.push("S3 - Published Service Menu/Pricing");
  }
  if (anyKeyword(visibleText, TRADE_ACCREDITATION_KEYWORDS)) {
    groupS.push("S4 - Trade Accreditation");
  }
  if (anyKeyword(visibleText, TYRE_PARTS_RETAIL_KEYWORDS)) {
    groupS.push("S5 - Tyre/Parts Retail");
  }
  // Own pages only, for the same reason as B2: S6 is the chain-vs-single-shop
  // discriminator, and a third-party booking or review widget's URL says
  // nothing about how many premises this business has.
  if (anyPath(ownPathHaystack, MULTI_LOCATION_PATHS) || anyKeyword(visibleText, MULTI_LOCATION_KEYWORDS)) {
    groupS.push("S6 - Multi-Location Operator");
  }
  if (anyPath(pathHaystack, SERVICE_WORK_PATHS) || anyKeyword(visibleText, SERVICE_WORK_KEYWORDS)) {
    groupS.push("S7 - Automotive Service Work");
  }

  // --- Franchise vs independent discriminators (only consulted once the site
  // has already been confirmed as a dealer — never used to confirm one). ---
  const hasFranchiseLanguage = anyKeyword(visibleText, FRANCHISE_KEYWORDS);
  const hasIndependentLanguage = anyKeyword(visibleText, INDEPENDENT_DEALER_KEYWORDS);

  // A SINGLE incidental mention of "automotive"/"vehicle" is not proof this
  // company's core business is vehicles. Two tiers, in decreasing order of
  // reliability:
  //   hasStrongAutomotiveContext — the page's own <title> names it. The most
  //     reliable available signal (confirmed on rivian.com: "Rivian: Electric
  //     Vehicles Designed For Adventure"); a company rarely titles its
  //     homepage after a secondary business line.
  //   hasAutomotiveContext (weak) — title OR 2+ distinct keyword phrases in
  //     the body. NOT reliable enough on its own to confirm a corporate
  //     verdict — proven at scale that total/distinct keyword frequency
  //     cannot cleanly separate a real automotive company from an adjacent
  //     one: Philips' "Automotive Lighting" product-line page repeats
  //     "automotive" (10x) MORE than Ferrari's marketing copy repeats "car"
  //     (12 total occurrences of car/cars) — Philips isn't an automotive
  //     company; Ferrari obviously is. This weak tier is only ever trusted
  //     alongside independently-rich vehicle-commerce evidence elsewhere
  //     (see hasRichCommerceSignals / corporateQualifies below), never alone.
  let pageTitle = "";
  try { pageTitle = ($("title").first().text() || "").toLowerCase(); } catch (_) { /* ignore */ }
  const hasStrongAutomotiveContext = anyKeyword(pageTitle, AUTOMOTIVE_CONTEXT_KEYWORDS);
  const automotiveContextHits = AUTOMOTIVE_CONTEXT_KEYWORDS.filter((k) => anyKeyword(visibleText, [k]));
  const hasAutomotiveContext = hasStrongAutomotiveContext || automotiveContextHits.length >= 2;

  return {
    groupA, groupB, groupC, groupS,
    hasInventoryPath, hasAutomotiveContext, hasStrongAutomotiveContext,
    hasFranchiseLanguage, hasIndependentLanguage, declaresInsurance,
  };
}

/**
 * Classify a scraped website as a dealer, corporate/OEM, or unknown site.
 *
 * @param {object} opts
 * @param {string} opts.url       - the audited URL
 * @param {object} opts.$         - cheerio instance loaded with the page HTML
 * @param {object} [opts.page]    - playwright page (optional, for network signals)
 * @param {object} [opts.response]- navigation response (optional)
 * @param {{url: string, $: object}[]} [opts.extraPages] - additional pre-fetched
 *   pages (e.g. a likely inventory or dealer-locator page found in the homepage's
 *   own nav) whose signals are merged with the homepage's before deciding. Dealer
 *   evidence (VIN/stock#/inventory listings) almost always lives on a VDP/SRP
 *   subpage rather than the homepage, so a homepage-only scan under-detects real
 *   dealer sites; these extra pages let the caller top up the evidence pool
 *   without this function needing to know how to fetch or discover them itself.
 * @returns {Promise<{siteType: 'dealer'|'service'|'corporate'|'unknown', siteSubType: 'franchise'|'independent'|'service'|'repair'|'corporate'|null, inconclusive: boolean, confidence: number, detectedBy: string[], reason: string, report: string}>}
 */
export async function detectSiteType({ url, $, page, response, statusCode, extraPages }) {
  let hostname = "";
  try { hostname = new URL(url).hostname.replace(/^www\./, "").toLowerCase(); } catch (_) { /* malformed url */ }

  // =========================================================================
  // STEP 1 — DISQUALIFIERS (always processed first, homepage domain only)
  // =========================================================================
  // These read the HOSTNAME only, so they are deliberately evaluated BEFORE the
  // inaccessible/challenge-page checks below: a listed domain's verdict does not
  // depend on the page body, and running the content checks first meant a
  // WAF-fronted listed domain never reached its own disqualifier. Measured:
  // cars.com is on MARKETPLACE_DOMAINS but was challenged first, so it burned a
  // full stealth-browser escalation (~15s) to arrive at the same rejection its
  // hostname settles in microseconds.
  //
  // D1 — a known OEM brand domain is definitionally a corporate/manufacturer
  // site, not a dealer. High-confidence fast path — no signal scoring needed.
  if (domainMatches(hostname, OEM_DOMAINS)) {
    return corporate(url, [`D1 - OEM Brand Domain (${hostname})`], `D1 — OEM brand website (${hostname})`, 0.95);
  }
  if (domainMatches(hostname, MARKETPLACE_DOMAINS)) {
    return unknownType(url, `D2 — Automotive marketplace / aggregator (${hostname})`);
  }
  if (domainMatches(hostname, MEDIA_DOMAINS)) {
    return unknownType(url, `D3 — Automotive media / review publication (${hostname})`);
  }

  // Rule #7 — inaccessible / no usable data. This is INCONCLUSIVE (we couldn't
  // evaluate), NOT a confident classification — the caller escalates to a
  // stealth browser and, if that also fails, the audit is refused.
  let rawHtml = "";
  try { rawHtml = ($ ? $.html() : "") || ""; } catch (_) { rawHtml = ""; }
  if (!$ || rawHtml.replace(/\s/g, "").length < 60) {
    return unknownType(url, "SITE INACCESSIBLE — INSUFFICIENT DATA TO EVALUATE", true);
  }

  // Bot-protection / challenge / block page (Cloudflare, Akamai, PerimeterX,
  // captcha, 403/503/429). The page we received is NOT the real site, so we
  // cannot classify it — return INCONCLUSIVE so the caller can escalate to the
  // stealth browser instead of recording a confident "not a dealership".
  if (isChallengeOrBlockPage(rawHtml, statusCode, response)) {
    return unknownType(url, "SITE INACCESSIBLE — bot protection / challenge page (cannot evaluate)", true);
  }

  // =========================================================================
  // STEP 2 — COLLECT SIGNALS, homepage + any extra probe pages, and MERGE.
  // A dealer's homepage alone often has nothing but a "Search Inventory"
  // button; the real Group A anchors (VIN/stock#/listing fields) live on the
  // SRP/VDP pages it links to. Merging (union, deduped) means a signal found
  // on EITHER page counts — it genuinely is evidence about this one site.
  // =========================================================================
  const pages = [{ url, $ }, ...(Array.isArray(extraPages) ? extraPages : [])];
  const groupA = new Set();
  const groupB = new Set();
  const groupC = new Set();
  const groupS = new Set();
  let hasInventoryPath = false;
  let hasAutomotiveContext = false;
  let hasStrongAutomotiveContext = false;
  let hasFranchiseLanguage = false;
  let hasIndependentLanguage = false;
  let declaresInsurance = false;
  for (const p of pages) {
    if (!p || !p.$) continue;
    const signals = collectPageSignals(p.url, p.$);
    signals.groupA.forEach((s) => groupA.add(s));
    signals.groupB.forEach((s) => groupB.add(s));
    signals.groupC.forEach((s) => groupC.add(s));
    signals.groupS.forEach((s) => groupS.add(s));
    hasInventoryPath = hasInventoryPath || signals.hasInventoryPath;
    hasAutomotiveContext = hasAutomotiveContext || signals.hasAutomotiveContext;
    hasStrongAutomotiveContext = hasStrongAutomotiveContext || signals.hasStrongAutomotiveContext;
    hasFranchiseLanguage = hasFranchiseLanguage || signals.hasFranchiseLanguage;
    hasIndependentLanguage = hasIndependentLanguage || signals.hasIndependentLanguage;
    declaresInsurance = declaresInsurance || signals.declaresInsurance;
  }

  // D5 — an insurer (see INSURANCE_HEADLINE_RE). Checked here rather than in
  // STEP 1 because it needs the collected signals: a site is only disqualified
  // when it has NO genuine own-inventory anchor, so a dealer group that happens
  // to head a page with its insurance product still classifies normally.
  const hasOwnInventoryEvidence = [...groupA].some((s) =>
    ["A1 - VIN Detected", "A2 - Inventory Listing", "A3 - Dealer Platform Script", "A4 - Vehicle Schema"].includes(s));
  if (declaresInsurance && !hasOwnInventoryEvidence) {
    return unknownType(url, "D5 — Insurance provider, not an automotive dealer, service or corporate site");
  }

  // =========================================================================
  // STEP 3 — DEALER DECISION
  // Require BOTH:
  //   (a) at least 3 matched signals total (A + B), AND
  //   (b) at least ONE genuinely-automotive anchor signal.
  //
  // Rule (b) is the guard against generic e-commerce sites. Signals like A5
  // (trade-in), A6 (finance), B3 (payment calculator) and B6 (specials) match
  // ordinary retail/EMI language ("financing options", "monthly payment",
  // "specials", "sales event", "trade-in") and on their own are NOT evidence of
  // a car dealership — a large marketplace (e.g. Flipkart/Amazon) trips several
  // at once. They only count as PADDING toward the 3-signal threshold; a real,
  // vehicle-specific anchor must also be present.
  // =========================================================================
  const MIN_SIGNALS = 3;
  const MIN_SIGNALS_WITH_GENUINE_ANCHOR = 2;   // see dealerThreshold below
  const matched = [...groupA, ...groupB];

  // NOTE: "B1 - Test Drive CTA" and "B5 - Certified Pre-Owned" were removed
  // from this anchor set — testing against real non-automotive sites showed
  // both are used as generic retail language outside cars: telecom carriers
  // (Verizon, AT&T) say "test drive" for trial offers and sell "certified
  // pre-owned" refurbished phones using the exact same phrasing as a car's
  // CPO program. They still count toward the plain 3-signal padding total,
  // just no longer satisfy the "must have ONE genuinely automotive signal"
  // requirement on their own.
  const AUTOMOTIVE_ANCHORS = new Set([
    "A1 - VIN Detected",
    "A2 - Inventory Listing",
    "A3 - Dealer Platform Script",
    "A4 - Vehicle Schema",
    "B2 - New/Used Separation",
    "B7 - Manufacturer Dealer Keyword",
    "B8 - Inventory API",
    "B9 - Vehicle Sales Declaration",
  ]);
  const hasAutomotiveAnchor = matched.some((m) => AUTOMOTIVE_ANCHORS.has(m));

  // Pre-compute the Group C (corporate) eligibility up front — STEP 3 needs
  // it for the override below, and STEP 4 reuses the same values.
  // Require BOTH:
  //   (a) at least 2 matched Group C signals, AND
  //   (b) either an automotive-specific anchor (C1/C2/C4 — a dealer locator,
  //       configurator, or dealer-network language is inherently automotive)
  //       OR general automotive/vehicle-industry vocabulary somewhere on the
  //       page(s) (hasAutomotiveContext).
  //
  // Rule (b) matters because C3/C5-C8 (press, investor relations,
  // sustainability, philosophy, global site selector) are hallmarks of ANY
  // large multinational — a bank or software company has all of them too.
  // Without also confirming the business is actually automotive/vehicle
  // related, those alone would misclassify an unrelated Fortune-500 site as
  // an automotive "corporate" site.
  const matchedC = [...groupC];
  const MIN_CORPORATE_SIGNALS = 2;
  const CORPORATE_AUTOMOTIVE_ANCHORS = new Set([
    "C1 - Dealer Locator Tool",
    "C2 - Build & Price Configurator",
    "C4 - Dealer Network Language",
  ]);
  const hasCorporateAutomotiveAnchor = matchedC.some((m) => CORPORATE_AUTOMOTIVE_ANCHORS.has(m));
  const strongCorporateAnchorCount = matchedC.filter((m) => CORPORATE_AUTOMOTIVE_ANCHORS.has(m)).length;

  // hasAutomotiveContext ALONE is too weak a fallback when there's no
  // corporate anchor — confirmed at scale it false-positives on companies for
  // whom automotive is just ONE of many things they touch: eBay (sells auto
  // parts as one of many marketplace categories), Nvidia/Intel (automotive is
  // one named business vertical), Salesforce (one industry in a CRM vertical
  // list), Progressive/State Farm (they insure vehicles, they don't make
  // them). None of these have their own vehicle SALES process, which is
  // exactly what rivian.com (the site this fallback exists for — an OEM
  // selling direct-to-consumer with no dealer network, so it lacks C1/C2/C4)
  // has in abundance: trade-in, test-drive, payment, service, AND specials
  // signals together. Require that same richness — at least 3 OTHER commerce
  // signals beyond the lone Finance/Credit Application one (A6 is the single
  // most generic signal here) — before trusting vocabulary as evidence.
  const commerceSignalsExcludingGenericFinance = matched.filter((m) => m !== "A6 - Finance/Credit Application");
  const hasRichCommerceSignals = commerceSignalsExcludingGenericFinance.length >= 3;

  // hasCorporateAutomotiveAnchor is ALSO not automotive-exclusive on its own —
  // a deeper finding at 1000-site international scale: Garmin/Philips trip C1
  // (Dealer Locator) via ordinary retail-partner "dealer" language for
  // marine/aviation/personal-care electronics, and Logitech/Rolex trip C2
  // (Configurator) via "configure your [gaming gear/watch]" — neither is
  // car-specific. But naively requiring automotive-context vocabulary to
  // ALWAYS corroborate every anchor doesn't work either: keyword-frequency
  // signals cannot reliably tell a real automotive company from an adjacent
  // one (Philips' "Automotive Lighting" page repeats "automotive" MORE than
  // Ferrari's marketing repeats "car"). The signal that DOES cleanly separate
  // them, checked directly across every corporate site in this app's test
  // history: every genuine OEM has 2+ of the three automotive-network anchors
  // (C1 locator + C2 configurator + C4 network language) TOGETHER — Ferrari,
  // Freightliner, Peterbilt, Yamaha, Harley-Davidson, Polaris, International
  // Trucks all do. Garmin/Philips/Rolex each have exactly ONE. Two of these
  // specific signals co-occurring is a near-unique automotive signature on
  // its own; tiered by strength of evidence:
  //   2+ strong anchors           -> sufficient alone, no context needed.
  //   exactly 1 strong anchor     -> only trustworthy with the page's own
  //                                  <title> confirming it (the weak
  //                                  title-or-frequency context isn't
  //                                  reliable enough here — that's exactly
  //                                  the loophole Garmin/Philips exploited).
  //   no strong anchor            -> rivian.com's case (DTC, no dealer
  //                                  network) — needs BOTH weak context AND
  //                                  independently-rich vehicle-commerce
  //                                  signals (trade-in/test-drive/payment/
  //                                  service together) to compensate.
  // The first two tiers are a genuine manufacturer SIGNATURE; the third is a
  // much softer "looks like a big automotive-ish company" fallback. They are
  // named apart because the two are trusted to different depths below — the
  // signature outranks a dealer reading and a servicing reading, the fallback
  // outranks neither.
  const strongCorporateSignature =
    strongCorporateAnchorCount >= 2 ||
    (strongCorporateAnchorCount === 1 && hasStrongAutomotiveContext);
  // Two Group C signals is the normal floor. A direct-to-consumer manufacturer
  // can legitimately fall one short of it: rivian.com's homepage carries a
  // configurator and nothing else from Group C — no dealer locator (no dealer
  // network exists), no investor/press links above the fold — yet it is a car
  // maker beyond argument, and once STEP 5 was allowed to decide before the
  // soft corporate tier it was claimed as a SERVICE business off its own
  // service-network pages. A single strong anchor may therefore substitute for
  // the second signal, but only when BOTH corroborations are present: the
  // <title> names the business automotive, and there is a real vehicle-purchase
  // funnel behind it (trade-in, test drive, payment, financing together).
  // Garmin/Philips/Rolex — the sites this floor was built to exclude — have one
  // strong anchor and neither corroboration, so they are still excluded twice
  // over.
  const corporateSignalFloor =
    matchedC.length >= MIN_CORPORATE_SIGNALS ||
    (strongCorporateAnchorCount >= 1 && hasStrongAutomotiveContext && hasRichCommerceSignals);
  const corporateQualifies =
    corporateSignalFloor &&
    (strongCorporateSignature || (hasAutomotiveContext && hasRichCommerceSignals));

  // GENUINE Group A anchors (VIN / own inventory listing / dealer-platform
  // script / vehicle schema) are the only signals that actually prove a site
  // sells ITS OWN vehicles. The rest of AUTOMOTIVE_ANCHORS (B1/B2/B5/B7/B8)
  // are still admitted as a dealer anchor in the normal case, but they also
  // legitimately fire on an OEM/manufacturer homepage — "schedule a test
  // drive", "certified pre-owned program", "authorized dealer", and a
  // cross-dealer inventory-search API are all things an OEM's OWN corporate
  // site says too (confirmed on harley-davidson.com, rivian.com,
  // freightliner.com — all had 0 Group A anchors, only B-signal padding, yet
  // ALL had a strong, unambiguous corporate anchor: C1 dealer locator / C2
  // configurator / C4 dealer-network language). When that happens, the
  // corporate evidence is strictly more specific than the B-signal padding —
  // a single-location dealer never has a tool to find OTHER dealers.
  const GENUINE_DEALER_ANCHORS = new Set([
    "A1 - VIN Detected", "A2 - Inventory Listing", "A3 - Dealer Platform Script", "A4 - Vehicle Schema",
  ]);
  const hasGenuineDealerAnchor = matched.some((m) => GENUINE_DEALER_ANCHORS.has(m));

  // A2 (Inventory Listing) specifically is NOT as trustworthy as A1/A3/A4 —
  // confirmed at 250-site scale: several OEM sites (Yamaha Motorsports,
  // Triumph, Peterbilt, International Trucks) have a national CROSS-DEALER
  // inventory search tool that legitimately shows real VIN/stock#/MSRP data
  // sourced from their whole dealer network, tripping A2 even though it's a
  // corporate feature, not evidence of one dealer's own stock. The
  // differentiator: a real single dealer essentially never has MULTIPLE
  // strong corporate anchors (dealer locator AND configurator AND
  // dealer-network language) together — each one individually is barely
  // plausible (a dealer's site can embed an OEM-provided "build & price"
  // widget, or a dealer GROUP can say "our dealer network" about its own
  // locations), but 2+ of them at once is a near-unique corporate signature.
  // So when the ONLY genuine anchor is A2 (not the harder-to-fake A1/A3/A4),
  // require the full corporate SIGNATURE before letting dealer win.
  //
  // That signature is strongCorporateSignature, not a bare "2+ anchors" count.
  // The count alone missed the entire direct-to-consumer OEM shape, which is
  // now common: polestar.com and vinfastauto.us both sell their own cars from
  // their own site, so they carry A2 (real listings with MSRP), trade-in,
  // financing and test-drive booking — every hallmark of a dealer — while
  // having NO dealer network to build a locator for, which is precisely why
  // they cannot reach two of C1/C2/C4. What they do have is one strong anchor
  // (a configurator) plus a <title> that names the business as automotive
  // ("Polestar – Electric Cars", "Premier New Electric Car Company | VinFast")
  // plus investor relations, a newsroom and a sustainability report. That is a
  // manufacturer, and the tier-2 rule already encodes exactly this judgement
  // for the corporate test; reusing it here keeps the two consistent.
  //
  // The three corpus dealers whose only genuine anchor is also A2
  // (enterprisecarsales, hgreglux, drivetime) are untouched: none has a
  // configurator, a dealer locator or dealer-network language, so none reaches
  // even one strong anchor, let alone the signature.
  const onlyWeakDealerAnchor = hasGenuineDealerAnchor && !matched.some((m) => m !== "A2 - Inventory Listing" && GENUINE_DEALER_ANCHORS.has(m));
  const corporateOutranksWeakAnchor = onlyWeakDealerAnchor && strongCorporateSignature && corporateQualifies;

  // The flat 3-signal count was written to stop generic e-commerce sites, but
  // the hasAutomotiveAnchor requirement below already does that job — and the
  // count on top of it rejects real dealers that are simply terse. hgreglux.com
  // (page title: "Used Cars for Sale in Florida") ends at A2 + A6 = 2 after its
  // /used-car SRP is probed and a genuine inventory listing is confirmed, and
  // was refused with HTTP 400. When one of the four GENUINE Group A anchors
  // (VIN / own inventory listing / dealer-platform script / vehicle schema) is
  // present, that anchor IS the evidence; padding only has to corroborate it,
  // so two signals suffice. Without a genuine anchor — i.e. leaning on the
  // B-signals that an OEM's own site also trips — the original bar stands.
  const dealerThreshold = hasGenuineDealerAnchor ? MIN_SIGNALS_WITH_GENUINE_ANCHOR : MIN_SIGNALS;

  if (matched.length >= dealerThreshold && hasAutomotiveAnchor) {
    if ((!hasGenuineDealerAnchor && corporateQualifies) || corporateOutranksWeakAnchor) {
      return corporate(url, matchedC, `Corporate/OEM signals outrank generic dealer-side padding (no own-inventory evidence): ${matchedC.join(", ")}`, 0.85);
    }
    return dealer(url, matched, resolveDealerSubType({ groupB, hasFranchiseLanguage, hasIndependentLanguage }));
  }

  // =========================================================================
  // STEP 4a — CORPORATE DECISION, manufacturer signature only.
  // Only reached once the site failed the dealer test above.
  //
  // Split from the softer tier (STEP 4b, below STEP 5) because corporate used
  // to be decided in full BEFORE service was ever considered, and the soft tier
  // is not strong enough to earn that priority. lesschwab.com — a tyre and
  // servicing chain with ASE-style credentials, a booking funnel, published
  // work (tire rotation, brake service) and hundreds of stores — was returned
  // as CORPORATE purely because it publishes a newsroom and a company-vision
  // page and sells enough things to clear hasRichCommerceSignals. A newsroom is
  // not a manufacturer. The real signature (a configurator, a dealer locator,
  // dealer-network language) still outranks a service reading and is decided
  // here; "has corporate-shaped pages" now has to wait until after STEP 5.
  // =========================================================================
  if (corporateQualifies && strongCorporateSignature) {
    return corporate(url, matchedC, `Corporate/OEM signals: ${matchedC.join(", ")}`, 0.75);
  }

  // =========================================================================
  // STEP 5 — SERVICE / REPAIR DECISION (GROUP S)
  // Only reached once the site failed BOTH the dealer and corporate tests, so
  // by construction it has no own-inventory evidence — which is exactly what
  // separates a servicing business from a selling one.
  //
  // This used to be disqualifier "D4" that resolved to unknown, i.e. the audit
  // was refused outright at the controller gate. The parameter matrix
  // (docs/reports/Automotive-Site-Type-Parameter-Matrix.html) treats service
  // centres and repair garages as two of the four audited site types, so they
  // are now first-class verdicts with 12 inventory-scoped parameters
  // renormalised out rather than scored as failures.
  //
  // Gate mirrors the dealer/corporate ones: N signals AND a genuinely
  // automotive anchor. S2 (booking) and S3 (service menu) are business-shape
  // signals that any appointment-based local business trips — a dentist books
  // online and publishes a price list, a plumber quotes "free estimate, upfront
  // pricing" — so they can only ever be padding, never anchor a verdict.
  //
  // The anchors come in two tiers because they are not equally self-proving:
  //   STRONG — S4 (ASE / I-CAR / NAPA / VACC accreditation), S5 (tyre fitting,
  //     windscreen repair, car parts) and S7 (named workshop operations: oil
  //     change, wheel alignment, collision repair). Nothing outside the trade
  //     uses this vocabulary, so these stand on their own. This matters in
  //     practice: a tyre/fast-fit chain often never says "vehicle" or
  //     "automotive" at all — it says "tyres" — and would fail a
  //     hasAutomotiveContext test calibrated on OEM corporate homepages.
  //     S7 is what lets an oil-change chain qualify at all; see its vocabulary
  //     above for why anchoring on it does not also catch parts retailers.
  //   WEAK — S1, which carries the shop-shape vocabulary but includes two
  //     genuinely ambiguous phrases: "body shop" (a well-known cosmetics
  //     retailer) and "repair shop" (phone/appliance repair). S1 therefore
  //     needs hasAutomotiveContext alongside it, the same backstop the
  //     corporate path uses for its generic Group C signals.
  // =========================================================================
  const MIN_SERVICE_SIGNALS = 2;
  const STRONG_SERVICE_ANCHORS = new Set([
    "S4 - Trade Accreditation", "S5 - Tyre/Parts Retail", "S7 - Automotive Service Work",
  ]);
  const matchedS = [...groupS];
  const serviceEvidence = groupB.has("B4 - Service Scheduling")
    ? [...matchedS, "B4 - Service Scheduling"]
    : matchedS;
  const serviceAnchored =
    matchedS.some((s) => STRONG_SERVICE_ANCHORS.has(s)) ||
    (groupS.has("S1 - Repair Shop Self-Description") && hasAutomotiveContext);

  // S7 is the broadest of the three strong anchors — it matches vocabulary a
  // business only has to MENTION, not perform, and the businesses that mention
  // repair work without doing any are exactly the ones already known to be
  // dangerous here: motor insurers (approved-repairer networks, "collision
  // repair", "auto repair"). Letting B4 be its sole corroboration would rebuild
  // the loophole that scored progressive.com as a repair shop, because B4 fires
  // on nothing more than "oem parts". So when S7 is the ONLY strong anchor,
  // the corroboration must be a second GROUP S signal — a booking funnel, a
  // published price list, an accreditation, a locator, a shop self-description.
  // Every genuine servicing business in the corpus clears this; the insurers
  // carry S7 and nothing else. S4/S5 are unaffected: nobody outside the trade
  // claims ASE certification or sells tyre fitting.
  const onlyS7Anchor =
    groupS.has("S7 - Automotive Service Work") &&
    !matchedS.some((s) => s !== "S7 - Automotive Service Work" && STRONG_SERVICE_ANCHORS.has(s)) &&
    !(groupS.has("S1 - Repair Shop Self-Description") && hasAutomotiveContext);
  const serviceCorroborated = onlyS7Anchor
    ? matchedS.length >= MIN_SERVICE_SIGNALS
    : serviceEvidence.length >= MIN_SERVICE_SIGNALS;

  // A servicing business sells LABOUR. It does not run a vehicle-purchase
  // funnel — it has no trade-in valuation to offer, no test drive to book, no
  // monthly payment to calculate, no certified-pre-owned programme. A site
  // carrying three or more of those at once is selling vehicles, whatever else
  // it also does, so STEP 5 must not claim it: rivian.com has a service network
  // with booking and locations (S2/S6/S7 all fire) and was read as a repair
  // chain the moment service was allowed to decide before the soft corporate
  // tier. Deliberately a count of three, not one — every servicing chain in the
  // corpus trips at most one of these in passing (lesschwab.com quotes a
  // trade-in on tyres), while a real seller trips several together.
  const VEHICLE_PURCHASE_FUNNEL = new Set([
    "A5 - Trade-In Tool", "B1 - Test Drive CTA", "B2 - New/Used Separation",
    "B3 - Payment Calculator", "B5 - Certified Pre-Owned", "B9 - Vehicle Sales Declaration",
  ]);
  const sellsVehicles = matched.filter((m) => VEHICLE_PURCHASE_FUNNEL.has(m)).length >= 3;

  if (serviceCorroborated && serviceAnchored && !sellsVehicles) {
    return service(url, serviceEvidence, resolveServiceSubType(groupS));
  }

  // =========================================================================
  // STEP 4b — CORPORATE DECISION, soft tier (see STEP 4a for why it sits here).
  // Automotive vocabulary plus a rich commerce mix, with no manufacturer
  // signature behind it. This is rivian.com's path — a DTC maker with no dealer
  // network, so no locator and no dealer-network language to anchor on — and it
  // only gets to decide once nothing above has claimed the site.
  // =========================================================================
  if (corporateQualifies) {
    return corporate(url, matchedC, `Corporate/OEM signals: ${matchedC.join(", ")}`, 0.75);
  }

  // Service-ish but under the bar — keep the old D4 wording so the "why was
  // this refused" log line still reads the way it always has.
  const hasServiceOnly = groupB.has("B4 - Service Scheduling") && !hasInventoryPath && groupA.size === 0;
  const reason = hasServiceOnly
    ? "D4 — Service/repair signals present but too thin to confirm a servicing business"
    : matched.length >= MIN_SIGNALS && !hasAutomotiveAnchor
      ? `Only generic commerce signals — no vehicle-specific evidence (matched: ${matched.join(", ")})`
      : matchedC.length >= MIN_CORPORATE_SIGNALS && !hasCorporateAutomotiveAnchor && !hasAutomotiveContext
        ? `Only generic corporate-site signals — no automotive/vehicle evidence (matched: ${matchedC.join(", ")})`
        : matched.length > 0 || matchedC.length > 0
          ? `Not enough signals for either verdict (dealer: ${matched.join(", ") || "none"}; corporate: ${matchedC.join(", ") || "none"})`
          : "No dealership or corporate signals detected";
  return unknownType(url, reason, false, hasAutomotiveContext, hasRichCommerceSignals);
}

// --- challenge / block page detection --------------------------------------
// Returns true when the received HTML is a bot-protection interstitial rather
// than the real website (so we must NOT classify it as "not a dealership").
function isChallengeOrBlockPage(rawHtml, statusCode, response) {
  const status = statusCode || (response && typeof response.status === "function" ? response.status() : undefined);
  if (status === 403 || status === 503 || status === 429) return true;

  const html = (rawHtml || "").toLowerCase();
  if (!html) return false;

  // STRONG markers — unambiguous interstitial fingerprints. These only appear on
  // a real challenge/block page, never as incidental strings inside a normal
  // site's markup or JS. Match anywhere.
  //
  // NOTE: "cdn-cgi/challenge-platform" is deliberately NOT here even though it
  // sounds unambiguous — Cloudflare injects that same path for its PASSIVE
  // JS-fingerprinting beacon (/cdn-cgi/challenge-platform/scripts/jsd/main.js)
  // on ordinary pages that show no challenge at all (confirmed on a real 139KB
  // dealer homepage that returned HTTP 200 with full content). It behaves like
  // a WEAK marker — trustworthy only on a small, interstitial-sized page — not
  // a strong one.
  const strongMarkers = [
    "attention required! | cloudflare", "cf-browser-verification",
    "/cdn-cgi/styles/cf.errors",
    "checking your browser before accessing", "just a moment...", "_cf_chl_opt",
    "please enable javascript and cookies", "verify you are human",
    "px-captcha", "captcha-delivery", "incapsula incident",
    "request unsuccessful. incapsula", "distil_r_captcha", "recaptcha challenge",
  ];
  if (strongMarkers.some((m) => html.includes(m))) return true;

  // WEAK markers — generic phrases ("access denied", "perimeterx", vendor names)
  // that legitimately show up inside large sites' JS bundles, error-handling
  // strings, or analytics tags. A genuine block/challenge page is TINY (a few
  // KB); a full real homepage is tens to hundreds of KB. So only trust a weak
  // marker when the page is small OR the HTTP status already signals a block.
  // This stops a 1MB real page (e.g. an e-commerce homepage) from being
  // mis-flagged as inconclusive just because "perimeterx" appears in a bundle.
  const SMALL_PAGE_BYTES = 15000;
  const looksBlockedBySize = html.replace(/\s/g, "").length < SMALL_PAGE_BYTES;
  if (!looksBlockedBySize) return false;

  const weakMarkers = [
    "cdn-cgi/challenge-platform",
    "cf-error-details", "ray id", "please enable cookies",
    "access denied", "you have been blocked", "are you a robot", "are you human",
    "perimeterx", "_incapsula_", "akamai", "reference&#32;#", "bot detection",
    "hcaptcha", "g-recaptcha",
  ];
  return weakMarkers.some((m) => html.includes(m));
}

// --- sub-type resolvers ------------------------------------------------------
// Both resolvers run only AFTER the coarse verdict is settled. They never
// promote or demote a verdict — they only pick which of the two columns in the
// parameter matrix this site is scored against, so an ambiguous read costs a
// weight tilt, never an audit.

// Franchise vs independent. A franchise store is contractually a single-brand
// NEW-vehicle retailer and is required to display that affiliation, so explicit
// franchise markers are reliable when present. B2 (new AND used inventory in the
// nav) is weighted highest because selling new vehicles requires a franchise —
// an independent lot cannot have it. Absence of every franchise marker is
// genuine evidence of absence here, so the fallback is "independent" rather
// than a coin flip.
function resolveDealerSubType({ groupB, hasFranchiseLanguage, hasIndependentLanguage }) {
  let franchisePoints = 0;
  if (groupB.has("B2 - New/Used Separation")) franchisePoints += 2;
  if (groupB.has("B7 - Manufacturer Dealer Keyword")) franchisePoints += 2;
  if (hasFranchiseLanguage) franchisePoints += 1;
  if (groupB.has("B5 - Certified Pre-Owned")) franchisePoints += 1;   // OEM CPO programme, but independents say "certified" loosely too

  const independentPoints = hasIndependentLanguage ? 2 : 0;

  return franchisePoints >= 2 && franchisePoints > independentPoints ? "franchise" : "independent";
}

// Service centre/chain vs single-location garage. The matrix splits columns 3
// and 4 on exactly this: "service centre or chain" versus "independent
// mechanic, collision repair, single location". S6 (multi-location) is the
// positive signal for a chain; S1 (garage/body-shop/mechanic self-description)
// for a single shop. When a site trips both — a two-branch body shop — the
// chain reading wins, because the parameters that actually differ between the
// columns (local landing pages, NAP, booking scheduler) are the ones a
// multi-location operator needs.
function resolveServiceSubType(groupS) {
  if (groupS.has("S6 - Multi-Location Operator")) return "service";
  if (groupS.has("S1 - Repair Shop Self-Description")) return "repair";
  return "service";
}

// --- verdict builders -------------------------------------------------------
function dealer(url, detectedBy, siteSubType = "independent") {
  const report =
    `=== SITE TYPE DETECTION RESULT ===\n\n` +
    `WEBSITE         : ${url}\n` +
    `VERDICT         : ✅ DEALER SITE CONFIRMED (${siteSubType})\n` +
    `DETECTED BY     : ${detectedBy.join(", ")}\n\n` +
    `→ PROCEEDING WITH DEALER AUDIT SCOPE...\n` +
    `====================================`;
  logger.info(`[SiteTypeGate] ✅ DEALER/${siteSubType} ${url} — ${detectedBy.join(", ")}`);
  return { siteType: "dealer", siteSubType, inconclusive: false, confidence: 0.9, detectedBy, reason: "", report };
}

// Confident positive — a servicing business (service centre/chain or repair
// garage) with no vehicle sales inventory of its own.
function service(url, detectedBy, siteSubType) {
  const label = siteSubType === "repair" ? "MECHANICAL/REPAIR" : "AUTOMOTIVE SERVICE";
  const report =
    `=== SITE TYPE DETECTION RESULT ===\n\n` +
    `WEBSITE         : ${url}\n` +
    `VERDICT         : 🔧 ${label} SITE CONFIRMED\n` +
    `DETECTED BY     : ${detectedBy.join(", ")}\n\n` +
    `→ PROCEEDING WITH SERVICE AUDIT SCOPE (inventory parameters N/A)...\n` +
    `====================================`;
  logger.info(`[SiteTypeGate] 🔧 SERVICE/${siteSubType} ${url} — ${detectedBy.join(", ")}`);
  return {
    siteType: "service",
    siteSubType,
    inconclusive: false,
    confidence: 0.85,
    detectedBy,
    reason: `Servicing business, no vehicle sales inventory: ${detectedBy.join(", ")}`,
    report,
  };
}

// Confident positive — a corporate/OEM/multi-dealer site (no inventory of its own).
function corporate(url, detectedBy, reason, confidence = 0.8) {
  const report =
    `=== SITE TYPE DETECTION RESULT ===\n\n` +
    `WEBSITE         : ${url}\n` +
    `VERDICT         : 🏢 CORPORATE/OEM SITE CONFIRMED\n` +
    `DETECTED BY     : ${detectedBy.join(", ")}\n\n` +
    `→ PROCEEDING WITH CORPORATE AUDIT SCOPE...\n` +
    `====================================`;
  logger.info(`[SiteTypeGate] 🏢 CORPORATE ${url} — ${reason}`);
  return { siteType: "corporate", siteSubType: "corporate", inconclusive: false, confidence, detectedBy, reason, report };
}

// Neither confirmed — a marketplace/media/non-automotive site, or too few
// signals for either verdict. Callers REFUSE the audit on this (HTTP 400 at
// both controller gates); "unknown" has NOT failed open to the dealer taxonomy
// since the four-site-type taxonomy landed. `inconclusive` distinguishes "we
// evaluated it and it isn't automotive" from "we could not look at all" — only
// the latter is worth a stealth-browser retry, and only the former is cached.
function unknownType(url, reason, wasInconclusive = false, hasAutomotiveContext = false, hasRichCommerceSignals = false) {
  const level = wasInconclusive ? "⚠️ INCONCLUSIVE" : "❓ UNKNOWN";
  logger.info(`[SiteTypeGate] ${level} ${url} — ${reason}`);
  return { siteType: "unknown", siteSubType: null, inconclusive: wasInconclusive, confidence: 0, detectedBy: [], reason, report: "", hasAutomotiveContext, hasRichCommerceSignals };
}

export default detectSiteType;
