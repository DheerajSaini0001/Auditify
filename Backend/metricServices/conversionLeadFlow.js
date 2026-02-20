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
function checkCTAClarity($) {
  const ctaSelectors = ['button', 'a', '.cta', '.cta-button', '.btn-primary'];
  const clearVerbs = ["buy", "get", "download", "sign up", "subscribe", "start", "join", "register", "learn", "book", "order"];

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

// CTA Flow Alignment
function checkCTAFlowAlignment($) {
  const ctaKeywords = ["buy now", "sign up", "get started", "subscribe", "download", "contact us", "book now"];
  const ctas = $("a, button").filter((_, el) => {
    const text = $(el).text().toLowerCase().trim();
    return ctaKeywords.some(keyword => text.includes(keyword));
  });

  const count = ctas.length;
  const idealRange = "0.1 - 0.9";

  if (count === 0) return {
    score: 0,
    status: "fail",
    details: "No flow CTAs found.",
    meta: { count, checkedKeywords: ctaKeywords },
    analysis: {
      cause: "No Call-to-Action elements with conversion-oriented keywords were found.",
      recommendation: "Add CTAs with strong action keywords like 'Get Started' or 'Buy Now' to guide user flow."
    }
  };

  const totalElements = $("*").length;
  const firstCTAIndex = $("*").index(ctas.first());
  const ratio = firstCTAIndex / totalElements;
  const positionRatio = ratio.toFixed(2);

  if (ratio > 0.1 && ratio < 0.9) {
    return {
      score: 100,
      status: "pass",
      details: "CTA placement aligns with user flow.",
      meta: { count, positionRatio, idealRange },
      analysis: null
    };
  }
  return {
    score: 50,
    status: "warning",
    details: "CTA placement might be too early or too late.",
    meta: { count, positionRatio, idealRange },
    analysis: {
      cause: "The primary Call-to-Action is placed at the extreme top or bottom of the content flow.",
      recommendation: "Position CTAs where users have enough context to make a decision, typically after a value proposition."
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
function checkReviewsVisible($) {
  const keywords = ["review", "rating", "stars", "customer-review"];
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
      details: "User reviews/ratings detected.",
      meta: { count, checkedKeywords: keywords },
      analysis: null
    };
  }

  return {
    score: 0,
    status: "fail",
    details: "No reviews found.",
    meta: { count: 0, checkedKeywords: keywords },
    analysis: {
      cause: "No aggregate ratings or specific user review elements were detected on the page.",
      recommendation: "Display star ratings or numerical scores if applicable to increase trust."
    }
  };
}

// Trust Badges
function checkTrustBadges($) {
  const keywords = ["secure", "ssl", "verified", "payment", "badge", "trust", "guarantee"];
  const images = $("img").filter((_, el) => {
    const src = ($(el).attr("src") || "").toLowerCase();
    const alt = ($(el).attr("alt") || "").toLowerCase();
    return keywords.some(k => src.includes(k) || alt.includes(k));
  });

  const count = images.length;

  if (count > 0) {
    return {
      score: 100,
      status: "pass",
      details: "Trust badges visible.",
      meta: { count, checkedKeywords: keywords },
      analysis: null
    };
  }

  return {
    score: 0,
    status: "fail",
    details: "No trust badges detected.",
    meta: { count: 0, checkedKeywords: keywords },
    analysis: {
      cause: "No trust-related images (security, SSL, verified) were detected.",
      recommendation: "Include icons for security or industry certifications to reassure users about data safety."
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

export default async function conversionLeadFlow(page, $) {

  const checkCTAsScore = checkCTAs($);
  const checkCTAClarityScore = checkCTAClarity($);
  const checkCTACrowdingScore = await checkCTACrowding(page);
  const checkCTAFlowAlignmentScore = checkCTAFlowAlignment($);

  const checkFormPresenceScore = await checkFormPresence(page);
  const checkFormLengthOptimalScore = checkFormLengthOptimal($);
  const checkRequiredVsOptionalFieldsScore = await checkRequiredVsOptionalFields(page);
  const checkInlineValidationScore = checkInlineValidation($);
  const checkSubmitButtonClarityScore = await checkSubmitButtonClarity(page);
  const checkMultiStepFormProgressScore = await checkMultiStepFormProgress(page);

  const checkTestimonialsScore = checkTestimonials($);
  const checkReviewsVisibleScore = checkReviewsVisible($);
  const checkTrustBadgesScore = checkTrustBadges($);
  const checkClientLogosScore = await checkClientLogos(page);
  const checkCaseStudiesAccessibilityScore = await checkCaseStudiesAccessibility(page);

  const checkProgressIndicatorsScore = checkProgressIndicators($);
  const checkFriendlyErrorHandlingScore = checkFriendlyErrorHandling($);
  const checkMicrocopyClarityScore = checkMicrocopyClarity($);

  const checkLeadMagnetsScore = await checkLeadMagnets(page);
  const checkIncentivesDisplayedScore = checkIncentivesDisplayed($);
  const checkLinkRelevanceScore = await checkLinkRelevance(page);


  // Weights
  const weights = {
    CTA_Presence: 5, Form_Presence: 5,
    CTA_Clarity: 4, Trust_Badges: 4, Inline_Validation: 4, Friendly_Error_Handling: 4,
    Testimonials: 4, Reviews: 4,
    Form_Length: 3, Submit_Button_Clarity: 3, Required_vs_Optional_Fields: 3, CTA_Flow_Alignment: 3,
    Lead_Magnets: 2, Microcopy_Clarity: 2, Incentives_Displayed: 2, CTA_Crowding: 2,
    Client_Logos: 1, Case_Studies_Accessibility: 1, MultiStep_Form_Progress: 1, Progress_Indicators: 1,
    Link_Relevance: 5
  };

  const metricsMap = {
    CTA_Presence: checkCTAsScore,
    CTA_Clarity: checkCTAClarityScore,
    CTA_Crowding: checkCTACrowdingScore,
    CTA_Flow_Alignment: checkCTAFlowAlignmentScore,
    Form_Presence: checkFormPresenceScore,
    Form_Length: checkFormLengthOptimalScore,
    Required_vs_Optional_Fields: checkRequiredVsOptionalFieldsScore,
    Inline_Validation: checkInlineValidationScore,
    Submit_Button_Clarity: checkSubmitButtonClarityScore,
    MultiStep_Form_Progress: checkMultiStepFormProgressScore,
    Testimonials: checkTestimonialsScore,
    Reviews: checkReviewsVisibleScore,
    Trust_Badges: checkTrustBadgesScore,
    Client_Logos: checkClientLogosScore,
    Case_Studies_Accessibility: checkCaseStudiesAccessibilityScore,
    Lead_Magnets: checkLeadMagnetsScore,
    Progress_Indicators: checkProgressIndicatorsScore,
    Friendly_Error_Handling: checkFriendlyErrorHandlingScore,
    Microcopy_Clarity: checkMicrocopyClarityScore,
    Incentives_Displayed: checkIncentivesDisplayedScore,
    Link_Relevance: checkLinkRelevanceScore,
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