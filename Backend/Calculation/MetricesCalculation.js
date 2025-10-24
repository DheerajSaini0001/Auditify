import technicalMetrics from "../Metrices/technicalMetrics.js";
import seoMetrics from "../Metrices/seoMetrics.js";
import accessibilityMetrics from "../Metrices/accessibilityMetrics.js";
import securityCompliance from "../Metrices/securityCompliance.js";
import uxContentStructure from "../Metrices/uxContentStructure.js";
import conversionLeadFlow from "../Metrices/conversionLeadFlow.js";
import aioReadiness from "../Metrices/aioReadiness.js";

import Puppeteer_Cheerio from "../Tools/Puppeteer_Cheerio.js";
import googleAPI from "../Tools/googleAPI.js";
import { performance } from "perf_hooks";

export default async function MetricesCalculation(url, device, selectedMetric = "All") {
  let start, end, timeTaken;
  let data = null;
  start = performance.now();
  const { browser, page, response, $ } = await Puppeteer_Cheerio(url, device);

    if (selectedMetric && selectedMetric !== "All") {
      let result;

      switch (selectedMetric) {
        case "technicalMetrics":
          data = await googleAPI(url, device);
          result = await technicalMetrics(url, data, page, response, browser);
          break;

        case "seoMetrics":
          result = await seoMetrics(url, $);
          break;

        case "accessibilityMetrics":
          result = await accessibilityMetrics(page);
          break;

        case "securityCompliance":
          result = await securityCompliance(url, page, response, browser);
          break;

        case "uxContentStructure":
          result = await uxContentStructure(url, $);
          break;

        case "conversionLeadFlow":
          result = await conversionLeadFlow(page, $);
          break;

        case "aioReadiness":
          result = await aioReadiness(url, $);
          break;

        default:
          throw new Error("Invalid metric selected");
      }
    end = performance.now();
    timeTaken = ((end-start)/1000).toFixed(0);

      return {
        url,
        device,
        report: selectedMetric,
        metric: result,
        timeTaken
      };
    }

    data = await googleAPI(url, device);
    const [
      technicalReport,
      seoReport,
      accessibilityReport,
      securityReport,
      uxReport,
      conversionReport,
      aioReport,
    ] = await Promise.all([
      technicalMetrics(url, data, page, response, browser),
      seoMetrics(url, $),
      accessibilityMetrics(page),
      securityCompliance(url, page, response, browser),
      uxContentStructure(url, $),
      conversionLeadFlow(page, $),
      aioReadiness(url, $),
    ]);

    end = performance.now();
    timeTaken = ((end-start)/1000).toFixed(0);
    
    return {
      url,
      device,
      report:selectedMetric,
      timeTaken,
      technicalReport,
      seoReport,
      accessibilityReport,
      securityReport,
      uxReport,
      conversionReport,
      aioReport,
    };
}
