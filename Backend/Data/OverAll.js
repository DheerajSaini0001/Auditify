
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


  return {
    totalScore:parseFloat(totalScore.toFixed(1)),
    grade,
    sectionScores: scores,
  };

}
