import technicalMetrics from "../Metrices/technicalMetrics.js";
import seoMetrics from "../Metrices/seoMetrics.js";
import accessibilityMetrics from "../Metrices/accessibilityMetrics.js";
import securityCompliance from "../Metrices/securityCompliance.js";
import uxContentStructure from "../Metrices/uxContentStructure.js";
import conversionLeadFlow from "../Metrices/conversionLeadFlow.js";
import aioReadiness from "../Metrices/aioReadiness.js";

import Puppeteer_Cheerio from "../Tools/Puppeteer_Cheerio.js";
import googleAPI from "../Tools/googleAPI.js";

export default async function MetricesCalculation(url, device, selectedMetric) {
  let data = null;


  if (selectedMetric === "technicalMetrics" || selectedMetric === "All" || !selectedMetric) {
    data = await googleAPI(url, device);
  }

  const { browser, page, response, $ } = await Puppeteer_Cheerio(url, device);

  let result = {};

  switch (selectedMetric) {
    case "technicalMetrics":
      result.technicalReport = await technicalMetrics(url, data, page, response, browser);
      break;

    case "seoMetrics":
      result.seoReport = await seoMetrics(url, $);
      break;

    case "accessibilityMetrics":
      result.accessibilityReport = await accessibilityMetrics(page);
      break;

    case "securityCompliance":
      result.securityReport = await securityCompliance(url, page, response, browser);
      break;

    case "uxContentStructure":
      result.uxReport = await uxContentStructure(url, $);
      break;

    case "conversionLeadFlow":
      result.conversionReport = await conversionLeadFlow(page, $);
      break;

    case "aioReadiness":
      result.aioReport = await aioReadiness(url, $);
      break;

    default: {
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

      result = {
        technicalReport,
        seoReport,
        accessibilityReport,
        securityReport,
        uxReport,
        conversionReport,
        aioReport
      };
      break;
    }
  }

  await browser.close();

  console.log(result);
  
  return result;
}
