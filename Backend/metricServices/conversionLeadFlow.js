// Helper to create standardized metric result
function createMetricResult(score, status, details, meta = {}) {
  return { score, status, details, meta };
}

// Conversion & Lead Flow (Call-to-Action (CTA) Effectiveness)
function checkCTAs($) {
  const ctaSelectors = [
    'button', 'input[type="button"]', 'input[type="submit"]', '.cta', '.cta-button', '.cta-btn',
    '.btn-primary', '.btn-cta', '.btn', '.button', 'a.cta', 'a.cta-button', 'a.btn',
    'a.btn-primary', 'a[href*="signup"]', 'a[href*="register"]', 'a[href*="subscribe"]',
    '[id*="cta"]', '[class*="cta"]', '.hero button', '.hero a', '.promo button', '.promo a',
    '.signup button', '.signup a', '.download button', '.download a'
  ];

  let totalCTAs = 0;
  let foundSelectors = [];

  ctaSelectors.forEach(selector => {
    const elements = $(selector);
    const count = elements.length;
    if (count > 0) {
      totalCTAs += count;
      foundSelectors.push(`${selector} (${count})`);
    }
  });

  if (totalCTAs > 0) {
    return createMetricResult(100, "pass", "CTAs are present and visible.", { count: totalCTAs, found: foundSelectors });
  }
  return createMetricResult(0, "fail", "No prominent Call-to-Action buttons found.", { count: 0, checkedSelectors: ctaSelectors.slice(0, 10) });
}

function checkCTAClarity($) {
  const ctaSelectors = ['button', 'a', '.cta', '.cta-button', '.btn-primary'];
  let totalCTAs = 0;
  let clearCTAs = 0;
  let clearExamples = [];
  let unclearExamples = [];
  const clearVerbs = ["buy", "get", "download", "sign up", "subscribe", "start", "join", "register", "learn", "book", "order"];

  ctaSelectors.forEach(selector => {
    $(selector).each((i, el) => {
      const text = $(el).text().trim().toLowerCase();
      if (!text || text.length > 30) return; // Ignore long text or empty
      totalCTAs++;
      if (clearVerbs.some(verb => text.includes(verb))) {
        clearCTAs++;
        if (clearExamples.length < 5) clearExamples.push(text);
      } else {
        if (unclearExamples.length < 5) unclearExamples.push(text);
      }
    });
  });

  if (clearCTAs > 0) {
    return createMetricResult(100, "pass", "CTAs use clear, actionable text.", { count: clearCTAs, examples: clearExamples });
  }
  return createMetricResult(0, "fail", "CTA text is vague or generic.", { totalChecked: totalCTAs, unclearText: unclearExamples });
}

async function checkCTAContrast(page) {
  const ctaSelectors = ['button', 'a', '.cta', '.cta-button', '.btn-primary'];
  const result = await page.evaluate((selectors) => {
    function rgbStringToArray(str) {
      const match = str.match(/\d+/g);
      return match ? match.map(Number) : [0, 0, 0];
    }
    function getContrast(foreground, background) {
      function luminance(r, g, b) {
        [r, g, b] = [r, g, b].map(c => c / 255 <= 0.03928 ? c / 12.92 : Math.pow((c / 255 + 0.055) / 1.055, 2.4));
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      }
      const L1 = luminance(...foreground);
      const L2 = luminance(...background);
      return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    }

    const elements = document.querySelectorAll(selectors.join(','));
    let highContrastCount = 0;
    let lowContrastCount = 0;
    let failingElements = [];

    elements.forEach(el => {
      const style = window.getComputedStyle(el);
      const fg = rgbStringToArray(style.color);
      const bg = rgbStringToArray(style.backgroundColor);
      const contrast = getContrast(fg, bg);
      if (contrast >= 4.5) {
        highContrastCount++;
      } else {
        lowContrastCount++;
        if (failingElements.length < 5) {
          failingElements.push({
            text: (el.innerText || "").slice(0, 20),
            contrast: contrast.toFixed(2)
          });
        }
      }
    });

    return { highContrastCount, lowContrastCount, failingElements };
  }, ctaSelectors);

  if (result.highContrastCount > 0) {
    return createMetricResult(100, "pass", "CTAs have sufficient color contrast.", { highContrast: result.highContrastCount, lowContrast: result.lowContrastCount });
  }
  return createMetricResult(0, "fail", "CTA buttons have low contrast.", {
    highContrast: result.highContrastCount,
    lowContrast: result.lowContrastCount,
    failingExamples: result.failingElements
  });
}

async function checkCTACrowding(page, maxCTAs = 3) {
  const ctaSelectors = ['button', '.cta', '.btn-primary', 'a.cta'];
  const result = await page.evaluate((selectors) => {
    return document.querySelectorAll(selectors.join(',')).length;
  }, ctaSelectors);

  if (result <= maxCTAs && result > 0) {
    return createMetricResult(100, "pass", "CTA count is optimal.", { count: result });
  } else if (result > maxCTAs) {
    return createMetricResult(50, "warning", "Too many CTAs may confuse users.", { count: result, limit: maxCTAs });
  }
  return createMetricResult(0, "fail", "No CTAs found.", { count: result });
}

function checkCTAFlowAlignment($) {
  const ctaKeywords = ["buy now", "sign up", "get started", "subscribe", "download", "contact us", "book now"];
  const ctas = $("a, button").filter((_, el) => {
    const text = $(el).text().toLowerCase().trim();
    return ctaKeywords.some(keyword => text.includes(keyword));
  });

  if (ctas.length === 0) return createMetricResult(0, "fail", "No flow CTAs found.", { checkedKeywords: ctaKeywords });

  const totalElements = $("*").length;
  const firstCTAIndex = $("*").index(ctas.first());
  const ratio = firstCTAIndex / totalElements;

  if (ratio > 0.1 && ratio < 0.9) {
    return createMetricResult(100, "pass", "CTA placement aligns with user flow.", { positionRatio: ratio.toFixed(2) });
  }
  return createMetricResult(50, "warning", "CTA placement might be too early or too late.", { positionRatio: ratio.toFixed(2), idealRange: "0.1 - 0.9" });
}

// Conversion & Lead Flow (Forms & Lead Capture)
async function checkFormPresence(page) {
  const formCount = await page.evaluate(() => document.querySelectorAll("form").length);
  if (formCount > 0) {
    return createMetricResult(100, "pass", "Lead capture forms are present.", { count: formCount });
  }
  return createMetricResult(0, "fail", "No forms detected on the page.", { count: 0, checkedTag: "<form>" });
}

function checkFormLengthOptimal($) {
  const forms = $("form");
  if (forms.length === 0) return createMetricResult(100, "pass", "No forms to analyze.", { count: 0 });

  let optimalForms = 0;
  let longForms = [];
  forms.each((i, form) => {
    const fieldCount = $(form).find("input, select, textarea").length;
    if (fieldCount > 0 && fieldCount < 7) {
      optimalForms++;
    } else {
      longForms.push(`Form #${i + 1}: ${fieldCount} fields`);
    }
  });

  if (optimalForms > 0) {
    return createMetricResult(100, "pass", "Forms are concise and user-friendly.", { optimalForms, totalForms: forms.length });
  }
  return createMetricResult(50, "warning", "Forms may be too long.", { totalForms: forms.length, details: longForms });
}

async function checkRequiredVsOptionalFields(page) {
  const result = await page.evaluate(() => {
    const forms = document.querySelectorAll("form");
    let hasDistinction = false;
    let checkedInputs = [];
    for (const form of forms) {
      const inputs = form.querySelectorAll("input, textarea, select");
      let hasReq = false, hasOpt = false;
      inputs.forEach(el => {
        const text = (el.previousElementSibling?.textContent || el.placeholder || "").toLowerCase();
        if (el.hasAttribute("required") || text.includes("*") || text.includes("required")) hasReq = true;
        if (text.includes("optional")) hasOpt = true;
        if (checkedInputs.length < 3) checkedInputs.push(el.name || el.id || "input");
      });
      if (hasReq || hasOpt) hasDistinction = true;
    }
    return { hasDistinction, checkedInputs };
  });

  if (result.hasDistinction) return createMetricResult(100, "pass", "Required fields are clearly marked.", {});
  return createMetricResult(50, "warning", "No clear distinction between required/optional fields.", { checkedInputs: result.checkedInputs });
}

function checkInlineValidation($) {
  const inputs = $("input, textarea, select");
  if (inputs.length === 0) return createMetricResult(100, "pass", "No inputs to validate.", {});

  let hasValidation = false;
  let checkedInputs = [];
  inputs.each((_, el) => {
    const $el = $(el);
    if (checkedInputs.length < 5) checkedInputs.push($el.attr("name") || $el.attr("id") || "unnamed-input");
    if ($el.attr("required") || $el.attr("pattern") || $el.attr("type") === "email") hasValidation = true;
  });

  if (hasValidation) return createMetricResult(100, "pass", "HTML5/Inline validation detected.", {});
  return createMetricResult(0, "fail", "No inline validation attributes found.", { checkedInputs });
}

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
    return { clearBtns, unclearBtns };
  }, clearTexts);

  if (result.clearBtns.length > 0) return createMetricResult(100, "pass", "Submit buttons use clear action text.", { examples: result.clearBtns.slice(0, 5) });
  return createMetricResult(50, "warning", "Submit buttons may be generic.", { unclearButtons: result.unclearBtns.slice(0, 5) });
}

function checkAutoFocusField($) {
  const hasAutoFocus = $("input[autofocus], textarea[autofocus]").length > 0;
  if (hasAutoFocus) return createMetricResult(100, "pass", "Autofocus is used on key fields.", {});
  return createMetricResult(100, "pass", "Autofocus not mandatory but good.", { note: "Consider adding 'autofocus' attribute to the first input." });
}

async function checkMultiStepFormProgress(page) {
  const hasProgress = await page.evaluate(() => {
    return document.querySelectorAll("progress, .step, .progress").length > 0;
  });
  if (hasProgress) return createMetricResult(100, "pass", "Progress indicators found for forms.", {});
  return createMetricResult(100, "pass", "No multi-step forms detected.", { note: "Only required for long forms." });
}

// Conversion & Lead Flow (Trust & Social Proof)
function checkTestimonials($) {
  const keywords = ["testimonial", "review", "client-say", "feedback"];
  const elements = $("*").filter((_, el) => {
    const cls = ($(el).attr("class") || "").toLowerCase();
    return keywords.some(k => cls.includes(k));
  });
  if (elements.length > 0) return createMetricResult(100, "pass", "Testimonials section detected.", { count: elements.length });
  return createMetricResult(0, "fail", "No testimonials found.", { checkedKeywords: keywords });
}

function checkReviewsVisible($) {
  const keywords = ["review", "rating", "stars"];
  const elements = $("*").filter((_, el) => {
    const cls = ($(el).attr("class") || "").toLowerCase();
    return keywords.some(k => cls.includes(k));
  });
  if (elements.length > 0) return createMetricResult(100, "pass", "User reviews/ratings detected.", { count: elements.length });
  return createMetricResult(0, "fail", "No reviews found.", { checkedKeywords: keywords });
}

function checkTrustBadges($) {
  const keywords = ["secure", "ssl", "verified", "payment", "badge"];
  const images = $("img").filter((_, el) => {
    const src = ($(el).attr("src") || "").toLowerCase();
    return keywords.some(k => src.includes(k));
  });
  if (images.length > 0) return createMetricResult(100, "pass", "Trust badges visible.", { count: images.length });
  return createMetricResult(0, "fail", "No trust badges detected.", { checkedKeywords: keywords });
}

async function checkClientLogos(page) {
  const hasLogos = await page.evaluate(() => {
    return document.querySelectorAll(".client-logo, .partner-logo, .logos img").length > 0;
  });
  if (hasLogos) return createMetricResult(100, "pass", "Client/Partner logos displayed.", {});
  return createMetricResult(50, "warning", "No client logos found.", { checkedSelectors: [".client-logo", ".partner-logo", ".logos img"] });
}

async function checkCaseStudiesAccessibility(page) {
  const hasCaseStudies = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase();
    return text.includes("case study") || text.includes("success story");
  });
  if (hasCaseStudies) return createMetricResult(100, "pass", "Case studies or success stories found.", {});
  return createMetricResult(50, "warning", "Consider adding case studies.", { checkedKeywords: ["case study", "success story"] });
}

// Conversion & Lead Flow (Lead Funnel Flow)
async function checkExitIntentTriggers(page) {
  const hasPopup = await page.evaluate(() => document.querySelectorAll(".popup, .modal, .exit-intent").length > 0);
  if (hasPopup) return createMetricResult(100, "pass", "Popup/Modal markup detected.", {});
  return createMetricResult(50, "warning", "No popup/modal markup found.", { checkedSelectors: [".popup", ".modal", ".exit-intent"] });
}

async function checkLeadMagnets(page) {
  const keywords = ["free ebook", "guide", "whitepaper", "cheatsheet"];
  const hasMagnet = await page.evaluate((kws) => {
    const text = document.body.innerText.toLowerCase();
    return kws.some(k => text.includes(k));
  }, keywords);
  if (hasMagnet) return createMetricResult(100, "pass", "Lead magnets detected.", {});
  return createMetricResult(50, "warning", "No lead magnets found.", { checkedKeywords: keywords });
}

function checkContactInfoVisibility($) {
  const text = $("body").text();
  const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text);
  const phone = /(\+?\d{1,3}[-.\s]?|\()?\d{1,4}(\)|[-.\s]?)?\d{1,4}[-.\s]?\d{1,9}/g.test(text);
  if (email || phone) return createMetricResult(100, "pass", "Contact info is visible.", { email, phone });
  return createMetricResult(0, "fail", "No contact info detected.", { checked: "Email regex, Phone regex" });
}

function checkChatbotPresence($) {
  const keywords = ["tawk.to", "intercom", "drift", "zendesk", "chat"];
  const scripts = $("script").toArray().some(s => {
    const src = ($(s).attr("src") || "").toLowerCase();
    return keywords.some(k => src.includes(k));
  });
  if (scripts) return createMetricResult(100, "pass", "Chatbot/Live chat detected.", {});
  return createMetricResult(50, "warning", "No chatbot detected.", { checkedProviders: keywords });
}

// Conversion & Lead Flow (User Engagement & Interaction)
async function checkInteractiveElements(page) {
  const hasInteractive = await page.evaluate(() => document.querySelectorAll(".slider, .carousel, [data-tooltip]").length > 0);
  if (hasInteractive) return createMetricResult(100, "pass", "Interactive elements found.", {});
  return createMetricResult(50, "warning", "No interactive elements found.", { checkedSelectors: [".slider", ".carousel", "[data-tooltip]"] });
}

function checkPersonalization($) {
  const text = $("body").text();
  if (text.includes("Welcome,") || text.includes("Recommended for you")) {
    return createMetricResult(100, "pass", "Personalization keywords found.", {});
  }
  return createMetricResult(50, "warning", "No obvious personalization found.", { checkedKeywords: ["Welcome,", "Recommended for you"] });
}

function checkProgressIndicators($) {
  const hasProgress = $(".progress, .step, progress").length > 0;
  if (hasProgress) return createMetricResult(100, "pass", "Progress indicators present.", {});
  return createMetricResult(50, "warning", "No progress indicators found.", { checkedSelectors: [".progress", ".step", "progress"] });
}

function checkFriendlyErrorHandling($) {
  const hasValidation = $("input[required]").length > 0;
  if (hasValidation) return createMetricResult(100, "pass", "Basic error handling present.", {});
  return createMetricResult(50, "warning", "No explicit error handling detected.", { checked: "input[required]" });
}

function checkMicrocopyClarity($) {
  const placeholders = $("input[placeholder]").length;
  if (placeholders > 0) return createMetricResult(100, "pass", "Inputs have placeholder microcopy.", { count: placeholders });
  return createMetricResult(50, "warning", "Few inputs have helper text.", { count: placeholders });
}

function checkIncentivesDisplayed($) {
  const text = $("body").text().toLowerCase();
  const keywords = ["free", "discount", "offer", "sale", "% off"];
  if (keywords.some(k => text.includes(k))) return createMetricResult(100, "pass", "Incentives/Offers displayed.", {});
  return createMetricResult(50, "warning", "No incentives detected.", { checkedKeywords: keywords });
}

// Misc
function checkScarcityUrgency($) {
  const text = $("body").text().toLowerCase();
  const keywords = ["limited", "only", "left", "hurry"];
  if (keywords.some(k => text.includes(k))) {
    return createMetricResult(100, "pass", "Scarcity/Urgency triggers found.", {});
  }
  return createMetricResult(50, "warning", "No scarcity triggers found.", { checkedKeywords: keywords });
}

function checkSmoothScrolling($) {
  const hasSmooth = $('html').css('scroll-behavior') === 'smooth' || $('a[href^="#"]').length > 0;
  if (hasSmooth) return createMetricResult(100, "pass", "Smooth scrolling or anchors detected.", {});
  return createMetricResult(50, "warning", "No smooth scrolling detected.", { checked: "scroll-behavior: smooth, anchor links" });
}

function checkMobileCTAAdaptation($) {
  const hasLargeBtns = $(".btn-lg, .btn-large, .mobile-cta").length > 0;
  if (hasLargeBtns) return createMetricResult(100, "pass", "Mobile-adapted CTAs detected.", {});
  return createMetricResult(50, "warning", "No specific mobile CTA classes found.", { checkedClasses: [".btn-lg", ".btn-large", ".mobile-cta"] });
}

function checkMultiChannelFollowUp($) {
  const hasSocial = $("a[href*='facebook'], a[href*='twitter'], a[href*='linkedin']").length > 0;
  if (hasSocial) return createMetricResult(100, "pass", "Social follow-up channels found.", {});
  return createMetricResult(50, "warning", "No social follow-up links found.", { checked: "Facebook/Twitter/LinkedIn links" });
}


export default async function conversionLeadFlow(page, $) {

  // Execute all checks
  const checkCTAsScore = checkCTAs($);
  const checkCTAClarityScore = checkCTAClarity($);
  const checkCTAContrastScore = await checkCTAContrast(page);
  const checkCTACrowdingScore = await checkCTACrowding(page);
  const checkCTAFlowAlignmentScore = checkCTAFlowAlignment($);

  const checkFormPresenceScore = await checkFormPresence(page);
  const checkFormLengthOptimalScore = checkFormLengthOptimal($);
  const checkRequiredVsOptionalFieldsScore = await checkRequiredVsOptionalFields(page);
  const checkInlineValidationScore = checkInlineValidation($);
  const checkSubmitButtonClarityScore = await checkSubmitButtonClarity(page);
  const checkAutoFocusFieldScore = checkAutoFocusField($);
  const checkMultiStepFormProgressScore = await checkMultiStepFormProgress(page);

  const checkTestimonialsScore = checkTestimonials($);
  const checkReviewsVisibleScore = checkReviewsVisible($);
  const checkTrustBadgesScore = checkTrustBadges($);
  const checkClientLogosScore = await checkClientLogos(page);
  const checkCaseStudiesAccessibilityScore = await checkCaseStudiesAccessibility(page);

  const checkExitIntentTriggersScore = await checkExitIntentTriggers(page);
  const checkLeadMagnetsScore = await checkLeadMagnets(page);
  const checkContactInfoVisibilityScore = checkContactInfoVisibility($);
  const checkChatbotPresenceScore = checkChatbotPresence($);

  const checkInteractiveElementsScore = await checkInteractiveElements(page);
  const checkPersonalizationScore = checkPersonalization($);
  const checkProgressIndicatorsScore = checkProgressIndicators($);
  const checkFriendlyErrorHandlingScore = checkFriendlyErrorHandling($);
  const checkMicrocopyClarityScore = checkMicrocopyClarity($);
  const checkIncentivesDisplayedScore = checkIncentivesDisplayed($);

  const checkScarcityUrgencyScore = checkScarcityUrgency($);
  const checkSmoothScrollingScore = checkSmoothScrolling($);
  const checkMobileCTAAdaptationScore = checkMobileCTAAdaptation($);
  const checkMultiChannelFollowUpScore = checkMultiChannelFollowUp($);

  // Weights
  const weights = {
    CTA_Visibility: 3, CTA_Clarity: 2, CTA_Contrast: 2, CTA_Crowding: 1, CTA_Flow_Alignment: 2,
    Form_Presence: 3, Form_Length: 2, Required_vs_Optional_Fields: 2, Inline_Validation: 2, Submit_Button_Clarity: 2, AutoFocus_Field: 1, MultiStep_Form_Progress: 2,
    Testimonials: 2, Reviews: 2, Trust_Badges: 3, Client_Logos: 1, Case_Studies_Accessibility: 1,
    Exit_Intent_Triggers: 2, Lead_Magnets: 2, Contact_Info_Visibility: 3, Chatbot_Presence: 1,
    Interactive_Elements: 1, Personalization: 1, Progress_Indicators: 1, Friendly_Error_Handling: 2, Microcopy_Clarity: 1, Incentives_Displayed: 2,
    Scarcity_Urgency: 1, Smooth_Scrolling: 1, Mobile_CTA_Adaptation: 2, MultiChannel_FollowUp: 1
  };

  const metricsMap = {
    CTA_Visibility: checkCTAsScore,
    CTA_Clarity: checkCTAClarityScore,
    CTA_Contrast: checkCTAContrastScore,
    CTA_Crowding: checkCTACrowdingScore,
    CTA_Flow_Alignment: checkCTAFlowAlignmentScore,
    Form_Presence: checkFormPresenceScore,
    Form_Length: checkFormLengthOptimalScore,
    Required_vs_Optional_Fields: checkRequiredVsOptionalFieldsScore,
    Inline_Validation: checkInlineValidationScore,
    Submit_Button_Clarity: checkSubmitButtonClarityScore,
    AutoFocus_Field: checkAutoFocusFieldScore,
    MultiStep_Form_Progress: checkMultiStepFormProgressScore,
    Testimonials: checkTestimonialsScore,
    Reviews: checkReviewsVisibleScore,
    Trust_Badges: checkTrustBadgesScore,
    Client_Logos: checkClientLogosScore,
    Case_Studies_Accessibility: checkCaseStudiesAccessibilityScore,
    Exit_Intent_Triggers: checkExitIntentTriggersScore,
    Lead_Magnets: checkLeadMagnetsScore,
    Contact_Info_Visibility: checkContactInfoVisibilityScore,
    Chatbot_Presence: checkChatbotPresenceScore,
    Interactive_Elements: checkInteractiveElementsScore,
    Personalization: checkPersonalizationScore,
    Progress_Indicators: checkProgressIndicatorsScore,
    Friendly_Error_Handling: checkFriendlyErrorHandlingScore,
    Microcopy_Clarity: checkMicrocopyClarityScore,
    Incentives_Displayed: checkIncentivesDisplayedScore,
    Scarcity_Urgency: checkScarcityUrgencyScore,
    Smooth_Scrolling: checkSmoothScrollingScore,
    Mobile_CTA_Adaptation: checkMobileCTAAdaptationScore,
    MultiChannel_FollowUp: checkMultiChannelFollowUpScore
  };

  let totalWeight = 0;
  let earnedScore = 0;

  for (const [key, metric] of Object.entries(metricsMap)) {
    const weight = weights[key] || 1;
    totalWeight += weight;
    if (metric.score === 100) {
      earnedScore += weight;
    } else if (metric.score === 50) {
      earnedScore += weight * 0.5;
    }
  }

  const actualPercentage = totalWeight > 0 ? parseFloat(((earnedScore / totalWeight) * 100).toFixed(0)) : 0;

  return {
    Percentage: actualPercentage,
    ...metricsMap
  };
}