import technicalMetrics from "../Metrices/technicalMetrics.js";
import seoMetrics from "../Metrices/seoMetrics.js";
import accessibilityMetrics from "../Metrices/accessibilityMetrics.js";
import securityCompliance from "../Metrices/securityCompliance.js";
import uxContentStructure from "../Metrices/uxContentStructure.js";
import conversionLeadFlow from "../Metrices/conversionLeadFlow.js";
import aioReadiness from "../Metrices/aioReadiness.js";
import puppeteers from "../Tools/puppeteers.js";
let lastBrowserInstance = null;

export default async function MetricesCalculation(url,data) {
  
    if (lastBrowserInstance) {
    console.log("🛑 Closing previous browser instance...");
      if(lastBrowserInstance.isConnected()) {
        await lastBrowserInstance.close();
      }
    lastBrowserInstance = null;
  }

const {browser,page} = await puppeteers();
lastBrowserInstance = browser;

const [page1, page2, page3, page4, page5, page6, page7] = await Promise.all([
    browser.newPage(),
    browser.newPage(),
    browser.newPage(),
    browser.newPage(),
    browser.newPage(),
    browser.newPage(),
    browser.newPage()
  ]);

  const [
    technicalReport,
    seoReport,
    accessibilityReport,
    securityReport,
    uxReport,
    conversionReport,
    aioReport
  ] = await Promise.all([
    technicalMetrics(url, data, page1),
    seoMetrics(url, page2),
    accessibilityMetrics(url, page3),
    securityCompliance(url, page4),
    uxContentStructure(url, page5),
    conversionLeadFlow(url, page6),
    aioReadiness(url, page7)
  ]);
browser.close();

  // console.log("Technical Report:", technicalReport)
  // console.log("SEO Report (B1+B2+B3):", seoReport);
  // console.log("Accessibility C Section Report:", accessibilityReport);
  // console.log("Security/Compliance D Section Report:", securityReport);
  // console.log("UX & Content Structure E Section Report:", uxReport);
  // console.log("Conversion & Lead Flow F Section Report:", conversionReport);
  // console.log("AIO G Section Report:", aioReport);

  return {
    technicalReport,
    seoReport,
    accessibilityReport,
    securityReport,
    uxReport,
    conversionReport,
    aioReport
  };
}
