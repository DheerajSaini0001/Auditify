import technicalMetrics from "../Metrices/technicalMetrics.js";
import seoMetrics from "../Metrices/seoMetrics.js";
import accessibilityMetrics from "../Metrices/accessibilityMetrics.js";
import securityCompliance from "../Metrices/securityCompliance.js";
import uxContentStructure from "../Metrices/uxContentStructure.js";
import conversionLeadFlow from "../Metrices/conversionLeadFlow.js";
import aioReadiness from "../Metrices/aioReadiness.js";
import Puppeteer_Cheerio from "../Tools/puppeteer_cheerio.js";
import googleAPI from "../Tools/googleAPI.js";

export default async function MetricesCalculation(url,device) {
  
const data = await googleAPI(url,device);
const {browser,page,response,$} = await Puppeteer_Cheerio(url,device);

  const [
    technicalReport,
    seoReport,
    accessibilityReport,
    securityReport,
    uxReport,
    conversionReport,
    aioReport
  ] = await Promise.all([
    technicalMetrics(url, data, page, response, browser),
    seoMetrics(url, $),
    accessibilityMetrics(page),
    securityCompliance(url, page, response, browser),
    uxContentStructure(url, $),
    conversionLeadFlow(page, $),
    aioReadiness(url, $)
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
