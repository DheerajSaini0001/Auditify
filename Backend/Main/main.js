import MetricesCalculation from "../Calculation/MetricesCalculation.js";
import Metrices from "../Data/Metrices.js";
import OverAll from "../Data/OverAll.js";
import { performance } from "perf_hooks";
import Raw from "../Data/Raw.js";

export default async function main(message) {

  var url = message[0].trim();
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }
  let device = message[1] 
  const report = message[2]

    console.log(`URL Received: ${url} and Device: ${device} and report: ${report}`);

    let start, end;

    start = performance.now();
    const MetricesCalculation_Data = await MetricesCalculation(url,device)
    end = performance.now();
    const timeTaken = ((end-start)/1000).toFixed(0);
    const Overall_Data =  OverAll(MetricesCalculation_Data)
    const Metrices_Data = Metrices(url,MetricesCalculation_Data,Overall_Data,timeTaken,device)
    const Raw_Data = Raw(url,MetricesCalculation_Data,Overall_Data,timeTaken,device)

    return  {Metrices_Data,Raw_Data}


}
