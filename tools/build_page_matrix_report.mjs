// ─────────────────────────────────────────────────────────────────────────────
// Builds docs/reports/Automotive-Page-Level-Parameter-Matrix.html
//
// The sibling of Automotive-Site-Type-Parameter-Matrix.html. That report answers
// "which parameters matter for which KIND OF BUSINESS". This one adds the second
// axis the audit actually runs on: which parameters matter on which PAGE of that
// business's crawl plan — 4 site types × 6 key pages = 24 columns.
//
// Nothing here is hand-rated. The section tilt, the site profile and the
// per-parameter importance are imported from the live config; the in-section
// weights and page gates are transcribed from the metric services with the line
// reference against each block. Run by hand:
//
//   node tools/build_page_matrix_report.mjs
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { importanceFor, PARAM_IMPORTANCE } from "../Backend/config/parameterImportance.js";
import { siteWeightMultipliers, KEY_PAGES_BY_SUBTYPE } from "../Backend/config/siteTypeProfiles.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/reports/Automotive-Page-Level-Parameter-Matrix.html");
const BUILT = "6 August 2026";

const SECTIONS = [
  "Technical Performance", "On Page SEO", "Accessibility", "Security/Compliance",
  "UX & Content Structure", "Conversion & Lead Flow",
  "AIO (AI-Optimization) Readiness", "AEO (Answer Engine Optimization)",
];
const SEC_SHORT = ["Tech", "SEO", "A11y", "Sec", "UX", "Conv", "AIO", "AEO"];
const SEC_KEY = ["tech", "seo", "a11y", "sec", "ux", "conv", "aio", "aeo"];

// workers/singleAuditWorker.js:224 — the live table for a full-site audit.
const PAGE_W = {
  home:     { tech:18, seo:18, a11y:8,  sec:12, ux:10, conv:14, aio:8,  aeo:12 },
  srp:      { tech:20, seo:20, a11y:7,  sec:8,  ux:11, conv:14, aio:8,  aeo:12 },
  vdp:      { tech:18, seo:18, a11y:8,  sec:8,  ux:11, conv:18, aio:7,  aeo:12 },
  specials: { tech:15, seo:16, a11y:8,  sec:13, ux:11, conv:17, aio:8,  aeo:12 },
  lease:    { tech:15, seo:16, a11y:8,  sec:14, ux:11, conv:16, aio:8,  aeo:12 },
  trade:    { tech:14, seo:12, a11y:9,  sec:16, ux:11, conv:22, aio:7,  aeo:9  },
  finance:  { tech:14, seo:12, a11y:9,  sec:22, ux:9,  conv:18, aio:7,  aeo:9  },
  service:  { tech:16, seo:16, a11y:8,  sec:10, ux:11, conv:19, aio:8,  aeo:12 },
  about:    { tech:14, seo:16, a11y:11, sec:10, ux:15, conv:12, aio:10, aeo:12 },
  content:  { tech:14, seo:22, a11y:9,  sec:9,  ux:15, conv:7,  aio:10, aeo:14 },
  booking:  { tech:15, seo:12, a11y:11, sec:10, ux:14, conv:25, aio:6,  aeo:7  },
  pricing:  { tech:14, seo:16, a11y:9,  sec:8,  ux:13, conv:20, aio:8,  aeo:12 },
  locations:{ tech:15, seo:18, a11y:9,  sec:8,  ux:16, conv:14, aio:7,  aeo:13 },
  generic:  { tech:18, seo:17, a11y:8,  sec:12, ux:11, conv:14, aio:8,  aeo:12 },
};

const TYPES = ["franchise", "independent", "service", "repair"];
const TYPE_LABEL = {
  franchise: "Franchise dealer", independent: "Independent lot",
  service: "Service chain", repair: "Repair garage",
};
const PAGE_LABEL = {
  home: "Home", vdp: "VDP", srp: "SRP", finance: "Finance", trade: "Trade-in",
  lease: "Lease", specials: "Specials", booking: "Booking", service: "Services",
  pricing: "Pricing", locations: "Locations", about: "About", content: "Content",
};
const PLAN = Object.fromEntries(TYPES.map((t) => [t, ["home", ...KEY_PAGES_BY_SUBTYPE[t]]]));
const SELLS = (t) => t === "franchise" || t === "independent";

// ── Parameter registry: in-section base weight + the page/site gate that decides
// whether it carries weight at all. Transcribed from the metric services. ─────
const ALL = () => true;
const on = (...pages) => (p) => pages.includes(p);
const inv = (...pages) => (p, t) => SELLS(t) && pages.includes(p);

const REG = {
  // technicalMetrics.js:2545. NOTE the scale: `components[]` only produce
  // Graded_Percentage. The `Percentage` that OverAll() consumes is PSI's own
  // Lighthouse category score, whose weights are fixed by Google.
  "Technical Performance": {
    scale: "lighthouse", src: "technicalMetrics.js:2545 / :2578",
    scaleNote: "headline is PageSpeed's own Lighthouse score — only the five metrics carrying values below reach it; the rest feed Graded_Percentage, a diagnostic",
    lh: { FCP: 10, SI: 10, LCP: 25, TBT: 30, CLS: 25 },
    params: {
      LCP:{w:22,g:ALL}, INP:{w:20,g:ALL}, CLS:{w:18,g:ALL}, FCP:{w:8,g:ALL},
      TTFB:{w:8,g:ALL}, SI:{w:6,g:ALL}, Render_Blocking:{w:5,g:ALL},
      Resource_Optimization:{w:5,g:ALL}, Compression:{w:4,g:ALL}, Caching:{w:4,g:ALL},
      Redirect_Chains:{w:3,g:ALL},
      Sold_Vehicle:{w:5,g:inv("vdp","srp"),gl:"VDP/SRP · sells vehicles"},
      TBT:{w:0,g:ALL,note:"reaches the score only through the fixed Lighthouse formula"},
    },
  },
  "On Page SEO": {
    scale: "ratio", src: "seoMetrics.js:4705",
    params: {
      Title:{w:.10,g:ALL}, Title_Uniqueness:{w:.03,g:ALL}, Title_Location_Optimization:{w:.02,g:ALL},
      Canonical:{w:.11,g:ALL}, H1:{w:.07,g:ALL}, Heading_Hierarchy:{w:.04,g:ALL},
      Meta_Description:{w:.06,g:ALL}, Meta_Description_Uniqueness:{w:.03,g:ALL},
      Robots_Txt:{w:.08,g:ALL}, URL_Structure:{w:.05,g:ALL}, URL_Slugs:{w:.03,g:ALL},
      Image:{w:.08,g:ALL}, Links:{w:.07,g:ALL}, Open_Graph:{w:.03,g:ALL},
      Twitter_Card:{w:.02,g:ALL}, Social_Links:{w:.01,g:ALL}, Semantic_Tags:{w:.05,g:ALL},
      Viewport:{w:.03,g:ALL},
      Content_Relevance:{w:0,g:ALL,note:"computed but unweighted since 2026-07-07 (hidden pending redesign)"},
      VDP_Content_Uniqueness:{w:.12,g:inv("vdp"),gl:"VDP · sells vehicles"},
      SRP_Index_Control:{w:.08,g:inv("srp"),gl:"SRP · sells vehicles"},
      SRP_To_VDP_Links:{w:.06,g:inv("srp"),gl:"SRP · sells vehicles"},
    },
  },
  Accessibility: {
    scale: "ratio", src: "accessibilityMetrics.js:1075 (severity ×3/×2/×1)",
    params: {
      Color_Contrast:{w:3,g:ALL}, Label:{w:3,g:ALL}, Html_Has_Lang:{w:3,g:ALL},
      Keyboard_Navigation:{w:3,g:ALL},
      Image_Alt:{w:2,g:ALL}, Link_Name:{w:2,g:ALL}, Button_Name:{w:2,g:ALL},
      Aria_Roles:{w:2,g:ALL}, Aria_Allowed_Attr:{w:2,g:ALL}, Document_Title:{w:2,g:ALL},
      Meta_Viewport:{w:2,g:ALL}, Target_Size:{w:2,g:ALL}, Reflow:{w:2,g:ALL},
      Heading_Order:{w:1,g:ALL}, Landmarks:{w:1,g:ALL}, List:{w:1,g:ALL},
      Skip_Links:{w:1,g:ALL}, Interactive_Element_Affordance:{w:1,g:ALL},
      Focus_Order:{w:0,g:ALL,note:"sub-part of the Keyboard_Navigation composite (8) — importance() IS applied inside the composite"},
      Focusable_Content:{w:0,g:ALL,note:"sub-part of the Keyboard_Navigation composite (6) — importance() IS applied inside the composite"},
      Tab_Index:{w:0,g:ALL,note:"sub-part of the Keyboard_Navigation composite (5) — importance() IS applied inside the composite"},
      Aria_Hidden_Focus:{w:0,g:ALL,note:"sub-part of the Keyboard_Navigation composite (3) — importance() IS applied inside the composite"},
    },
  },
  "Security/Compliance": {
    scale: "deduction", src: "securityCompliance.js:2374",
    scaleNote: "deducts from 100 rather than averaging; the site tilt is rescaled to preserve the original weight sum",
    params: {
      HTTPS:{w:13,g:ALL}, SSL:{w:7,g:ALL}, SSL_Expiry:{w:4,g:ALL}, TLS_Version:{w:5,g:ALL},
      HSTS:{w:5,g:ALL}, CSP:{w:9,g:ALL}, X_Frame_Options:{w:4,g:ALL},
      X_Content_Type_Options:{w:3,g:ALL}, Referrer_Policy:{w:2,g:ALL},
      Permissions_Policy:{w:2,g:ALL}, Cookie_Flags:{w:5,g:ALL}, Third_Party_Cookies:{w:2,g:ALL},
      Reputation:{w:9,g:ALL}, SQLi_Exposure:{w:4,g:ALL}, XSS:{w:4,g:ALL},
      Forms_Use_HTTPS:{w:4,g:ALL}, Weak_Default_Credentials:{w:2,g:ALL},
      Admin_Panel_Public:{w:1,g:ALL}, Cookie_Consent:{w:3,g:ALL}, Privacy_Policy:{w:3,g:ALL},
      Privacy_Compliance:{w:4,g:ALL},
      Finance_Form_Security:{w:10,g:inv("finance","trade"),gl:"Finance/Trade · sells vehicles"},
      Legal_Disclaimers:{w:8,g:on("finance","specials","lease","vdp"),gl:"Finance/Specials/Lease/VDP"},
    },
  },
  "UX & Content Structure": {
    scale: "ratio", src: "uxContentStructure.js:2423",
    params: {
      Text_Readability:{w:.10,g:ALL}, Intrusive_Interstitials:{w:.11,g:ALL},
      Navigation_Discoverability:{w:.11,g:ALL}, Above_the_Fold_Content:{w:.09,g:ALL},
      Broken_Links:{w:.11,g:ALL}, Mobile_Experience:{w:.09,g:ALL},
      Interactive_Click_Feedback:{w:.06,g:ALL}, Loading_Feedback:{w:.05,g:ALL},
      Hierarchy_Flow_Clarity:{w:.07,g:ALL}, Content_Density_Balance:{w:.05,g:ALL},
      Layout_Consistency:{w:.05,g:ALL}, Sticky_Header_Usage:{w:.05,g:ALL},
      In_Page_Navigation:{w:.04,g:ALL}, Breadcrumbs:{w:.05,g:ALL},
      Inventory_Filtering:{w:.10,g:inv("srp"),gl:"SRP · sells vehicles"},
      No_Results_UX:{w:.06,g:inv("srp"),gl:"SRP · sells vehicles"},
      Vehicle_Image_Gallery:{w:.10,g:inv("vdp"),gl:"VDP · sells vehicles"},
    },
  },
  "Conversion & Lead Flow": {
    scale: "ratio", src: "conversionLeadFlow.js:2196",
    params: {
      CTA_Presence:{w:.07,g:ALL}, CTA_Clarity:{w:.05,g:ALL}, CTA_Flow_Alignment:{w:.06,g:ALL},
      CTA_Crowding:{w:.05,g:ALL},
      Form_Presence:{w:.09,g:on("trade","finance","about","service","booking","pricing"),gl:"Trade/Finance/About/Service/Booking/Pricing"},
      Form_Length:{w:.04,g:ALL,form:1}, Required_vs_Optional_Fields:{w:.04,g:ALL,form:1},
      Inline_Validation:{w:.05,g:ALL,form:1}, Submit_Button_Clarity:{w:.025,g:ALL,form:1},
      MultiStep_Form_Progress:{w:.015,g:ALL,form:1}, Friendly_Error_Handling:{w:.02,g:ALL,form:1},
      Microcopy_Clarity:{w:.02,g:ALL,form:1}, Thank_You_Pages:{w:.03,g:ALL,form:1},
      Trust_Badges:{w:.05,g:ALL,form:1},
      Testimonials:{w:.04,g:ALL}, Reviews:{w:.03,g:ALL}, Client_Logos:{w:.01,g:ALL},
      Case_Studies_Accessibility:{w:.01,g:ALL}, Certifications_Awards:{w:.01,g:ALL},
      Pricing_Transparency:{w:.06,gl:"VDP/Specials/Lease/Finance — or Service/Pricing on a servicing site",
        g:(p,t)=>(SELLS(t)&&["vdp","specials","lease","finance"].includes(p))||(!SELLS(t)&&["service","pricing"].includes(p))},
      Vehicle_History:{w:.04,g:inv("vdp"),gl:"VDP · sells vehicles"},
      Click_To_Call:{w:.04,g:ALL}, Chat_Experience:{w:.03,g:ALL}, Lead_Magnets:{w:.02,g:ALL},
      GA4_Installed:{w:.05,g:ALL}, GTM_Configuration:{w:.03,g:ALL},
      Conversion_Tracking:{w:.04,g:ALL}, CRM_Integration:{w:.02,g:ALL},
      TradeIn_Flow:{w:.15,g:inv("trade"),gl:"Trade-in · sells vehicles"},
      Financing_Flow:{w:.10,g:inv("finance"),gl:"Finance · sells vehicles"},
      Finance_Calculator:{w:.10,g:inv("finance","vdp"),gl:"Finance/VDP · sells vehicles"},
      Appointment_Booking:{w:.12,gl:"Service — or Booking/Home/generic on a servicing site",
        g:(p,t)=>p==="service"||(!SELLS(t)&&["booking","home","generic"].includes(p))},
      Incentives_Displayed:{w:.06,g:on("service","specials","lease"),gl:"Service/Specials/Lease"},
    },
  },
  "AIO (AI-Optimization) Readiness": {
    scale: "ratio", src: "aioReadiness.js:1025",
    params: {
      Structured_Data:{w:.20,g:ALL}, Content_NLP_Friendly:{w:.16,g:ALL},
      Answer_Oriented_Structure:{w:.12,g:ALL}, Keywords_Entities_Annotated:{w:.10,g:ALL},
      Content_Updated_Regularly:{w:.10,g:ALL}, Internal_Linking_AI_Friendly:{w:.10,g:ALL},
      Topical_Focus_Clarity:{w:.10,g:ALL},
      AI_Agentic_Browsing:{w:.06,g:(p)=>!["about","content"].includes(p),gl:"every page except About/Content"},
    },
  },
  "AEO (Answer Engine Optimization)": {
    scale: "ratio", src: "aeoService.js:59",
    params: {
      Schema_Markup:{w:.20,g:ALL}, Answer_First_Structure:{w:.15,g:ALL}, Bot_Access:{w:.11,g:ALL},
      Structured_Content:{w:.09,g:ALL},
      FAQ_QA_Blocks:{w:.07,gl:"Content/Finance/Service/VDP — or Pricing on a servicing site",
        g:(p,t)=>["content","finance","service","vdp"].includes(p)||(!SELLS(t)&&p==="pricing")},
      Entity_Recognition:{w:.07,g:ALL}, Citation_NAP_Consistency:{w:.06,g:ALL},
      Citations_Attribution:{w:.05,g:ALL}, Topical_Authority:{w:.05,g:ALL},
      Index_Coverage:{w:.04,g:ALL},
      SameAs_Validation:{w:.04,gl:"Home/About — or Locations on a servicing site",
        g:(p,t)=>["home","about"].includes(p)||(!SELLS(t)&&p==="locations")},
      EEAT_Composite:{w:.10,g:on("about","content","service","home"),gl:"About/Content/Service/Home"},
      Llms_Txt:{w:.02,g:ALL},
    },
  },
};

const TIER = { 3: "Most important", 2: "Important", 1: "Recommended" };
const SEC_ABBR = Object.fromEntries(SECTIONS.map((s, i) => [s, SEC_SHORT[i]]));
const COL = { franchise: 0, independent: 1, service: 2, repair: 3 };

// ── Computation ──────────────────────────────────────────────────────────────
function sectionShares(page, type) {
  const w = PAGE_W[page] || PAGE_W.generic;
  const m = siteWeightMultipliers(type) || [1, 1, 1, 1, 1, 1, 1, 1];
  const raw = SEC_KEY.map((k, i) => w[k] * m[i]);
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((v) => (v / sum) * 100);
}

function cell(page, type) {
  const shares = sectionShares(page, type);
  const out = {};
  SECTIONS.forEach((sec, si) => {
    const def = REG[sec];
    const imp = importanceFor(sec);
    const share = shares[si];
    const live = [];
    for (const [key, d] of Object.entries(def.params)) {
      const applicable = d.g(page, type);
      const i = imp(key, type);
      out[key] = { sec, applicable, base: d.w, imp: i, eff: 0, form: !!d.form };
      if (applicable && d.w > 0 && i > 0) live.push([key, d.w * i]);
    }
    if (def.scale === "lighthouse") {
      for (const [k, lw] of Object.entries(def.lh)) out[k].eff = share * (lw / 100);
    } else if (def.scale === "deduction") {
      const origAll = Object.values(def.params).reduce((s, d) => s + d.w, 0);
      const tiltAll = Object.entries(def.params).reduce((s, [k, d]) => s + d.w * imp(k, type), 0);
      const rescale = tiltAll > 0 ? origAll / tiltAll : 1;
      for (const [k, w] of live) out[k].eff = share * ((w * rescale) / 100);
    } else {
      const tot = live.reduce((s, [, w]) => s + w, 0);
      for (const [k, w] of live) out[k].eff = tot > 0 ? share * (w / tot) : 0;
    }
  });
  return { shares, out };
}

// A parameter is "gated" when it does not run on every page — those are the ones
// a crawl slot actually buys. Detected by probing the gate rather than by hand.
const DEALER_PAGES = ["home", "vdp", "srp", "trade", "lease", "finance", "service", "specials", "about", "content"];
const SERVICING_PAGES = ["home", "booking", "pricing", "service", "locations", "about", "content"];
const isGated = (d) => {
  const probe = (t, pages) => pages.map((p) => d.g(p, t));
  const all = [...probe("franchise", DEALER_PAGES), ...probe("repair", SERVICING_PAGES)];
  return all.some(Boolean) && !all.every(Boolean);
};

const COLS = [];
const M = {};
for (const t of TYPES) for (const p of PLAN[t]) { COLS.push([t, p]); M[`${t}|${p}`] = cell(p, t); }
const at = (t, p) => M[`${t}|${p}`];

const PARAMS = [];
for (const sec of SECTIONS) for (const [key, d] of Object.entries(REG[sec].params)) PARAMS.push({ sec, key, d });

// The page types each classifier can actually emit — pageClassifier.js
// MATCH_ORDER (dealers) and SERVICE_MATCH_ORDER (servicing). A servicing site
// has no route to a `finance` or `vdp` page type at all, which is what separates
// "the plan didn't visit it" from "this business cannot have it".
const REACHABLE_PAGES = {
  dealer:    ["home", "vdp", "srp", "trade", "lease", "finance", "service", "specials", "about", "content", "generic"],
  servicing: ["home", "booking", "pricing", "service", "locations", "about", "content", "generic"],
};

// Why is a parameter never scored for this site type?
//   diagnostic — measured, but its section's headline doesn't read it
//   unweighted — shown in the report, carries weight 0
//   siteNA     — this kind of business structurally cannot have it
//   planGap    — it IS scoreable for this business, but no page in the plan opens the gate
function neverKind(t, sec, key) {
  const def = REG[sec];
  const d = def.params[key];
  if (def.scale === "lighthouse" && !(key in def.lh)) return "diagnostic";
  if (d.w === 0) return "unweighted";
  if (importanceFor(sec)(key, t) === 0) return "siteNA";
  const pages = REACHABLE_PAGES[SELLS(t) ? "dealer" : "servicing"];
  return pages.some((p) => d.g(p, t)) ? "planGap" : "siteNA";
}

const coverage = {};
for (const t of TYPES) {
  const scored = new Set();
  const never = { diagnostic: [], unweighted: [], siteNA: [], planGap: [] };
  for (const { sec, key } of PARAMS) {
    if (PLAN[t].some((p) => at(t, p).out[key].eff > 0)) { scored.add(key); continue; }
    never[neverKind(t, sec, key)].push({ sec, key });
  }
  coverage[t] = { scored: scored.size, never };
}

// The page-gated parameters each slot buys: those that do not run everywhere and
// do score here. `only` marks the ones no other page in the plan can reach.
const unlocks = {};
for (const t of TYPES) {
  unlocks[t] = {};
  for (const p of PLAN[t]) {
    unlocks[t][p] = PARAMS
      .filter(({ key, d }) => isGated(d) && at(t, p).out[key].eff > 0)
      .map(({ sec, key }) => ({
        sec, key, eff: at(t, p).out[key].eff,
        only: PLAN[t].filter((q) => at(t, q).out[key].eff > 0).length === 1,
      }))
      .sort((a, b) => b.eff - a.eff);
  }
}

const topN = (t, p, n = 12) =>
  PARAMS.map(({ sec, key }) => ({ sec, key, ...at(t, p).out[key] }))
    .filter((r) => r.eff > 0).sort((a, b) => b.eff - a.eff).slice(0, n);

// ── Rendering helpers ────────────────────────────────────────────────────────
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const nice = (k) => k.replace(/_/g, " ");
const f1 = (v) => (v >= 10 ? v.toFixed(0) : v.toFixed(1));

function heat(v) {
  if (v <= 0) return "";
  const a = Math.min(1, Math.pow(v / 5.5, 0.7));
  return ` style="background:rgba(242,100,25,${(a * 0.62).toFixed(3)});${a > 0.55 ? "color:#fff;font-weight:700" : ""}"`;
}
function shareHeat(v) {
  const a = Math.min(1, Math.pow((v - 4) / 26, 0.85));
  return ` style="background:rgba(15,28,44,${(Math.max(0, a) * 0.5).toFixed(3)});${a > 0.55 ? "color:#fff;font-weight:700" : ""}"`;
}

const colHeadHtml = (cls = "") => `
  <tr class="${cls} tsub">
    <th class="pn"></th>
    ${TYPES.map((t) => `<th class="tstart" colspan="${PLAN[t].length}">${TYPE_LABEL[t]}</th>`).join("")}
  </tr>
  <tr class="${cls}">
    <th class="pn">Parameter</th>
    ${COLS.map(([t, p], i) => {
      const first = i === 0 || COLS[i - 1][0] !== t;
      return `<th class="rot${first ? " tstart" : ""}"><span>${PAGE_LABEL[p]}</span></th>`;
    }).join("")}
  </tr>`;

// ── Master matrix ────────────────────────────────────────────────────────────
function masterMatrix() {
  let rows = "";
  for (const sec of SECTIONS) {
    const def = REG[sec];
    rows += `<tr class="secrow"><td class="pn">${esc(sec)}<span class="srcnote">${esc(def.src)}</span></td>${def.scaleNote ? `<td class="scalenote" colspan="${COLS.length}">${esc(def.scaleNote)}</td>` : COLS.map(() => "<td></td>").join("")}</tr>`;
    for (const [key, d] of Object.entries(def.params)) {
      const cells = COLS.map(([t, p]) => {
        const c = at(t, p).out[key];
        if (!c.applicable || c.imp === 0) return `<td class="na">—</td>`;
        if (c.eff <= 0) return `<td class="zero">·</td>`;
        return `<td${heat(c.eff)}>${f1(c.eff)}${c.form ? "<i>*</i>" : ""}</td>`;
      }).join("");
      const rating = PARAM_IMPORTANCE[sec]?.[key] || [];
      const pat = rating.map((v) => (v === null ? "–" : v)).join("");
      rows += `<tr><td class="pn"><b>${esc(nice(key))}</b><span class="pat">${pat}</span>${d.note ? `<span class="pnote">${esc(d.note)}</span>` : ""}</td>${cells}</tr>`;
    }
  }
  return `<table class="matrix">${colHeadHtml("mh")}${rows}</table>`;
}

// ── Section-share matrix ─────────────────────────────────────────────────────
function shareMatrix() {
  const rows = SECTIONS.map((s, i) =>
    `<tr><td class="pn"><b>${esc(s)}</b></td>${COLS.map(([t, p]) => {
      const v = at(t, p).shares[i];
      return `<td${shareHeat(v)}>${v.toFixed(1)}</td>`;
    }).join("")}</tr>`).join("");
  return `<table class="matrix shares">${colHeadHtml("mh")}${rows}</table>`;
}

// ── Per-type dossier ─────────────────────────────────────────────────────────
const DOSSIER = {
  franchise: {
    tag: "Sells new + used under an OEM banner",
    lede: `A franchise store is the only one of the four that arrives with borrowed authority — the OEM's locator already resolves it as an entity, its model vocabulary is consistent, and it ranks on brand+geo almost by default. What it does not get for free is scale hygiene: templated titles across thousands of VDPs, faceted SRPs that manufacture duplicates, and the heaviest third-party tag stack in local retail sitting on the same origin as a credit application. Its plan spends four of five slots on the vehicle-sale funnel and the fifth on Reg-Z / Reg-M advertising compliance.`,
    slot: `<b>Slot 6 goes to Lease.</b> A franchise store advertises APR and lease payments, which puts it under Regulation Z and Regulation M — so the lease page carries the disclosure battery that an independent lot does not have to answer for.`,
  },
  independent: {
    tag: "Sells used, mixed-brand, no OEM banner",
    lede: `Structurally the same funnel as a franchise store, scored differently in two places. Trust has to be manufactured rather than borrowed — <b>Trust badges</b>, <b>Testimonials</b>, <b>Vehicle history</b> and <b>Click-to-call</b> all rise a tier, because a shopper cannot fall back on a manufacturer's name. And mixed-brand inventory arriving from several feeds with inconsistent make/model/trim naming is exactly what breaks entity extraction, so <b>Keywords &amp; entities annotated</b> rises too. Meanwhile the pure-scale problems relax: with a smaller URL count, index control and crawl depth stop being the binding constraint.`,
    slot: `<b>Slot 6 goes to Specials.</b> An independent lot advertises price and add-ons rather than APR — the FTC CARS Rule's primary target — so the offers page, not a lease page, is where its advertising exposure concentrates.`,
  },
  service: {
    tag: "Multi-branch servicing, no vehicle sales",
    lede: `The whole inventory block is gone and the funnel is a scheduler. Twelve parameters are renormalised out of the denominator rather than scored zero — that alone is worth about a section and a half of the score, and getting it wrong is the single largest source of false-low readings in an audit product. What replaces them is discovery: a chain is found branch by branch, so <b>NAP consistency</b>, <b>sameAs breadth</b> and <b>Locations</b> carry weight a dealer's plan never spends. AEO rises to 11 because service queries are questions, and answer engines resolve them directly.`,
    slot: `<b>Slot 5 goes to Locations.</b> A chain is discovered one branch at a time — the locations page is the only page in the plan where sameAs validation is scored for a servicing site.`,
  },
  repair: {
    tag: "Single-site garage or body shop, no vehicle sales",
    lede: `The most differentiated profile in the product: highest AEO weight of the four (13) and the lowest Security (8). Its customer cannot evaluate mechanical competence directly, so accreditation is the currency — <b>Certifications &amp; awards</b>, <b>E-E-A-T</b> and <b>Testimonials</b> all sit at the top tier. Its traffic is phone-dominated and often urgent, which lifts <b>Target size</b>, <b>Meta viewport</b> and <b>Click-to-call</b>. And the absence of a form is frequently the correct design here: the telephone is the funnel, so <b>Form presence</b> drops a tier rather than being scored as a miss.`,
    slot: `<b>Slot 5 goes to About.</b> A single-location garage has no brand badge to borrow and no branch network to enumerate, so it is found on its credentials — technicians, years in trade, ASE / I-CAR / VACC accreditation.`,
  },
};

const PAGE_NOTE = {
  home: "The URL the visitor typed, and the only page Stage 1 always audits. Every plan starts here.",
  vdp: "The single highest-value page in a dealer plan: it alone unlocks VDP uniqueness, the vehicle gallery, vehicle history and the on-VDP payment calculator.",
  srp: "The crawl spine. Index control and SRP→VDP linking are scored nowhere else, and neither is inventory filtering or the zero-result recovery path.",
  finance: "The heaviest compliance page in the product — Security takes 22 of the page's 100 before the site profile is applied.",
  trade: "Carries the single heaviest conversion parameter in the engine: Trade-in flow at 0.15 in-section.",
  lease: "Regulation M territory. The lease page is one of only four page types where legal disclaimers are assessed at all.",
  specials: "The FTC CARS Rule surface — advertised price, add-ons and expiry. Also the only page besides Service where incentives are scored.",
  booking: "The entire funnel for a servicing business. Conversion takes 25 of 100 before the site profile — the highest single-section share of any page in any plan.",
  service: "The service menu. On a servicing site it carries booking, pricing, incentives, FAQ blocks and E-E-A-T simultaneously.",
  pricing: "Read by customers and quoted by answer engines. Published pricing is the strongest differentiator a servicing business has, and until the servicing gate was added it was never measured for them at all.",
  locations: "Local discovery and NAP. The only page in a servicing plan where sameAs breadth is scored.",
  about: "Credentials and identity. Carries E-E-A-T and sameAs, and is one of two page types where AI agentic browsing is deliberately not assessed.",
  content: "The highest On-Page SEO share of any page in any plan (22 before profile), and the highest AEO. FAQ blocks and E-E-A-T both land here.",
};

const groupBySec = (list) => {
  const bySec = {};
  for (const n of list) (bySec[n.sec] ||= []).push(n.key);
  return Object.entries(bySec)
    .map(([s, ks]) => `<i>${esc(SEC_ABBR[s])}:</i> ${ks.map(nice).map(esc).join(", ")}`)
    .join(" · ");
};

function dossier(t) {
  const d = DOSSIER[t];
  const pages = PLAN[t];
  const nev = coverage[t].never;

  const pageBlocks = pages.map((p) => {
    const top = topN(t, p, 10);
    const ex = unlocks[t][p];
    return `
    <div class="pgcard">
      <div class="pgh"><h4>${PAGE_LABEL[p]}</h4><span class="pgshare">${SEC_SHORT.map((s, i) => `${s} ${at(t, p).shares[i].toFixed(0)}`).join(" · ")}</span></div>
      <p class="pgnote">${PAGE_NOTE[p]}</p>
      <div class="pgcols">
        <div>
          <div class="lbl">Heaviest parameters on this page</div>
          <table class="mini">${top.map((r) => `<tr><td>${esc(nice(r.key))}</td><td class="n">${r.eff.toFixed(2)}%</td></tr>`).join("")}</table>
        </div>
        <div>
          <div class="lbl">Page-gated parameters this slot buys${ex.length ? "" : " — none"}</div>
          ${ex.length ? `<table class="mini">${ex.map((r) => `<tr><td>${esc(nice(r.key))}${r.only ? '<b class="only">only here</b>' : ""}</td><td class="n">${r.eff.toFixed(2)}%</td></tr>`).join("")}</table>`
            : `<p class="none">Nothing page-gated lands here — this slot contributes a second sample of the parameters every page carries, not new coverage.</p>`}
        </div>
      </div>
    </div>`;
  }).join("");

  return `
  <div class="sec keep">
    <div class="sech"><span class="num">${TYPES.indexOf(t) + 1}</span><h3>${TYPE_LABEL[t]}</h3><span class="tag">${d.tag}</span></div>
    <p>${d.lede}</p>
    <div class="planbar">${pages.map((p) => `<span>${PAGE_LABEL[p]}</span>`).join("<i>→</i>")}</div>
    <p class="slotnote">${d.slot}</p>
    <div class="cov">
      <div><b>${coverage[t].scored}</b><span>parameters reachable across the six-page plan</span></div>
      <div><b>${nev.siteNA.length}</b><span>structurally absent — this business cannot have them</span></div>
      <div><b>${nev.planGap.length}</b><span>scoreable for this business, but no page in the plan opens the gate</span></div>
      <div><b>${nev.diagnostic.length + nev.unweighted.length}</b><span>measured and shown, but carry no weight in any section</span></div>
    </div>
    ${nev.planGap.length ? `<p class="nevlist gap"><b>Plan gap —</b> ${groupBySec(nev.planGap)}. Every one of these is unlocked by a single Service or About slot.</p>` : ""}
    ${nev.siteNA.length ? `<p class="nevlist"><b>Structurally absent:</b> ${groupBySec(nev.siteNA)}</p>` : ""}
    ${pageBlocks}
  </div>`;
}

// ── Biggest movers, franchise → repair ───────────────────────────────────────
function movers() {
  const rows = [];
  for (const { sec, key, d } of PARAMS) {
    if (d.w === 0) continue;
    const r = PARAM_IMPORTANCE[sec]?.[key];
    if (!r) continue;
    const fr = r[0], rp = r[3];
    if (fr === rp) continue;
    rows.push({ sec, key, fr, rp, dir: rp === null ? -99 : rp - fr });
  }
  rows.sort((a, b) => a.dir - b.dir || a.key.localeCompare(b.key));
  const up = rows.filter((r) => r.dir > 0).reverse();
  const down = rows.filter((r) => r.dir < 0 && r.dir !== -99);
  const na = rows.filter((r) => r.dir === -99);
  const cell = (r) => `<tr><td>${esc(nice(r.key))}</td><td class="s">${SEC_ABBR[r.sec]}</td><td class="n">${TIER[r.fr]} → ${r.rp === null ? "<b>N/A</b>" : TIER[r.rp]}</td></tr>`;
  return `
  <div class="two">
    <div><div class="lbl">Rises on a repair garage</div><table class="mini wide">${up.map(cell).join("")}</table></div>
    <div><div class="lbl">Falls on a repair garage</div><table class="mini wide">${down.map(cell).join("")}</table></div>
  </div>
  <div class="lbl" style="margin-top:8px">Disappears entirely — renormalised out, never scored zero</div>
  <table class="mini wide cols3">${na.map(cell).join("")}</table>`;
}

// ── The short run ────────────────────────────────────────────────────────────
function shortRun() {
  const t = "repair";
  const got = ["home", "service", "about"];
  const missed = ["booking", "pricing", "content"];
  const lost = [];
  for (const { sec, key, d } of PARAMS) {
    if (d.w === 0) continue;
    const inShort = got.some((p) => at(t, p).out[key].eff > 0);
    const inFull = PLAN[t].some((p) => at(t, p).out[key].eff > 0);
    if (inFull && !inShort) lost.push({ sec, key, eff: Math.max(...missed.map((p) => at(t, p).out[key].eff)) });
  }
  lost.sort((a, b) => b.eff - a.eff);
  return { lost, got, missed };
}

// ── Findings ─────────────────────────────────────────────────────────────────
const deadRatings = [];
for (const [sec, table] of Object.entries(PARAM_IMPORTANCE)) {
  for (const key of Object.keys(table)) {
    const d = REG[sec]?.params?.[key];
    if (d && d.w === 0) deadRatings.push({ sec, key, note: d.note });
  }
}

// ── Assemble ─────────────────────────────────────────────────────────────────
const sr = shortRun();
const weightedCount = PARAMS.filter((p) => p.d.w > 0).length;

const html = `<meta charset="utf-8">
<title>Automotive Page-Level Parameter Matrix</title>
<style>
  @page { size: A4; margin: 14mm 12mm 16mm 12mm; }
  @page :first { margin: 0; }
  @page land { size: A4 landscape; margin: 10mm 8mm 12mm 8mm; }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: "Manrope", -apple-system, "Helvetica Neue", Arial, sans-serif;
    color: #0F1C2C; font-size: 8.6pt; line-height: 1.5; margin: 0; background: #FBFAF7; }
  h1,h2,h3,h4 { margin: 0; font-weight: 800; letter-spacing: -0.01em; }
  p { margin: 0 0 7px; }
  b { font-weight: 700; }

  .cover { height: 297mm; background: #0F1C2C; color: #fff; padding: 30mm 22mm;
    display: flex; flex-direction: column; justify-content: space-between; page-break-after: always; }
  .cover .kicker { color: #F26419; font-size: 10pt; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; }
  .cover h1 { font-size: 34pt; line-height: 1.08; margin: 14px 0 16px; max-width: 15em; }
  .cover .sub { font-size: 12pt; color: #A9AFB6; max-width: 34em; line-height: 1.6; }
  .cover .rule { height: 4px; width: 84px; background: #F26419; margin: 22px 0; }
  .cover .meta { font-size: 9pt; color: #8B949E; }
  .cover .meta b { color: #fff; font-weight: 700; }
  .cover .grid4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-top: 26px; }
  .cover .grid4 div { border-top: 2px solid #F26419; padding-top: 8px; }
  .cover .grid4 b { display: block; font-size: 17pt; color: #fff; }
  .cover .grid4 span { font-size: 8pt; color: #8B949E; line-height: 1.4; display: block; }

  .page { padding: 0 4mm; max-width: 190mm; margin: 0 auto; }
  .land { page: land; page-break-before: always; max-width: none; padding: 0; }

  .sec { margin: 0 0 14px; }
  .keep { page-break-inside: avoid; }
  .sech { display: flex; align-items: baseline; gap: 9px; border-bottom: 2px solid #0F1C2C;
    padding-bottom: 5px; margin: 0 0 9px; }
  .sech h3 { font-size: 13pt; }
  .sech h2 { font-size: 15pt; }
  .sech .num { background: #F26419; color: #fff; font-weight: 800; font-size: 8pt;
    width: 16px; height: 16px; border-radius: 50%; display: inline-flex;
    align-items: center; justify-content: center; flex: none; }
  .sech .tag { margin-left: auto; font-size: 7.6pt; color: #8B949E; font-weight: 600; }

  .lead { font-size: 9.6pt; line-height: 1.62; color: #26364a; }
  .callout { background: #FDE9DD; border-left: 3px solid #F26419; padding: 8px 11px; margin: 9px 0; }
  .callout b { color: #B34410; }
  .grey { background: #F2F1ED; border-left: 3px solid #C9CDD2; padding: 8px 11px; margin: 9px 0; }

  table { border-collapse: collapse; width: 100%; }
  .matrix { font-size: 5.9pt; table-layout: fixed; }
  .matrix th, .matrix td { border: 0.4px solid #E0DFD9; padding: 1.6px 1px; text-align: center; }
  .matrix .pn { width: 46mm; text-align: left; padding: 2px 4px; font-size: 6.2pt; }
  .matrix td.pn b { font-weight: 700; }
  .matrix .pat { float: right; font-family: ui-monospace, Menlo, monospace; color: #B7BCC2; letter-spacing: .5px; }
  .matrix .pnote { display: block; color: #B34410; font-size: 5.4pt; font-style: italic; line-height: 1.25; }
  .matrix .srcnote { float: right; font-weight: 400; color: #8B949E; font-size: 5.4pt; font-style: italic; }
  .matrix th.rot { height: 17mm; vertical-align: bottom; padding-bottom: 3px; background: #0F1C2C; }
  .matrix th.rot span { writing-mode: vertical-rl; transform: rotate(180deg); color: #fff;
    font-size: 6.2pt; font-weight: 700; white-space: nowrap; }
  .matrix .tsub th { background: #26364a; color: #F26419; font-size: 5.6pt; font-weight: 800;
    text-transform: uppercase; letter-spacing: .04em; padding: 2px 0; }
  .matrix .tstart { border-left: 1.6px solid #0F1C2C !important; }
  .matrix .secrow td { background: #0F1C2C; color: #fff; font-weight: 800; font-size: 6.4pt;
    text-align: left; letter-spacing: .02em; }
  .matrix td.na { color: #C9CDD2; }
  .matrix td.zero { color: #C9CDD2; }
  .matrix .scalenote { background: #26364a; color: #FDE9DD; font-weight: 500; font-style: italic;
    font-size: 5.6pt; text-align: left; padding-left: 6px; letter-spacing: 0; }
  .matrix td i { font-style: normal; color: #B34410; font-size: 5pt; vertical-align: super; }
  .matrix.shares { font-size: 6.6pt; }
  .matrix.shares td { padding: 3px 1px; }
  .matrix thead { display: table-header-group; }

  .mini { font-size: 7.2pt; }
  .mini td { border-bottom: 0.4px solid #E4E1D9; padding: 1.7px 3px; }
  .mini td.n { text-align: right; font-variant-numeric: tabular-nums; color: #B34410; font-weight: 700; white-space: nowrap; }
  .mini td.s { color: #8B949E; font-size: 6.6pt; }
  .mini.wide td:first-child { font-weight: 600; }
  .cols3 { column-count: 2; }
  .lbl { font-size: 6.6pt; font-weight: 800; text-transform: uppercase; letter-spacing: .1em;
    color: #8B949E; margin: 0 0 3px; }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .three { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }

  .planbar { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; margin: 7px 0 8px; }
  .planbar span { background: #0F1C2C; color: #fff; font-size: 7.2pt; font-weight: 700;
    padding: 2.5px 8px; border-radius: 9px; }
  .planbar i { color: #F26419; font-style: normal; font-weight: 800; }
  .slotnote { font-size: 8.2pt; background: #F2F1ED; padding: 6px 9px; border-left: 3px solid #F26419; }

  .cov { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin: 8px 0; }
  .cov div { border-top: 2px solid #E4E1D9; padding-top: 5px; }
  .cov b { font-size: 15pt; color: #B34410; display: block; line-height: 1.1; }
  .cov span { font-size: 7pt; color: #5C6674; line-height: 1.35; display: block; margin-top: 2px; }
  .nevlist { font-size: 7.2pt; color: #5C6674; background: #F2F1ED; padding: 6px 9px; margin-bottom: 5px; }
  .nevlist i { font-style: normal; font-weight: 700; color: #0F1C2C; }
  .nevlist.gap { background: #FDE9DD; border-left: 3px solid #F26419; }
  .nevlist.gap b { color: #B34410; }

  .pgcard { border: 0.6px solid #E4E1D9; background: #fff; padding: 7px 9px; margin: 7px 0;
    page-break-inside: avoid; }
  .pgh { display: flex; align-items: baseline; gap: 8px; border-bottom: 1px solid #E4E1D9;
    padding-bottom: 3px; margin-bottom: 4px; }
  .pgh h4 { font-size: 10pt; }
  .pgshare { margin-left: auto; font-size: 6.2pt; color: #8B949E; font-variant-numeric: tabular-nums; }
  .pgnote { font-size: 7.6pt; color: #5C6674; margin-bottom: 5px; }
  .pgcols { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .none { font-size: 7.2pt; color: #8B949E; font-style: italic; }
  .only { font-size: 5.6pt; font-weight: 800; text-transform: uppercase; letter-spacing: .06em;
    color: #fff; background: #F26419; padding: 0.5px 3px; border-radius: 2px; margin-left: 4px;
    vertical-align: 1px; }

  .find { border-left: 3px solid #B34410; background: #fff; padding: 7px 10px; margin: 7px 0;
    page-break-inside: avoid; }
  .find h4 { font-size: 9.2pt; margin-bottom: 3px; }
  .find .sev { font-size: 6.4pt; font-weight: 800; text-transform: uppercase; letter-spacing: .1em;
    color: #B34410; }
  .find p { font-size: 8pt; margin-bottom: 4px; }
  code { font-family: ui-monospace, Menlo, monospace; font-size: 7.4pt; background: #F2F1ED; padding: 0 2px; }
  .legend { display: flex; gap: 14px; flex-wrap: wrap; font-size: 7pt; color: #5C6674; margin: 6px 0 8px; }
  .legend b { color: #0F1C2C; }
  .sw { display: inline-block; width: 9px; height: 9px; vertical-align: -1px; margin-right: 3px; border: 0.4px solid #E0DFD9; }
</style>

<div class="cover">
  <div>
    <div class="kicker">DealerSiteAudit · Scoring reference</div>
    <h1>Which parameters matter on which page, for which kind of automotive website</h1>
    <div class="rule"></div>
    <div class="sub">Four site types × six key pages = the twenty-four columns an audit actually runs.
      Every number is computed from the shipped config, not rated by hand.</div>
  </div>
  <div>
    <div class="grid4">
      <div><b>${weightedCount}</b><span>weighted parameters across 8 sections</span></div>
      <div><b>24</b><span>site-type × key-page combinations</span></div>
      <div><b>12</b><span>inventory parameters renormalised out for servicing sites</span></div>
      <div><b>4</b><span>different scoring models beneath the 8 sections</span></div>
    </div>
    <p class="meta" style="margin-top:22mm">Built <b>${BUILT}</b> from <b>Backend/config/parameterImportance.js</b>,
      <b>Backend/config/siteTypeProfiles.js</b> and the eight metric services ·
      Companion to <b>Automotive-Site-Type-Parameter-Matrix</b>, which covers the site-type axis alone</p>
  </div>
</div>

<div class="page">

<div class="sec">
  <div class="sech"><h2>What this report is</h2></div>
  <p class="lead">The companion report rates every parameter against the four site types the platform audits.
  It answers <i>what kind of business is this</i>. It does not answer the question an audit actually has to
  resolve first: <b>this page, on this site — what is even scoreable here, and what is it worth?</b>
  A trade-in flow is worth 0.15 of the Conversion section, but only on a trade-in page, and only if the
  business sells vehicles. Move it one page over and it is worth nothing at all.</p>
  <p class="lead">So this report crosses the two axes. Four site types, each with a six-page crawl plan,
  gives twenty-four columns; ${weightedCount} weighted parameters give the rows. Every cell is that
  parameter's <b>share of that page's final score</b> — not its in-section weight, but what it actually
  controls once the page tilt, the site profile and the per-parameter importance ratio have all been applied.</p>
  <div class="callout"><b>Nothing here is a fresh judgement call.</b> The section tilt is read from
  <code>singleAuditWorker.js</code>, the site profile and applicability from <code>siteTypeProfiles.js</code>,
  and the importance ratios from <code>parameterImportance.js</code>. The in-section weights and page gates are
  transcribed from the eight metric services, with the source line printed against each block in the master
  matrix. If a number here is wrong, the engine is wrong the same way — which is the point of computing it
  rather than writing it.</div>
</div>

<div class="sec keep">
  <div class="sech"><span class="num">§</span><h3>How a cell is computed</h3></div>
  <p>Three multiplications and a renormalisation stand between a parameter and its influence on a score.</p>
  <div class="three">
    <div><div class="lbl">1 · Page tilt</div><p style="font-size:7.8pt">What kind of page is this? A finance page gives
      Security 22 of its 100; a booking page gives Conversion 25. Eighteen page types, one row each.</p></div>
    <div><div class="lbl">2 · Site profile</div><p style="font-size:7.8pt">What kind of business runs it? Applied as a
      <i>ratio</i> against the neutral row, so a franchise dealer's finance page keeps its Security tilt and a
      repair shop's contact page never inherits one.</p></div>
    <div><div class="lbl">3 · Parameter ratio</div><p style="font-size:7.8pt">Franchise is the reference column, so a
      franchise dealer scores exactly as it did before the ratings existed. Every other type moves relative to it.</p></div>
  </div>
  <p style="margin-top:6px">Then the section renormalises: <code>Σ(score × w) / Σ(w)</code> over the parameters that
  actually apply. That last step is what makes an N/A parameter harmless — it leaves the denominator instead of
  entering it as a zero.</p>
  <div class="grey"><b>Four sections do not use that formula, and it changes how you read their rows.</b><br>
  <b>Technical Performance</b> reports PageSpeed's own Lighthouse category score as its headline — fixed weights
  (LCP 25, TBT 30, CLS 25, FCP 10, SI 10) that no site profile can move. The twelve-component list, the delivery
  hygiene checks and <i>Sold vehicle</i> feed <code>Graded_Percentage</code>, a diagnostic the overall score never reads.<br>
  <b>Security / Compliance</b> deducts from 100 rather than averaging, and the site tilt is rescaled to preserve the
  original weight sum — so a garage's controls redistribute without the section quietly becoming easier.<br>
  <b>Accessibility</b> weights by severity (×3 critical, ×2 serious, ×1 moderate) and folds four keyboard checks
  into one composite with fixed internal weights.<br>
  <b>AEO</b> carries three page-gated parameters — FAQ blocks, E-E-A-T and sameAs — that are simply absent elsewhere.</div>
</div>

<div class="sec keep">
  <div class="sech"><span class="num">§</span><h3>The five crawl plans</h3></div>
  <p>A full-site run visits at most six pages, each one a full Chromium render plus an eight-pillar pass. The page
  list is therefore both the biggest lever on cost and — because the page decides what is scoreable at all — the
  biggest lever on what the report can say. These lists are ordered by what each page uniquely unlocks.</p>
  ${TYPES.map((t) => `<div class="planbar"><span style="background:#F26419;min-width:31mm">${TYPE_LABEL[t]}</span>${PLAN[t].map((p) => `<span>${PAGE_LABEL[p]}</span>`).join("<i>→</i>")}<b style="margin-left:auto;color:#8B949E">6 / 6</b></div>`).join("")}
  <div class="planbar"><span style="background:#8B949E;min-width:31mm">Small 4-page garage</span><span>Home</span><i>→</i><span>Services</span><i>→</i><span>About</span><b style="margin-left:auto;color:#8B949E">3 / 6 — honest short run</b></div>
  <p style="margin-top:6px">The last row is not a failure mode. A four-page site has three of the six categories and no
  more; the run reports three and stops. What that costs is quantified in §6.</p>
</div>

<div class="sec keep">
  <div class="sech"><span class="num">§</span><h3>Section share of the page score — all 24 columns</h3></div>
  <p>Page tilt × site profile, renormalised to 100. This is the ceiling every parameter underneath it is
  competing for. Read the spread across a row: Security runs from <b>5.1</b> on a repair garage's pricing page to
  <b>23.2</b> on a franchise dealer's finance page — a 4.5× swing driven entirely by what page it is and who runs it.</p>
  ${shareMatrix()}
</div>

<div class="sec keep">
  <div class="sech"><span class="num">§</span><h3>What moves between a franchise dealer and a repair garage</h3></div>
  <p>The two extremes of the taxonomy. Everything below is a tier change in
  <code>parameterImportance.js</code>, read left to right as franchise → repair.</p>
  ${movers()}
</div>

</div>

<div class="land">
  <div style="padding:0 6mm 6mm">
    <div class="sech" style="margin-top:4mm"><span class="num">§</span><h3>The master matrix — ${weightedCount} parameters × 24 columns</h3></div>
    <p style="font-size:7.6pt;margin-bottom:4px">Each cell is the parameter's share of that page's final score, in
    percent. A parameter worth 2.0 controls a fiftieth of everything that page can earn.</p>
    <div class="legend">
      <span><span class="sw" style="background:rgba(242,100,25,.10)"></span><span class="sw" style="background:rgba(242,100,25,.30)"></span><span class="sw" style="background:rgba(242,100,25,.62)"></span> <b>share of page score</b></span>
      <span><b>—</b> not applicable here: renormalised out, never scored zero</span>
      <span><b>·</b> measured and shown, but carries no weight</span>
      <span><b>*</b> scored only if the page renders a form; shown at its weight when one is present</span>
      <span><b>3213</b> the importance pattern, franchise · independent · service · repair</span>
    </div>
    ${masterMatrix()}
  </div>
</div>

<div class="page">
<div class="sech" style="page-break-before:always;margin-top:2mm"><span class="num">§</span><h2>Four dossiers</h2></div>
<p class="lead" style="margin-bottom:10px">Each type's six pages, in plan order: what the page is worth section by
section, which parameters carry it, and — the number that decides whether a slot earns its place — which parameters
<b>nothing else in the plan can reach</b>.</p>
${TYPES.map(dossier).join("")}

<div class="sec keep">
  <div class="sech"><span class="num">§</span><h3>The short run: a four-page garage</h3></div>
  <p>Home, Services and About exist; Booking, Pricing and Content do not. The run reports 3 / 6 and that is the honest
  answer. The question worth asking is what the missing three slots would actually have added — and computing it
  gives a more reassuring result than the headline 3 / 6 suggests.</p>
  <div class="two">
    <div>
      <div class="lbl">Reachable in the short run</div>
      <div class="planbar" style="margin-top:2px">${sr.got.map((p) => `<span>${PAGE_LABEL[p]}</span>`).join("<i>→</i>")}</div>
      <p style="font-size:7.8pt">Home carries <b>Appointment booking</b> — the gate was widened to home and generic for
      servicing sites precisely because a garage's booking form usually sits on the home page. Services carries
      <b>Pricing transparency</b>, <b>Incentives</b>, <b>FAQ blocks</b> and <b>E-E-A-T</b>. About carries
      <b>sameAs</b>, <b>E-E-A-T</b> and <b>Form presence</b>.</p>
    </div>
    <div>
      <div class="lbl">Weighted parameters lost entirely</div>
      ${sr.lost.length
        ? `<table class="mini wide">${sr.lost.map((r) => `<tr><td>${esc(nice(r.key))}</td><td class="s">${SEC_ABBR[r.sec]}</td><td class="n">${r.eff.toFixed(2)}%</td></tr>`).join("")}</table>`
        : `<p style="font-size:8pt"><b style="font-size:15pt;color:#B34410;display:block;line-height:1.2">None.</b>
           Every weighted parameter the full six-page plan can reach is also reachable from Home, Services and About.
           The three servicing page gates that matter — booking, pricing/FAQ, and E-E-A-T/sameAs — each open on more
           than one page type, and the short run holds at least one of each.</p>`}
    </div>
  </div>
  <div class="callout"><b>The practical read: a short run costs confidence, not coverage.</b> Every parameter still
  gets a score; what changes is the quality of the evidence behind it and the number of samples the page average is
  built from. <b>Pricing transparency</b> is judged off the services page rather than a dedicated price list.
  <b>Appointment booking</b> is judged off whatever the home page exposes rather than a real scheduler.
  And the Content page — the highest On-Page SEO and AEO share of any page in any plan, at 19.4 and 15.2 — is simply
  not there to demonstrate topical authority. That is a narrower and more defensible claim than "3 / 6 of the audit
  is missing", and it is the one the numbers support.</div>
</div>

<div class="sec">
  <div class="sech"><span class="num">§</span><h2>Where the config and the engine disagree</h2></div>
  <p class="lead">Six things surfaced when this matrix was first computed from the shipped code. Four have since been
  closed in the engine; two remain, and both are deliberate. None of them ever broke a score — each one meant a rating
  in <code>parameterImportance.js</code> was doing less than it read as doing.</p>

  <div class="find" style="border-left-color:#F26419;background:#FDE9DD">
    <div class="sev">Open · by design</div>
    <h4>The thirteen Technical Performance ratings still cannot move the section score</h4>
    <p>The headline <code>OverAll()</code> consumes is <code>Percentage</code>: PageSpeed's own Lighthouse category
    score, computed by Google at fixed weights that no site profile can touch. That is a product decision, not an
    oversight — the headline stays directly comparable to a PSI run the customer can repeat themselves. The tilt does
    reach the two derived numbers built from the same components, <code>Delivery_Hygiene</code> and
    <code>Graded_Percentage</code>, both of which the report shows.</p>
    <p><b>Closed as documented rather than moved.</b> The block now opens with an explicit warning in
    <code>parameterImportance.js</code>, so the ratings no longer read as load-bearing. Where the site type genuinely
    changes what Technical Performance is worth is its section weight in <code>siteTypeProfiles.js</code> — 18 for a
    dealer, 16 for a garage.</p>
  </div>

  <div class="find" style="border-left-color:#F26419;background:#FDE9DD">
    <div class="sev">Open · a product call, and a small one</div>
    <h4>Appointment booking is still unreachable in both dealer plans</h4>
    <p>Neither dealer plan fetches a <code>service</code> page, and that is the only page where a real scheduler lives.
    Widening the gate to the dealer home page was considered and rejected: <code>checkAppointmentBooking</code> grades
    a genuine scheduler widget, so a home-page nav link would score at the weak end and read as a failure the site
    doesn't have.</p>
    <p>It is rated Important for a franchise store and Recommended for an independent lot — the smallest of the three
    original plan gaps, and the residual is one parameter rather than three. Unlocking it means spending a slot on
    Service instead of Lease or Trade-in, which is a product call.</p>
  </div>

  <div class="find">
    <div class="sev">Closed · the finding that changed a score</div>
    <h4>Two of the three unreachable dealer gates now open on pages the plan already fetches</h4>
    <p><i>Incentives displayed</i> is rated <b>Most Important</b> for a franchise dealer on the reasoning that OEM
    incentives are its time-bound offer surface — but its gate was <code>service / specials</code> and the franchise
    plan's sixth slot goes to Lease, so the highest-rated Conversion parameter for that site type went unscored on
    every franchise audit. The gate now includes <code>lease</code>: a page advertising manufacturer lease offers is an
    incentive surface, so this is a correction rather than a workaround.</p>
    <p><i>E-E-A-T composite</i>, at 0.10 the second-heaviest AEO parameter, gated on about / content / service — none of
    which either dealer plan fetches. It now also opens on <code>home</code>, which carries the same evidence the check
    looks for: who we are, how long we have traded, named staff, review counts.</p>
    <p>Together these took franchise coverage from 135 reachable parameters to 137, and both dealer plans from three
    and two plan gaps respectively down to one each.</p>
  </div>

  <div class="find">
    <div class="sev">Closed · 4 ratings now live</div>
    <h4>The keyboard sub-checks are multiplied inside the composite</h4>
    <p><i>Focus order</i>, <i>Focusable content</i>, <i>Tab index</i> and <i>Aria hidden focus</i> are folded into the
    <b>Keyboard navigation</b> composite at 8 / 6 / 5 / 3, and the section only ever sees the composite.
    <code>importance()</code> is now applied inside <code>checkKeyboardNavigation</code> rather than in the section
    roll-up, so their ratings — including the deliberate drop to Recommended on repair sites, whose "forms" are usually
    a phone number — reach the score.</p>
  </div>

  <div class="find">
    <div class="sev">Closed · one table</div>
    <h4>The duplicated page-weight table is gone</h4>
    <p><code>singleAuditWorker.js</code> keyed its copy <code>trade</code> / <code>specials</code> while
    <code>utils/sectionWeights.js</code> keyed the same rows <code>tradein</code> / <code>offers</code>, each matching
    its own classifier, with a "keep BOTH tables in sync" comment in each file. There is now one table, read through
    <code>weightsForPageType()</code>, which resolves either vocabulary. Fixing it also surfaced a real bug: the
    subset-audit path was applying the page tilt without the site profile, so a partial audit of a repair site was
    weighted as if it were a dealer's.</p>
  </div>

  <div class="find">
    <div class="sev">Open question · not ours to close</div>
    <h4>Content relevance is rated Most Important for service and repair, and switched off</h4>
    <p>Hidden on 2026-07-07 by product decision pending a redesign: <code>checkContentRelevance</code> still runs, its
    0.06 is commented out of the weights, and its card is hidden in <code>On_Page_SEO.jsx</code>. Its rating is
    <code>2233</code> — a garage has to explain a mechanical problem to a non-mechanic before it can sell the fix,
    while dealer copy is specification data that is read rather than comprehended. It remains the single
    highest-value re-enable available, and it is worth the most to the two types it currently does nothing for. The
    rating is kept, flagged in place, and deliberately not acted on: reversing a stated product decision is not a
    correctness fix.</p>
  </div>

  <div class="find">
    <div class="sev">Belt and braces · kept</div>
    <h4>The site-level inventory gate is defence in depth, not a live fix, on the worker path</h4>
    <p><code>siteTypeProfiles.js</code> justifies the site gate with a repair shop's <code>/finance-options</code> page
    classifying as <code>finance</code> and running the whole credit-application battery. On the worker path that cannot
    happen: a servicing site is classified with <code>classifyServicePageType</code>, which has no finance bucket, so
    the page lands in <code>generic</code>. The gate is still correct and still worth keeping — any caller that reaches
    a metric service with the dealer classifier gets the protection — but the specific scenario in the comment is
    already closed upstream.</p>
  </div>
</div>

</div>`;

fs.writeFileSync(OUT, html);
console.log(`wrote ${OUT} (${(html.length / 1024).toFixed(0)} kB)`);
console.log(`  ${weightedCount} weighted parameters · ${COLS.length} columns · ${deadRatings.length} inert ratings`);
for (const t of TYPES) {
  const n = coverage[t].never;
  console.log(`  ${t}: ${coverage[t].scored} reachable · ${n.siteNA.length} structurally absent · ${n.planGap.length} plan gap · ${n.diagnostic.length + n.unweighted.length} unweighted`);
}
console.log(`  short run loses ${sr.lost.length} parameters`);
