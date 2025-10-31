import SiteReport from "../Model/SiteReport.js";

// Conversion & Lead Flow (Call-to-Action (CTA) Effectiveness)
function checkCTAs($) {
    // Array of common CTA selectors
    const ctaSelectors = [
        'button',
        'input[type="button"]',
        'input[type="submit"]',
        '.cta',
        '.cta-button',
        '.cta-btn',
        '.btn-primary',
        '.btn-cta',
        '.btn',
        '.button',
        'a.cta',
        'a.cta-button',
        'a.btn',
        'a.btn-primary',
        'a[href*="signup"]',
        'a[href*="register"]',
        'a[href*="subscribe"]',
        '[id*="cta"]',
        '[class*="cta"]',
        '.hero button',
        '.hero a',
        '.promo button',
        '.promo a',
        '.signup button',
        '.signup a',
        '.download button',
        '.download a'
    ];

    let totalCTAs = 0;
    let foundCTAs = 0;

    ctaSelectors.forEach(selector => {
        const elements = $(selector);
        const count = elements.length;
        if (count > 0) {
            foundCTAs += count;
        }
        totalCTAs += count;
    });
    const score =  foundCTAs > 0 ? 1 : 0 // 1 if at least one CTA exists

    return score
}

function checkCTAClarity($) {
    const ctaSelectors = ['button', 'a', '.cta', '.cta-button', '.btn-primary']; // simplified

    let totalCTAs = 0;
    let clearCTAs = 0;

    const clearVerbs = ["buy", "get", "download", "sign up", "subscribe", "start", "join", "register", "learn", "book", "order"];

    ctaSelectors.forEach(selector => {
        $(selector).each((i, el) => {
            const text = $(el).text().trim().toLowerCase();
            if (!text) return;
            totalCTAs++;
            const isClear = clearVerbs.some(verb => text.includes(verb));
            if (isClear) clearCTAs++;
        });
    });

    const score = clearCTAs > 0 ? 1 : 0  // 1 if at least one CTA is clear
    return score
}

async function checkCTAContrast(page) {
    const ctaSelectors = ['button', 'a', '.cta', '.cta-button', '.btn-primary'];

    const result = await page.evaluate((selectors) => {
        function rgbStringToArray(str) {
            const match = str.match(/\d+/g);
            return match ? match.map(Number) : [0,0,0];
        }

        function getContrast(foreground, background) {
            function luminance(r,g,b){
                [r,g,b] = [r,g,b].map(c => c/255 <= 0.03928 ? c/12.92 : Math.pow((c/255+0.055)/1.055,2.4));
                return 0.2126*r + 0.7152*g + 0.0722*b;
            }
            const L1 = luminance(...foreground);
            const L2 = luminance(...background);
            return (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
        }

        const elements = document.querySelectorAll(selectors.join(','));
        let highContrastCount = 0;

        elements.forEach(el => {
            const style = window.getComputedStyle(el);
            const fg = rgbStringToArray(style.color);
            const bg = rgbStringToArray(style.backgroundColor);
            const contrast = getContrast(fg, bg);
            if (contrast >= 4.5) highContrastCount++;
        });

        const score =  highContrastCount > 0 ? 1 : 0
        return score
    }, ctaSelectors);

    return result;
}

async function checkCTACrowding(page, maxCTAs = 2) {
    const ctaSelectors = [
        'button',
        'input[type="button"]',
        'input[type="submit"]',
        '.cta',
        '.cta-button',
        '.cta-btn',
        '.btn-primary',
        'a.cta',
        'a.cta-button',
        'a.btn',
        'a.btn-primary'
    ];
    const result = await page.evaluate((selectors, max) => {
        const totalCTAs = document.querySelectorAll(selectors.join(',')).length;
        const score = totalCTAs <= max ? 1 : 0; // 1 = not crowded, 0 = crowded
        return { totalCTAs, score };
    }, ctaSelectors, maxCTAs);

    return result;
}

function checkCTAFlowAlignment($) {
  try {
    // Common CTA texts (expandable list)
    const ctaKeywords = [
      "buy now", "sign up", "get started", "subscribe",
      "download", "contact us", "book now", "join now", "try for free"
    ];

    // Find CTA-like buttons or links
    const ctas = $("a, button").filter((_, el) => {
      const text = $(el).text().toLowerCase().trim();
      return ctaKeywords.some(keyword => text.includes(keyword));
    });

    if (ctas.length === 0) return 0; // No CTA found

    // Find position of first CTA in the DOM
    const totalElements = $("*").length;
    const firstCTAIndex = $("*").index(ctas.first());
    const ctaPositionRatio = firstCTAIndex / totalElements;

    // Heuristic:
    // CTA should appear after ~10% of content but before last 90%
    if (ctaPositionRatio > 0.1 && ctaPositionRatio < 0.9) {
      return 1; // Flow aligns with user journey
    }

    return 0; // Too early or too late → not aligned
  } catch (error) {
    console.error("Error checking CTA flow alignment:", error.message);
    return 0;
  }
}

// Conversion & Lead Flow (Forms & Lead Capture)
async function checkFormPresence(page) {

  try {

    // Evaluate page content for lead capture forms
    const formExists = await page.evaluate(() => {
      const forms = document.querySelectorAll("form");
      for (const form of forms) {
        const inputs = form.querySelectorAll("input, textarea, select");

        // Typical lead form fields
        const leadKeywords = ["name", "email", "phone", "contact", "message"];
        const hasLeadField = Array.from(inputs).some(input =>
          leadKeywords.some(keyword =>
            (input.name || input.id || input.placeholder || "").toLowerCase().includes(keyword)
          )
        );

        if (hasLeadField) return true;
      }
      return false;
    });

    return formExists ? 1 : 0;

  } catch (error) {
    console.error("Error checking form presence:", error);
    return 0;
  }
}

function checkFormLengthOptimal($) {
  try {
    // Select all forms on the page
    const forms = $("form");
    if (forms.length === 0) return 0; // No forms → fail (not applicable)

    let hasOptimalForm = false;

    forms.each((_, form) => {
      // Count total form fields (input, select, textarea)
      const fieldCount = $(form).find("input, select, textarea").length;

      // If any form has fewer than 5 fields, mark as optimal
      if (fieldCount > 0 && fieldCount < 5) {
        hasOptimalForm = true;
      }
    });

    return hasOptimalForm ? 1 : 0;
  } catch (err) {
    console.error("Error checking form length:", err.message);
    return 0;
  }
}

async function checkRequiredVsOptionalFields(page) {
  try {

    const distinctionExists = await page.evaluate(() => {
      const forms = document.querySelectorAll("form");
      let hasRequired = false;
      let hasOptional = false;

      for (const form of forms) {
        const inputs = form.querySelectorAll("input, textarea, select, label");

        for (const el of inputs) {
          const labelText =
            (el.textContent || el.innerText || "").toLowerCase().trim();

          // Check for required indication
          if (
            el.hasAttribute("required") ||
            labelText.includes("*") ||
            labelText.includes("required")
          ) {
            hasRequired = true;
          }

          // Check for optional indication
          if (
            labelText.includes("(optional)") ||
            labelText.includes("optional")
          ) {
            hasOptional = true;
          }
        }
      }

      // Clear distinction if both required and optional are marked
      return hasRequired && hasOptional;
    });

    return distinctionExists ? 1 : 0;
  } catch (error) {
    console.error("Error checking required vs optional fields:", error);
    return 0;
  }
}

function checkInlineValidation($) {
  try {
    const inputs = $("input, textarea, select");
    if (inputs.length === 0) return 0; // No form fields → skip

    let hasValidation = false;

    inputs.each((_, el) => {
      const elem = $(el);

      // Look for HTML5 validation attributes
      const hasHTML5Validation =
        elem.attr("required") ||
        elem.attr("pattern") ||
        elem.attr("minlength") ||
        elem.attr("maxlength") ||
        elem.attr("type") === "email" ||
        elem.attr("type") === "number";

      // Look for JS event handlers indicating inline validation
      const hasEventValidation =
        elem.attr("oninput") ||
        elem.attr("onchange") ||
        elem.attr("onblur");

      // Look for classes or ARIA attributes used for inline errors
      const hasErrorIndicators =
        elem.attr("aria-invalid") ||
        elem.hasClass("error") ||
        elem.hasClass("invalid") ||
        elem.next().text().toLowerCase().includes("error") ||
        elem.parent().text().toLowerCase().includes("invalid");

      if (hasHTML5Validation || hasEventValidation || hasErrorIndicators) {
        hasValidation = true;
        return false; // Stop loop early
      }
    });

    return hasValidation ? 1 : 0;
  } catch (err) {
    console.error("Error checking inline validation:", err.message);
    return 0;
  }
}

async function checkSubmitButtonClarity(page) {

  try {

    const clarityExists = await page.evaluate(() => {
      // Collect all possible button-like elements
      const buttons = Array.from(document.querySelectorAll("button, input[type='submit'], input[type='button']"));

      // Common clear CTA phrases
      const clearTexts = [
        "get quote",
        "subscribe",
        "sign up",
        "register",
        "send",
        "contact",
        "join now",
        "apply now",
        "book now",
        "download",
        "submit",
        "start free trial",
        "get started",
        "request demo",
        "enquire now",
        "message",
        "try now"
      ];

      for (const btn of buttons) {
        const text = (btn.innerText || btn.value || "").toLowerCase().trim();
        if (text) {
          // Check if button text matches any clear CTA phrases
          if (clearTexts.some(keyword => text.includes(keyword))) {
            return true;
          }
        }
      }
      return false;
    });

    return clarityExists ? 1 : 0;
  } catch (error) {
    console.error("Error checking submit button clarity:", error);
    return 0;
  }
}

function checkAutoFocusField($) {
  try {
    // Look for any input, textarea, or select with autofocus attribute
    const hasAutoFocus = $("input[autofocus], textarea[autofocus], select[autofocus]").length > 0;

    return hasAutoFocus ? 1 : 0;
  } catch (err) {
    console.error("Error checking autofocus field:", err.message);
    return 0;
  }
}

async function checkMultiStepFormProgress(page) {

  try {

    const progressExists = await page.evaluate(() => {
      const forms = document.querySelectorAll("form");

      for (const form of forms) {
        const steps = form.querySelectorAll("fieldset, .step, .form-step, .multi-step");
        if (steps.length > 1) {
          // Multi-step form detected, now check for progress indicator
          const progressTexts = Array.from(document.querySelectorAll("p, span, div, li"))
            .map(el => el.textContent.toLowerCase());

          const progressPatterns = [
            /step \d+ of \d+/,
            /progress/i,
            /\d+\s*\/\s*\d+/  // e.g., 1/3
          ];

          const hasIndicator = progressTexts.some(text =>
            progressPatterns.some(pattern => pattern.test(text))
          );

          if (hasIndicator) return true;
        }
      }
      return false;
    });

    return progressExists ? 1 : 0;

  } catch (error) {
    console.error("Error checking multi-step form progress:", error);
    return 0;
  }
}

// Conversion & Lead Flow (Trust & Social Proof)
function checkTestimonials($) {
  try {
    // Common keywords for testimonial containers
    const testimonialKeywords = ["testimonial", "review", "feedback", "client-say", "user-story"];

    // Look for elements whose class or id includes a keyword
    const testimonialElems = $("*").filter((_, el) => {
      const $el = $(el);
      const className = ($el.attr("class") || "").toLowerCase();
      const idName = ($el.attr("id") || "").toLowerCase();

      return testimonialKeywords.some(keyword => className.includes(keyword) || idName.includes(keyword));
    });

    // Check if at least one has readable text
    const hasReadableText = testimonialElems.toArray().some(el => {
      const text = $(el).text().trim();
      return text.length > 1; // Arbitrary minimum length for readability
    });

    return hasReadableText ? 1 : 0;
  } catch (err) {
    console.error("Error checking testimonials:", err.message);
    return 0;
  }
}

function checkReviewsVisible($) {
  try {
    const keywords = ["review", "rating", "stars", "testimonial", "feedback"];

    // Look for elements with class or id containing keywords
    const reviewElems = $("*").filter((_, el) => {
      const $el = $(el);
      const className = ($el.attr("class") || "").toLowerCase();
      const idName = ($el.attr("id") || "").toLowerCase();

      return keywords.some(kw => className.includes(kw) || idName.includes(kw));
    });

    // Check if at least one has visible content
    const hasContent = reviewElems.toArray().some(el => {
      const text = $(el).text().trim();
      return text.length > 1; // Minimum text length for visibility
    });

    return hasContent ? 1 : 0;
  } catch (err) {
    console.error("Error checking reviews/ratings:", err.message);
    return 0;
  }
}

function checkTrustBadges($) {
  try {
    const badgeKeywords = ["trust", "secure", "ssl", "payment", "verified", "badge", "compliance", "certified"];

    // Check images
    const badgeImages = $("img").filter((_, el) => {
      const $el = $(el);
      const alt = ($el.attr("alt") || "").toLowerCase();
      const src = ($el.attr("src") || "").toLowerCase();
      const className = ($el.attr("class") || "").toLowerCase();
      const idName = ($el.attr("id") || "").toLowerCase();

      return badgeKeywords.some(keyword =>
        alt.includes(keyword) || src.includes(keyword) || className.includes(keyword) || idName.includes(keyword)
      );
    });

    // Check other elements (div/span with badge classes)
    const badgeElements = $("*").filter((_, el) => {
      const $el = $(el);
      const className = ($el.attr("class") || "").toLowerCase();
      const idName = ($el.attr("id") || "").toLowerCase();
      return badgeKeywords.some(keyword => className.includes(keyword) || idName.includes(keyword));
    });

    return badgeImages.length > 0 || badgeElements.length > 0 ? 1 : 0;
  } catch (err) {
    console.error("Error checking trust badges:", err.message);
    return 0;
  }
}

async function checkClientLogos(page) {

  try {

    const logosExist = await page.evaluate(() => {
      // Common client/logo container selectors
      const logoSelectors = [
        ".client-logo",
        ".partner-logo",
        ".logos",
        ".clients",
        "[class*='logo']",
        "[class*='partner']"
      ];

      for (const selector of logoSelectors) {
        const elements = document.querySelectorAll(selector);

        for (const el of elements) {
          const style = window.getComputedStyle(el);

          // Check for <img> tags inside the element
          const imgs = el.querySelectorAll("img");
          for (const img of imgs) {
            const imgStyle = window.getComputedStyle(img);
            if (
              img.src &&
              img.src.trim() !== "" &&
              imgStyle.display !== "none" &&
              imgStyle.visibility !== "hidden" &&
              imgStyle.opacity !== "0"
            ) {
              return true;
            }
          }

          // Check for background images
          const bgImage = style.backgroundImage;
          if (bgImage && bgImage !== "none") {
            return true;
          }
        }
      }

      return false;
    });

    return logosExist ? 1 : 0;

  } catch (error) {
    console.error("Error checking client logos:", error);
    return 0;
  }
}

async function checkCaseStudiesAccessibility(page) {

  try {

    const accessible = await page.evaluate(() => {
      const keywords = [
        "case study",
        "success story",
        "client story",
        "project showcase",
        "customer story",
        "our work",
        "portfolio"
      ];

      // Check links, buttons, and sections
      const elements = Array.from(document.querySelectorAll("a, button, div, section, article"));

      for (const el of elements) {
        const style = window.getComputedStyle(el);
        const text = (el.innerText || "").toLowerCase().trim();

        if (
          text &&
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0"
        ) {
          // If text matches any case study keyword
          if (keywords.some(keyword => text.includes(keyword))) {
            return true;
          }
        }
      }

      return false;
    });

    return accessible ? 1 : 0;

  } catch (error) {
    console.error("Error checking case studies accessibility:", error);
    return 0;
  }
}

// Conversion & Lead Flow (Lead Funnel Flow)
async function checkExitIntentTriggers(page) {

  // Helper for delay
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  try {

    // Give the page some time to load scripts
    await delay(2000);

    // Simulate exit-intent: move mouse to top of page
    await page.mouse.move(100, 0); // move to top

    // Wait a moment for popups to appear
    await delay(2000);

    const popupDetected = await page.evaluate(() => {
      const popupSelectors = [
        ".popup",
        ".modal",
        ".exit-intent",
        ".offer",
        ".newsletter",
        "[class*='popup']",
        "[class*='modal']",
        "[class*='offer']"
      ];

      for (const selector of popupSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          const style = window.getComputedStyle(el);
          const text = (el.innerText || "").trim();

          if (text.length > 0 && style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0") {
            return true; // visible popup detected
          }
        }
      }

      return false;
    });

    return popupDetected ? 1 : 0;

  } catch (error) {
    console.error("Error checking exit-intent triggers:", error);
    return 0;
  }
}

async function checkLeadMagnets(page) {

  try {


    const leadMagnetExists = await page.evaluate(() => {
      const keywords = [
        "free ebook",
        "free guide",
        "trial",
        "download",
        "whitepaper",
        "case study",
        "cheatsheet",
        "template"
      ];

      // Check links, buttons, sections, divs
      const elements = Array.from(document.querySelectorAll("a, button, div, section, article"));

      for (const el of elements) {
        const style = window.getComputedStyle(el);
        const text = (el.innerText || "").toLowerCase().trim();

        if (
          text &&
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0"
        ) {
          if (keywords.some(keyword => text.includes(keyword))) {
            return true;
          }
        }
      }

      return false;
    });

    return leadMagnetExists ? 1 : 0;

  } catch (error) {
    console.error("Error checking lead magnets:", error);
    return 0;
  }
}

function checkContactInfoVisibility($) {
  try {
    const pageText = $("body").text();

    // Simple regex for email
    const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
    const emailFound = emailRegex.test(pageText);

    // Simple regex for phone numbers (international & local)
    const phoneRegex = /(\+?\d{1,3}[-.\s]?|\()?\d{1,4}(\)|[-.\s]?)?\d{1,4}[-.\s]?\d{1,9}/g;
    const phoneFound = phoneRegex.test(pageText);

    return emailFound || phoneFound ? 1 : 0;
  } catch (err) {
    console.error("Error checking contact info visibility:", err.message);
    return 0;
  }
}

function checkChatbotPresence($) {
  try {
    const chatbotKeywords = ["tawk.to", "intercom", "drift", "livechat", "zendesk"];
    const elementKeywords = ["chat", "live-chat", "chat-widget", "support-widget"];

    // Check scripts
    const scripts = $("script").toArray();
    const scriptFound = scripts.some(el => {
      const src = ($(el).attr("src") || "").toLowerCase();
      return chatbotKeywords.some(kw => src.includes(kw));
    });

    // Check elements by class/id
    const elementsFound = $("*").toArray().some(el => {
      const className = ($(el).attr("class") || "").toLowerCase();
      const idName = ($(el).attr("id") || "").toLowerCase();
      return elementKeywords.some(kw => className.includes(kw) || idName.includes(kw));
    });

    return scriptFound || elementsFound ? 1 : 0;
  } catch (err) {
    console.error("Error checking chatbot/live chat:", err.message);
    return 0;
  }
}

// Conversion & Lead Flow (User Engagement & Interaction)
async function checkInteractiveElements(page) {
  try {

    const interactiveExists = await page.evaluate(() => {
      // 1️⃣ Check for tooltips via attributes
      const tooltipElements = Array.from(document.querySelectorAll("[title], [aria-label], [data-tooltip]"));
      if (tooltipElements.some(el => el.offsetParent !== null)) {
        return true;
      }

      // 2️⃣ Check for hoverable elements (simple detection via CSS :hover in stylesheets)
      const hoverElements = Array.from(document.querySelectorAll("*")).filter(el => {
        const style = window.getComputedStyle(el);
        return style.transitionDuration !== "0s"; // rough approximation for hover effects
      });
      if (hoverElements.length > 0) return true;

      // 3️⃣ Check for sliders/carousels
      const sliderSelectors = [
        ".slider",
        ".carousel",
        ".swiper",
        "[class*='slider']",
        "[class*='carousel']"
      ];
      for (const selector of sliderSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) return true;
      }

      return false;
    });

    return interactiveExists ? 1 : 0;

  } catch (error) {
    console.error("Error checking interactive elements:", error);
    return 0;
  }
}

function checkPersonalization($) {
  try {
    const placeholderKeywords = ["{{username}}", "{{user_name}}", "{{email}}"];
    const dynamicKeywords = ["personalization", "recommendation", "recently-viewed", "suggested-for-you", "dynamic-content"];
    const scriptProviders = ["optimizely", "segment", "vwo", "dynamicyield"];

    // Check text placeholders in body
    const bodyText = $("body").text();
    const hasPlaceholders = placeholderKeywords.some(kw => bodyText.includes(kw));

    // Check elements with dynamic content keywords in class/id
    const dynamicElements = $("*").toArray().some(el => {
      const className = ($(el).attr("class") || "").toLowerCase();
      const idName = ($(el).attr("id") || "").toLowerCase();
      return dynamicKeywords.some(kw => className.includes(kw) || idName.includes(kw));
    });

    // Check script src for personalization providers
    const scriptFound = $("script").toArray().some(el => {
      const src = ($(el).attr("src") || "").toLowerCase();
      return scriptProviders.some(provider => src.includes(provider));
    });

    return hasPlaceholders || dynamicElements || scriptFound ? 1 : 0;
  } catch (err) {
    console.error("Error checking personalization:", err.message);
    return 0;
  }
}

function checkProgressIndicators($) {
  try {
    const keywords = ["progress", "step", "wizard", "form-step", "progress-bar", "multi-step"];

    // Check for native <progress> elements
    const nativeProgress = $("progress").length > 0;

    // Check for elements with keywords in class or id
    const keywordElements = $("*").filter((_, el) => {
      const className = ($(el).attr("class") || "").toLowerCase();
      const idName = ($(el).attr("id") || "").toLowerCase();
      return keywords.some(kw => className.includes(kw) || idName.includes(kw));
    });

    return nativeProgress || keywordElements.length > 0 ? 1 : 0;
  } catch (err) {
    console.error("Error checking progress indicators:", err.message);
    return 0;
  }
}

function checkFriendlyErrorHandling($) {
  try {
    const inputs = $("input, textarea, select");
    if (inputs.length === 0) return 0;

    const errorKeywords = ["error", "invalid", "help-block", "error-message", "warning"];
    const messageKeywords = ["please", "required", "invalid", "must be", "enter a valid"];

    let hasFriendlyError = false;

    inputs.each((_, el) => {
      const $el = $(el);

      // HTML5 validation attributes
      const hasValidationAttr = $el.attr("required") || $el.attr("pattern") || $el.attr("minlength") || $el.attr("maxlength");

      // Check nearby sibling or parent for error-related classes or text
      const parentText = $el.parent().text().toLowerCase();
      const siblingText = $el.next().text().toLowerCase();
      const hasErrorText = messageKeywords.some(kw => parentText.includes(kw) || siblingText.includes(kw));

      const hasErrorClass = errorKeywords.some(kw => {
        const className = ($el.attr("class") || "").toLowerCase();
        const parentClass = ($el.parent().attr("class") || "").toLowerCase();
        return className.includes(kw) || parentClass.includes(kw);
      });

      if (hasValidationAttr || hasErrorText || hasErrorClass) {
        hasFriendlyError = true;
        return false; // Stop loop early
      }
    });

    return hasFriendlyError ? 1 : 0;
  } catch (err) {
    console.error("Error checking friendly error handling:", err.message);
    return 0;
  }
}

function checkMicrocopyClarity($) {
  try {
    const inputs = $("input, textarea, select");
    if (inputs.length === 0) return 0;

    let hasClarity = false;

    inputs.each((_, el) => {
      const $el = $(el);

      // Check for associated <label>
      const id = $el.attr("id");
      const hasLabel = id && $(`label[for="${id}"]`).length > 0;

      // Check for placeholder text
      const hasPlaceholder = $el.attr("placeholder") && $el.attr("placeholder").trim().length > 5;

      // Check for helper text nearby
      const helperText = $el.next("small, .help-text, .form-text").text().trim();
      const hasHelperText = helperText.length > 10;

      if (hasLabel || hasPlaceholder || hasHelperText) {
        hasClarity = true;
        return false; // Stop loop early
      }
    });

    return hasClarity ? 1 : 0;
  } catch (err) {
    console.error("Error checking microcopy clarity:", err.message);
    return 0;
  }
}

function checkIncentivesDisplayed($) {
  try {
    const keywords = ["discount", "free trial", "limited offer", "save", "deal", "promo", "offer"];

    // Get all visible text from the body
    const bodyText = $("body").text().toLowerCase();

    // Check if any keyword is present
    const found = keywords.some(kw => bodyText.includes(kw));

    return found ? 1 : 0;
  } catch (err) {
    console.error("Error checking incentives:", err.message);
    return 0;
  }
}

// Conversion & Lead Flow (Misc / Optional Extras for Conversion)
function checkScarcityUrgency($) {
  try {
    const keywords = ["limited stock", "only", "left", "hurry", "ends in", "countdown", "sale ends"];
    const elementKeywords = ["timer", "countdown", "stock", "urgency"];

    // Check visible text
    const bodyText = $("body").text().toLowerCase();
    const textFound = keywords.some(kw => bodyText.includes(kw));

    // Check element classes and ids
    const elementFound = $("*").toArray().some(el => {
      const className = ($(el).attr("class") || "").toLowerCase();
      const idName = ($(el).attr("id") || "").toLowerCase();
      return elementKeywords.some(kw => className.includes(kw) || idName.includes(kw));
    });

    return textFound || elementFound ? 1 : 0;
  } catch (err) {
    console.error("Error checking scarcity/urgency:", err.message);
    return 0;
  }
}

function checkSmoothScrolling($) {
  try {
    // Anchor links
    const anchorLinks = $('a[href^="#"]').length > 0;

    // CSS smooth scrolling
    const smoothCss = $('[style*="scroll-behavior: smooth"]').length > 0;

    // Inline JS smooth scrolling
    const scriptSmooth = $("script").toArray().some(el => {
      const scriptContent = $(el).html() || "";
      return scriptContent.includes('scrollIntoView') && scriptContent.includes('smooth');
    });

    return anchorLinks || smoothCss || scriptSmooth ? 1 : 0;
  } catch (err) {
    console.error("Error checking smooth scrolling:", err.message);
    return 0;
  }
}

function checkMobileCTAAdaptation($) {
  try {
    const ctaKeywords = ["cta", "button", "primary", "btn", "submit"];

    const ctas = $("a, button").toArray();

    const mobileFriendlyCTA = ctas.some(el => {
      const $el = $(el);
      const className = ($el.attr("class") || "").toLowerCase();
      const idName = ($el.attr("id") || "").toLowerCase();
      const style = ($el.attr("style") || "").toLowerCase();

      // Heuristic: contains CTA keyword and has inline padding/height or large button class
      const hasCTAClass = ctaKeywords.some(kw => className.includes(kw) || idName.includes(kw));
      const hasLargeStyle = /padding|height|font-size/.test(style) || /btn-lg|large|mobile/.test(className);

      return hasCTAClass && hasLargeStyle;
    });

    return mobileFriendlyCTA ? 1 : 0;
  } catch (err) {
    console.error("Error checking mobile CTA adaptation:", err.message);
    return 0;
  }
}

function checkMultiChannelFollowUp($) {
  try {
    const links = $("a").toArray();

    const channelDetected = links.some(el => {
      const $el = $(el);
      const href = ($el.attr("href") || "").toLowerCase();
      return href.startsWith("mailto:") || href.startsWith("tel:") || href.includes("wa.me") || href.includes("api.whatsapp.com/send");
    });

    return channelDetected ? 1 : 0;
  } catch (err) {
    console.error("Error checking multi-channel follow-up prompts:", err.message);
    return 0;
  }
}

export default async function conversionLeadFlow(url,device,selectedMetric,page, $, auditId) {

  // Conversion & Lead Flow (Call-to-Action (CTA) Effectiveness)
  const checkCTAsScore=checkCTAs($)
  const checkCTAClarityScore=checkCTAClarity($);
  const checkCTAContrastScore=await checkCTAContrast(page);
  const checkCTACrowdings=await checkCTACrowding(page);
  const checkCTACrowdingTotal= checkCTACrowdings.totalCTAs;
  const checkCTACrowdingScore=checkCTACrowdings.score;
  const checkCTAFlowAlignmentScore=checkCTAFlowAlignment($);

  // Conversion & Lead Flow (Forms & Lead Capture)
  const checkFormPresenceScore=await checkFormPresence(page);
  let checkFormLengthOptimalScore;
  let checkRequiredVsOptionalFieldsScore
  let checkInlineValidationScore
  let checkSubmitButtonClarityScore
  let checkAutoFocusFieldScore
  let checkMultiStepFormProgressScore

  if(checkFormPresenceScore===0){
  checkFormLengthOptimalScore=1;
  checkRequiredVsOptionalFieldsScore=1;
  checkInlineValidationScore=1;
  checkSubmitButtonClarityScore=1;
  checkAutoFocusFieldScore=1;
  checkMultiStepFormProgressScore=1;
  }
  else{
  checkFormLengthOptimalScore=checkFormLengthOptimal($);
  checkRequiredVsOptionalFieldsScore=await checkRequiredVsOptionalFields(page);
  checkInlineValidationScore=checkInlineValidation($);
  checkSubmitButtonClarityScore=await checkSubmitButtonClarity(page);
  checkAutoFocusFieldScore=checkAutoFocusField($);
  checkMultiStepFormProgressScore=await checkMultiStepFormProgress(page);
  }

  // Conversion & Lead Flow (Trust & Social Proof)
  const checkTestimonialsScore=checkTestimonials($);
  const checkReviewsVisibleScore=checkReviewsVisible($);
  const checkTrustBadgesScore=checkTrustBadges($);
  const checkClientLogosScore=await checkClientLogos(page);
  const checkCaseStudiesAccessibilityScore=await checkCaseStudiesAccessibility(page);
  
  // Conversion & Lead Flow (Lead Funnel Flow)
  const checkExitIntentTriggersScore=await checkExitIntentTriggers(page);
  const checkLeadMagnetsScore=await checkLeadMagnets(page);
  const checkContactInfoVisibilityScore=checkContactInfoVisibility($);
  const checkChatbotPresenceScore=checkChatbotPresence($);

  // Conversion & Lead Flow (User Engagement & Interaction)
  const checkInteractiveElementsScore=await checkInteractiveElements(page);
  const checkPersonalizationScore=checkPersonalization($);
  const checkProgressIndicatorsScore=checkProgressIndicators($);
  const checkFriendlyErrorHandlingScore=checkFriendlyErrorHandling($);
  const checkMicrocopyClarityScore=checkMicrocopyClarity($);
  const checkIncentivesDisplayedScore=checkIncentivesDisplayed($);  
  
  // Conversion & Lead Flow (Misc / Optional Extras for Conversion)
  const checkScarcityUrgencyScore=checkScarcityUrgency($);
  const checkSmoothScrollingScore=checkSmoothScrolling($);
  const checkMobileCTAAdaptationScore=checkMobileCTAAdaptation($);
  const checkMultiChannelFollowUpScore=checkMultiChannelFollowUp($);
  
  const Total = parseFloat((((checkCTAsScore+checkCTAClarityScore+checkCTAContrastScore+checkCTACrowdingScore+checkCTAFlowAlignmentScore+checkFormPresenceScore+checkFormLengthOptimalScore+checkRequiredVsOptionalFieldsScore+checkInlineValidationScore+checkSubmitButtonClarityScore+checkAutoFocusFieldScore+checkMultiStepFormProgressScore+checkTestimonialsScore+checkReviewsVisibleScore+checkTrustBadgesScore+checkClientLogosScore+checkCaseStudiesAccessibilityScore+checkExitIntentTriggersScore+checkLeadMagnetsScore+checkContactInfoVisibilityScore+checkChatbotPresenceScore+checkInteractiveElementsScore+checkPersonalizationScore+checkProgressIndicatorsScore+checkFriendlyErrorHandlingScore+checkMicrocopyClarityScore+checkIncentivesDisplayedScore+checkScarcityUrgencyScore+checkSmoothScrollingScore+checkMobileCTAAdaptationScore+checkMultiChannelFollowUpScore)/31)*100).toFixed(0));
  
  // Passed
  const passed = [];
  
  // Improvements
  const improvements = [];

// Conversion & Lead Flow (Call-to-Action (CTA) Effectiveness)
if (checkCTAsScore === 0) {
  improvements.push({
    metric: "CTA Visibility",
    current: "No visible CTAs",
    recommended: "At least one prominent CTA should be present",
    severity: "High 🟠",
    suggestion: "Add a clear and visible CTA to guide user action."
  });
} else {
  passed.push({
    metric: "CTA Visibility",
    current: "CTA visible",
    recommended: "At least one prominent CTA should be present",
    severity: "✅ Passed",
    suggestion: "CTA presence is good and visible."
  });
}

if (checkCTAClarityScore === 0) {
  improvements.push({
    metric: "CTA Clarity",
    current: "Unclear CTA text",
    recommended: "Use actionable text like 'Buy', 'Sign Up', 'Download'",
    severity: "High 🟠",
    suggestion: "Ensure CTA buttons and links have clear, actionable text."
  });
} else {
  passed.push({
    metric: "CTA Clarity",
    current: "Clear CTA text",
    recommended: "Use actionable text like 'Buy', 'Sign Up', 'Download'",
    severity: "✅ Passed",
    suggestion: "CTA text is clear and actionable."
  });
}

if (checkCTAContrastScore === 0) {
  improvements.push({
    metric: "CTA Contrast",
    current: "Low contrast CTA",
    recommended: "CTA text should have sufficient contrast (≥ 4.5:1)",
    severity: "Medium 🟡",
    suggestion: "Ensure CTA text is readable against its background."
  });
} else {
  passed.push({
    metric: "CTA Contrast",
    current: "Good contrast",
    recommended: "CTA text should have sufficient contrast (≥ 4.5:1)",
    severity: "✅ Passed",
    suggestion: "CTA contrast is sufficient."
  });
}

if (checkCTACrowdingScore === 0) {
  improvements.push({
    metric: "CTA Crowding",
    current: "Too many CTAs on page",
    recommended: "Limit number of CTAs to prevent confusion",
    severity: "Medium 🟡",
    suggestion: "Reduce the number of CTAs to make user focus easier."
  });
} else {
  passed.push({
    metric: "CTA Crowding",
    current: "CTA count optimal",
    recommended: "Limit number of CTAs to prevent confusion",
    severity: "✅ Passed",
    suggestion: "CTA placement is well-spaced."
  });
}

if (checkCTAFlowAlignmentScore === 0) {
  improvements.push({
    metric: "CTA Flow Alignment",
    current: "CTA not aligned with user flow",
    recommended: "Place CTAs at logical points in the user journey",
    severity: "Medium 🟡",
    suggestion: "Adjust CTA placement to match user engagement flow."
  });
} else {
  passed.push({
    metric: "CTA Flow Alignment",
    current: "CTA aligned with flow",
    recommended: "Place CTAs at logical points in the user journey",
    severity: "✅ Passed",
    suggestion: "CTA placement follows user journey."
  });
}

// Conversion & Lead Flow (Forms & Lead Capture)
if (checkFormPresenceScore === 0) {
  improvements.push({
    metric: "Form Presence",
    current: "No lead capture form detected",
    recommended: "Include at least one form for user input",
    severity: "High 🟠",
    suggestion: "Add a lead capture form to collect user details."
  });
} else {
  passed.push({
    metric: "Form Presence",
    current: "Form exists",
    recommended: "Include at least one form for user input",
    severity: "✅ Passed",
    suggestion: "Lead form is present and detectable."
  });
}

if (checkFormLengthOptimalScore === 0) {
  improvements.push({
    metric: "Form Length",
    current: "Form too long or missing",
    recommended: "Forms should be concise for better conversions",
    severity: "Medium 🟡",
    suggestion: "Simplify forms to include only essential fields."
  });
} else {
  passed.push({
    metric: "Form Length",
    current: "Optimal length",
    recommended: "Forms should be concise for better conversions",
    severity: "✅ Passed",
    suggestion: "Form length is optimal."
  });
}

if (checkRequiredVsOptionalFieldsScore === 0) {
  improvements.push({
    metric: "Required vs Optional Fields",
    current: "No distinction between required and optional fields",
    recommended: "Clearly mark required and optional fields",
    severity: "Medium 🟡",
    suggestion: "Update form fields to indicate which are required."
  });
} else {
  passed.push({
    metric: "Required vs Optional Fields",
    current: "Properly marked",
    recommended: "Clearly mark required and optional fields",
    severity: "✅ Passed",
    suggestion: "Form fields clearly indicate required vs optional."
  });
}

if (checkInlineValidationScore === 0) {
  improvements.push({
    metric: "Inline Validation",
    current: "No inline validation",
    recommended: "Provide real-time feedback for user input",
    severity: "Medium 🟡",
    suggestion: "Add inline validation to guide users while filling forms."
  });
} else {
  passed.push({
    metric: "Inline Validation",
    current: "Inline validation present",
    recommended: "Provide real-time feedback for user input",
    severity: "✅ Passed",
    suggestion: "Inline validation is working correctly."
  });
}

if (checkSubmitButtonClarityScore === 0) {
  improvements.push({
    metric: "Submit Button Clarity",
    current: "Unclear submit button",
    recommended: "Use actionable text like 'Submit', 'Sign Up', 'Get Started'",
    severity: "Medium 🟡",
    suggestion: "Update submit button to clearly indicate action."
  });
} else {
  passed.push({
    metric: "Submit Button Clarity",
    current: "Clear",
    recommended: "Use actionable text like 'Submit', 'Sign Up', 'Get Started'",
    severity: "✅ Passed",
    suggestion: "Submit button text is clear."
  });
}

if (checkAutoFocusFieldScore === 0) {
  improvements.push({
    metric: "AutoFocus Field",
    current: "No autofocus set",
    recommended: "Focus on first input field for user convenience",
    severity: "Low 🟢",
    suggestion: "Add autofocus to the first form field."
  });
} else {
  passed.push({
    metric: "AutoFocus Field",
    current: "Autofocus present",
    recommended: "Focus on first input field for user convenience",
    severity: "✅ Passed",
    suggestion: "Autofocus is set correctly."
  });
}

if (checkMultiStepFormProgressScore === 0) {
  improvements.push({
    metric: "Multi-Step Form Progress",
    current: "No progress indicator",
    recommended: "Show progress in multi-step forms",
    severity: "Medium 🟡",
    suggestion: "Add progress indicators to guide users through the form."
  });
} else {
  passed.push({
    metric: "Multi-Step Form Progress",
    current: "Progress indicator present",
    recommended: "Show progress in multi-step forms",
    severity: "✅ Passed",
    suggestion: "Multi-step forms show progress correctly."
  });
}

// Conversion & Lead Flow (Trust & Social Proof)
if (checkTestimonialsScore === 0) {
  improvements.push({
    metric: "Testimonials",
    current: "No testimonials visible",
    recommended: "Include user testimonials or feedback",
    severity: "Medium 🟡",
    suggestion: "Add client testimonials to build trust."
  });
} else {
  passed.push({
    metric: "Testimonials",
    current: "Testimonials visible",
    recommended: "Include user testimonials or feedback",
    severity: "✅ Passed",
    suggestion: "Testimonials are present and readable."
  });
}

if (checkReviewsVisibleScore === 0) {
  improvements.push({
    metric: "Reviews / Ratings",
    current: "No reviews or ratings",
    recommended: "Display user reviews or ratings",
    severity: "Medium 🟡",
    suggestion: "Add visible reviews to improve credibility."
  });
} else {
  passed.push({
    metric: "Reviews / Ratings",
    current: "Reviews visible",
    recommended: "Display user reviews or ratings",
    severity: "✅ Passed",
    suggestion: "Reviews are visible and credible."
  });
}

if (checkTrustBadgesScore === 0) {
  improvements.push({
    metric: "Trust Badges",
    current: "No trust badges",
    recommended: "Display security/trust badges",
    severity: "Medium 🟡",
    suggestion: "Add SSL, payment, or certified badges for credibility."
  });
} else {
  passed.push({
    metric: "Trust Badges",
    current: "Trust badges visible",
    recommended: "Display security/trust badges",
    severity: "✅ Passed",
    suggestion: "Trust badges are properly displayed."
  });
}

if (checkClientLogosScore === 0) {
  improvements.push({
    metric: "Client Logos",
    current: "No client logos",
    recommended: "Display logos of notable clients",
    severity: "Low 🟢",
    suggestion: "Add client logos to show credibility."
  });
} else {
  passed.push({
    metric: "Client Logos",
    current: "Client logos visible",
    recommended: "Display logos of notable clients",
    severity: "✅ Passed",
    suggestion: "Client logos are displayed."
  });
}

if (checkCaseStudiesAccessibilityScore === 0) {
  improvements.push({
    metric: "Case Studies Accessibility",
    current: "No accessible case studies",
    recommended: "Provide accessible case studies or success stories",
    severity: "Low 🟢",
    suggestion: "Add case studies linked from visible text/buttons."
  });
} else {
  passed.push({
    metric: "Case Studies Accessibility",
    current: "Case studies accessible",
    recommended: "Provide accessible case studies or success stories",
    severity: "✅ Passed",
    suggestion: "Case studies are accessible."
  });
}

// Conversion & Lead Flow (Lead Funnel Flow)
if (checkExitIntentTriggersScore === 0) {
  improvements.push({
    metric: "Exit Intent Triggers",
    current: "No exit-intent detected",
    recommended: "Implement exit-intent popups for engagement",
    severity: "Low 🟢",
    suggestion: "Add exit-intent popups to retain users."
  });
} else {
  passed.push({
    metric: "Exit Intent Triggers",
    current: "Exit-intent present",
    recommended: "Implement exit-intent popups for engagement",
    severity: "✅ Passed",
    suggestion: "Exit-intent popups are functioning."
  });
}

if (checkLeadMagnetsScore === 0) {
  improvements.push({
    metric: "Lead Magnets",
    current: "No lead magnets found",
    recommended: "Offer guides, templates, or free trials",
    severity: "Medium 🟡",
    suggestion: "Add lead magnets to encourage conversions."
  });
} else {
  passed.push({
    metric: "Lead Magnets",
    current: "Lead magnets present",
    recommended: "Offer guides, templates, or free trials",
    severity: "✅ Passed",
    suggestion: "Lead magnets are available."
  });
}

if (checkContactInfoVisibilityScore === 0) {
  improvements.push({
    metric: "Contact Info Visibility",
    current: "No contact info visible",
    recommended: "Display contact information prominently",
    severity: "Medium 🟡",
    suggestion: "Ensure email and phone number are visible."
  });
} else {
  passed.push({
    metric: "Contact Info Visibility",
    current: "Contact info visible",
    recommended: "Display contact information prominently",
    severity: "✅ Passed",
    suggestion: "Contact info is visible and accessible."
  });
}

if (checkChatbotPresenceScore === 0) {
  improvements.push({
    metric: "Chatbot Presence",
    current: "No chatbot found",
    recommended: "Provide live chat support for engagement",
    severity: "Low 🟢",
    suggestion: "Add a chatbot or live chat widget."
  });
} else {
  passed.push({
    metric: "Chatbot Presence",
    current: "Chatbot present",
    recommended: "Provide live chat support for engagement",
    severity: "✅ Passed",
    suggestion: "Chatbot is functioning."
  });
}

// Conversion & Lead Flow (User Engagement & Interaction)
if (checkInteractiveElementsScore === 0) {
  improvements.push({
    metric: "Interactive Elements",
    current: "No interactive elements",
    recommended: "Include sliders, carousels, or tooltips",
    severity: "Low 🟢",
    suggestion: "Add interactive elements to improve engagement."
  });
} else {
  passed.push({
    metric: "Interactive Elements",
    current: "Interactive elements present",
    recommended: "Include sliders, carousels, or tooltips",
    severity: "✅ Passed",
    suggestion: "Interactive elements are present."
  });
}

if (checkPersonalizationScore === 0) {
  improvements.push({
    metric: "Personalization",
    current: "No personalization detected",
    recommended: "Use dynamic content or recommendations",
    severity: "Low 🟢",
    suggestion: "Add personalized content or product suggestions."
  });
} else {
  passed.push({
    metric: "Personalization",
    current: "Personalization active",
    recommended: "Use dynamic content or recommendations",
    severity: "✅ Passed",
    suggestion: "Personalized content is working."
  });
}

if (checkProgressIndicatorsScore === 0) {
  improvements.push({
    metric: "Progress Indicators",
    current: "No progress indicators",
    recommended: "Show progress in forms or tasks",
    severity: "Low 🟢",
    suggestion: "Add progress indicators for multi-step interactions."
  });
} else {
  passed.push({
    metric: "Progress Indicators",
    current: "Progress indicators present",
    recommended: "Show progress in forms or tasks",
    severity: "✅ Passed",
    suggestion: "Progress indicators are visible."
  });
}

if (checkFriendlyErrorHandlingScore === 0) {
  improvements.push({
    metric: "Friendly Error Handling",
    current: "Error messages not clear",
    recommended: "Provide clear and helpful error messages",
    severity: "Medium 🟡",
    suggestion: "Improve error messages to guide users."
  });
} else {
  passed.push({
    metric: "Friendly Error Handling",
    current: "Error messages clear",
    recommended: "Provide clear and helpful error messages",
    severity: "✅ Passed",
    suggestion: "Error handling is user-friendly."
  });
}

if (checkMicrocopyClarityScore === 0) {
  improvements.push({
    metric: "Microcopy Clarity",
    current: "Unclear microcopy",
    recommended: "Provide helpful labels, placeholders, or helper text",
    severity: "Medium 🟡",
    suggestion: "Improve microcopy for better user guidance."
  });
} else {
  passed.push({
    metric: "Microcopy Clarity",
    current: "Microcopy clear",
    recommended: "Provide helpful labels, placeholders, or helper text",
    severity: "✅ Passed",
    suggestion: "Microcopy is clear and informative."
  });
}

if (checkIncentivesDisplayedScore === 0) {
  improvements.push({
    metric: "Incentives Displayed",
    current: "No incentives visible",
    recommended: "Display offers, discounts, or free trials prominently",
    severity: "Low 🟢",
    suggestion: "Add visible incentives to motivate users."
  });
} else {
  passed.push({
    metric: "Incentives Displayed",
    current: "Incentives visible",
    recommended: "Display offers, discounts, or free trials prominently",
    severity: "✅ Passed",
    suggestion: "Incentives are properly displayed."
  });
}

// Conversion & Lead Flow (Misc / Optional Extras for Conversion)
if (checkScarcityUrgencyScore === 0) {
  improvements.push({
    metric: "Scarcity / Urgency",
    current: "No scarcity or urgency cues",
    recommended: "Use countdowns or limited stock messages",
    severity: "Low 🟢",
    suggestion: "Add scarcity or urgency cues to encourage action."
  });
} else {
  passed.push({
    metric: "Scarcity / Urgency",
    current: "Scarcity / urgency cues present",
    recommended: "Use countdowns or limited stock messages",
    severity: "✅ Passed",
    suggestion: "Scarcity / urgency cues are working."
  });
}

if (checkSmoothScrollingScore === 0) {
  improvements.push({
    metric: "Smooth Scrolling",
    current: "No smooth scrolling detected",
    recommended: "Implement smooth scrolling for anchors",
    severity: "Low 🟢",
    suggestion: "Add smooth scrolling to improve UX."
  });
} else {
  passed.push({
    metric: "Smooth Scrolling",
    current: "Smooth scrolling present",
    recommended: "Implement smooth scrolling for anchors",
    severity: "✅ Passed",
    suggestion: "Scrolling is smooth."
  });
}

if (checkMobileCTAAdaptationScore === 0) {
  improvements.push({
    metric: "Mobile CTA Adaptation",
    current: "CTAs not adapted for mobile",
    recommended: "Ensure CTA buttons are large and tappable on mobile",
    severity: "Medium 🟡",
    suggestion: "Optimize CTA buttons for mobile devices."
  });
} else {
  passed.push({
    metric: "Mobile CTA Adaptation",
    current: "CTAs mobile-adapted",
    recommended: "Ensure CTA buttons are large and tappable on mobile",
    severity: "✅ Passed",
    suggestion: "CTA buttons are mobile-friendly."
  });
}

if (checkMultiChannelFollowUpScore === 0) {
  improvements.push({
    metric: "Multi-Channel Follow-Up",
    current: "No multi-channel follow-up detected",
    recommended: "Provide options like email, phone, or WhatsApp follow-up",
    severity: "Low 🟢",
    suggestion: "Add multi-channel follow-up links or buttons."
  });
} else {
  passed.push({
    metric: "Multi-Channel Follow-Up",
    current: "Follow-up options present",
    recommended: "Provide options like email, phone, or WhatsApp follow-up",
    severity: "✅ Passed",
    suggestion: "Multi-channel follow-up is available."
  });
}

  // Warning
  const warning = [];

  const actualPercentage = parseFloat((((checkCTAsScore+checkCTAClarityScore+checkCTAContrastScore+checkCTACrowdingScore+checkCTAFlowAlignmentScore+checkFormPresenceScore+checkFormLengthOptimalScore+checkRequiredVsOptionalFieldsScore+checkInlineValidationScore+checkSubmitButtonClarityScore+checkAutoFocusFieldScore+checkMultiStepFormProgressScore+checkTestimonialsScore+checkReviewsVisibleScore+checkTrustBadgesScore+checkClientLogosScore+checkCaseStudiesAccessibilityScore+checkExitIntentTriggersScore+checkLeadMagnetsScore+checkContactInfoVisibilityScore+checkChatbotPresenceScore+checkInteractiveElementsScore+checkPersonalizationScore+checkProgressIndicatorsScore+checkFriendlyErrorHandlingScore+checkMicrocopyClarityScore+checkIncentivesDisplayedScore+checkScarcityUrgencyScore+checkSmoothScrollingScore+checkMobileCTAAdaptationScore+checkMultiChannelFollowUpScore)/31)*100).toFixed(0));
  
  // console.log("CTA Visibility Score:", checkCTAsScore);
  // console.log("CTA Clarity Score:", checkCTAClarityScore);
  // console.log("CTA Contrast Score:", checkCTAContrastScore);
  // console.log("CTA Crowding Total:", checkCTACrowdingTotal);
  // console.log("CTA Crowding Score:", checkCTACrowdingScore);
  // console.log("CTA Flow Alignment Score:", checkCTAFlowAlignmentScore);
  // console.log("Form Presence Score:", checkFormPresenceScore);
  // console.log("Form Length Optimal Score:", checkFormLengthOptimalScore);
  // console.log("Required vs Optional Fields Score:", checkRequiredVsOptionalFieldsScore);
  // console.log("Inline Validation Score:", checkInlineValidationScore);
  // console.log("Submit Button Clarity Score:", checkSubmitButtonClarityScore);
  // console.log("AutoFocus Field Score:", checkAutoFocusFieldScore);
  // console.log("Multi-Step Form Progress Score:", checkMultiStepFormProgressScore);
  // console.log("Testimonials Score:", checkTestimonialsScore);
  // console.log("Reviews/ Ratings Visible Score:", checkReviewsVisibleScore);
  // console.log("Trust Badges Score:", checkTrustBadgesScore);
  // console.log("Client Logos Score:", checkClientLogosScore);
  // console.log("Case Studies Accessibility Score:", checkCaseStudiesAccessibilityScore);
  // console.log("Exit-Intent Triggers Score:", checkExitIntentTriggersScore);
  // console.log("Lead Magnets Score:", checkLeadMagnetsScore);
  // console.log("Contact Info Visibility Score:", checkContactInfoVisibilityScore);
  // console.log("Chatbot/ Live Chat Presence Score:", checkChatbotPresenceScore);
  // console.log("Interactive Elements Score:", checkInteractiveElementsScore);
  // console.log("Personalization Score:", checkPersonalizationScore);
  // console.log("Progress Indicators Score:", checkProgressIndicatorsScore);
  // console.log("Friendly Error Handling Score:", checkFriendlyErrorHandlingScore);
  // console.log("Microcopy Clarity Score:", checkMicrocopyClarityScore);
  // console.log("Incentives Displayed Score:", checkIncentivesDisplayedScore);
  // console.log("Scarcity/ Urgency Score:", checkScarcityUrgencyScore);
  // console.log("Smooth Scrolling Score:", checkSmoothScrollingScore);
  // console.log("Mobile CTA Adaptation Score:", checkMobileCTAAdaptationScore);
  // console.log("Multi-Channel Follow-Up Prompts Score:", checkMultiChannelFollowUpScore);
  // console.log(actualPercentage);
  // console.log(warning);
  // console.log(passed);
  // console.log(Total);
  // console.log(improvements);

  await SiteReport.findByIdAndUpdate(auditId, {
    Conversion_and_Lead_Flow: {
        CTA_Visibility: {
          Score: checkCTAsScore,
          Parameter: "1 if at least one prominent CTA is present, else 0"
        },
        CTA_Clarity: {
          Score: checkCTAClarityScore,
          Parameter: "1 if CTA buttons and links have clear, actionable text, else 0"
        },
        CTA_Contrast: {
          Score: checkCTAContrastScore,
          Parameter: "1 if CTA text has sufficient contrast (≥4.5:1), else 0"
        },
        CTA_Crowding: {
          Score: checkCTACrowdingScore,
          Parameter: "1 if number of CTAs is limited to prevent confusion, else 0"
        },
        CTA_Flow_Alignment: {
          Score: checkCTAFlowAlignmentScore,
          Parameter: "1 if CTAs are placed logically along user flow, else 0"
        },
        Form_Presence: {
          Score: checkFormPresenceScore,
          Parameter: "1 if at least one form is present, else 0"
        },
        Form_Length: {
          Score: checkFormLengthOptimalScore,
          Parameter: "1 if forms are concise, else 0"
        },
        Required_vs_Optional_Fields: {
          Score: checkRequiredVsOptionalFieldsScore,
          Parameter: "1 if required vs optional fields are clearly marked, else 0"
        },
        Inline_Validation: {
          Score: checkInlineValidationScore,
          Parameter: "1 if real-time feedback is provided for user input, else 0"
        },
        Submit_Button_Clarity: {
          Score: checkSubmitButtonClarityScore,
          Parameter: "1 if submit button text is clear and actionable, else 0"
        },
        AutoFocus_Field: {
          Score: checkAutoFocusFieldScore,
          Parameter: "1 if first input field is autofocused, else 0"
        },
        MultiStep_Form_Progress: {
          Score: checkMultiStepFormProgressScore,
          Parameter: "1 if progress indicators exist in multi-step forms, else 0"
        },
        Testimonials: {
          Score: checkTestimonialsScore,
          Parameter: "1 if testimonials are visible, else 0"
        },
        Reviews: {
          Score: checkReviewsVisibleScore,
          Parameter: "1 if reviews/ratings are visible, else 0"
        },
        Trust_Badges: {
          Score: checkTrustBadgesScore,
          Parameter: "1 if trust/security badges are visible, else 0"
        },
        Client_Logos: {
          Score: checkClientLogosScore,
          Parameter: "1 if client logos are visible, else 0"
        },
        Case_Studies_Accessibility: {
          Score: checkCaseStudiesAccessibilityScore,
          Parameter: "1 if case studies are accessible, else 0"
        },
        Exit_Intent_Triggers: {
          Score: checkExitIntentTriggersScore,
          Parameter: "1 if exit-intent triggers exist, else 0"
        },
        Lead_Magnets: {
          Score: checkLeadMagnetsScore,
          Parameter: "1 if lead magnets are offered, else 0"
        },
        Contact_Info_Visibility: {
          Score: checkContactInfoVisibilityScore,
          Parameter: "1 if contact info is visible, else 0"
        },
        Chatbot_Presence: {
          Score: checkChatbotPresenceScore,
          Parameter: "1 if chatbot is present, else 0"
        },
        Interactive_Elements: {
          Score: checkInteractiveElementsScore,
          Parameter: "1 if interactive elements are present, else 0"
        },
        Personalization: {
          Score: checkPersonalizationScore,
          Parameter: "1 if personalized content exists, else 0"
        },
        Progress_Indicators: {
          Score: checkProgressIndicatorsScore,
          Parameter: "1 if progress indicators are visible, else 0"
        },
        Friendly_Error_Handling: {
          Score: checkFriendlyErrorHandlingScore,
          Parameter: "1 if error messages are clear and helpful, else 0"
        },
        Microcopy_Clarity: {
          Score: checkMicrocopyClarityScore,
          Parameter: "1 if labels/placeholders are clear, else 0"
        },
        Incentives_Displayed: {
          Score: checkIncentivesDisplayedScore,
          Parameter: "1 if offers or incentives are visible, else 0"
        },
        Scarcity_Urgency: {
          Score: checkScarcityUrgencyScore,
          Parameter: "1 if scarcity or urgency cues are present, else 0"
        },
        Smooth_Scrolling: {
          Score: checkSmoothScrollingScore,
          Parameter: "1 if smooth scrolling is implemented, else 0"
        },
        Mobile_CTA_Adaptation: {
          Score: checkMobileCTAAdaptationScore,
          Parameter: "1 if CTAs are mobile-friendly, else 0"
        },
        MultiChannel_FollowUp: {
          Score: checkMultiChannelFollowUpScore,
          Parameter: "1 if multi-channel follow-up options exist, else 0"
        },
      Percentage: actualPercentage,
      Warning: warning,
      Passed: passed,
      Total: Total,
      Improvements: improvements
    },
    $set: {
          'Raw.Site': url,
          'Raw.Report': selectedMetric,
          'Raw.Device': device,
          'Raw.Conversion_and_Lead_Flow':{
        CTA_Visibility: {
          Score: checkCTAsScore,
          Parameter: "1 if at least one prominent CTA is present, else 0"
        },
        CTA_Clarity: {
          Score: checkCTAClarityScore,
          Parameter: "1 if CTA buttons and links have clear, actionable text, else 0"
        },
        CTA_Contrast: {
          Score: checkCTAContrastScore,
          Parameter: "1 if CTA text has sufficient contrast (≥4.5:1), else 0"
        },
        CTA_Crowding: {
          Score: checkCTACrowdingScore,
          Parameter: "1 if number of CTAs is limited to prevent confusion, else 0"
        },
        CTA_Flow_Alignment: {
          Score: checkCTAFlowAlignmentScore,
          Parameter: "1 if CTAs are placed logically along user flow, else 0"
        },
        Form_Presence: {
          Score: checkFormPresenceScore,
          Parameter: "1 if at least one form is present, else 0"
        },
        Form_Length: {
          Score: checkFormLengthOptimalScore,
          Parameter: "1 if forms are concise, else 0"
        },
        Required_vs_Optional_Fields: {
          Score: checkRequiredVsOptionalFieldsScore,
          Parameter: "1 if required vs optional fields are clearly marked, else 0"
        },
        Inline_Validation: {
          Score: checkInlineValidationScore,
          Parameter: "1 if real-time feedback is provided for user input, else 0"
        },
        Submit_Button_Clarity: {
          Score: checkSubmitButtonClarityScore,
          Parameter: "1 if submit button text is clear and actionable, else 0"
        },
        AutoFocus_Field: {
          Score: checkAutoFocusFieldScore,
          Parameter: "1 if first input field is autofocused, else 0"
        },
        MultiStep_Form_Progress: {
          Score: checkMultiStepFormProgressScore,
          Parameter: "1 if progress indicators exist in multi-step forms, else 0"
        },
        Testimonials: {
          Score: checkTestimonialsScore,
          Parameter: "1 if testimonials are visible, else 0"
        },
        Reviews: {
          Score: checkReviewsVisibleScore,
          Parameter: "1 if reviews/ratings are visible, else 0"
        },
        Trust_Badges: {
          Score: checkTrustBadgesScore,
          Parameter: "1 if trust/security badges are visible, else 0"
        },
        Client_Logos: {
          Score: checkClientLogosScore,
          Parameter: "1 if client logos are visible, else 0"
        },
        Case_Studies_Accessibility: {
          Score: checkCaseStudiesAccessibilityScore,
          Parameter: "1 if case studies are accessible, else 0"
        },
        Exit_Intent_Triggers: {
          Score: checkExitIntentTriggersScore,
          Parameter: "1 if exit-intent triggers exist, else 0"
        },
        Lead_Magnets: {
          Score: checkLeadMagnetsScore,
          Parameter: "1 if lead magnets are offered, else 0"
        },
        Contact_Info_Visibility: {
          Score: checkContactInfoVisibilityScore,
          Parameter: "1 if contact info is visible, else 0"
        },
        Chatbot_Presence: {
          Score: checkChatbotPresenceScore,
          Parameter: "1 if chatbot is present, else 0"
        },
        Interactive_Elements: {
          Score: checkInteractiveElementsScore,
          Parameter: "1 if interactive elements are present, else 0"
        },
        Personalization: {
          Score: checkPersonalizationScore,
          Parameter: "1 if personalized content exists, else 0"
        },
        Progress_Indicators: {
          Score: checkProgressIndicatorsScore,
          Parameter: "1 if progress indicators are visible, else 0"
        },
        Friendly_Error_Handling: {
          Score: checkFriendlyErrorHandlingScore,
          Parameter: "1 if error messages are clear and helpful, else 0"
        },
        Microcopy_Clarity: {
          Score: checkMicrocopyClarityScore,
          Parameter: "1 if labels/placeholders are clear, else 0"
        },
        Incentives_Displayed: {
          Score: checkIncentivesDisplayedScore,
          Parameter: "1 if offers or incentives are visible, else 0"
        },
        Scarcity_Urgency: {
          Score: checkScarcityUrgencyScore,
          Parameter: "1 if scarcity or urgency cues are present, else 0"
        },
        Smooth_Scrolling: {
          Score: checkSmoothScrollingScore,
          Parameter: "1 if smooth scrolling is implemented, else 0"
        },
        Mobile_CTA_Adaptation: {
          Score: checkMobileCTAAdaptationScore,
          Parameter: "1 if CTAs are mobile-friendly, else 0"
        },
        MultiChannel_FollowUp: {
          Score: checkMultiChannelFollowUpScore,
          Parameter: "1 if multi-channel follow-up options exist, else 0"
        },
      Percentage: actualPercentage
    }
        }
    });

    return actualPercentage
}