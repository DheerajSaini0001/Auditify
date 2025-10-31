import technicalMetrics from "../Metrices/technicalMetrics.js";
import seoMetrics from "../Metrices/seoMetrics.js";
import accessibilityMetrics from "../Metrices/accessibilityMetrics.js";
import securityCompliance from "../Metrices/securityCompliance.js";
import uxContentStructure from "../Metrices/uxContentStructure.js";
import conversionLeadFlow from "../Metrices/conversionLeadFlow.js";
import aioReadiness from "../Metrices/aioReadiness.js";

import Puppeteer_Cheerio from "../Tools/Puppeteer_Cheerio.js";
import { performance } from "perf_hooks";
import SiteReport from "../Model/SiteReport.js";

function OverAll(technicalReport,seoReport,accessibilityReport,securityReport,uxReport,conversionReport,aioReport) {

  const totalA = technicalReport || 0;
  const totalB = seoReport || 0;
  const totalC = accessibilityReport || 0;
  const totalD = securityReport || 0;
  const totalE = uxReport || 0;
  const totalF = conversionReport || 0;
  const totalG = aioReport || 0;

  const scores = [
  { name: "Technical Performance", score: totalA },
  { name: "On-Page SEO", score: totalB },
  { name: "Accessibility", score: totalC },
  { name: "Security/Compliance", score: totalD },
  { name: "UX & Content", score: totalE },
  { name: "Conversion & Lead Flow", score: totalF },
  { name: "AIO Readiness", score: totalG }
];

  const totalScore = (totalA + totalB + totalC + totalD + totalE + totalF + totalG)/7;

  let grade = "F";
  if (totalScore >= 90) grade = "A";
  else if (totalScore >= 80) grade = "B";
  else if (totalScore >= 70) grade = "C";
  else if (totalScore >= 60) grade = "D";


  return {
    totalScore:parseFloat(totalScore.toFixed(1)),
    grade,
    sectionScores: scores,
  };

}

export default async function MetricesCalculation(url, device, selectedMetric = "All", auditId) {
  let start, end, timeTaken;
  start = performance.now();

  const { browser, page, response, $ } = await Puppeteer_Cheerio(url, device);

    if (selectedMetric && selectedMetric !== "All") {
      let result;

      switch (selectedMetric) {
        case "technicalMetrics":
          result = await technicalMetrics(url,device,selectedMetric, page, response, browser, auditId);
          end = performance.now();
          timeTaken = ((end-start)/1000).toFixed(0);
          browser.close();
          await SiteReport.findByIdAndUpdate(auditId, {
            Status:'completed',
            Time_Taken:timeTaken + 's',
            $set: {
              'Raw.Time_Taken': timeTaken + 's'
            }
          });
          break;

        case "seoMetrics":
          result = await seoMetrics(url,device,selectedMetric, $, auditId);
          end = performance.now();
          timeTaken = ((end-start)/1000).toFixed(0);
          browser.close();
          await SiteReport.findByIdAndUpdate(auditId, {
            Status:'completed',
            Time_Taken:timeTaken + 's',
            $set: {
              'Raw.Time_Taken': timeTaken + 's'
            }
          });
          break;

        case "accessibilityMetrics":
          result = await accessibilityMetrics(url,device,selectedMetric,page, auditId);
          end = performance.now();
          timeTaken = ((end-start)/1000).toFixed(0);
          browser.close();
          await SiteReport.findByIdAndUpdate(auditId, {
            Status:'completed',
            Time_Taken:timeTaken + 's',
            $set: {
              'Raw.Time_Taken': timeTaken + 's'
            }
          });
          break;

        case "securityCompliance":
          result = await securityCompliance(url,device,selectedMetric, page, response, browser, auditId);
          end = performance.now();
          timeTaken = ((end-start)/1000).toFixed(0);
          browser.close();
          await SiteReport.findByIdAndUpdate(auditId, {
            Status:'completed',
            Time_Taken:timeTaken + 's',
            $set: {
              'Raw.Time_Taken': timeTaken + 's'
            }
          });
          break;

        case "uxContentStructure":
          result = await uxContentStructure(url,device,selectedMetric, $, auditId);
          end = performance.now();
          timeTaken = ((end-start)/1000).toFixed(0);
          browser.close();
          await SiteReport.findByIdAndUpdate(auditId, {
            Status:'completed',
            Time_Taken:timeTaken + 's',
            $set: {
              'Raw.Time_Taken': timeTaken + 's'
            }
          });
          break;

        case "conversionLeadFlow":
          result = await conversionLeadFlow(url,device,selectedMetric,page, $, auditId);
          end = performance.now();
          timeTaken = ((end-start)/1000).toFixed(0);
          browser.close();
          await SiteReport.findByIdAndUpdate(auditId, {
            Status:'completed',
            Time_Taken:timeTaken + 's',
            $set: {
              'Raw.Time_Taken': timeTaken + 's'
            }
          });
          break;

        case "aioReadiness":
          result = await aioReadiness(url,device,selectedMetric, $, auditId);
          end = performance.now();
          timeTaken = ((end-start)/1000).toFixed(0);
          browser.close();
          await SiteReport.findByIdAndUpdate(auditId, {
            Status:'completed',
            Time_Taken:timeTaken + 's',
            $set: {
              'Raw.Time_Taken': timeTaken + 's'
            }
          });
          break;

        default:
          throw new Error("Invalid metric selected");
      }
    }

    else{
    const [
      technicalReport,
      seoReport,
      accessibilityReport,
      securityReport,
      uxReport,
      conversionReport,
      aioReport,
    ] = await Promise.all([
      technicalMetrics(url,device,selectedMetric, page, response, browser, auditId),
      seoMetrics(url,device,selectedMetric, $, auditId),
      accessibilityMetrics(url,device,selectedMetric,page, auditId),
      securityCompliance(url,device,selectedMetric, page, response, browser, auditId),
      uxContentStructure(url,device,selectedMetric, $, auditId),
      conversionLeadFlow(url,device,selectedMetric,page, $, auditId),
      aioReadiness(url,device,selectedMetric, $, auditId),
    ]);

    end = performance.now();
    timeTaken = ((end-start)/1000).toFixed(0);

    const Overall_Data = OverAll(technicalReport,seoReport,accessibilityReport,securityReport,uxReport,conversionReport,aioReport);

    browser.close();
    
    await SiteReport.findByIdAndUpdate(auditId, {
        Status:'completed',
        Time_Taken:timeTaken + 's',
        Score: Overall_Data.totalScore,
        Grade: Overall_Data.grade,
        Section_Score: Overall_Data.sectionScores,
        $set: {
          'Raw.Time_Taken': timeTaken + 's',
          'Raw.Score': Overall_Data.totalScore,
          'Raw.Grade': Overall_Data.grade,
          'Raw.Section_Score': Overall_Data.sectionScores
        }
        });


    
  }
}
