// ─────────────────────────────────────────────────────────────────────────────
// Shared link-semantics helper — SINGLE SOURCE OF TRUTH.
//
// Imported by BOTH:
//   • Backend/metricServices/seoMetrics.js  (scores contextual linking)
//   • Frontend/src/Pages/On_Page_SEO.jsx    (renders Contextual vs Non-Contextual)
//
// Editing the synonym groups here updates the score and the on-screen split at the
// same time, so the two can never drift apart.
//
// Plain ESM `.js` so both the Node backend ("type":"module") and the Vite frontend
// can import it directly.
// ─────────────────────────────────────────────────────────────────────────────

// Words that carry the SAME intent for link-relatedness. When an anchor word and a
// URL/slug word land in the same group, the link is topically related even without
// a literal string overlap — e.g. "Browse All Vehicles" ↔ /car-sales
// ("vehicles" ≈ "cars", "browse" ≈ "sales/search"). Deterministic (no API),
// automotive-dealership tuned.
export const SEMANTIC_SYNONYM_GROUPS = [
  ["car", "cars", "vehicle", "vehicles", "auto", "autos", "automobile", "automobiles", "motor", "motors", "ride", "rides", "wheels", "suv", "suvs", "ute", "utes", "truck", "trucks", "van", "vans", "sedan", "hatch", "4wd", "model", "models", "make", "makes"],
  ["used", "preowned", "secondhand", "cpo", "certified", "demo", "demos"],
  ["new", "latest", "brandnew"],
  ["buy", "buying", "purchase", "purchasing", "shop", "shopping", "order", "sale", "sales", "forsale", "showroom"],
  ["sell", "selling", "trade", "tradein", "valuation", "valuations", "value", "appraisal", "appraise", "sellmycar"],
  ["browse", "search", "find", "finder", "explore", "view", "discover", "see", "listing", "listings", "inventory", "stock", "range", "collection", "catalog", "catalogue", "results"],
  ["finance", "financing", "loan", "loans", "lease", "leasing", "credit", "repayment", "repayments", "preapproval", "prequalify", "calculator", "payment", "payments"],
  ["service", "servicing", "repair", "repairs", "maintenance", "workshop", "mechanic", "bookaservice"],
  ["part", "parts", "accessory", "accessories", "spares", "spare"],
  ["deal", "deals", "offer", "offers", "special", "specials", "promotion", "promotions", "discount", "discounts", "saving", "savings"],
  ["warranty", "warranties", "insurance", "protection", "guarantee", "guarantees"],
  ["contact", "enquiry", "enquiries", "inquiry", "inquiries", "reach", "connect", "getintouch"],
  ["about", "company", "story", "history", "mission", "team", "staff"],
  ["location", "locations", "directions", "map", "maps", "dealership", "dealer", "dealers", "branch", "branches", "store", "stores", "visit", "findus"],
  ["book", "booking", "bookings", "schedule", "appointment", "appointments", "reserve", "reservation", "testdrive"],
  ["home", "homepage", "index", "main"],
  ["blog", "blogs", "post", "posts", "posting", "news", "article", "articles", "insight", "insights", "update", "updates", "stories", "story", "press"],
];

// word -> concept-group index
const WORD_CONCEPT = (() => {
  const m = {};
  SEMANTIC_SYNONYM_GROUPS.forEach((group, gi) => group.forEach((w) => { m[w] = gi; }));
  return m;
})();

// Map a raw word to its concept group (handles casing, punctuation, simple plural).
export const conceptOf = (word) => {
  const w = String(word || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!w || w.length < 2) return null;
  if (WORD_CONCEPT[w] !== undefined) return WORD_CONCEPT[w];
  if (w.endsWith("s") && WORD_CONCEPT[w.slice(0, -1)] !== undefined) return WORD_CONCEPT[w.slice(0, -1)];
  return null;
};

// True when any anchor word shares a concept with any URL word (similar meaning).
export const sharesMeaning = (textWords, urlWords) => {
  const concepts = new Set();
  for (const w of textWords) { const c = conceptOf(w); if (c !== null) concepts.add(c); }
  if (concepts.size === 0) return false;
  for (const w of urlWords) { const c = conceptOf(w); if (c !== null && concepts.has(c)) return true; }
  return false;
};

// Generic / non-descriptive anchor phrases (the classic "click here" problem). On their
// own they describe nothing — but see isDescriptiveUrl: when such a link points to a
// descriptive URL, the destination supplies the context and the link is still useful.
export const GENERIC_ANCHORS = new Set([
  "click here", "click me", "read more", "more", "details", "here", "learn more",
  "view more", "view details", "view detail", "shop now", "learn", "see more",
  "view", "read", "explore", "see details", "find out more", "go", "link",
]);

export const isGenericAnchor = (text) => {
  const norm = String(text || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  return norm !== "" && GENERIC_ANCHORS.has(norm);
};

// True when the URL's own path is descriptive/on-topic — i.e. the destination conveys
// meaning even if the anchor text doesn't. A slug is descriptive when it contains a
// known concept word (car/finance/service…) OR has ≥2 meaningful word tokens (numbers
// and short fragments — typically IDs — don't count). e.g.
//   /cars/used-white-2024-toyota-corolla-00102716  → true  (car keywords)
//   /p?id=5                                          → false (no descriptive tokens)
export const isDescriptiveUrl = (href) => {
  let path = String(href || "");
  try { path = path.startsWith("http") ? new URL(path).pathname : path; } catch { /* keep raw */ }
  const tokens = path.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
    .filter((w) => w.length > 2 && !/^\d+$/.test(w)); // drop short bits and pure-number IDs
  if (tokens.length === 0) return false;
  if (tokens.some((w) => conceptOf(w) !== null)) return true; // an on-topic word is present
  return tokens.length >= 2; // otherwise a multi-word slug still reads as descriptive
};

// True when a link points to a maps / location service. Such links are inherently a
// "directions / location / reviews" link to the business's own listing — always
// contextual for a local business (dealership), regardless of the anchor wording (which
// is usually the address or the review rating). Covers Google/Apple/Bing Maps, Waze,
// OpenStreetMap and the goo.gl / maps.app.goo.gl short links.
export const isMapUrl = (href) => {
  let host = "", path = "";
  try {
    const u = new URL(String(href || ""), "https://relative.invalid");
    host = u.hostname.toLowerCase();
    path = u.pathname.toLowerCase();
  } catch {
    const s = String(href || "").toLowerCase();
    host = s; path = s;
  }
  if (/(^|\.)maps\.google\./.test(host)) return true;                       // maps.google.com
  if (/(^|\.)google\.[a-z.]+$/.test(host) && path.includes("/maps")) return true; // google.com/maps
  if (host === "maps.app.goo.gl") return true;                              // GMB share links
  if (host.includes("goo.gl") && path.includes("maps")) return true;
  if (host.includes("maps.apple.com")) return true;
  if (host.includes("bing.") && path.includes("/maps")) return true;
  if (host.includes("waze.com")) return true;
  if (host.includes("openstreetmap.org")) return true;
  return false;
};

// ── Social media links ──────────────────────────────────────────────────────
export const SOCIAL_HOSTS = [
  "facebook.com", "fb.com", "fb.me", "fb.watch",
  "instagram.com", "twitter.com", "x.com", "t.co",
  "youtube.com", "youtu.be", "linkedin.com", "tiktok.com",
  "pinterest.com", "yelp.com", "snapchat.com", "threads.net", "reddit.com", "wa.me",
];

const _hostOf = (href) => {
  try {
    return new URL(String(href || ""), "https://relative.invalid")
      .hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");
  } catch { return ""; }
};

// True when a link points to a social-media platform.
export const isSocialUrl = (href) => {
  const host = _hostOf(href);
  if (!host || host === "relative.invalid") return false;
  return SOCIAL_HOSTS.some((s) => host === s || host.endsWith("." + s));
};

// The profile handle (first meaningful path segment), or null when the link is an
// opaque share / short link that doesn't name a profile — e.g. facebook.com/share/…,
// facebook.com/profile.php?id=…, fb.me/…, youtu.be/…, a permalink or a reel.
export const socialHandle = (href) => {
  const host = _hostOf(href);
  let path = "";
  try { path = new URL(String(href || ""), "https://relative.invalid").pathname.toLowerCase(); }
  catch { return null; }
  if (["fb.me", "fb.watch", "youtu.be", "t.co", "wa.me"].includes(host)) return null;
  const segs = path.split("/").filter(Boolean);
  if (segs.length === 0) return null;
  const first = segs[0];
  // No identifiable profile — share widgets, permalinks, posts, etc. → opaque.
  const opaqueFirst = new Set([
    "share", "sharer", "share_channel", "profile.php", "permalink.php",
    "groups", "p", "reel", "reels", "watch", "shorts", "story", "stories",
    "status", "posts", "embed", "intent", "home",
  ]);
  if (opaqueFirst.has(first)) return null;
  // Platforms that put the real name in the SECOND segment: linkedin.com/company/NAME,
  // linkedin.com/in/NAME, youtube.com/channel/NAME, youtube.com/c/NAME, facebook.com/pages/NAME/ID.
  const containerFirst = new Set(["company", "in", "school", "pub", "c", "channel", "user", "pages"]);
  if (containerFirst.has(first)) {
    const second = segs[1];
    return second ? second.replace(/^@/, "") : null;
  }
  return first.replace(/^@/, ""); // some platforms prefix handles with @
};

// A social link with no nameable profile (share widget / short link) — almost always
// the site's own, since those are generated by the site's own share buttons.
export const isOpaqueSocialShareUrl = (href) => isSocialUrl(href) && socialHandle(href) === null;
