const VIN_RE = /\b[a-hj-npr-z0-9]{17}\b/i;
const YEAR = "(?:19|20)\\d{2}";
const MAKE = "(?:acura|alfa-?romeo|aston-?martin|audi|bentley|bmw|buick|cadillac|chevrolet|chevy|chrysler|dodge|ferrari|fiat|ford|genesis|gmc|honda|hummer|hyundai|infiniti|isuzu|jaguar|jeep|kia|lamborghini|land-?rover|lexus|lincoln|lotus|lucid|maserati|maybach|mazda|mclaren|mercedes(?:-?benz)?|mercury|mini|mitsubishi|nissan|oldsmobile|polestar|pontiac|porsche|ram|rivian|rolls-?royce|saab|saturn|scion|smart|subaru|suzuki|tesla|toyota|vinfast|volkswagen|vw|volvo)";

const VDP_QUERY_RE = /[?&](?:vin|vehicleid|vehicle_id|vid|stocknumber|stocknum)=/i;
const VDP_DETAIL_RE = /\/(vehicle-?details?|vehicle-?info(?:rmation)?|vdp|car-?details?|cardetails?)(\/|$)/;
const VDP_ID_RE = /\/(vehicle|vehicles|listing|listings|detail|details|auto|car)\/\d{3,}(\/|$)/;
const VDP_FOLDER_YEAR_RE = new RegExp(`\\/(?:inventory|vehicles?|new|used|certified|cpo|pre-?owned|auto)\\/[^/]*\\b${YEAR}\\b[^/]*\\/?$`);
const VDP_YEAR_MAKE_RE = new RegExp(`\\/(?:[a-z0-9]+-)*${YEAR}-${MAKE}-`, "i");
const VDP_MAKE_YEAR_RE = new RegExp(`\\/${MAKE}-[a-z0-9-]*${YEAR}\\b`, "i");

const isVdp = (path, url) =>
  VDP_QUERY_RE.test(url) ||
  VIN_RE.test(path) ||
  VDP_DETAIL_RE.test(path) ||
  VDP_ID_RE.test(path) ||
  VDP_FOLDER_YEAR_RE.test(path) ||
  VDP_YEAR_MAKE_RE.test(path) ||
  VDP_MAKE_YEAR_RE.test(path);

const SRP_KEYWORDS_RE = new RegExp(
  [
    "inventory",
    "showroom",
    "for-?sale",
    "pre-?owned",
    "(?:new|used|certified|cpo|all|our|current|featured|available|shop|browse|view|search)-?(?:cars?|vehicles?|trucks?|suvs?|inventory|listings?)",
    "(?:vehicle|car|auto)-?(?:search|finder|listings?)",
    "search-?(?:new|used|inventory|vehicles?|cars?)",
    "search(?:new|used)",
    "vehiclesearchresults",
    "searchresults",
  ].join("|")
);
const SRP_FOLDER_RE = /^\/(new|used|certified|cpo|pre-?owned|vehicles?|cars?|trucks?|suvs?|sedans?|coupes?|vans?|minivans?|crossovers?|hatchbacks?|wagons?|convertibles?|hybrids?|electric|commercial(?:-vehicles?)?|fleet)\/?$/;
const SRP_MODEL_RE = new RegExp(`^\\/(?:new|used|certified|cpo|pre-?owned|inventory|vehicles)\\/${MAKE}(?:[-/]|$)`, "i");

const isSrp = (p) => SRP_KEYWORDS_RE.test(p) || SRP_FOLDER_RE.test(p) || SRP_MODEL_RE.test(p);

const EXCLUDE_RE = /\/(privacy(?:-policy)?|terms(?:-of-service|-of-use|-and-conditions)?|tos|legal|disclaimers?|accessibility|cookies?(?:-policy)?|do-not-sell|sitemap|site-map|thank-?you|404|login|sign-?in|register|my-account|account|cart|wishlist|saved-vehicles?)(?:\/|$)/;

const MATCH_ORDER = [
  { key: "vdp", test: (p, u) => isVdp(p, u) },
  {
    key: "trade",
    test: (p) =>
      /(trade-?in|value-(your|my)|whats?-?my-?(trade|car|vehicle)|sell-?(my|your|us)|we-(buy|want|pay)|cash-offer|apprais|kelley|kbb|trade-?value|instant-?offer)/.test(p),
  },
  { key: "lease", test: (p) => /lease/.test(p) },
  {
    key: "finance",
    test: (p) =>
      /(financ|credit-app|credit-application|700-?credit|pre-?approv|get-?(pre-?)?approved|payment-calc|loan|auto-loan|apply-?(for|online|now|today)?)/.test(p),
  },
  { key: "service", test: (p) => /(service|repair|maintenance|oil-change|brakes?|express-lane|collision|body-shop|detailing|parts|accessor|tires?\b|wheels?\b)/.test(p) },
  { key: "specials", test: (p) => /(special|offer|deal|incentive|saving|clearance|promo|rebate)/.test(p) },
  { key: "srp", test: (p) => isSrp(p) },
  {
    key: "about",
    test: (p) =>
      /(about|our-story|our-team|meet-(the|our)|staff|why-(us|buy|choose)|who-we-are|our-history|contact|get-?directions?|directions?|locations?|hours|find-us|visit-us|leadership|our-people|hours-and-direction)/.test(p),
  },
  { key: "content", test: (p) => /(blog|news|articles?|resources?|research|reviews?|tips|guides?|community|car-care|learn|faqs?|frequently-asked|how-?tos?|how-do-i)/.test(p) },
];

const normPath = (pathname) => (pathname.toLowerCase().replace(/\/+$/, "") || "/");

export function classifyPageType(rawUrl) {
  let path, lower;
  try {
    const url = new URL(rawUrl);
    path = normPath(url.pathname);
    lower = rawUrl.toLowerCase();
    
    // Homepage check
    if (path === "/" || path === "") {
      return "home";
    }
  } catch {
    // If not a valid URL, treat input as the path/string
    path = normPath(String(rawUrl));
    lower = String(rawUrl).toLowerCase();
    if (path === "/" || path === "") {
      return "home";
    }
  }
  
  if (EXCLUDE_RE.test(path)) return "generic"; // excluded page → generic
  
  for (const def of MATCH_ORDER) {
    if (def.test(path, lower)) return def.key;
  }
  
  return "generic";
}
