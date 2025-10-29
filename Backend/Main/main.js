import MetricesCalculation from "../Calculation/MetricesCalculation.js";
import Metrices from "../Data/Metrices.js";
import SiteReport from "../Model/SiteReport.js"; 

export default async function main(message) {

  var url = message[0].trim();
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }
  let device = message[1] 
  const report = message[2]

    console.log(`URL Received: ${url} and Device: ${device} and report: ${report}`);

    // Check if already exists in DB
    const existingData = await SiteReport.findOne({ "Raw.Site": url,"Raw.Report":report,"Raw.Device": device});
    if(existingData){
      console.log('Data is persent in DB')
      return existingData;
    }

    const MetricesCalculation_Data = await MetricesCalculation(url,device,report)
    const Metric = Metrices(MetricesCalculation_Data)

    // ✅ Save Raw_Data to MongoDB
    const newData = new SiteReport(Metric);
    await newData.save();
    console.log("✅ Audit Completed & Data Saved to MongoDB");

    return  {Metric}
}
