import { classifyPageType, classifyServicePageType } from "../utils/pageClassifier.js";
import { applySiteApplicability } from "../config/siteTypeProfiles.js";
import { importanceFor } from "../config/parameterImportance.js";
import { getLocale, anyTerm, matchedTerms, GLOBAL_CTA_VERBS, GLOBAL_MAKES } from "../config/locale/index.js";
import { isPhoneLikeDigits } from "../utils/localeFormats.js";

// Per-parameter weight tilt for this section, by site sub-type. 1.0 for a
// franchise dealer (the reference column) and for corporate/unresolved sites,
// so nothing about their scoring changes. See config/parameterImportance.js.
const importance = importanceFor("Conversion & Lead Flow");

// Call to Action (CTA) Effectiveness
function checkCTAs($) {
  const ctaSelectors = [
    'button', 'input[type="button"]', 'input[type="submit"]', '.cta', '.cta-button', '.cta-btn',
    '.btn-primary', '.btn-cta', '.btn', '.button', 'a.cta', 'a.cta-button', 'a.btn',
    'a.btn-primary', 'a[href*="signup"]', 'a[href*="register"]', 'a[href*="subscribe"]',
    '[id*="cta"]', '[class*="cta"]', '.hero button', '.hero a', '.promo button', '.promo a',
    '.signup button', '.signup a', '.download button', '.download a'
  ];

  const ctaElements = $(ctaSelectors.join(','));
  const count = ctaElements.length;

  if (count > 0) {
    // Provide a snippet of found selectors for context
    const found = [];
    ctaSelectors.slice(0, 10).forEach(selector => {
      const elCount = $(selector).length;
      if (elCount > 0) found.push(`${selector} (${elCount})`);
    });

    return {
      score: 100,
      status: "pass",
      details: "CTAs are present and visible.",
      meta: { count, selectors: found },
      analysis: null
    };
  }

  return {
    score: 0,
    status: "fail",
    details: "No prominent Call-to-Action buttons found.",
    meta: { count: 0, selectors: ctaSelectors.slice(0, 10) },
    analysis: {
      cause: "No elements matching common CTA patterns (buttons, primary links) were detected.",
      recommendation: "Add at least one clear Call-to-Action button like 'Get Started' or 'Contact Us' in a prominent position."
    }
  };
}

// CTA Clarity
function checkCTAClarity($, market = null) {
  const ctaSelectors = ['button', 'a', '.cta', '.cta-button', '.btn-primary'];
  // Globally-clear verbs plus the ones that are idiomatic in this market.
  // "Enquire" was missing entirely, so nearly every Australian dealer's primary
  // CTA — "Enquire Now" — was being scored as vague.
  const clearVerbs = [...GLOBAL_CTA_VERBS, ...getLocale(market).ctaVerbs];

  const elements = $(ctaSelectors.join(','));
  let totalChecked = 0;
  let clearCount = 0;
  let clearExamples = [];
  let unclearExamples = [];

  elements.each((_, el) => {
    const text = $(el).text().trim().toLowerCase();
    if (!text || text.length > 30) return;

    totalChecked++;
    if (clearVerbs.some(verb => text.includes(verb))) {
      clearCount++;
      if (clearExamples.length < 5) clearExamples.push(text);
    } else {
      if (unclearExamples.length < 5) unclearExamples.push(text);
    }
  });

  if (clearCount > 0) {
    return {
      score: 100,
      status: "pass",
      details: "CTAs use clear, actionable text.",
      meta: { count: clearCount, examples: clearExamples, totalChecked },
      analysis: null
    };
  }

  return {
    score: 0,
    status: "fail",
    details: "CTA text is vague or generic.",
    meta: { count: totalChecked - clearCount, examples: unclearExamples, totalChecked },
    analysis: {
      cause: "Buttons or links use passive or ambiguous labels (e.g., 'Click Here', 'More Info').",
      recommendation: "Use action-oriented verbs like 'Buy Now', 'Download', or 'Register' to drive higher engagement."
    }
  };
}

// CTA Crowding
async function checkCTACrowding(page, maxCTAs = 3) {
  const ctaSelectors = [
    'button', 'input[type="button"]', 'input[type="submit"]', '.cta', '.cta-button', '.cta-btn',
    '.btn-primary', '.btn-cta', '.btn', '.button', 'a.cta', 'a.cta-button', 'a.btn',
    'a.btn-primary', 'a[href*="signup"]', 'a[href*="register"]', 'a[href*="subscribe"]',
    '[id*="cta"]', '[class*="cta"]', '.hero button', '.hero a', '.promo button', '.promo a',
    '.signup button', '.signup a', '.download button', '.download a'
  ];

  const result = await page.evaluate((selectors) => {
    return document.querySelectorAll(selectors.join(',')).length;
  }, ctaSelectors);

  if (result <= maxCTAs && result > 0) {
    return {
      score: 100,
      status: "pass",
      details: "CTA count is optimal.",
      meta: { count: result, limit: maxCTAs },
      analysis: null
    };
  } else if (result > maxCTAs) {
    return {
      score: 50,
      status: "warning",
      details: "Too many CTAs may confuse users.",
      meta: { count: result, limit: maxCTAs },
      analysis: {
        cause: "The number of CTA elements exceeds the recommended limit, potentially causing choice paralysis.",
        recommendation: "Focus on one or two primary actions to guide the user more effectively."
      }
    };
  }
  return {
    score: 0,
    status: "fail",
    details: "No CTAs found.",
    meta: { count: result, limit: maxCTAs },
    analysis: {
      cause: "No Call-to-Action buttons or links were detected on the page.",
      recommendation: "Add a primary Call-to-Action to provide a clear next step for your visitors."
    }
  };
}

// CTA Flow Alignment / Funnel Placement
// Evaluates REAL rendered geometry — above-the-fold presence, distribution across the
// page, and end-of-page repetition — instead of a naive source-order DOM-index ratio.
async function checkCTAFlowAlignment(page, $) {
  // Conversion-focused CTA detection (explicit CTA classes + intent links), kept tight
  // on purpose so generic buttons (nav toggles, cards) don't inflate distribution.
  const ctaSelectors = [
    '.cta', '.cta-button', '.cta-btn', '.btn-primary', '.btn-cta',
    'a.cta', 'a.cta-button', 'a.btn-primary',
    'a[href*="signup"]', 'a[href*="register"]', 'a[href*="subscribe"]',
    'a[href*="contact"]', 'a[href*="quote"]', 'a[href*="appointment"]',
    'a[href*="finance"]', 'a[href*="trade"]', 'a[href*="test-drive"]',
    '[id*="cta"]', '[class*="cta"]'
  ];
  const ctaKeywords = [
    "buy now", "sign up", "get started", "subscribe", "download", "contact us", "book now",
    "get a quote", "request a quote", "value your trade", "value my trade", "trade-in",
    "get pre-approved", "apply for financing", "schedule service", "book a test drive",
    "test drive", "schedule appointment", "learn more", "shop now", "view inventory",
    "browse inventory", "call now", "get directions", "schedule", "reserve"
  ];

  const result = await page.evaluate((cfg) => {
    const { ctaSelectors, ctaKeywords } = cfg;
    const lc = (s) => (s || "").toLowerCase();

    const viewportHeight = window.innerHeight || 800;
    const documentHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body ? document.body.scrollHeight : 0
    ) || viewportHeight;

    // Candidate CTAs: selector matches + conversion-keyword text/aria
    const candidates = new Set();
    try { document.querySelectorAll(ctaSelectors.join(",")).forEach(el => candidates.add(el)); } catch (e) {}
    document.querySelectorAll("a, button, input[type='submit'], input[type='button']").forEach(el => {
      const text = lc(el.innerText || el.value || el.getAttribute("aria-label"));
      if (text && ctaKeywords.some(k => text.includes(k))) candidates.add(el);
    });

    const isVisible = (el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 1 || rect.height <= 1) return false;
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || parseFloat(style.opacity) === 0) return false;
      return true;
    };

    const ctas = [];
    candidates.forEach(el => {
      if (!isVisible(el)) return;
      const rect = el.getBoundingClientRect();
      const absoluteTop = rect.top + window.scrollY;
      const label = (el.innerText || el.value || el.getAttribute("aria-label") || "").trim().slice(0, 40);
      ctas.push({ absoluteTop, label });
    });
    ctas.sort((a, b) => a.absoluteTop - b.absoluteTop);

    const ctaCount = ctas.length;
    const aboveFoldCTA = ctas.some(c => c.absoluteTop < viewportHeight);

    // Distribution across page thirds
    const third = documentHeight / 3;
    const distribution = { top: 0, middle: 0, bottom: 0 };
    ctas.forEach(c => {
      if (c.absoluteTop < third) distribution.top++;
      else if (c.absoluteTop < 2 * third) distribution.middle++;
      else distribution.bottom++;
    });

    const isLongPage = documentHeight > 2 * viewportHeight;
    const endCTA = ctas.some(c => c.absoluteTop > documentHeight * 0.75);
    const examples = ctas.slice(0, 5).map(c => c.label).filter(Boolean);

    return { ctaCount, aboveFoldCTA, distribution, isLongPage, endCTA, viewportHeight, documentHeight, examples };
  }, { ctaSelectors, ctaKeywords });

  // No CTAs at all
  if (result.ctaCount === 0) {
    return {
      score: 0,
      status: "fail",
      details: "No conversion CTAs found to evaluate funnel placement.",
      meta: {
        ctaCount: 0, aboveFoldCTA: false, distribution: result.distribution,
        isLongPage: result.isLongPage, endCTA: false,
        documentHeight: result.documentHeight, viewportHeight: result.viewportHeight, examples: []
      },
      analysis: {
        cause: "No Call-to-Action elements with conversion intent were detected, so funnel placement cannot be assessed.",
        recommendation: "Add clear CTAs (e.g., 'Value Your Trade', 'Get Pre-Approved', 'Schedule Service') and place a primary one above the fold."
      }
    };
  }

  // Composite funnel-context score
  const sectionsCovered = ["top", "middle", "bottom"].filter(s => result.distribution[s] > 0).length;
  const coverage = result.isLongPage ? (sectionsCovered / 3) : 1;          // long pages must spread CTAs across the journey
  const endSignal = result.isLongPage ? (result.endCTA ? 1 : 0) : 1;        // short pages don't need a repeated end CTA
  const aboveFold = result.aboveFoldCTA ? 1 : 0;
  const composite = Math.round((0.4 * aboveFold + 0.35 * coverage + 0.25 * endSignal) * 100);

  const baseMeta = {
    compositeScore: composite,
    ctaCount: result.ctaCount,
    aboveFoldCTA: result.aboveFoldCTA,
    distribution: result.distribution,
    isLongPage: result.isLongPage,
    endCTA: result.endCTA,
    documentHeight: result.documentHeight,
    viewportHeight: result.viewportHeight,
    examples: result.examples
  };

  // Strong funnel placement
  if (composite >= 70) {
    return {
      score: 100,
      status: "pass",
      details: "CTAs are well-placed across the user's journey (above the fold and through the page).",
      meta: baseMeta,
      analysis: null
    };
  }

  // Targeted guidance for the partial / poor cases
  const issues = [];
  if (!result.aboveFoldCTA) issues.push("no primary CTA is visible above the fold");
  if (result.isLongPage && sectionsCovered < 2) issues.push("CTAs are clustered in one part of a long page");
  if (result.isLongPage && !result.endCTA) issues.push("no CTA near the end of a long page");

  if (composite >= 40) {
    return {
      score: 50,
      status: "warning",
      details: "CTA placement partially supports the funnel but has gaps.",
      meta: baseMeta,
      analysis: {
        cause: `Funnel placement is weak because ${issues.join("; ") || "CTAs are not distributed to match the decision journey"}.`,
        recommendation: "Place a primary CTA above the fold, repeat a CTA after key value sections, and add one near the end of long pages so users can act without scrolling back."
      }
    };
  }

  return {
    score: 0,
    status: "fail",
    details: "CTA placement does not align with the user's decision flow.",
    meta: baseMeta,
    analysis: {
      cause: `Funnel placement is poor because ${issues.join("; ") || "CTAs are positioned where users lack context or visibility"}.`,
      recommendation: "Add a prominent above-the-fold CTA, distribute CTAs at natural decision points, and ensure a closing CTA on long pages."
    }
  };
}

// Form Presence
async function checkFormPresence(page) {
  const formCount = await page.evaluate(() => document.querySelectorAll("form").length);
  if (formCount > 0) {
    return {
      score: 100,
      status: "pass",
      details: "Lead capture forms are present.",
      meta: { count: formCount },
      analysis: null
    };
  }
  return {
    score: 0,
    status: "fail",
    details: "No forms detected on the page.",
    meta: { count: 0 },
    analysis: {
      cause: "The page does not contain any `<form>` elements for lead capture.",
      recommendation: "Add a contact or lead generation form to capture visitor information directly."
    }
  };
}

// Form Length Optimal
function checkFormLengthOptimal($) {
  const forms = $("form");
  if (forms.length === 0) return {
    score: 100,
    status: "pass",
    details: "No forms to analyze.",
    meta: { count: 0 },
    analysis: null
  };

  let optimalForms = 0;
  let longForms = [];
  forms.each((i, form) => {
    const fieldCount = $(form).find("input, select, textarea").length;
    if (fieldCount > 0 && fieldCount < 7) {
      optimalForms++;
    } else if (fieldCount >= 7) {
      longForms.push(`Form #${i + 1}: ${fieldCount} fields`);
    }
  });

  if (optimalForms > 0) {
    return {
      score: 100,
      status: "pass",
      details: "Forms are concise and user-friendly.",
      meta: { optimalForms, totalForms: forms.length },
      analysis: null
    };
  }
  return {
    score: 50,
    status: "warning",
    details: "Forms may be too long.",
    meta: { totalForms: forms.length, details: longForms },
    analysis: {
      cause: "One or more forms have many fields, which can discourage users from completing them.",
      recommendation: "Reduce the number of required fields or use a multi-step format for long forms."
    }
  };
}

// Required vs Optional Fields
async function checkRequiredVsOptionalFields(page) {
  const result = await page.evaluate(() => {
    const inputs = document.querySelectorAll("form input, form textarea, form select");
    if (inputs.length === 0) return { hasDistinction: true, checkedInputs: [], count: 0 };

    let hasDistinction = false;
    let checkedInputs = [];

    inputs.forEach(el => {
      // Get associated label text
      let labelText = "";
      const id = el.getAttribute("id");
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) labelText = label.textContent;
      }
      if (!labelText) {
        labelText = el.closest("label")?.textContent || el.previousElementSibling?.textContent || el.placeholder || "";
      }
      labelText = labelText.toLowerCase();

      const isRequired = el.hasAttribute("required") || labelText.includes("*") || labelText.includes("required");
      const isOptional = labelText.includes("optional");

      if (isRequired || isOptional) hasDistinction = true;
      if (checkedInputs.length < 5) {
        checkedInputs.push(`${el.tagName.toLowerCase()}${el.name ? `[name="${el.name}"]` : ""}`);
      }
    });

    return { hasDistinction, checkedInputs, count: inputs.length };
  });

  if (result.count === 0) {
    return {
      score: 100,
      status: "pass",
      details: "No form inputs found to analyze.",
      meta: { count: 0, checkedInputs: [] },
      analysis: null
    };
  }

  if (result.hasDistinction) {
    return {
      score: 100,
      status: "pass",
      details: "Required or optional fields are clearly distinguished.",
      meta: { count: result.count, checkedInputs: result.checkedInputs },
      analysis: null
    };
  }

  return {
    score: 50,
    status: "warning",
    details: "No clear distinction between /requiredoptional fields.",
    meta: { count: result.count, checkedInputs: result.checkedInputs },
    analysis: {
      cause: "Form fields do not use visual indicators (like asterisks) or labels ('required'/'optional') to guide the user.",
      recommendation: "Clearly mark required fields with '*' or use labels like '(optional)' to reduce user confusion and improve form completion rates."
    }
  };
}

// Inline Validation
function checkInlineValidation($) {
  const inputs = $("form input, form textarea, form select");
  const count = inputs.length;

  if (count === 0) return {
    score: 100,
    status: "pass",
    details: "No form inputs found to analyze.",
    meta: { count: 0, checkedInputs: [], hasValidation: true },
    analysis: null
  };

  let hasValidation = false;
  let checkedInputs = [];

  inputs.each((_, el) => {
    const $el = $(el);
    if (checkedInputs.length < 5) {
      checkedInputs.push(`${el.tagName.toLowerCase()}${el.name ? `[name="${el.name}"]` : ""}`);
    }
    if ($el.attr("required") || $el.attr("pattern") || $el.attr("type") === "email" || $el.attr("minlength") || $el.attr("maxlength")) {
      hasValidation = true;
    }
  });

  if (hasValidation) {
    return {
      score: 100,
      status: "pass",
      details: "HTML5/Inline validation attributes detected.",
      meta: { count, checkedInputs, hasValidation },
      analysis: null
    };
  }

  return {
    score: 0,
    status: "fail",
    details: "No inline validation indicators found for form inputs.",
    meta: { count, checkedInputs, hasValidation },
    analysis: {
      cause: "Form inputs lack HTML5 validation attributes (like 'required', 'pattern', 'type=\"email\"', etc.), providing no immediate feedback to users.",
      recommendation: "Enable inline validation by adding standard HTML5 attributes to provide instant feedback and prevent the submission of invalid data."
    }
  };
}

// Submit Button Clarity
async function checkSubmitButtonClarity(page) {
  const clearTexts = ["submit", "sign up", "register", "join", "get started", "download", "contact", "send"];
  const result = await page.evaluate((keywords) => {
    const buttons = Array.from(document.querySelectorAll("button, input[type='submit']"));
    const clearBtns = [];
    const unclearBtns = [];
    buttons.forEach(b => {
      const text = (b.innerText || b.value || "").toLowerCase().trim();
      if (!text) return;
      if (keywords.some(k => text.includes(k))) {
        clearBtns.push(text);
      } else {
        unclearBtns.push(text);
      }
    });
    return { clearBtns, unclearBtns, totalCount: buttons.length };
  }, clearTexts);

  if (result.totalCount === 0) {
    return {
      score: 100,
      status: "pass",
      details: "No form submit buttons found to analyze.",
      meta: { totalCount: 0, clearCount: 0, examples: [] },
      analysis: null
    };
  }

  if (result.clearBtns.length > 0) {
    return {
      score: 100,
      status: "pass",
      details: "Submit buttons use clear, conversion-oriented text.",
      meta: { totalCount: result.totalCount, clearCount: result.clearBtns.length, examples: result.clearBtns.slice(0, 5) },
      analysis: null
    };
  }

  return {
    score: 50,
    status: "warning",
    details: "Submit buttons use generic labels.",
    meta: { totalCount: result.totalCount, clearCount: 0, examples: result.unclearBtns.slice(0, 5) },
    analysis: {
      cause: "Submit buttons use generic labels like 'Submit' rather than engaging, action-oriented text.",
      recommendation: "Use more specific and engaging text like 'Get My Quote' or 'Start Free Trial' to improve conversions."
    }
  };
}

// Multi-Step Form Progress
async function checkMultiStepFormProgress(page) {
  const result = await page.evaluate(() => {
    const indicators = document.querySelectorAll("progress, .step, .progress, .form-step, [role='progressbar']");
    return { count: indicators.length, hasProgress: indicators.length > 0 };
  });

  if (result.hasProgress) {
    return {
      score: 100,
      status: "pass",
      details: "Progress indicators or multi-step form elements detected.",
      meta: { hasProgress: result.hasProgress, count: result.count },
      analysis: null
    };
  }

  return {
    score: 100,
    status: "pass",
    details: "No multi-step forms detected.",
    meta: { hasProgress: false, count: 0 },
    analysis: null
  };
}

// Testimonials
function checkTestimonials($) {
  const keywords = ["testimonial", "review", "client-say", "feedback", "what people say"];
  const elements = $("*").filter((_, el) => {
    const cls = ($(el).attr("class") || "").toLowerCase();
    const id = ($(el).attr("id") || "").toLowerCase();
    return keywords.some(k => cls.includes(k) || id.includes(k));
  });

  const count = elements.length;

  if (count > 0) {
    return {
      score: 100,
      status: "pass",
      details: "Testimonials section or elements detected.",
      meta: { count, checkedKeywords: keywords },
      analysis: null
    };
  }

  return {
    score: 0,
    status: "fail",
    details: "No testimonials found.",
    meta: { count: 0, checkedKeywords: keywords },
    analysis: {
      cause: "No section or elements were found that indicate client testimonials or success stories.",
      recommendation: "Add at least 2-3 customer testimonials to build credibility and social proof."
    }
  };
}

// Reviews Visible
function checkReviewsVisible($, market = null) {
  const locale = getLocale(market);
  const keywords = ["review", "rating", "stars", "customer-review"];
  const elements = $("*").filter((_, el) => {
    const cls = ($(el).attr("class") || "").toLowerCase();
    const id = ($(el).attr("id") || "").toLowerCase();
    return keywords.some(k => cls.includes(k) || id.includes(k));
  });

  // Which third-party review platforms is this site actually linking to? Google
  // dominates in both markets, but beyond it the ecosystems have nothing in
  // common — Yelp and DealerRater are meaningless in Australia, where
  // ProductReview.com.au and carsales dealer ratings are what buyers read.
  const platformLinks = [];
  $("a[href]").each((_, el) => {
    const href = ($(el).attr("href") || "").toLowerCase();
    for (const d of locale.directoryDomains) {
      if (href.includes(d) && !platformLinks.includes(d)) platformLinks.push(d);
    }
  });

  const count = elements.length;

  if (count > 0 || platformLinks.length) {
    return {
      score: 100,
      status: "pass",
      details: platformLinks.length
        ? `User reviews/ratings detected, including links to ${platformLinks.slice(0, 3).join(", ")}.`
        : "User reviews/ratings detected.",
      meta: { market: locale.code, count, checkedKeywords: keywords, platformLinks },
      analysis: null
    };
  }

  return {
    score: 0,
    status: "fail",
    details: "No reviews found.",
    meta: { market: locale.code, count: 0, checkedKeywords: keywords, platformLinks: [] },
    analysis: {
      cause: "No aggregate ratings or specific user review elements were detected on the page.",
      recommendation: locale.code === "AU"
        ? "Display star ratings on the page and link your Google Business Profile, ProductReview.com.au and carsales dealer-rating profiles."
        : "Display star ratings or numerical scores if applicable to increase trust, and link your Google, DealerRater and Cars.com profiles."
    }
  };
}

// Trust Badges
function checkTrustBadges($, market = null) {
  const locale = getLocale(market);
  const keywords = ["secure", "ssl", "verified", "payment", "badge", "trust", "guarantee"];

  // 🔍 Step 1: Detect payment intent from page text
  const pageText = $("body").text().toLowerCase();
  const paymentKeywords = ["buy now", "add to cart", "checkout", "payment", "pay now"];

  const hasPayment = paymentKeywords.some(k => pageText.includes(k));

  // 🔍 Step 2: Find trust badge images — generic security seals, plus the
  // accreditation marks that actually carry trust in this market. An Australian
  // dealer displaying its LMCT number and VACC membership is showing strong
  // trust signals that a US-only badge list could not see at all.
  const localCredentials = locale.credentials.filter((c) => pageText.includes(c));
  const images = $("img").filter((_, el) => {
    const src = ($(el).attr("src") || "").toLowerCase();
    const alt = ($(el).attr("alt") || "").toLowerCase();
    return keywords.some(k => src.includes(k) || alt.includes(k))
      || locale.credentials.some(c => alt.includes(c) || src.includes(c.replace(/\s+/g, "")));
  });

  const count = images.length + localCredentials.length;

  // ✅ Step 3: If NO payment → ignore this check
  if (!hasPayment) {
    return {
      score: 100,
      status: "pass",
      category: "ux",
      details: "No payment functionality detected, trust badges not required.",
      meta: { count: 0, checkedKeywords: keywords },
      analysis: {
        impact: "Trust badges are primarily relevant for transaction-based websites."
      }
    };
  }

  // ✅ Step 4: Payment present + badges found
  if (count > 0) {
    return {
      score: 100,
      status: "pass",
      category: "ux",
      details: "Trust badges visible on a transaction-enabled page.",
      meta: { count, checkedKeywords: keywords },
      analysis: {
        impact: "Trust badges help build user confidence during payments."
      }
    };
  }

  // ⚠️ Step 5: Payment present but no badges → warning (not fail)
  return {
    score: 40,
    status: "warning",
    category: "ux",
    details: "No trust badges detected on a transaction-enabled site.",
    meta: { count: 0, checkedKeywords: keywords },
    analysis: {
      cause: "No trust-related images (SSL, verified, secure) found despite payment functionality.",
      impact: "Users may hesitate to complete transactions due to lack of trust signals.",
      recommendation: "Add SSL badges, secure payment icons, or certification seals near checkout or payment sections."
    }
  };
}

// Client Logos
async function checkClientLogos(page) {
  const selectors = [".client-logo", ".partner-logo", ".logos img", ".clients img", ".trusted-by img"];
  const result = await page.evaluate((sel) => {
    const elements = document.querySelectorAll(sel.join(','));
    return { count: elements.length, hasLogos: elements.length > 0 };
  }, selectors);

  if (result.hasLogos) {
    return {
      score: 100,
      status: "pass",
      details: "Client or partner logos detected.",
      meta: { count: result.count, checkedSelectors: selectors },
      analysis: null
    };
  }

  return {
    score: 50,
    status: "warning",
    details: "No client logos detected.",
    meta: { count: 0, checkedSelectors: selectors },
    analysis: {
      cause: "The page does not prominently feature logos of partners or previous clients.",
      recommendation: "Display a 'Logos' or 'Trusted By' section with well-known brands you've worked with to boost authority."
    }
  };
}

// Case Studies Accessibility
async function checkCaseStudiesAccessibility(page) {
  const keywords = ["case study", "case studies", "success story", "success stories", "client success"];
  const result = await page.evaluate((kws) => {
    const text = document.body.innerText.toLowerCase();
    const hits = kws.filter(k => text.includes(k));
    return { count: hits.length, hasCaseStudies: hits.length > 0, hits };
  }, keywords);

  if (result.hasCaseStudies) {
    return {
      score: 100,
      status: "pass",
      details: "Case studies or success stories detected.",
      meta: { count: result.count, checkedKeywords: keywords, found: result.hits },
      analysis: null
    };
  }

  return {
    score: 50,
    status: "warning",
    details: "No references to case studies or success stories found.",
    meta: { count: 0, checkedKeywords: keywords },
    analysis: {
      cause: "No textual references to 'case studies' or 'success stories' were found in the page content.",
      recommendation: "Showcase real-world examples of your work through detailed case studies or success stories to build deep trust."
    }
  };
}

// Progress Indicators
function checkProgressIndicators($) {
  const hasProgress = $(".progress, .step, progress").length > 0;
  if (hasProgress) return {
    score: 100,
    status: "pass",
    details: "Progress indicators present.",
    meta: {},
    analysis: null
  };
  return {
    score: 50,
    status: "warning",
    details: "No progress indicators found.",
    meta: { checkedSelectors: [".progress", ".step", "progress"] },
    analysis: {
      cause: "No progress bars or step indicators were found on the page.",
      recommendation: "Add progress indicators for any multi-stage processes to inform users of their status."
    }
  };
}

// Friendly Error Handling
function checkFriendlyErrorHandling($) {
  const selectors = ["input[required]", "input[pattern]", ".error-message", ".invalid-feedback", "[aria-invalid]"];
  const elements = $(selectors.join(','));
  const count = elements.length;

  if (count > 0) {
    return {
      score: 100,
      status: "pass",
      details: "Error handling or validation cues detected.",
      meta: { count, checkedSelectors: selectors },
      analysis: null
    };
  }

  return {
    score: 50,
    status: "warning",
    details: "No explicit error handling or validation cues found.",
    meta: { count: 0, checkedSelectors: selectors },
    analysis: {
      cause: "No clear error message containers or validation attributes were identified on form elements.",
      recommendation: "Design and implement clear, helpful error messages that guide users to fix input mistakes in real-time."
    }
  };
}

// Microcopy Clarity
function checkMicrocopyClarity($) {
  const selectors = ["input[placeholder]", "textarea[placeholder]", ".helper-text", ".form-text", "small.text-muted"];
  const elements = $(selectors.join(','));
  const count = elements.length;

  if (count > 0) {
    return {
      score: 100,
      status: "pass",
      details: "Form inputs use helpful microcopy or placeholders.",
      meta: { count, checkedSelectors: selectors },
      analysis: null
    };
  }

  return {
    score: 50,
    status: "warning",
    details: "Limited or no microcopy found for form inputs.",
    meta: { count: 0, checkedSelectors: selectors },
    analysis: {
      cause: "Form inputs lack placeholders or descriptive helper text to guide the completion process.",
      recommendation: "Add descriptive microcopy and meaningful placeholders to simplify the user experience and reduce friction."
    }
  };
}

// Lead Magnets
async function checkLeadMagnets(page) {
  const keywords = ["free ebook", "guide", "whitepaper", "cheatsheet", "download now", "get my copy", "resource library"];
  const result = await page.evaluate((kws) => {
    const text = document.body.innerText.toLowerCase();
    const hits = kws.filter(k => text.includes(k));
    return { count: hits.length, hasMagnet: hits.length > 0, hits };
  }, keywords);

  if (result.hasMagnet) {
    return {
      score: 100,
      status: "pass",
      details: "Lead magnets or high-value resources detected.",
      meta: { count: result.count, checkedKeywords: keywords, found: result.hits },
      analysis: null
    };
  }

  return {
    score: 50,
    status: "warning",
    details: "No clear lead magnets detected.",
    meta: { count: 0, checkedKeywords: keywords },
    analysis: {
      cause: "No high-value offers like ebooks, guides, or whitepapers were detected on the page.",
      recommendation: "Offer a relevant lead magnet (e.g., a PDF guide or checklist) to exchange value for visitor contact information."
    }
  };
}

// Incentives Displayed
function checkIncentivesDisplayed($) {
  const keywords = ["free", "discount", "offer", "sale", "% off", "get your", "bonus", "limited time"];
  const text = $("body").text().toLowerCase();
  const hits = keywords.filter(k => text.includes(k));

  const count = hits.length;

  if (count > 0) {
    return {
      score: 100,
      status: "pass",
      details: "Promotional incentives or offers detected.",
      meta: { count, checkedKeywords: keywords, found: hits },
      analysis: null
    };
  }

  return {
    score: 50,
    status: "warning",
    details: "No promotional incentives or offers found.",
    meta: { count: 0, checkedKeywords: keywords },
    analysis: {
      cause: "No promotional language or special offers were detected in the page content.",
      recommendation: "Highlight special offers, discounts, or 'risk-free' trials to boost conversion rates and encourage immediate action."
    }
  };
}

// Link Relevance
async function checkLinkRelevance(page) {
  const result = await page.evaluate(() => {
    const ctas = [];
    const keywords = ["buy", "get", "sign up", "register", "purchase", "order"];
    const buttons = document.querySelectorAll("a, button");

    buttons.forEach(el => {
      const text = (el.innerText || "").toLowerCase().trim();
      if (keywords.some(k => text.includes(k))) {
        let href = el.getAttribute("href");
        if (href) {
          href = href.toLowerCase();
          ctas.push({ text, href });
        }
      }
    });

    const relevantKeywords = ["checkout", "cart", "product", "pricing", "sign-up", "register"];
    const irrelevantKeywords = ["blog", "about", "contact", "faq", "terms"];

    let relevantCount = 0;
    let irrelevantCount = 0;
    let examples = [];
    let correctCtas = [];
    let incorrectCtas = [];

    ctas.forEach(cta => {
      const isRelevant = relevantKeywords.some(k => cta.href.includes(k));
      const isIrrelevant = irrelevantKeywords.some(k => cta.href.includes(k));

      if (isRelevant) {
        relevantCount++;
        correctCtas.push(cta);
      } else if (isIrrelevant) {
        irrelevantCount++;
        incorrectCtas.push(cta);
        if (examples.length < 3) examples.push(`${cta.text} -> ${cta.href}`);
      } else {
        // Determine what to do with 'neutral' ones? treat as neutral/correct for now or separate
        // Let's just keep them out of incorrect list for safety
        correctCtas.push(cta);
      }
    });

    return { total: ctas.length, relevantCount, irrelevantCount, examples, correctCtas, incorrectCtas };
  });

  if (result.irrelevantCount > 0) {
    return {
      score: 50,
      status: "warning",
      details: "Some conversion CTAs link to unrelated pages.",
      meta: {
        total: result.total,
        irrelevantCount: result.irrelevantCount,
        examples: result.examples,
        correctCtas: result.correctCtas,
        incorrectCtas: result.incorrectCtas
      },
      analysis: {
        cause: "High-intent buttons (like 'Buy Now') are linking to informational pages (like Blog/About) instead of conversion pages.",
        recommendation: "Ensure 'Buy' or 'Sign Up' buttons link directly to checkout, pricing, or registration pages to reduce friction."
      }
    };
  }

  if (result.relevantCount > 0) {
    return {
      score: 100,
      status: "pass",
      details: "CTAs link to relevant conversion pages.",
      meta: {
        total: result.total,
        relevantCount: result.relevantCount,
        correctCtas: result.correctCtas,
        incorrectCtas: result.incorrectCtas
      },
      analysis: null
    };
  }

  return {
    score: 100, // Neutral if no specific conversion CTAs found to judge
    status: "pass",
    details: "No obvious CTA link mismatches detected.",
    meta: {
      total: result.total,
      correctCtas: result.correctCtas,
      incorrectCtas: result.incorrectCtas
    },
    analysis: null
  };
}

// Trade-In Flow / Trade-In Estimator (Dealer Lead Flow)
async function checkTradeInFlow(page, $, market = null) {
  // The valuation-provider dictionary is the whole reason this parameter — the
  // heaviest in the pillar at 0.15 — scored near zero on complete Australian
  // trade-in tools: it looked for KBB, Black Book and J.D. Power, none of which
  // operate in Australia, where RedBook and Glass's Guide are the market.
  const locale = getLocale(market);
  const valuation = locale.valuationProviders;

  // Signals ordered strongest -> weakest
  const textKeywords = [
    "trade-in", "trade in", "value your trade", "value my trade",
    "what's my car worth", "whats my car worth", "what is my car worth",
    "trade-in value", "trade appraisal", "appraise my", "instant cash offer",
    "get my trade value", "estimate your trade", "sell us your car", "sell your car",
    // auto / vehicle wording variants (dealers often say "auto" or "vehicle" instead of "car")
    "value your auto", "value my auto", "value your vehicle", "value my vehicle",
    "sell us your auto", "sell your auto", "sell us your vehicle", "sell your vehicle",
    "what's my auto worth", "whats my auto worth", "what's my vehicle worth", "whats my vehicle worth"
  ];
  const ctaKeywords = [
    "trade-in", "tradein", "trade_in", "value-your-trade", "value-my-trade",
    "whats-my-car-worth", "what-is-my-car-worth", "appraisal", "appraise",
    "instant-cash-offer", "instant cash offer", "trade-value", "sell-your-car",
    "value your trade", "value my trade", "what's my car worth",
    "sell-us-your-car", "sell-us-your-auto", "sell-your-auto", "value-your-auto", "value-your-vehicle"
  ];
  const widgetSignals = [
    // Vendor-neutral widget markers, true in any market.
    "tradepending", "trade-pending", "trade-in-widget",
    "tradein-widget", "valueyourtrade", "value-your-trade",
    // Whichever valuation providers this market actually uses.
    ...valuation.names.map((n) => n.replace(/\s+/g, "")),
    ...valuation.domains,
    // US-only vendor markers, kept for the US pack via its own provider list.
    ...(locale.code === "US" ? ["kbb", "accutrade", "accu-trade", "blackbook", "black-book", "icoapi", "instantcashoffer"] : []),
  ];

  const result = await page.evaluate((sig) => {
    const { textKeywords, ctaKeywords, widgetSignals } = sig;
    const lc = (s) => (s || "").toLowerCase();
    // Normalize separators (-, _, /) to spaces so hyphenated slugs match space keywords
    const norm = (s) => lc(s).replace(/[-_/]+/g, " ").replace(/\s+/g, " ").trim();
    // Combined keyword set in normalized (space) form for CTA matching
    const ctaMatchSet = ctaKeywords.concat(textKeywords).map(k => k.replace(/[-_/]+/g, " ").replace(/\s+/g, " ").trim());

    // 1. Widget / embed detection (script src, iframe src, container id/class)
    const foundWidgets = [];
    document.querySelectorAll("iframe, script, div, section").forEach(el => {
      const hay = lc(el.getAttribute("src")) + " " + lc(el.id) + " " + lc(el.className);
      widgetSignals.forEach(w => {
        if (hay.includes(w) && !foundWidgets.includes(w)) foundWidgets.push(w);
      });
    });

    // 2. CTA / link detection (reads text, href, aria-label, title; separator-normalized)
    const ctaExamples = [];
    document.querySelectorAll("a, button").forEach(el => {
      const hay = [
        norm(el.innerText || el.value),
        norm(el.getAttribute("href")),
        norm(el.getAttribute("aria-label")),
        norm(el.getAttribute("title"))
      ].join(" ");
      if (ctaMatchSet.some(k => k && hay.includes(k))) {
        const label = (el.innerText || el.value || el.getAttribute("aria-label") || "").trim().slice(0, 40);
        const rawHref = el.getAttribute("href");
        if (label && ctaExamples.length < 5) {
          ctaExamples.push(label + (rawHref ? ` -> ${rawHref}` : ""));
        }
      }
    });

    // 3. Valuation form detection (form referencing trade-in + vehicle-identifying fields)
    let formFieldsDetected = [];
    const vehicleFieldHints = ["vin", "year", "make", "model", "mileage", "odometer", "condition", "trim"];
    document.querySelectorAll("form").forEach(form => {
      const formText = lc(form.innerText) + " " + lc(form.getAttribute("id")) + " " + lc(form.getAttribute("class"));
      const hits = new Set();
      form.querySelectorAll("input, select, textarea").forEach(inp => {
        const fieldMeta = lc(inp.name) + " " + lc(inp.id) + " " + lc(inp.placeholder) + " " + lc(inp.getAttribute("aria-label"));
        vehicleFieldHints.forEach(h => { if (fieldMeta.includes(h)) hits.add(h); });
      });
      const mentionsTrade = textKeywords.some(k => formText.includes(k));
      if (mentionsTrade && hits.size >= 2 && formFieldsDetected.length === 0) {
        formFieldsDetected = Array.from(hits);
      }
    });

    // 4. Text mention (weakest signal)
    const bodyText = lc(document.body.innerText);
    const matchedKeywords = textKeywords.filter(k => bodyText.includes(k));

    return { foundWidgets, ctaExamples, formFieldsDetected, matchedKeywords };
  }, { textKeywords, ctaKeywords, widgetSignals });

  const hasWidget = result.foundWidgets.length > 0;
  const hasCTA = result.ctaExamples.length > 0;
  const hasForm = result.formFieldsDetected.length > 0;
  const hasText = result.matchedKeywords.length > 0;

  // PASS: an actionable trade-in tool exists
  if (hasWidget || hasCTA || hasForm) {
    const detectionType = hasWidget ? "estimator-widget" : hasForm ? "valuation-form" : "trade-in-cta";
    return {
      score: 100,
      status: "pass",
      details: "An interactive trade-in valuation flow is available to capture high-intent leads.",
      meta: {
        detectionType,
        foundWidgets: result.foundWidgets,
        ctaExamples: result.ctaExamples,
        formFieldsDetected: result.formFieldsDetected,
        matchedKeywords: result.matchedKeywords
      },
      analysis: null
    };
  }

  // WARNING: trade-ins mentioned, but no tool to act on
  if (hasText) {
    return {
      score: 50,
      status: "warning",
      details: "Trade-ins are mentioned, but no interactive estimator, CTA, or valuation form was found.",
      meta: {
        detectionType: "text-mention-only",
        foundWidgets: [],
        ctaExamples: [],
        formFieldsDetected: [],
        matchedKeywords: result.matchedKeywords
      },
      analysis: {
        cause: "The page references trade-ins in its copy but offers no tool, button, or form for a visitor to actually get a trade-in value.",
        recommendation: "Add a 'Value Your Trade' CTA or embed a trade-in estimator (e.g., KBB Instant Cash Offer, TradePending) so high-intent trade-in shoppers convert on-site instead of leaving."
      }
    };
  }

  // FAIL: no trade-in signals at all
  return {
    score: 0,
    status: "fail",
    details: "No trade-in valuation flow or estimator detected.",
    meta: {
      detectionType: "none",
      foundWidgets: [],
      ctaExamples: [],
      formFieldsDetected: [],
      matchedKeywords: []
    },
    analysis: {
      cause: "No trade-in estimator, 'Value Your Trade' CTA, valuation form, or even a textual reference to trade-ins was found on the page.",
      recommendation: "Add a trade-in estimator and a prominent 'Value Your Trade' Call-to-Action. Trade-in shoppers are high-intent buyers — capturing them on-site prevents these leads from leaking to third-party sites like KBB or Carvana."
    }
  };
}

// Financing Flow / Pre-Approval Process (Dealer Lead Flow)
async function checkFinancingFlow(page, $, market = null) {
  // Signals ordered strongest -> weakest
  const textKeywords = [
    "financing", "auto financing", "car financing", "vehicle financing",
    "pre-approval", "pre approval", "pre-approved", "pre approved", "get pre-approved",
    "apply for financing", "apply for credit", "credit application", "finance application",
    "auto loan", "car loan", "get approved", "bad credit", "no credit",
    "secure credit application", "finance center", "financing options"
  ];
  const ctaKeywords = [
    "pre-approval", "pre-approved", "preapproval", "preapproved", "get-pre-approved",
    "apply-for-financing", "apply-for-credit", "credit-application", "finance-application",
    "auto-loan", "car-loan", "get-financing", "get-approved", "credit-app", "creditapp",
    "secure-credit-application", "financing", "finance", "apply for financing", "apply for credit"
  ];
  const widgetSignals = [
    "routeone", "route-one", "dealertrack", "dealer-track", "autofi", "auto-fi",
    "700credit", "capitalone", "capital-one", "drivetime", "americredit", "westlake",
    "darwinautomotive", "darwin", "promax", "appone", "financing-widget",
    "creditapp", "credit-application", "prequal", "preapproval"
  ];

  const result = await page.evaluate((sig) => {
    const { textKeywords, ctaKeywords, widgetSignals } = sig;
    const lc = (s) => (s || "").toLowerCase();
    const norm = (s) => lc(s).replace(/[-_/]+/g, " ").replace(/\s+/g, " ").trim();
    const ctaMatchSet = ctaKeywords.concat(textKeywords).map(k => k.replace(/[-_/]+/g, " ").replace(/\s+/g, " ").trim());

    // 1. Lender / financing widget detection (script src, iframe src, container id/class)
    const foundWidgets = [];
    document.querySelectorAll("iframe, script, div, section").forEach(el => {
      const hay = lc(el.getAttribute("src")) + " " + lc(el.id) + " " + lc(el.className);
      widgetSignals.forEach(w => {
        if (hay.includes(w) && !foundWidgets.includes(w)) foundWidgets.push(w);
      });
    });

    // 2. CTA / link detection (text, href, aria-label, title; separator-normalized)
    const ctaExamples = [];
    document.querySelectorAll("a, button").forEach(el => {
      const hay = [
        norm(el.innerText || el.value),
        norm(el.getAttribute("href")),
        norm(el.getAttribute("aria-label")),
        norm(el.getAttribute("title"))
      ].join(" ");
      if (ctaMatchSet.some(k => k && hay.includes(k))) {
        const label = (el.innerText || el.value || el.getAttribute("aria-label") || "").trim().slice(0, 40);
        const rawHref = el.getAttribute("href");
        if (label && ctaExamples.length < 5) {
          ctaExamples.push(label + (rawHref ? ` -> ${rawHref}` : ""));
        }
      }
    });

    // 3. Credit-application form detection (finance copy + finance-identifying fields)
    let formFieldsDetected = [];
    const financeFieldHints = ["ssn", "social security", "income", "employer", "employment", "down payment", "downpayment", "credit score", "date of birth", "dob", "residence", "monthly payment"];
    document.querySelectorAll("form").forEach(form => {
      const formText = lc(form.innerText) + " " + lc(form.getAttribute("id")) + " " + lc(form.getAttribute("class"));
      const hits = new Set();
      form.querySelectorAll("input, select, textarea").forEach(inp => {
        const fieldMeta = lc(inp.name) + " " + lc(inp.id) + " " + lc(inp.placeholder) + " " + lc(inp.getAttribute("aria-label"));
        financeFieldHints.forEach(h => { if (fieldMeta.includes(h)) hits.add(h); });
      });
      const mentionsFinance = textKeywords.some(k => formText.includes(k));
      if (mentionsFinance && hits.size >= 2 && formFieldsDetected.length === 0) {
        formFieldsDetected = Array.from(hits);
      }
    });

    // 4. Text mention (weakest signal)
    const bodyText = lc(document.body.innerText);
    const matchedKeywords = textKeywords.filter(k => bodyText.includes(k));

    return { foundWidgets, ctaExamples, formFieldsDetected, matchedKeywords };
  }, { textKeywords, ctaKeywords, widgetSignals });

  const hasWidget = result.foundWidgets.length > 0;
  const hasCTA = result.ctaExamples.length > 0;
  const hasForm = result.formFieldsDetected.length > 0;
  const hasText = result.matchedKeywords.length > 0;

  // PASS: an actionable financing flow exists.
  //
  // Where the market licenses credit assistance, offering the flow at all
  // carries a disclosure obligation with it. In Australia, arranging finance is
  // credit assistance under the NCCP Act and the Australian Credit Licence
  // number must be disclosed — present or absent, no judgement required, and
  // there is no US analogue. The licence PATTERN is matched, not just the
  // phrase: "we are a credit licensee" without a number is exactly the case
  // this is meant to catch.
  const licenceRule = getLocale(market).finance.licenceDisclosure;
  let licence = null;
  if (licenceRule && (hasWidget || hasCTA || hasForm)) {
    licence = await page.evaluate((cfg) => {
      const text = document.body.innerText || "";
      const lower = text.toLowerCase();
      const m = text.match(new RegExp(cfg.pattern.source, cfg.pattern.flags));
      return {
        numberFound: !!m,
        number: m ? m[1] : null,
        phraseFound: cfg.terms.some((t) => lower.includes(t)),
      };
    }, { pattern: { source: licenceRule.pattern.source, flags: licenceRule.pattern.flags }, terms: licenceRule.terms })
      .catch(() => null);
  }
  const licenceMissing = !!(licenceRule && licence && !licence.numberFound);

  if (hasWidget || hasCTA || hasForm) {
    const detectionType = hasWidget ? "lender-widget" : hasForm ? "credit-application-form" : "financing-cta";
    return {
      score: licenceMissing ? 75 : 100,
      status: licenceMissing ? "warning" : "pass",
      details: licenceMissing
        ? `A financing flow is available, but no ${licenceRule.label} was found on the page.`
        : "A financing / pre-approval flow is available to capture sales-ready leads on-site.",
      meta: {
        market: getLocale(market).code,
        creditLicence: licenceRule ? { expected: licenceRule.label, ...(licence || {}), basis: licenceRule.basis } : null,
        detectionType,
        foundWidgets: result.foundWidgets,
        ctaExamples: result.ctaExamples,
        formFieldsDetected: result.formFieldsDetected,
        matchedKeywords: result.matchedKeywords
      },
      analysis: licenceMissing ? {
        cause: `This page offers finance but does not display ${licenceRule.label.toLowerCase()}. ${licenceRule.basis}`,
        recommendation: "Display your Australian Credit Licence number (or your authorised-representative details and the licensee's number) on every page that offers or arranges finance — typically in the footer and beside the application form.",
      } : null
    };
  }

  // WARNING: financing mentioned, but no actionable flow
  if (hasText) {
    return {
      score: 50,
      status: "warning",
      details: "Financing is mentioned, but no pre-approval CTA, credit application, or lender widget was found.",
      meta: {
        detectionType: "text-mention-only",
        foundWidgets: [],
        ctaExamples: [],
        formFieldsDetected: [],
        matchedKeywords: result.matchedKeywords
      },
      analysis: {
        cause: "The page references financing in its copy but offers no pre-approval button, credit application, or lender tool for a visitor to actually start the process.",
        recommendation: "Add a 'Get Pre-Approved' / 'Apply for Financing' CTA or embed a secure credit application (e.g., RouteOne, DealerTrack, AutoFi) so bottom-of-funnel buyers convert on-site."
      }
    };
  }

  // FAIL: no financing signals at all
  return {
    score: 0,
    status: "fail",
    details: "No financing or pre-approval flow detected.",
    meta: {
      detectionType: "none",
      foundWidgets: [],
      ctaExamples: [],
      formFieldsDetected: [],
      matchedKeywords: []
    },
    analysis: {
      cause: "No lender widget, credit application, 'Get Pre-Approved' CTA, or even a textual reference to financing was found on the page.",
      recommendation: "Add a financing / pre-approval flow — a prominent 'Get Pre-Approved' CTA plus a secure credit application. Pre-approval shoppers are your most sales-ready leads; capturing them on-site keeps the financing relationship with the dealer."
    }
  };
}

// Finance Calculator / Payment Estimator (Dealer Lead Flow)
async function checkFinanceCalculator(page, $, market = null) {
  const locale = getLocale(market);

  // Signals ordered strongest -> weakest
  const textKeywords = [
    "payment calculator", "finance calculator", "loan calculator", "lease calculator",
    "payment estimator", "estimate your payment", "estimate your monthly payment",
    "calculate your payment", "calculate your monthly payment", "estimated monthly payment",
    "monthly payment calculator", "auto loan calculator", "car payment calculator",
    // Australian sites overwhelmingly quote WEEKLY repayments, and call the tool
    // a repayment calculator rather than a payment calculator.
    ...(locale.code === "AU" ? [
      "repayment calculator", "repayments calculator", "estimate your repayments",
      "calculate your repayments", "weekly repayment", "weekly repayments",
      "finance calculator", "car loan calculator", "novated lease calculator",
    ] : []),
  ];
  const ctaKeywords = [
    "payment-calculator", "finance-calculator", "loan-calculator", "lease-calculator",
    "estimate-payment", "calculate-payment", "payment-estimator", "monthly-payment",
    "payment calculator", "finance calculator", "loan calculator", "estimate your payment",
    "calculate payment", "estimate payment", "auto-loan-calculator", "car-payment-calculator"
  ];
  const widgetSignals = [
    "payment-calculator", "paymentcalculator", "finance-calculator", "financecalculator",
    "loan-calculator", "loancalculator", "lease-calculator", "leasecalculator",
    "calculatepayment", "payment-estimator", "paymentestimator", "estimate-payment",
    "marketscan", "dealerscience", "calculator-widget", "paymentwidget"
  ];

  const result = await page.evaluate((sig) => {
    const { textKeywords, ctaKeywords, widgetSignals } = sig;
    const lc = (s) => (s || "").toLowerCase();
    const norm = (s) => lc(s).replace(/[-_/]+/g, " ").replace(/\s+/g, " ").trim();
    const ctaMatchSet = ctaKeywords.concat(textKeywords).map(k => k.replace(/[-_/]+/g, " ").replace(/\s+/g, " ").trim());

    // 1. Calculator widget / embed detection (script src, iframe src, container id/class)
    const foundWidgets = [];
    document.querySelectorAll("iframe, script, div, section").forEach(el => {
      const hay = lc(el.getAttribute("src")) + " " + lc(el.id) + " " + lc(el.className);
      widgetSignals.forEach(w => {
        if (hay.includes(w) && !foundWidgets.includes(w)) foundWidgets.push(w);
      });
    });

    // 2. CTA / link detection (text, href, aria-label, title; separator-normalized)
    const ctaExamples = [];
    document.querySelectorAll("a, button").forEach(el => {
      const hay = [
        norm(el.innerText || el.value),
        norm(el.getAttribute("href")),
        norm(el.getAttribute("aria-label")),
        norm(el.getAttribute("title"))
      ].join(" ");
      if (ctaMatchSet.some(k => k && hay.includes(k))) {
        const label = (el.innerText || el.value || el.getAttribute("aria-label") || "").trim().slice(0, 40);
        const rawHref = el.getAttribute("href");
        if (label && ctaExamples.length < 5) {
          ctaExamples.push(label + (rawHref ? ` -> ${rawHref}` : ""));
        }
      }
    });

    // 3. Calculator input cluster (page-wide; calculators are often <div>s, not <form>s)
    // "core" finance-math fields distinguish a calculator from a generic/credit form
    const coreHints = ["interest rate", "apr", "term", "months", "loan amount", "amount financed", "monthly payment"];
    const sharedHints = ["down payment", "downpayment", "vehicle price", "sale price", "msrp", "trade value", "trade-in value"];
    const allHints = coreHints.concat(sharedHints);
    const hitSet = new Set();
    let coreHitCount = 0;
    document.querySelectorAll("input, select").forEach(inp => {
      const fieldMeta = lc(inp.name) + " " + lc(inp.id) + " " + lc(inp.placeholder) + " " + lc(inp.getAttribute("aria-label"));
      allHints.forEach(h => {
        if (fieldMeta.includes(h)) {
          hitSet.add(h);
          if (coreHints.includes(h)) coreHitCount++;
        }
      });
    });
    // require >=2 distinct calc fields AND at least one rate/term/payment "core" field
    const formFieldsDetected = (hitSet.size >= 2 && coreHitCount >= 1) ? Array.from(hitSet) : [];

    // 4. Text mention (weakest signal)
    const bodyText = lc(document.body.innerText);
    const matchedKeywords = textKeywords.filter(k => bodyText.includes(k));

    return { foundWidgets, ctaExamples, formFieldsDetected, matchedKeywords };
  }, { textKeywords, ctaKeywords, widgetSignals });

  const hasWidget = result.foundWidgets.length > 0;
  const hasInputs = result.formFieldsDetected.length > 0;
  const hasCTA = result.ctaExamples.length > 0;
  const hasText = result.matchedKeywords.length > 0;

  // PASS: an actionable payment calculator exists.
  //
  // A working calculator is necessary but not sufficient: both markets require a
  // disclosure wherever a rate or repayment is advertised, and they require
  // DIFFERENT ones. The US triggers on Reg-Z — stating a payment forces the full
  // terms including the APR. Australia requires a comparison rate plus the
  // prescribed warning under the National Credit Code, and expects the credit
  // licence number nearby. Both are deterministic string checks, so a calculator
  // that quotes a rate with no disclosure is a real, quotable finding rather
  // than a clean 100.
  if (hasWidget || hasInputs || hasCTA) {
    const detectionType = hasWidget ? "calculator-widget" : hasInputs ? "calculator-inputs" : "calculator-cta";
    const rd = locale.finance.rateDisclosure;
    const disclosure = await page.evaluate((cfg) => {
      const text = (document.body.innerText || "").toLowerCase();
      const quotesRate = /\b\d+(?:\.\d+)?\s*%\s*(?:p\.?a\.?|apr|interest|comparison)?/.test(text)
        || /\bfrom \$\d+\s*(?:per|\/)\s*(?:week|month|fortnight)/.test(text);
      return {
        quotesRate,
        required: cfg.required.filter((t) => text.includes(t)),
        supporting: cfg.supporting.filter((t) => text.includes(t)),
        licence: cfg.licence ? cfg.licence.some((t) => text.includes(t)) : null,
      };
    }, {
      required: rd.requiredTerms,
      supporting: rd.supportingTerms,
      licence: locale.finance.licenceDisclosure ? locale.finance.licenceDisclosure.terms : null,
    }).catch(() => null);

    const disclosureMissing = !!(disclosure && disclosure.quotesRate && disclosure.required.length === 0);
    const score = disclosureMissing ? 75 : 100;

    return {
      score,
      status: score >= 80 ? "pass" : "warning",
      details: disclosureMissing
        ? `Interactive calculator present, but a rate is advertised without ${rd.label}.`
        : "An interactive payment calculator / estimator is available to help shoppers gauge affordability.",
      meta: {
        market: locale.code,
        detectionType,
        foundWidgets: result.foundWidgets,
        ctaExamples: result.ctaExamples,
        formFieldsDetected: result.formFieldsDetected,
        matchedKeywords: result.matchedKeywords,
        rateDisclosure: disclosure
          ? { expected: rd.label, quotesRate: disclosure.quotesRate, found: disclosure.required, supporting: disclosure.supporting, licenceNearby: disclosure.licence, basis: rd.basis }
          : null,
      },
      analysis: disclosureMissing
        ? {
          cause: `This page advertises a rate or repayment but ${rd.label.toLowerCase()} was not found alongside it. ${rd.basis}`,
          recommendation: locale.code === "AU"
            ? "Show the comparison rate and the prescribed warning statement beside every advertised rate, along with \"fees and charges apply\", \"approval subject to lending criteria\", and your Australian Credit Licence number."
            : "Show the APR wherever a payment amount, down payment, term or finance charge appears, together with the full credit terms.",
        }
        : null
    };
  }

  // WARNING: calculator mentioned, but no actionable tool
  if (hasText) {
    return {
      score: 50,
      status: "warning",
      details: "A payment calculator is mentioned, but no interactive estimator or calculator inputs were found.",
      meta: {
        detectionType: "text-mention-only",
        foundWidgets: [],
        ctaExamples: [],
        formFieldsDetected: [],
        matchedKeywords: result.matchedKeywords
      },
      analysis: {
        cause: "The page references a payment calculator in its copy but offers no interactive tool, inputs, or link for a visitor to actually estimate a monthly payment.",
        recommendation: "Add an interactive payment calculator (price, down payment, APR, term) so shoppers can see an estimated monthly payment and move toward a financing lead."
      }
    };
  }

  // FAIL: no calculator signals at all
  return {
    score: 0,
    status: "fail",
    details: "No payment calculator or estimator detected.",
    meta: {
      detectionType: "none",
      foundWidgets: [],
      ctaExamples: [],
      formFieldsDetected: [],
      matchedKeywords: []
    },
    analysis: {
      cause: "No calculator widget, calculator inputs, payment-estimator CTA, or even a textual reference to a payment calculator was found on the page.",
      recommendation: "Add a finance / payment calculator so shoppers can estimate monthly payments on-site. Removing payment uncertainty increases engagement and lead quality."
    }
  };
}

// Appointment Booking (Test Drive / Service Scheduling) (Dealer Lead Flow)
async function checkAppointmentBooking(page, $) {
  // Signals ordered strongest -> weakest
  const textKeywords = [
    "schedule service", "service appointment", "schedule a service", "book service",
    "book a test drive", "schedule a test drive", "schedule test drive", "test drive",
    "book an appointment", "schedule an appointment", "make an appointment",
    "book appointment", "schedule appointment", "schedule your visit", "request a test drive",
    "schedule a visit", "book a visit"
  ];
  const ctaKeywords = [
    "schedule-service", "service-appointment", "book-service", "book-test-drive",
    "schedule-test-drive", "test-drive", "book-appointment", "schedule-appointment",
    "make-an-appointment", "request-a-test-drive", "schedule-a-test-drive", "schedule-a-visit",
    "schedule service", "book a test drive", "schedule a test drive", "test drive",
    "book an appointment", "schedule an appointment", "make an appointment", "schedule appointment"
  ];
  const widgetSignals = [
    "xtime", "mykaarma", "my-kaarma", "timehighway", "calendly", "setmore",
    "acuityscheduling", "acuity", "autopoint", "cdkglobal", "dealersocket",
    "appointment-widget", "appointmentwidget", "booking-widget", "bookingwidget",
    "scheduler", "schedule-service", "schedule-appointment", "simplybook"
  ];

  const result = await page.evaluate((sig) => {
    const { textKeywords, ctaKeywords, widgetSignals } = sig;
    const lc = (s) => (s || "").toLowerCase();
    const norm = (s) => lc(s).replace(/[-_/]+/g, " ").replace(/\s+/g, " ").trim();
    const ctaMatchSet = ctaKeywords.concat(textKeywords).map(k => k.replace(/[-_/]+/g, " ").replace(/\s+/g, " ").trim());

    // 1. Scheduling widget / embed detection (script src, iframe src, container id/class)
    const foundWidgets = [];
    document.querySelectorAll("iframe, script, div, section").forEach(el => {
      const hay = lc(el.getAttribute("src")) + " " + lc(el.id) + " " + lc(el.className);
      widgetSignals.forEach(w => {
        if (hay.includes(w) && !foundWidgets.includes(w)) foundWidgets.push(w);
      });
    });

    // 2. CTA / link detection (text, href, aria-label, title; separator-normalized)
    const ctaExamples = [];
    document.querySelectorAll("a, button").forEach(el => {
      const hay = [
        norm(el.innerText || el.value),
        norm(el.getAttribute("href")),
        norm(el.getAttribute("aria-label")),
        norm(el.getAttribute("title"))
      ].join(" ");
      if (ctaMatchSet.some(k => k && hay.includes(k))) {
        const label = (el.innerText || el.value || el.getAttribute("aria-label") || "").trim().slice(0, 40);
        const rawHref = el.getAttribute("href");
        if (label && ctaExamples.length < 5) {
          ctaExamples.push(label + (rawHref ? ` -> ${rawHref}` : ""));
        }
      }
    });

    // 3. Booking form detection (appointment copy + date/time scheduling fields)
    let formFieldsDetected = [];
    const dateTimeHints = ["appointment date", "appointment time", "preferred date", "preferred time", "date", "time", "appointment", "schedule"];
    document.querySelectorAll("form").forEach(form => {
      const formText = lc(form.innerText) + " " + lc(form.getAttribute("id")) + " " + lc(form.getAttribute("class"));
      const hits = new Set();
      form.querySelectorAll("input, select, textarea").forEach(inp => {
        const type = lc(inp.getAttribute("type"));
        if (type === "date") hits.add("date");
        if (type === "time") hits.add("time");
        const fieldMeta = lc(inp.name) + " " + lc(inp.id) + " " + lc(inp.placeholder) + " " + lc(inp.getAttribute("aria-label"));
        dateTimeHints.forEach(h => { if (fieldMeta.includes(h)) hits.add(h); });
      });
      const mentionsAppt = textKeywords.some(k => formText.includes(k));
      if (mentionsAppt && hits.size >= 1 && formFieldsDetected.length === 0) {
        formFieldsDetected = Array.from(hits);
      }
    });

    // 4. Text mention (weakest signal)
    const bodyText = lc(document.body.innerText);
    const matchedKeywords = textKeywords.filter(k => bodyText.includes(k));

    return { foundWidgets, ctaExamples, formFieldsDetected, matchedKeywords };
  }, { textKeywords, ctaKeywords, widgetSignals });

  const hasWidget = result.foundWidgets.length > 0;
  const hasForm = result.formFieldsDetected.length > 0;
  const hasCTA = result.ctaExamples.length > 0;
  const hasText = result.matchedKeywords.length > 0;

  // PASS: an actionable appointment booking flow exists
  if (hasWidget || hasForm || hasCTA) {
    const detectionType = hasWidget ? "scheduling-widget" : hasForm ? "booking-form" : "appointment-cta";
    return {
      score: 100,
      status: "pass",
      details: "An appointment booking flow (test drive / service scheduling) is available on-site.",
      meta: {
        detectionType,
        foundWidgets: result.foundWidgets,
        ctaExamples: result.ctaExamples,
        formFieldsDetected: result.formFieldsDetected,
        matchedKeywords: result.matchedKeywords
      },
      analysis: null
    };
  }

  // WARNING: appointments mentioned, but no actionable booking flow
  if (hasText) {
    return {
      score: 50,
      status: "warning",
      details: "Appointments are mentioned, but no scheduling widget, booking form, or appointment CTA was found.",
      meta: {
        detectionType: "text-mention-only",
        foundWidgets: [],
        ctaExamples: [],
        formFieldsDetected: [],
        matchedKeywords: result.matchedKeywords
      },
      analysis: {
        cause: "The page references test drives or service appointments in its copy but offers no scheduler, booking form, or button for a visitor to actually book a time.",
        recommendation: "Add a 'Schedule Service' / 'Book a Test Drive' CTA or embed a scheduling tool (e.g., Xtime, myKaarma, Calendly) so high-intent visitors can book on-site."
      }
    };
  }

  // FAIL: no appointment signals at all
  return {
    score: 0,
    status: "fail",
    details: "No appointment booking or scheduling flow detected.",
    meta: {
      detectionType: "none",
      foundWidgets: [],
      ctaExamples: [],
      formFieldsDetected: [],
      matchedKeywords: []
    },
    analysis: {
      cause: "No scheduling widget, booking form, 'Schedule Service' / 'Book a Test Drive' CTA, or even a textual reference to appointments was found on the page.",
      recommendation: "Add an appointment booking flow — a prominent 'Schedule Service' and 'Book a Test Drive' CTA plus an on-site scheduler. Appointment bookers are ready to visit; capturing them on-site converts browsers into showroom and service-bay visits."
    }
  };
}

// Thank You / Confirmation Pages (Conversion follow-up)
async function checkThankYouPages(page, $) {
  const result = await page.evaluate(() => {
    const lc = (s) => (s || "").toLowerCase();
    const refKeywords = ["thank-you", "thankyou", "thank_you", "/thanks", "confirmation", "thank you"];
    const formCount = document.querySelectorAll("form").length;
    const references = [];

    // Links pointing at a thank-you / confirmation page
    document.querySelectorAll("a").forEach(a => {
      const href = lc(a.getAttribute("href"));
      if (href && refKeywords.some(k => href.includes(k))) {
        const raw = a.getAttribute("href");
        if (raw && references.length < 6 && !references.includes(raw)) references.push(raw);
      }
    });

    // Form action / redirect attributes pointing at a thank-you page
    document.querySelectorAll("form").forEach(f => {
      const action = lc(f.getAttribute("action"));
      const redirect = lc(
        f.getAttribute("data-redirect") || f.getAttribute("data-thank-you") ||
        f.getAttribute("data-confirmation") || f.getAttribute("data-success-url") || ""
      );
      const hay = action + " " + redirect;
      if (refKeywords.some(k => hay.includes(k))) {
        const raw = f.getAttribute("action") || f.getAttribute("data-redirect") || "form-redirect";
        if (references.length < 6 && !references.includes(raw)) references.push(raw);
      }
    });

    // Is the current page itself a thank-you / confirmation page?
    const h1 = document.querySelector("h1");
    const pageSignals = lc(document.title) + " " + lc(location.pathname) + " " + lc(h1 ? h1.innerText : "");
    const isThankYouPage = ["thank you", "thank-you", "thankyou", "/thanks", "confirmation"].some(k => pageSignals.includes(k));

    return { formCount, references, isThankYouPage };
  });

  const hasRef = result.references.length > 0 || result.isThankYouPage;

  // PASS: thank-you/confirmation flow detected
  if (hasRef) {
    return {
      score: 100,
      status: "pass",
      details: "A thank-you / confirmation page is in place for post-submission follow-up.",
      meta: {
        detectionType: result.isThankYouPage ? "is-thank-you-page" : "thank-you-reference",
        formCount: result.formCount,
        references: result.references
      },
      analysis: null
    };
  }

  // WARNING: forms exist but no confirmation page found
  if (result.formCount > 0) {
    return {
      score: 50,
      status: "warning",
      details: "Lead forms exist but no thank-you / confirmation page was detected.",
      meta: { detectionType: "forms-without-thankyou", formCount: result.formCount, references: [] },
      analysis: {
        cause: "Forms are present but no thank-you or confirmation page/redirect was found, so successful submissions may not be confirmed to the user or tracked as conversions.",
        recommendation: "Redirect form submissions to a dedicated thank-you page. It reassures the user, sets next steps, and provides a clean conversion event for analytics and retargeting."
      }
    };
  }

  // NEUTRAL: no forms, so a thank-you page is not required
  return {
    score: 100,
    status: "pass",
    details: "No lead forms detected, so a thank-you page is not required.",
    meta: { detectionType: "not-applicable", formCount: 0, references: [] },
    analysis: { impact: "Thank-you pages become relevant once lead-capture forms are present." }
  };
}

// Chat Experience (Live Chat / Chatbot)
async function checkChatExperience(page, $) {
  const widgetSignals = [
    "intercom", "drift", "tawk.to", "tawk", "livechat", "live-chat", "zendesk", "zopim",
    "tidio", "crisp", "gubagoo", "podium", "liveperson", "olark", "freshchat", "kommunicate",
    "manychat", "birdeye", "activengage", "carnow", "hubspot", "helpcrunch", "chaport",
    "chatbot", "chat-widget", "chatwidget", "chat-bubble", "fb-customerchat"
  ];
  const textKeywords = ["live chat", "chat with us", "chat now", "start a chat", "chat with an agent", "message us"];

  const result = await page.evaluate((sig) => {
    const { widgetSignals, textKeywords } = sig;
    const lc = (s) => (s || "").toLowerCase();

    // Widget / embed detection (script src, iframe src, container id/class)
    const foundWidgets = [];
    document.querySelectorAll("iframe, script, div, section, button").forEach(el => {
      const hay = lc(el.getAttribute("src")) + " " + lc(el.id) + " " + lc(el.className);
      widgetSignals.forEach(w => { if (hay.includes(w) && !foundWidgets.includes(w)) foundWidgets.push(w); });
    });

    // Chat launcher buttons (aria-label / title / text)
    const launchers = [];
    document.querySelectorAll("a, button, div[role='button']").forEach(el => {
      const hay = lc(el.getAttribute("aria-label")) + " " + lc(el.getAttribute("title")) + " " + lc(el.innerText);
      if (/(live chat|open chat|chat with|start chat|chat now|chatbot)/.test(hay)) {
        const label = (el.getAttribute("aria-label") || el.innerText || "").trim().slice(0, 40);
        if (label && launchers.length < 5 && !launchers.includes(label)) launchers.push(label);
      }
    });

    const bodyText = lc(document.body.innerText);
    const matchedKeywords = textKeywords.filter(k => bodyText.includes(k));

    return { foundWidgets, launchers, matchedKeywords };
  }, { widgetSignals, textKeywords });

  const hasWidget = result.foundWidgets.length > 0;
  const hasLauncher = result.launchers.length > 0;
  const hasText = result.matchedKeywords.length > 0;

  // PASS: a chat experience is loaded
  if (hasWidget || hasLauncher) {
    return {
      score: 100,
      status: "pass",
      details: "A live chat / chatbot experience is available for instant engagement.",
      meta: {
        detectionType: hasWidget ? "chat-widget" : "chat-launcher",
        foundWidgets: result.foundWidgets,
        ctaExamples: result.launchers,
        formFieldsDetected: [],
        matchedKeywords: result.matchedKeywords
      },
      analysis: null
    };
  }

  // WARNING: chat mentioned, no widget
  if (hasText) {
    return {
      score: 50,
      status: "warning",
      details: "Chat is mentioned, but no live chat or chatbot widget was detected.",
      meta: { detectionType: "text-mention-only", foundWidgets: [], ctaExamples: [], formFieldsDetected: [], matchedKeywords: result.matchedKeywords },
      analysis: {
        cause: "The page references chat in its copy but no chat widget or launcher was found loaded on the page.",
        recommendation: "Add a live chat or chatbot widget (e.g., Gubagoo, Podium, CarNow, Intercom, Drift) so visitors get instant answers and convert without leaving."
      }
    };
  }

  // FAIL: no chat at all
  return {
    score: 0,
    status: "fail",
    details: "No live chat or chatbot experience detected.",
    meta: { detectionType: "none", foundWidgets: [], ctaExamples: [], formFieldsDetected: [], matchedKeywords: [] },
    analysis: {
      cause: "No chat widget, chatbot, or chat launcher was found on the page.",
      recommendation: "Add a live chat or chatbot (Gubagoo, Podium, CarNow, Intercom) to answer shopper questions in real time and capture leads outside business hours."
    }
  };
}

// Click-to-Call (tel: link detection)
async function checkClickToCall(page, $, market = null) {
  // The primary path — a tel: link — is market-neutral and unchanged. What was
  // broken is the FALLBACK ("a number is shown but is not tappable"), whose
  // hardcoded 10–11 digit rule rejected every Australian 13-number: "13 12 34"
  // is six digits, so such a page scored 0 instead of 50.
  const validLengths = getLocale(market).phone.nationalDigits;

  const result = await page.evaluate((lengths) => {
    const digitCount = (s) => (s.replace(/\D/g, "").length);
    const plausible = (s) => {
      const d = digitCount(s);
      // A national-length number, optionally carrying a trunk zero or a country
      // code on top of it.
      return lengths.some((n) => d === n || d === n + 1 || d === n + 2 || d === n + 3);
    };

    const telLinks = Array.from(document.querySelectorAll('a[href^="tel:"]'));
    const telExamples = [];
    telLinks.forEach(a => {
      const num = (a.getAttribute("href") || "").replace(/^tel:/i, "").trim();
      if (num && telExamples.length < 5 && !telExamples.includes(num)) telExamples.push(num);
    });

    // Visible phone numbers in body text, at any length this market actually uses.
    const bodyText = document.body.innerText || "";
    const phoneRegex = /(\+?\d[\d\s().-]{4,}\d)/g;
    const matches = bodyText.match(phoneRegex) || [];
    const phones = matches.filter(plausible);

    return {
      telCount: telLinks.length,
      telExamples,
      phoneInText: phones.length > 0,
      phoneSample: phones.slice(0, 3).map(s => s.trim())
    };
  }, validLengths);

  // PASS: click-to-call links present
  if (result.telCount > 0) {
    return {
      score: 100,
      status: "pass",
      details: "Click-to-call (tel:) links are present for one-tap calling.",
      meta: { detectionType: "tel-links", telCount: result.telCount, telExamples: result.telExamples },
      analysis: null
    };
  }

  // WARNING: phone shown but not tappable
  if (result.phoneInText) {
    return {
      score: 50,
      status: "warning",
      details: "A phone number is shown but it is not a click-to-call (tel:) link.",
      meta: { detectionType: "phone-text-only", telCount: 0, telExamples: [], phoneSample: result.phoneSample },
      analysis: {
        cause: "A phone number appears in the page text but is not wrapped in a tel: link, so mobile users cannot tap to call.",
        recommendation: "Wrap phone numbers in an <a href=\"tel:...\"> link so mobile visitors can call with one tap — phone is a top lead channel for dealerships."
      }
    };
  }

  // FAIL: no phone at all
  return {
    score: 0,
    status: "fail",
    details: "No phone number or click-to-call link detected.",
    meta: { detectionType: "none", telCount: 0, telExamples: [] },
    analysis: {
      cause: "No tel: link or visible phone number was found on the page.",
      recommendation: "Display your dealership phone number prominently and make it a click-to-call (tel:) link so shoppers can reach you instantly."
    }
  };
}

// ---------------------------------------------------------------------------
// Analytics & Conversion Tracking
// ---------------------------------------------------------------------------
// Gather the rendered page's scripts (src + inline), full HTML, tel: links, and
// known tracking globals once, so GA4 / GTM / Conversion checks can share it.
export async function collectTrackingData(page) {
  return await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll("script"));
    const scriptSrcs = scripts.map((s) => s.src).filter(Boolean);
    const inline = scripts.map((s) => s.textContent || "").join("\n").slice(0, 200000);
    const html = document.documentElement.outerHTML.slice(0, 300000);
    const telLinks = document.querySelectorAll('a[href^="tel:"]').length;
    let gtmObj = [];
    try { if (window.google_tag_manager) gtmObj = Object.keys(window.google_tag_manager); } catch (e) {}
    return {
      scriptSrcs,
      inline,
      html,
      telLinks,
      gtmObj,
      hasDataLayer: Array.isArray(window.dataLayer),
      hasGtag: typeof window.gtag === "function",
      hasFbq: typeof window.fbq === "function",
      hasGa: typeof window.ga === "function",
    };
  });
}

// GA4 Installed — dedicated Google Analytics 4 tag check.
export function checkGA4Installed(data) {
  const hay = data.scriptSrcs.join(" ") + " " + data.inline + " " + data.html;
  const measurementIds = [...new Set(hay.match(/G-[A-Z0-9]{6,12}/g) || [])];
  const gtagJs = /googletagmanager\.com\/gtag\/js\?id=G-/i.test(hay) || /gtag\/js\?id=G-/i.test(hay);
  const ga4ViaGtm = (data.gtmObj || []).some((k) => /^G-/.test(k));

  if (measurementIds.length || ga4ViaGtm) {
    return {
      score: 100,
      status: "pass",
      details: measurementIds.length
        ? `GA4 detected (${measurementIds.join(", ")})`
        : "GA4 configured via Google Tag Manager",
      meta: { measurementIds, method: measurementIds.length ? "gtag.js" : "gtm", hasGtag: data.hasGtag },
      analysis: null,
    };
  }

  if (gtagJs || data.hasGtag) {
    return {
      score: 50,
      status: "warning",
      details: "gtag.js present but no GA4 measurement ID (G-XXXXXXX) confirmed",
      meta: { measurementIds: [], method: "gtag.js", hasGtag: data.hasGtag },
      analysis: {
        cause: "The Google tag (gtag.js) library is loaded, but no GA4 'G-' measurement ID was found — it may be a legacy Universal Analytics (UA-) or Google Ads-only tag.",
        recommendation: "Add a GA4 property and configure the tag with its G-XXXXXXX measurement ID to track modern analytics.",
      },
    };
  }

  return {
    score: 0,
    status: "fail",
    details: "No GA4 (Google Analytics 4) tag detected",
    meta: { measurementIds: [] },
    analysis: {
      cause: "No GA4 measurement ID (G-XXXXXXX) or gtag.js loader was found on the page.",
      recommendation: "Install Google Analytics 4 (directly via gtag.js or through Google Tag Manager) so you can measure traffic, engagement, and conversions.",
    },
  };
}

// GTM Configuration — Google Tag Manager container detection.
export function checkGTMConfiguration(data) {
  const hay = data.scriptSrcs.join(" ") + " " + data.inline + " " + data.html;
  const idsInHtml = hay.match(/GTM-[A-Z0-9]{4,9}/g) || [];
  const idsInObj = (data.gtmObj || []).filter((k) => /^GTM-/.test(k));
  const containerIds = [...new Set([...idsInHtml, ...idsInObj])];
  const gtmJs = /googletagmanager\.com\/gtm\.js\?id=GTM-/i.test(hay) || /gtm\.js\?id=GTM-/i.test(hay);

  if (containerIds.length) {
    return {
      score: 100,
      status: "pass",
      details: `Google Tag Manager detected (${containerIds.join(", ")})`,
      meta: { containerIds, hasDataLayer: data.hasDataLayer },
      analysis: null,
    };
  }

  if (gtmJs) {
    return {
      score: 50,
      status: "warning",
      details: "GTM loader present but container ID (GTM-XXXX) could not be confirmed",
      meta: { containerIds: [], hasDataLayer: data.hasDataLayer },
      analysis: {
        cause: "The GTM loader script is present but no GTM-XXXX container ID was resolved.",
        recommendation: "Verify the Tag Manager container snippet is installed correctly with a valid GTM-XXXX ID.",
      },
    };
  }

  return {
    score: 0,
    status: "fail",
    details: "No Google Tag Manager container detected",
    meta: { containerIds: [], hasDataLayer: data.hasDataLayer },
    analysis: {
      cause: "No GTM container ID (GTM-XXXX) or gtm.js loader was found on the page.",
      recommendation: "Install Google Tag Manager to manage analytics and marketing tags without code changes, and to centralize conversion tracking.",
    },
  };
}

// Conversion Tracking (form/call) — form-submit & call conversion event detection.
export function checkConversionTracking(data) {
  const hay = (data.scriptSrcs.join(" ") + " " + data.inline + " " + data.html).toLowerCase();

  // ---- Form / lead conversion signals ----
  const formSignals = [];
  if (/generate_lead/.test(hay)) formSignals.push("GA4 generate_lead event");
  if (/['"]form_submit['"]|formsubmit|form_submission/.test(hay)) formSignals.push("form_submit event");
  if (/gtag\(\s*['"]event['"]\s*,\s*['"](generate_lead|sign_up|submit|conversion|contact)['"]/.test(hay)) formSignals.push("gtag conversion event");
  if (/aw-\d{6,}/.test(hay) || /send_to['"]?\s*:\s*['"]aw-/.test(hay)) formSignals.push("Google Ads conversion (AW-)");
  if (data.hasFbq && /fbq\(\s*['"]track['"]\s*,\s*['"](lead|completeregistration|submitapplication|contact)['"]/.test(hay)) formSignals.push("Meta Pixel Lead event");
  if (/datalayer\.push/.test(hay) && /(lead|form_submit|formsubmit|conversion|contact)/.test(hay)) formSignals.push("dataLayer conversion push");

  // ---- Call / phone conversion signals ----
  const callSignals = [];
  const callProviders = ["callrail.com", "calltrk.com", "calltrackingmetrics.com", "dialogtech", "marchex", "retreaver", "invoca", "whatconverts", "calltracking"];
  callProviders.forEach((p) => { if (hay.includes(p)) callSignals.push(p); });
  if (/phone_call|click_to_call|tel_conversion|phone_conversion|call_conversion/.test(hay)) callSignals.push("phone conversion event");

  const formTracking = formSignals.length > 0;
  const callTracking = callSignals.length > 0;
  const telLinks = data.telLinks || 0;

  const baseMeta = { formTracking, callTracking, signals: [...formSignals, ...callSignals], telLinks };

  if (formTracking && callTracking) {
    return {
      score: 100,
      status: "pass",
      details: "Form and call conversion tracking detected",
      meta: baseMeta,
      analysis: null,
    };
  }

  if (formTracking || callTracking) {
    const have = formTracking ? "form" : "call";
    const missing = formTracking ? "call" : "form";
    return {
      score: 50,
      status: "warning",
      details: `Only ${have} conversion tracking detected — ${missing} tracking missing`,
      meta: baseMeta,
      analysis: {
        cause: `Conversion events were found for ${have} submissions, but no ${missing} conversion tracking was detected${missing === "call" && telLinks > 0 ? " despite clickable phone numbers being present" : ""}.`,
        recommendation: missing === "call"
          ? "Add call conversion tracking (e.g., Google Ads phone_conversion, or a call-tracking provider like CallRail) so phone leads are measured."
          : "Add form-submission conversion tracking (e.g., a GA4 'generate_lead' event or Google Ads conversion) so form leads are measured.",
      },
    };
  }

  return {
    score: 0,
    status: "fail",
    details: "No form or call conversion tracking events detected",
    meta: baseMeta,
    analysis: {
      cause: "No conversion-tracking events (GA4 generate_lead, Google Ads conversion, Meta Pixel Lead, or a call-tracking provider) were detected on the page.",
      recommendation: "Fire a conversion event on form submissions and add phone-call tracking, so you can measure how many leads each channel produces.",
    },
  };
}

// ---------------------------------------------------------------------------
// CRM Integration (site-wide) — spec §2.6 "CRM vendor script + form action wired".
// Lightweight DOM/script detection (the heavy network/submission probe lives in
// Security; here it is a Low-weight measurability signal that fits the (page,$)
// signature). Relocated from Security §2.4 (GA4/GTM/Conversion already moved).
// ---------------------------------------------------------------------------
const CRM_VENDOR_SIGNATURES = [
  // Marketing / generic CRMs
  "hubspot", "force.com", "salesforce", "pardot", "marketo", "mktoresp",
  "act-on.com", "salesloft", "/web-to-lead", "leadform", "lead-capture",
  // Automotive / dealership CRMs
  "vinsolutions", "dealersocket", "eleadcrm", "elead", "dealer.com",
  "dealerinspire", "gocrm.ai", "gocrm.io", "selly", "leadperfection",
  "cdkglobal", "promax", "carnow", "activix",
];
export function checkCRMIntegration(data, $) {
  const hay = (data.scriptSrcs.join(" ") + " " + data.inline + " " + data.html).toLowerCase();
  const detected = [...new Set(CRM_VENDOR_SIGNATURES.filter((v) => hay.includes(v)))];

  // Form actions wired to a CRM endpoint (stronger signal than just an SDK on the page).
  const formActions = [];
  try {
    $("form").each((_, f) => {
      const action = ($(f).attr("action") || "").toLowerCase();
      if (action && CRM_VENDOR_SIGNATURES.some((v) => action.includes(v))) {
        if (formActions.length < 5) formActions.push(action);
      }
    });
  } catch (e) { /* cheerio optional */ }

  const hasFormWired = formActions.length > 0;

  if (detected.length && hasFormWired) {
    return {
      score: 100,
      status: "pass",
      details: `CRM integration detected (${detected.join(", ")}) with a lead form wired to it.`,
      meta: { detectedCRMs: detected, formActions },
      analysis: null,
    };
  }

  if (detected.length) {
    return {
      score: 50,
      status: "warning",
      details: `CRM script/SDK detected (${detected.join(", ")}) but no lead form action wired to it was found.`,
      meta: { detectedCRMs: detected, formActions: [] },
      analysis: {
        cause: "A CRM vendor script is present, but no on-page form action posts directly to the CRM — leads may be relayed server-side (not verifiable from the browser) or not captured at all.",
        recommendation: "Wire your lead forms to the CRM (a client-side form action or API) so submissions are reliably captured by VinSolutions / DealerSocket / eLead / HubSpot.",
      },
    };
  }

  return {
    score: 0,
    status: "fail",
    details: "No CRM integration (vendor script or wired form action) detected.",
    meta: { detectedCRMs: [], formActions: [] },
    analysis: {
      cause: "No recognized CRM vendor script (VinSolutions, DealerSocket, eLead, HubSpot, etc.) or CRM-wired form action was found on the page.",
      recommendation: "Connect your lead forms to a CRM so inquiries flow straight into your sales process. Add the CRM's official form embed/SDK and point form submissions at it.",
    },
  };
}

// ---------------------------------------------------------------------------
// Pricing Transparency (page-specific: VDP / Offers / Lease / Finance) — spec §2.6.
// Actual price/payment shown (not "call for price"); fees disclosed. Claimed from
// UX §2.5 (relocated here). Self-flags N/A (dropped from denominator) when the page
// shows no pricing at all.
// ---------------------------------------------------------------------------
// The two markets grade this differently because the underlying obligation is
// different, not merely worded differently:
//
//   US → a price plus separately-disclosed fees and taxes. "Out-the-door" is a
//        customer-driven norm; honesty flows from FTC Act s5.
//   AU → ACL s48: the single total minimum price INCLUDING GST must be stated
//        at least as prominently as any component of it. "Drive away, no more
//        to pay" is the clean compliant form; "+ on-road costs" shown on its
//        own is the defect. The ACCC enforces this actively in automotive.
//
// So the AU branch grades the presence of a TOTAL, and treats a component-only
// price as a specific, quotable finding. Running the AU rule against US pages
// would produce mass false positives, which is exactly why it is gated on the
// locale's own `totalPriceRequired` flag rather than on a market string.
async function checkPricingTransparency(page, market = null) {
  const locale = getLocale(market);

  const data = await page.evaluate((cfg) => {
    const text = (document.body.innerText || '').toLowerCase();
    const has = (terms) => terms.some((t) => text.includes(t));
    const priceEls = document.querySelectorAll('[class*="price" i], [itemprop="price"]').length;
    const dollarCount = (text.match(/\$\s?\d/g) || []).length;
    const hasPriceLabels = new RegExp(cfg.priceLabels, 'i').test(text);
    const callForPrice = /call for price|contact (us )?for price|price on request|please call|inquire for price|enquire for price/.test(text);

    const feeDisclosure = has(cfg.feeTerms);
    const noHidden = has(cfg.transparencyTerms);
    const disclaimer = /disclaimer|price does not include|does not include tax|see dealer for details|plus applicable|tax, title|excludes tax|excludes on-road|conditions apply/.test(text);
    const financing = /monthly payment|estimated payment|weekly repayment|\/mo\b|\bapr\b|comparison rate|financing available|finance available|payment calculator|repayment calculator|as low as \$|from \$\d+\s*(?:per|\/)\s*week/.test(text);

    const totalShown = has(cfg.totalTerms);
    const componentOnly = cfg.componentOnlyTerms.filter((t) => text.includes(t));

    const hasAnyPrice = priceEls > 0 || dollarCount >= 2 || hasPriceLabels;
    return { priceEls, dollarCount, hasPriceLabels, callForPrice, feeDisclosure, noHidden, disclaimer, financing, hasAnyPrice, totalShown, componentOnly };
  }, {
    priceLabels: locale.code === 'AU'
      ? '\\bdrive ?away\\b|\\brrp\\b|sale price|our price|list price|asking price|was price'
      : '\\bmsrp\\b|sale price|our price|internet price|selling price|list price|asking price',
    feeTerms: locale.pricing.feeDisclosureTerms,
    transparencyTerms: locale.pricing.transparencyTerms,
    totalTerms: locale.pricing.totalPriceTerms || [],
    componentOnlyTerms: locale.pricing.componentOnlyTerms || [],
  });

  if (!data.hasAnyPrice && !data.callForPrice) {
    return {
      status: 'pass',
      details: "No pricing is shown on this page, so pricing transparency isn't applicable here.",
      analysis: { cause: "Pricing transparency is evaluated where vehicle prices/payments appear (VDP, Offers, Lease, Finance).", recommendation: "Audit a vehicle-detail, offers or finance page to grade price and fee transparency." },
      meta: { notApplicable: true, infoOnly: true, market: locale.code },
      infoOnly: true
    };
  }

  const showsRealPrices = (data.priceEls > 0 || data.dollarCount >= 2 || data.hasPriceLabels) && !(data.callForPrice && data.dollarCount < 2);

  // Same 100-point budget in both markets — only what earns the middle 30
  // changes. Where a total price is the legal requirement, showing one is what
  // earns it; where it is not, fee disclosure is.
  const totalOrFee = locale.pricing.totalPriceRequired ? data.totalShown : data.feeDisclosure;
  let score = Math.max(0, Math.min(100,
    (showsRealPrices ? 30 : 0) +
    (totalOrFee ? 30 : 0) +
    (data.disclaimer ? 15 : 0) +
    (data.financing ? 15 : 0) +
    (data.noHidden ? 10 : 0)
  ));

  // A component-only price where a total is legally required is worse than a
  // merely incomplete page: it is the specific thing the regulator acts on.
  const componentOnlyDefect = locale.pricing.totalPriceRequired && data.componentOnly.length > 0 && !data.totalShown;
  if (componentOnlyDefect) score = Math.min(score, 45);

  const status = score >= 80 ? 'pass' : (score >= 40 ? 'warning' : 'fail');

  let analysis;
  if (componentOnlyDefect) {
    analysis = {
      cause: `This page advertises a price component (${data.componentOnly.join(', ')}) without an equally prominent total. ${locale.pricing.basis}`,
      recommendation: "Show the drive-away price — the GST-inclusive total including registration, stamp duty and dealer delivery — at least as prominently as any component figure. \"Drive away, no more to pay\" is the clean compliant form."
    };
  } else if (status === 'pass') {
    analysis = {
      cause: locale.pricing.totalPriceRequired
        ? "A total drive-away price is shown, which is both the legal requirement and what buyers compare on."
        : "Prices are shown openly with fee disclosure, building buyer trust before they ever call.",
      recommendation: locale.pricing.totalPriceRequired
        ? "Keep the drive-away total as the headline figure on every listing and offer."
        : "Keep fees and disclaimers visible next to price; consider an out-the-door price estimator."
    };
  } else if (status === 'warning') {
    analysis = {
      cause: `Pricing is partly transparent${!totalOrFee ? (locale.pricing.totalPriceRequired ? ' but no total drive-away price is shown' : ' but fees/taxes are not disclosed') : ''}${!data.financing ? '; no payment estimate' : ''}.`,
      recommendation: locale.pricing.totalPriceRequired
        ? "Show a GST-inclusive drive-away total beside every advertised figure, add a repayment estimate, and state \"no more to pay\" if it is true."
        : "Disclose doc/dealer fees and taxes near the price, add a monthly-payment estimate, and state 'no hidden fees' if true."
    };
  } else {
    analysis = {
      cause: data.callForPrice
        ? "Prices are largely hidden behind 'call for price', which erodes trust."
        : (locale.pricing.totalPriceRequired ? "Prices appear but no GST-inclusive total is shown." : "Prices appear but fees and disclaimers are not disclosed."),
      recommendation: locale.pricing.totalPriceRequired
        ? "Show actual drive-away prices rather than \"call for price\", and make the GST-inclusive total the most prominent figure."
        : "Show actual prices (not just 'call for price'), disclose all fees and taxes, and add financing/payment estimates."
    };
  }

  return {
    score, status,
    details: locale.pricing.totalPriceRequired
      ? `${showsRealPrices ? 'Prices shown' : 'Prices hidden / call-for-price'}; drive-away total: ${data.totalShown ? 'yes' : 'no'}, finance shown: ${data.financing ? 'yes' : 'no'}.`
      : `${showsRealPrices ? 'Prices shown' : 'Prices hidden / call-for-price'}; fee disclosure: ${data.feeDisclosure ? 'yes' : 'no'}, financing: ${data.financing ? 'yes' : 'no'}.`,
    analysis,
    meta: {
      market: locale.code,
      pricingModel: locale.pricing.model,
      showsRealPrices, callForPrice: data.callForPrice,
      feeDisclosure: data.feeDisclosure, noHidden: data.noHidden,
      disclaimer: data.disclaimer, financing: data.financing,
      totalPriceRequired: locale.pricing.totalPriceRequired,
      totalPriceShown: data.totalShown,
      componentOnlyTerms: data.componentOnly,
      basis: locale.pricing.basis,
    }
  };
}

// ---------------------------------------------------------------------------
// Vehicle History — CARFAX / AutoCheck (page-specific: VDP) — spec §2.6. Claimed
// from UX §2.5 (relocated here). Self-flags N/A for new-only / non-inventory pages.
// ---------------------------------------------------------------------------
// CARFAX and AutoCheck do not operate in Australia, so an AU used-car VDP
// offering a PPSR certificate — the direct analogue, and the single most
// requested trust artefact by Australian used buyers — used to score zero here.
// The check shape is unchanged; only the provider dictionary moves.
async function checkVehicleHistory(page, market = null) {
  const locale = getLocale(market);
  const providers = locale.historyProviders;

  const data = await page.evaluate((cfg) => {
    const text = (document.body.innerText || '').toLowerCase();
    const url = window.location.pathname.toLowerCase();
    const html = document.documentElement.innerHTML.toLowerCase();

    const usedUrl = /\/used|\/pre-owned|\/preowned|\/cpo|\/certified|\/second-hand|\/demo/.test(url);
    const usedText = /\bused\b|pre-owned|pre owned|certified pre-owned|\bcpo\b|second-hand|second hand|\bdemo\b|demonstrator/.test(text);
    const newOnlyUrl = /\/new(-|\/|$)/.test(url) && !usedUrl;

    const priceEls = document.querySelectorAll('[class*="price" i], [itemprop="price"]').length;
    const vehicleContext = usedUrl || usedText || /\/inventory|\/vehicles|\/vdp|\/cars|\/stock/.test(url) || priceEls >= 2 || /\b(vin|stock\s?#|mileage|odometer|kilometres|\bkms?\b)\b/.test(text);

    // Which of this market's providers is named anywhere in the markup?
    const providersFound = cfg.names.filter((n) => html.includes(n));
    const reportLinks = cfg.domains.reduce(
      (n, d) => n + document.querySelectorAll(`a[href*="${d}" i]`).length, 0
    );
    const historyLang = cfg.language.some((t) => text.includes(t));

    return { usedUrl, usedText, newOnlyUrl, vehicleContext, providersFound, reportLinks, historyLang };
  }, { names: providers.names, domains: providers.domains, language: providers.language });

  const isUsedContext = data.usedUrl || data.usedText;

  if (!data.vehicleContext || (data.newOnlyUrl && !isUsedContext)) {
    return {
      status: 'pass',
      details: data.newOnlyUrl ? "New-vehicle context — history reports don't apply to new cars." : "No used-vehicle inventory context on this page; history reports not applicable.",
      analysis: { cause: `${providers.label} history is only expected on used / certified pre-owned vehicles.`, recommendation: "Audit a used or CPO vehicle-detail page to grade history-report availability." },
      meta: { notApplicable: true, context: data.newOnlyUrl ? 'new' : 'non-inventory', infoOnly: true, market: locale.code },
      infoOnly: true
    };
  }

  const hasReport = data.providersFound.length > 0;
  const score = Math.max(0, Math.min(100,
    (hasReport ? 55 : 0) +
    (data.reportLinks > 0 ? 20 : 0) +
    (data.historyLang ? 25 : 0)
  ));
  const status = score >= 80 ? 'pass' : (score >= 40 ? 'warning' : 'fail');
  const found = data.providersFound.map((n) => n.toUpperCase()).join(' & ');

  return {
    score, status,
    details: `${hasReport ? `${found} present` : `No ${providers.label} detected`}${data.reportLinks ? `, ${data.reportLinks} report link(s)` : ''}.`,
    analysis: {
      cause: hasReport
        ? "Vehicle history reports are surfaced, reassuring used-car buyers about condition and ownership."
        : `Used vehicles are shown without a visible ${providers.label}, a major trust gap for pre-owned shoppers in ${locale.name}.`,
      recommendation: locale.code === 'AU'
        ? "Offer a PPSR certificate on every used listing and say plainly that the vehicle is clear of finance, not written off and not stolen. PPSR status is the first thing an Australian used buyer looks for."
        : "Provide a free CARFAX or AutoCheck report link on every used/CPO listing and highlight 'accident-free' / 'one-owner' / 'clean title' where applicable."
    },
    meta: {
      market: locale.code,
      context: isUsedContext ? 'used' : 'inventory',
      expectedProvider: providers.label,
      providersFound: data.providersFound,
      reportLinks: data.reportLinks,
      historyLang: data.historyLang,
      registryNote: providers.registryNote,
    }
  };
}

// ---------------------------------------------------------------------------
// Certifications & Awards (common) — OEM/award/financing-partner credibility marks.
// Spec §2.6 folds this into the "Client logos / case studies / certifications &
// awards" param. Claimed from UX §2.5 (where it was info-only); WEIGHTED here.
// ---------------------------------------------------------------------------
async function checkCertificationsAwards(page, market = null) {
  // ASE, NADA and BBB simply do not exist in Australia, so the old signal set
  // read a legitimate AU dealer displaying its LMCT number and VACC membership
  // as having no credibility marks at all. Market-specific credentials come
  // from the locale pack; the three genuinely universal signals (a
  // manufacturer certification, an award, a star rating) stay shared.
  const locale = getLocale(market);

  const data = await page.evaluate((cfg) => {
    const text = (document.body.innerText || '').toLowerCase();
    const imgAlts = Array.from(document.querySelectorAll('img')).map(i => (i.getAttribute('alt') || '').toLowerCase());
    const altText = imgAlts.join(' ');
    const haystack = text + ' ' + altText + ' ' + document.body.className.toLowerCase();

    const universal = {
      certified: /\bcertified\b|\bcertification\b|certified pre-owned|\bcpo\b|accredited/,
      award: /\baward(s|ed)?\b|dealer of the year|president'?s award|mark of excellence|top rated|top-rated|best dealer/,
      ratings: /google reviews|5[- ]?star|five[- ]?star|customer rating/,
      manufacturer: new RegExp(`(${cfg.makes.join('|')})\\s+(?:certified|authorised|authorized)`),
    };
    const found = Object.keys(universal).filter((k) => universal[k].test(haystack));

    // Market credentials matched as literal phrases from the locale pack.
    const localCreds = cfg.credentials.filter((c) => haystack.includes(c));
    if (localCreds.length) found.push('local accreditation');

    const badgeImgs = imgAlts.filter((a) =>
      /certified|award|accredited|5[- ]?star|excellence/.test(a) || cfg.credentials.some((c) => a.includes(c))
    ).length;

    return { found, localCreds, badgeImgs };
  }, {
    credentials: locale.credentials,
    makes: [...GLOBAL_MAKES, ...locale.vehicle.distinctiveMakes],
  });

  const distinct = data.found.length;
  let score = distinct === 0 ? 20 : distinct === 1 ? 55 : distinct === 2 ? 75 : 100;
  if (data.badgeImgs > 0 && score < 100) score = Math.min(100, score + 10);
  const status = score >= 80 ? 'pass' : (score >= 40 ? 'warning' : 'fail');

  const exampleCreds = locale.code === 'AU'
    ? 'your dealer licence number (LMCT/MD), ABN, AADA or state motor-trades membership (VACC, MTA), and RACV/NRMA/RACQ approval'
    : 'manufacturer certifications, BBB accreditation, award badges (Dealer of the Year, DealerRater) and star ratings';

  return {
    score, status,
    details: distinct
      ? `Trust signals found: ${data.found.join(', ')}${data.localCreds.length ? ` (${data.localCreds.slice(0, 3).join(', ')})` : ''}${data.badgeImgs ? ` (+${data.badgeImgs} badge image${data.badgeImgs > 1 ? 's' : ''})` : ''}.`
      : "No certifications, accreditations or awards detected on this page.",
    analysis: {
      cause: distinct >= 2
        ? "The page surfaces multiple credibility signals (certifications/awards) that build buyer trust."
        : `Few or no third-party credibility signals recognised in ${locale.name} are visible.`,
      recommendation: `Display ${exampleCreds} prominently near the top of key pages.`
    },
    meta: { market: locale.code, found: data.found, localCredentials: data.localCreds, badgeImgs: data.badgeImgs }
  };
}

// Unified page classifier is imported at the top of the file.

// Spec §2.6 in-section weights (decimals). The product splits some spec params into
// sub-cards whose weights SUM to the spec param weight (same pattern as On-Page §2.2):
//   CTA effectiveness 0.18 = Presence .07 + Clarity .05 + Flow .06
//   Form length / required-vs-optional 0.08 = Form_Length .04 + Required_vs_Optional .04
//   Submit clarity / multi-step 0.04 = Submit .025 + MultiStep .015
//   Friendly error / microcopy 0.04 = Friendly .02 + Microcopy .02
//   Testimonials / reviews 0.07 = Testimonials .04 + Reviews .03
//   Logos / case studies / certs 0.03 = Client_Logos .01 + Case_Studies .01 + Certifications .01
const CONVERSION_SPEC_WEIGHTS = {
  // CTA effectiveness (common) — 0.18
  CTA_Presence: 0.07, CTA_Clarity: 0.05, CTA_Flow_Alignment: 0.06,
  CTA_Crowding: 0.05,
  // Forms (page-specific) — Form_Presence 0.09; quality 0.08 + 0.05 + 0.04 + 0.04 + 0.03
  Form_Presence: 0.09,
  Form_Length: 0.04, Required_vs_Optional_Fields: 0.04,
  Inline_Validation: 0.05,
  Submit_Button_Clarity: 0.025, MultiStep_Form_Progress: 0.015,
  Friendly_Error_Handling: 0.02, Microcopy_Clarity: 0.02,
  Thank_You_Pages: 0.03,
  // Trust / social proof (common) — 0.05 / 0.07 / 0.03
  Trust_Badges: 0.05,
  Testimonials: 0.04, Reviews: 0.03,
  Client_Logos: 0.01, Case_Studies_Accessibility: 0.01, Certifications_Awards: 0.01,
  // Commercial (page-specific)
  Pricing_Transparency: 0.06,
  Vehicle_History: 0.04,
  // Engagement (common)
  Click_To_Call: 0.04,
  Chat_Experience: 0.03,
  Lead_Magnets: 0.02,
  // Analytics (site-wide)
  GA4_Installed: 0.05, GTM_Configuration: 0.03, Conversion_Tracking: 0.04, CRM_Integration: 0.02,
  // Page-specific lead tools (add-ons; only scored on their page type)
  TradeIn_Flow: 0.15,
  Financing_Flow: 0.10,
  Finance_Calculator: 0.10,
  Appointment_Booking: 0.12,
  Incentives_Displayed: 0.06,
};

// `siteSubType` (franchise/independent/service/repair) gates which parameters
// are even applicable to this kind of business — see config/siteTypeProfiles.js.
// It arrives as the 4th argument because the 3rd (pageType) is passed by the
// worker but deliberately re-derived here from the live page URL.
export default async function conversionLeadFlow(page, $, _pageType = null, siteSubType = null, market = null) {
  const url = (() => { try { return page.url(); } catch { return ""; } })();
  const isServicingSite = siteSubType === "service" || siteSubType === "repair";
  // Classify against the taxonomy that matches the business. On a servicing
  // site the dealer classifier buckets /book-online and /price-list as
  // "generic", which is precisely why the two most important conversion
  // parameters for those site types went unscored — the gates below key off
  // page type, so the page type has to be right first.
  const pageType = isServicingSite ? classifyServicePageType(url) : classifyPageType(url);

  const isTradeIn = pageType === "trade";
  const isFinance = pageType === "finance";
  const isService = pageType === "service";
  const isVdp = pageType === "vdp";
  const isOffers = pageType === "specials";
  const isLease = pageType === "lease";
  // Spec: Form presence applies on Trade-In, Finance, Contact, Service (N/A elsewhere).
  // "booking" and "pricing" only exist in the servicing taxonomy, and both are
  // form pages by definition — a booking request and a quote request.
  const isFormPage = ["trade", "finance", "about", "service", "booking", "pricing"].includes(pageType);

  // ---- Analytics / measurability (site-wide) ----
  const trackingData = await collectTrackingData(page);
  const checkGA4Score = checkGA4Installed(trackingData);
  const checkGTMScore = checkGTMConfiguration(trackingData);
  const checkConversionTrackingScore = checkConversionTracking(trackingData);
  const checkCRMScore = checkCRMIntegration(trackingData, $);

  // ---- CTA effectiveness (common) ----
  const checkCTAsScore = checkCTAs($);
  const checkCTAClarityScore = checkCTAClarity($, market);
  const checkCTACrowdingScore = await checkCTACrowding(page);
  const checkCTAFlowAlignmentScore = await checkCTAFlowAlignment(page, $);

  // ---- Forms ----
  const checkFormPresenceScore = await checkFormPresence(page);
  const formCount = checkFormPresenceScore?.meta?.count || 0;
  const hasForms = formCount > 0;
  const checkFormLengthOptimalScore = checkFormLengthOptimal($);
  const checkRequiredVsOptionalFieldsScore = await checkRequiredVsOptionalFields(page);
  const checkInlineValidationScore = checkInlineValidation($);
  const checkSubmitButtonClarityScore = await checkSubmitButtonClarity(page);
  const checkMultiStepFormProgressScore = await checkMultiStepFormProgress(page);
  const checkFriendlyErrorHandlingScore = checkFriendlyErrorHandling($);
  const checkMicrocopyClarityScore = checkMicrocopyClarity($);
  const checkThankYouPagesScore = await checkThankYouPages(page, $);

  // ---- Trust / social proof (common) ----
  const checkTrustBadgesScore = checkTrustBadges($, market);
  const checkTestimonialsScore = checkTestimonials($);
  const checkReviewsVisibleScore = checkReviewsVisible($, market);
  const checkClientLogosScore = await checkClientLogos(page);
  const checkCaseStudiesAccessibilityScore = await checkCaseStudiesAccessibility(page);
  const checkCertificationsAwardsScore = await checkCertificationsAwards(page, market);

  // ---- Commercial (page-specific) ----
  // Service pages were added to this gate for the two servicing site types.
  // Published service pricing is the strongest differentiator a service centre
  // or garage has (the matrix rates it Most Important for both) and it was
  // previously never measured for them at all: the gate only opened on
  // vdp/specials/lease/finance, none of which a garage has.
  const checkPricingTransparencyScore = (isVdp || isOffers || isLease || isFinance || (isServicingSite && (isService || pageType === "pricing")))
    ? await checkPricingTransparency(page, market)
    : null;
  const checkVehicleHistoryScore = isVdp ? await checkVehicleHistory(page, market) : null;

  // ---- Engagement (common) ----
  const checkClickToCallScore = await checkClickToCall(page, $, market);
  const checkChatExperienceScore = await checkChatExperience(page, $);
  const checkLeadMagnetsScore = await checkLeadMagnets(page);

  // ---- Page-specific lead tools (only run where they apply) ----
  const checkTradeInFlowScore = isTradeIn ? await checkTradeInFlow(page, $, market) : null;
  const checkFinancingFlowScore = isFinance ? await checkFinancingFlow(page, $, market) : null;       // user decision: keep, page-specific Finance
  const checkFinanceCalculatorScore = (isFinance || isVdp) ? await checkFinanceCalculator(page, $, market) : null;
  // Booking is THE funnel for a service centre or garage (the matrix rates it
  // Most Important for both), but their booking form very often sits on the
  // home page or a /book page that classifies as `generic` — so gating it on
  // pageType === "service" alone left the single most important conversion
  // parameter for those site types unscored. Widened to home/generic there
  // only; on a dealer site the service-page gate is still exactly right.
  const bookingApplies = isService || (isServicingSite && ["booking", "home", "generic"].includes(pageType));
  const checkAppointmentBookingScore = bookingApplies ? await checkAppointmentBooking(page, $) : null;
  // Lease was added to this gate because it is where a franchise dealer's
  // incentives actually live. The parameter is rated Most Important for a
  // franchise store on the reasoning that OEM incentives and manufacturer
  // rebates are its time-bound offer surface — but the franchise crawl plan
  // spends its sixth slot on Lease rather than Specials, so the gate never
  // opened and the highest-rated Conversion parameter for that site type went
  // unscored on every franchise audit. A lease-specials page advertising
  // manufacturer lease offers IS an incentive surface, so this is a correction
  // rather than a workaround for the plan.
  const checkIncentivesDisplayedScore = (isService || isOffers || isLease) ? checkIncentivesDisplayed($) : null;

  // Applicable metric set. Page-specific & form-quality params are `null` where they
  // don't apply (omitted → dropped from the denominator, spec rule 6). NOTE: Link_Relevance
  // (folded into CTA effectiveness / funnel alignment) and Progress_Indicators (duplicate of
  // MultiStep_Form_Progress) are HIDDEN per spec Part 4 rule 4 — no longer computed/returned.
  const candidateMap = {
    CTA_Presence: checkCTAsScore,
    CTA_Clarity: checkCTAClarityScore,
    CTA_Crowding: checkCTACrowdingScore,
    CTA_Flow_Alignment: checkCTAFlowAlignmentScore,

    Form_Presence: isFormPage ? checkFormPresenceScore : null,
    Form_Length: hasForms ? checkFormLengthOptimalScore : null,
    Required_vs_Optional_Fields: hasForms ? checkRequiredVsOptionalFieldsScore : null,
    Inline_Validation: hasForms ? checkInlineValidationScore : null,
    Submit_Button_Clarity: hasForms ? checkSubmitButtonClarityScore : null,
    MultiStep_Form_Progress: hasForms ? checkMultiStepFormProgressScore : null,
    Friendly_Error_Handling: hasForms ? checkFriendlyErrorHandlingScore : null,
    Microcopy_Clarity: hasForms ? checkMicrocopyClarityScore : null,
    Thank_You_Pages: hasForms ? checkThankYouPagesScore : null,

    Trust_Badges: hasForms ? checkTrustBadgesScore : null,   // spec: trust badges near PII forms
    Testimonials: checkTestimonialsScore,
    Reviews: checkReviewsVisibleScore,
    Client_Logos: checkClientLogosScore,
    Case_Studies_Accessibility: checkCaseStudiesAccessibilityScore,
    Certifications_Awards: checkCertificationsAwardsScore,

    Pricing_Transparency: checkPricingTransparencyScore,
    Vehicle_History: checkVehicleHistoryScore,

    Click_To_Call: checkClickToCallScore,
    Chat_Experience: checkChatExperienceScore,
    Lead_Magnets: checkLeadMagnetsScore,

    GA4_Installed: checkGA4Score,
    GTM_Configuration: checkGTMScore,
    Conversion_Tracking: checkConversionTrackingScore,
    CRM_Integration: checkCRMScore,

    TradeIn_Flow: checkTradeInFlowScore,
    Financing_Flow: checkFinancingFlowScore,
    Finance_Calculator: checkFinanceCalculatorScore,
    Appointment_Booking: checkAppointmentBookingScore,
    Incentives_Displayed: checkIncentivesDisplayedScore,
  };

  // Renormalize: section = Σ(score × w) / Σ(w) over APPLICABLE, non-N/A params only.
  let totalWeight = 0;
  let earnedScore = 0;
  const metricsMap = {};

  // Site-level applicability on top of the page-level gates above: Vehicle
  // History, Trade-In, Financing Flow and Finance Calculator presuppose a
  // vehicle for sale, so on a service/repair site they are N/A rather than
  // failed. Not redundant with the page gates — page type is decided by URL
  // regex, and a garage's /finance-options page (payment plans for a big
  // repair bill are common) classifies as `finance` and would otherwise run
  // and fail the whole credit-application battery.
  const applicableMap = applySiteApplicability(candidateMap, siteSubType);

  for (const [key, metric] of Object.entries(applicableMap)) {
    if (!metric) continue;                                            // not applicable on this page type
    if (metric.infoOnly === true || metric.meta?.notApplicable === true) continue; // self-flagged N/A → drop
    const weight = (CONVERSION_SPEC_WEIGHTS[key] ?? 0.02) * importance(key, siteSubType);
    const s = typeof metric.score === "number"
      ? metric.score
      : (metric.status === "pass" ? 100 : metric.status === "warning" ? 50 : 0);
    // A zero weight means the matrix rates this parameter N/A for this kind of
    // business. It still goes into metricsMap (the card is shown, with its real
    // score) but contributes to neither side of the ratio.
    totalWeight += weight;
    earnedScore += weight * (s / 100);
    metricsMap[key] = metric;
  }

  const actualPercentage = totalWeight > 0 ? parseFloat(((earnedScore / totalWeight) * 100).toFixed(0)) : 0;

  return {
    Percentage: actualPercentage,
    Confidence: "heuristic",                          // spec §0.5 — all conversion signals are DOM heuristics
    pageType,
    parametersScored: Object.keys(metricsMap).length,
    ...metricsMap
  };
}