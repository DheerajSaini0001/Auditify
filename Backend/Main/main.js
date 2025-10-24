import MetricesCalculation from "../Calculation/MetricesCalculation.js";
import Metrices from "../Data/Metrices.js";
import Raw from "../Data/Raw.js";

export default async function main(message) {

  var url = message[0].trim();
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }
  let device = message[1] 
  const report = message[2]

    console.log(`URL Received: ${url} and Device: ${device} and report: ${report}`);

    const MetricesCalculation_Data = await MetricesCalculation(url,device,report)
    const Metrices_Data = Metrices(MetricesCalculation_Data)
    console.log(Metrices_Data);
    
    const Raw_Data = Raw(MetricesCalculation_Data,Metrices_Data)

    return  {Metrices_Data,Raw_Data}
}
