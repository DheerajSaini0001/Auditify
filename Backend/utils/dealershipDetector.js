// =============================================================================
// DEALERSHIP DETECTION & AUDIT GATE
// Autonomous | Binary Decision | Zero Human Interaction
//
// Implements dealership_detection_prompt.md as a deterministic rule engine.
// Returns a binary verdict — DEALERSHIP CONFIRMED or NOT A DEALERSHIP — that the
// audit workers use as a gate: only confirmed dealerships proceed to the audit.
//
// Decision order (disqualifiers ALWAYS first):
//   1. Any Disqualifier D1–D4            -> NOT A DEALERSHIP
//   2. 3+ matched signals (Group A + B)  -> DEALERSHIP CONFIRMED
//   3. Otherwise                         -> NOT A DEALERSHIP
//
// NOTE: a single signal is intentionally NOT enough. A site must match at least
// THREE parameters total (combining dealership-exclusive Group A signals and
// supporting Group B signals) before it is confirmed as a dealership. This makes
// the gate strict and avoids false positives from one stray keyword/path.
// =============================================================================

import logger from "./logger.js";

// --- Disqualifier domain lists (D1–D3) -------------------------------------
const OEM_DOMAINS = [
  "toyota.com", "ford.com", "bmw.com", "honda.com", "chevrolet.com", "nissanusa.com",
  "nissan.com", "hyundaiusa.com", "hyundai.com", "kia.com", "mazdausa.com", "mazda.com",
  "subaru.com", "volkswagen.com", "vw.com", "audi.com", "mercedes-benz.com", "mbusa.com",
  "lexus.com", "acura.com", "infinitiusa.com", "jeep.com", "dodge.com", "ram trucks.com",
  "ramtrucks.com", "gmc.com", "buick.com", "cadillac.com", "volvocars.com", "porsche.com",
  "jaguar.com", "landrover.com", "tesla.com", "chrysler.com", "mini.com", "fiatusa.com",
  "mitsubishicars.com", "genesis.com", "lincoln.com", "alfaromeousa.com",
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
  "/vehicle-showroom"
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
  "drivetrain", "fuel economy", "city mpg", "highway mpg",
  "vehicle history report", "carfax", "autocheck",
  "value your trade", "schedule test drive", "vehicle overview",
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
  "reserve now",
  "vehicle reservation",
  "hold this vehicle",
  "hold vehicle",
  "reserve car",
  "reserve this car",

  // Availability
  "check availability",
  "vehicle availability",
  "is this vehicle available",
  "available now",
  "check vehicle availability",
  "confirm availability",
  "inventory availability",

  // Contact & Inquiry
  "request information",
  "vehicle inquiry",
  "contact dealer",
  "contact us about this vehicle",
  "send inquiry",
  "request more information",
  "ask a question",

  // Vehicle Interest Actions
  "get e-price",
  "unlock price",
  "get today's price",
  "get internet price",
  "request pricing",
  "price quote",
  "request quote",

  // Purchase Intent
  "buy online",
  "start purchase",
  "purchase vehicle",
  "express checkout",
  "start buying process",
  "save vehicle",
  "favorite vehicle",

  // Dealer Lead Forms
  "schedule appointment",
  "book appointment",
  "request appointment",
  "meet with sales",
  "sales appointment",

  // Common Dealer CTAs
  "i'm interested",
  "interested in this vehicle",
  "learn more",
  "vehicle details request",
  "contact sales",
  "speak with a specialist"
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
  "used vehicle inventory"
];

// VIN: 17 chars, excludes I/O/Q. Anchored to a VIN label to avoid false positives.
const VIN_LABELLED_RE = /\b(?:vin|vehicle\s+identification\s+number)\b\s*[:#]*\s*([A-HJ-NPR-Z0-9]{17})\b/i;
// Strict standalone VIN (uppercase, must mix letters and digits).
const VIN_STANDALONE_RE = /\b(?=[A-HJ-NPR-Z0-9]{17}\b)(?=[A-HJ-NPR-Z]*[0-9])(?=[0-9]*[A-HJ-NPR-Z])[A-HJ-NPR-Z0-9]{17}\b/;

// --- helpers ----------------------------------------------------------------
const domainMatches = (hostname, list) =>
  list.some((d) => {
    const clean = d.replace(/\s+/g, "");
    return hostname === clean || hostname.endsWith("." + clean);
  });

const anyKeyword = (text, keywords) => keywords.some((k) => text.includes(k));
const anyPath = (haystack, paths) => paths.some((p) => haystack.includes(p));

/**
 * Detect whether a scraped website is a car dealership.
 *
 * @param {object} opts
 * @param {string} opts.url       - the audited URL
 * @param {object} opts.$         - cheerio instance loaded with the page HTML
 * @param {object} [opts.page]    - playwright page (optional, for network signals)
 * @param {object} [opts.response]- navigation response (optional)
 * @returns {Promise<{isDealership: boolean, detectedBy: string[], reason: string, report: string}>}
 */
export async function detectDealership({ url, $, page, response, statusCode }) {
  // Rule #7 — inaccessible / no usable data. This is INCONCLUSIVE (we couldn't
  // evaluate), NOT a confident "not a dealership". Callers must fail OPEN on this.
  let rawHtml = "";
  try { rawHtml = ($ ? $.html() : "") || ""; } catch (_) { rawHtml = ""; }
  if (!$ || rawHtml.replace(/\s/g, "").length < 60) {
    return inconclusive(url, "SITE INACCESSIBLE — INSUFFICIENT DATA TO EVALUATE");
  }

  // Bot-protection / challenge / block page (Cloudflare, Akamai, PerimeterX,
  // captcha, 403/503/429). The page we received is NOT the real site, so we
  // cannot classify it — return INCONCLUSIVE so the caller lets the full audit
  // (which has proper bot-bypass handling) take over instead of wrongly blocking.
  if (isChallengeOrBlockPage(rawHtml, statusCode, response)) {
    return inconclusive(url, "SITE INACCESSIBLE — bot protection / challenge page (cannot evaluate)");
  }

  let hostname = "";
  let urlPath = "";
  try {
    const u = new URL(url);
    hostname = u.hostname.replace(/^www\./, "").toLowerCase();
    urlPath = (u.pathname || "").toLowerCase();
  } catch (_) { /* malformed url — treat path as empty */ }

  // ---- Collect signals from the DOM ----------------------------------------
  const lowerHtml = rawHtml.toLowerCase();

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
  const hrefs = [];
  try {
    $("a[href], link[href], form[action]").each((_, el) => {
      const v = ($(el).attr("href") || $(el).attr("action") || "").toLowerCase();
      if (v) hrefs.push(v);
    });
  } catch (_) { /* ignore */ }
  const pathHaystack = (urlPath + " " + hrefs.join(" ")).toLowerCase();

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

  // =========================================================================
  // STEP 1 — DISQUALIFIERS (always processed first)
  // =========================================================================
  if (domainMatches(hostname, OEM_DOMAINS)) {
    return notADealership(url, `D1 — OEM brand website (${hostname})`);
  }
  if (domainMatches(hostname, MARKETPLACE_DOMAINS)) {
    return notADealership(url, `D2 — Automotive marketplace / aggregator (${hostname})`);
  }
  if (domainMatches(hostname, MEDIA_DOMAINS)) {
    return notADealership(url, `D3 — Automotive media / review publication (${hostname})`);
  }

  // =========================================================================
  // STEP 2 — GROUP A (any ONE confirms)
  // =========================================================================
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

  // =========================================================================
  // STEP 3 — GROUP B (supporting signals)
  // =========================================================================
  const groupB = [];

  // B1 — test drive CTA
  if (anyKeyword(visibleText, TEST_DRIVE_KEYWORDS)) groupB.push("B1 - Test Drive CTA");

  // B2 — new AND used inventory separation in navigation
  const hasNew = /\/new-(inventory|vehicles|cars)/.test(pathHaystack) || /\bnew (inventory|vehicles)\b/.test(visibleText);
  const hasUsed = /\/(used-(inventory|vehicles|cars)|pre-owned)/.test(pathHaystack) || /\b(used (inventory|vehicles)|pre-owned)\b/.test(visibleText);
  if (hasNew && hasUsed) groupB.push("B2 - New/Used Separation");

  // B3 — payment calculator
  if (anyKeyword(visibleText, PAYMENT_KEYWORDS)) groupB.push("B3 - Payment Calculator");

  // B4 — service scheduling
  if (anyPath(pathHaystack, SERVICE_PATHS) || anyKeyword(visibleText, SERVICE_KEYWORDS)) groupB.push("B4 - Service Scheduling");

  // B5 — certified pre-owned
  if (anyKeyword(visibleText, CPO_KEYWORDS)) groupB.push("B5 - Certified Pre-Owned");

  // B6 — dealer specials pages
  if (anyPath(pathHaystack, SPECIALS_PATHS) || anyKeyword(visibleText, SPECIALS_KEYWORDS)) groupB.push("B6 - Dealer Specials");

  // B7 — manufacturer dealer keyword
  if (anyKeyword(visibleText, MANUFACTURER_DEALER_KEYWORDS)) groupB.push("B7 - Manufacturer Dealer Keyword");

  // B8 — inventory API requests (approximated from inline/script references)
  if (resourceHaystack.includes("dealerinventory") || (lowerHtml.includes("stocknumber") && lowerHtml.includes("msrp"))) {
    groupB.push("B8 - Inventory API");
  }

  // =========================================================================
  // STEP 4 — DECISION
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
  const matched = [...groupA, ...groupB];

  const AUTOMOTIVE_ANCHORS = new Set([
    "A1 - VIN Detected",
    "A2 - Inventory Listing",
    "A3 - Dealer Platform Script",
    "A4 - Vehicle Schema",
    "B1 - Test Drive CTA",
    "B2 - New/Used Separation",
    "B5 - Certified Pre-Owned",
    "B7 - Manufacturer Dealer Keyword",
    "B8 - Inventory API",
  ]);
  const hasAutomotiveAnchor = matched.some((m) => AUTOMOTIVE_ANCHORS.has(m));

  if (matched.length >= MIN_SIGNALS && hasAutomotiveAnchor) {
    return dealership(url, matched);
  }

  // D4 — independent repair/service shop with no sales inventory: service signals
  // present but zero sales signals. Surface the specific disqualifier when it fits.
  const hasServiceOnly = groupB.includes("B4 - Service Scheduling") && !hasInventoryPath && groupA.length === 0;
  const reason = hasServiceOnly
    ? "D4 — Service/repair shop with no vehicle sales inventory"
    : matched.length >= MIN_SIGNALS && !hasAutomotiveAnchor
      ? `Only generic commerce signals — no vehicle-specific evidence (matched: ${matched.join(", ")})`
      : matched.length > 0
        ? `Only ${matched.length} signal(s) matched (need ${MIN_SIGNALS}): ${matched.join(", ")}`
        : "No dealership signals detected";
  return notADealership(url, reason);
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
  const strongMarkers = [
    "attention required! | cloudflare", "cf-browser-verification",
    "cdn-cgi/challenge-platform", "/cdn-cgi/styles/cf.errors",
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
    "cf-error-details", "ray id", "please enable cookies",
    "access denied", "you have been blocked", "are you a robot", "are you human",
    "perimeterx", "_incapsula_", "akamai", "reference&#32;#", "bot detection",
    "hcaptcha", "g-recaptcha",
  ];
  return weakMarkers.some((m) => html.includes(m));
}

// --- verdict builders -------------------------------------------------------
function dealership(url, detectedBy) {
  const report =
    `=== DEALERSHIP DETECTION RESULT ===\n\n` +
    `WEBSITE         : ${url}\n` +
    `VERDICT         : ✅ DEALERSHIP CONFIRMED\n` +
    `DETECTED BY     : ${detectedBy.join(", ")}\n\n` +
    `→ PROCEEDING TO AUDIT...\n` +
    `====================================`;
  logger.info(`[DealershipGate] ✅ CONFIRMED ${url} — ${detectedBy.join(", ")}`);
  return { isDealership: true, inconclusive: false, detectedBy, reason: "", report };
}

// Confident negative — we got the real site and it is NOT a dealership.
function notADealership(url, reason) {
  const report =
    `=== DEALERSHIP DETECTION RESULT ===\n\n` +
    `WEBSITE         : ${url}\n` +
    `VERDICT         : ❌ NOT A DEALERSHIP WEBSITE\n` +
    `REASON          : ${reason}\n\n` +
    `→ AUDIT CANNOT BE PERFORMED. THIS WEBSITE DOES NOT QUALIFY.\n` +
    `====================================`;
  logger.info(`[DealershipGate] ❌ NOT A DEALERSHIP ${url} — ${reason}`);
  return { isDealership: false, inconclusive: false, detectedBy: [], reason, report };
}

// Inconclusive — we could NOT evaluate (blocked / empty / challenge). Callers
// must FAIL OPEN: proceed with the audit rather than block a possibly-real site.
function inconclusive(url, reason) {
  logger.info(`[DealershipGate] ⚠️ INCONCLUSIVE ${url} — ${reason}`);
  return { isDealership: false, inconclusive: true, detectedBy: [], reason, report: "" };
}

export default detectDealership;
