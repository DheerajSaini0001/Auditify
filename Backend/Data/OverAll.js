
export default function OverAll(MetricesCalculation_Data) {

  const totalA = MetricesCalculation_Data.technicalReport.actualPercentage || 0;
  const totalB = MetricesCalculation_Data.seoReport.actualPercentage || 0;
  const totalC = MetricesCalculation_Data.accessibilityReport.actualPercentage || 0;
  const totalD = MetricesCalculation_Data.securityReport.actualPercentage || 0;
  const totalE = MetricesCalculation_Data.uxReport.actualPercentage || 0;
  const totalF = MetricesCalculation_Data.conversionReport.actualPercentage || 0;
  const totalG = MetricesCalculation_Data.aioReport.actualPercentage || 0;

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

  // const topFixes = [...scores]
  // .sort((a, b) => a.score - b.score)  
  // .slice(0, 5); 

// const recommendations = [];

// if (totalA < 20) {
//   recommendations.push("Improve Technical Performance (optimize LCP, CLS, INP, and fix sitemap/robots).");
// }

// if (totalB < 15) {
//   recommendations.push("Work on On-Page SEO (titles, meta descriptions, headings, image alts).");
// }

// if (totalC < 8) {
//   recommendations.push("Accessibility is weak – fix ARIA labels, color contrast, and alt text.");
// }

// if (totalD < 5) {
//   recommendations.push("Security is low – add HTTPS, HSTS, and required security headers.");
// }

// if (totalE < 6) {
//   recommendations.push("UX & Content need improvements – check mobile friendliness, readability, navigation depth.");
// }

// if (totalF < 6) {
//   recommendations.push("Conversion & Lead Flow is weak – ensure CTAs, forms, and tracking work properly.");
// }

// if (totalG < 6) {
//   recommendations.push("AI-Optimization readiness is low – add structured data (Organization, Product, FAQ).");
// }

  return {
    totalScore:parseFloat(totalScore.toFixed(1)),
    grade,
    sectionScores: scores,
    // topFixes,
    // recommendations,
  };

}
