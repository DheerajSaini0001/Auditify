// import puppeteer from "puppeteer";
import puppeteer from "../Tools/puppeteers.js";

export default async function aioReadiness(url,page) {
  const report = {};


  await page.goto(url, {waitUntil: "networkidle2",timeout: 240000});
 
  const bodyText = await page.evaluate(() => document.body.innerText || "");
  const headerText = await page.evaluate(() => document.querySelector("header")?.innerText || "");
  const footerText = await page.evaluate(() => document.querySelector("footer")?.innerText || "");

  const jsonLdScripts = await page.evaluate(() =>
    Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map(el => {
        try { return JSON.parse(el.innerText); } catch { return null; }
      })
      .filter(Boolean)
  );

  // G1.1
  const orgSchemas = jsonLdScripts.filter(s => s["@type"] === "Organization");
  let orgFieldScore = 0;
  let orgValid = orgSchemas.length > 0;

  if (orgSchemas.length > 0) {
    const fields = ["name", "logo", "url", "contactPoint", "address", "sameAs"];
    const bestPercent = Math.max(
      ...orgSchemas.map(schema => {
        const presentFields = fields.reduce((acc, f) => acc + (schema[f] ? 1 : 0), 0);
        return (presentFields / fields.length) * 100;
      })
    );
    orgFieldScore = bestPercent > 75 ? 1 : 0;
  }

  // G1.2
  const phoneRegex = /\+?\d[\d\s\-]{7,}/g;
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const addressRegex = /(street|st\.|road|rd\.|avenue|ave\.|blvd|building)/gi;

  function normalizePhone(phone) { return phone.replace(/\D/g, ""); }
  function normalizeEmail(email) { return email.toLowerCase(); }
  function normalizeAddress(addr) { return addr.toLowerCase().replace(/\s+/g, " ").trim(); }
  function matchAll(text, regex) { return (text.match(regex) || []).map(m => m.trim()); }

  const phones = [...matchAll(headerText, phoneRegex), ...matchAll(footerText, phoneRegex), ...matchAll(bodyText, phoneRegex)];
  const emails = [...matchAll(headerText, emailRegex), ...matchAll(footerText, emailRegex), ...matchAll(bodyText, emailRegex)];
  const addresses = [...matchAll(headerText, addressRegex), ...matchAll(footerText, addressRegex), ...matchAll(bodyText, addressRegex)];

  function isConsistent(values, type) {
    if (values.length < 2) return false;
    let normalized;
    if (type === "phone") normalized = values.map(normalizePhone);
    else if (type === "email") normalized = values.map(normalizeEmail);
    else if (type === "address") normalized = values.map(normalizeAddress);
    else normalized = values;
    const counts = {};
    normalized.forEach(v => counts[v] = (counts[v] || 0) + 1);
    return Object.values(counts).some(c => c >= 2);
  }

  let consistencyCount = 0;
  if (isConsistent(phones, "phone")) consistencyCount++;
  if (isConsistent(emails, "email")) consistencyCount++;
  if (isConsistent(addresses, "address")) consistencyCount++;
  const napScore = consistencyCount == 3 ? 1 : 0;

  // G1.3
  const basePolicies = ["About", "Contact", "Privacy", "Terms"];
  const ecommercePolicies = ["Returns", "Shipping"];
  const isEcommerce = /cart|checkout|product/i.test(bodyText);
  const policies = isEcommerce ? [...basePolicies, ...ecommercePolicies] : [...basePolicies];
  const policyPresent = policies.filter(p => bodyText.toLowerCase().includes(p.toLowerCase())).length;
  const policyScore = (policyPresent / policies.length) > 75 ? 1 : 0;

  // G2.1
  const faqSchemas = jsonLdScripts.filter(s => s["@type"] === "FAQPage" || s["@type"] === "HowTo");
  const faqScore = faqSchemas.length ? 1 : 0

  // G2.2
  const headingsWithId = await page.evaluate(() => document.querySelectorAll("h1[id],h2[id],h3[id]").length);
  const headingsTotal = await page.evaluate(() => document.querySelectorAll("h1,h2,h3").length) || 1;
  const tocScore = (headingsWithId / headingsTotal) ? 1 : 0;

  // G2.3
  const imgWithFigcaption = await page.evaluate(() => document.querySelectorAll("figure figcaption").length);
  const mediaScore = imgWithFigcaption ? 1 : 0;

  // G3.1
  const productSchemas = jsonLdScripts.filter(s =>
    ["Product", "Vehicle", "Offer", "AggregateRating"].includes(s["@type"])
  );
  const productScore = productSchemas.length > 0 ? 1 : 0;
  let productValid = productSchemas.length > 0;

  // G3.2
  const hasFeed = await page.evaluate(() =>
    document.querySelectorAll('link[type="application/rss+xml"], link[type="application/atom+xml"], link[type="application/json"]').length > 0
  );
  const feedScore = hasFeed ? 1 : 0;

  // G4
  // let robotsScore = 1;
  // let robotsOk = true;
  //   if (/Disallow:\s*\/\s*$/i.test(robotsText)) {
  //     robotsScore = 0;
  //     robotsOk = false;
  //   }

  page.close()



  const totalGScore = ((orgFieldScore +napScore +policyScore +faqScore +tocScore +mediaScore +productScore +feedScore )/8)*100;

  const aioCompatible = totalGScore >= 75 && orgValid && productValid  ? "Yes" : "No";

  report.G = {
    jsonLdScripts:jsonLdScripts,
    orgFields: orgFieldScore,
    napConsistency: napScore,
    policies: policyScore,
    totalG1: (orgFieldScore + napScore + policyScore),

    faqJsonLd: faqScore,
    sectionAnchors: tocScore,
    mediaCaptions: mediaScore,
    totalG2: (faqScore + tocScore + mediaScore),

    productSchemas: productScore,
    feedAvailability: feedScore,
    totalG3: (productScore + feedScore),

    // crawlFriendliness: robotsScore,

    totalGScore:parseFloat(totalGScore.toFixed(0)),
    aioCompatibleBadge: aioCompatible,
  };

  return report;
}
