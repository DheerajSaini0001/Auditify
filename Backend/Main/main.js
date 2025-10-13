import MetricesCalculation from "../Calculation/MetricesCalculation.js";
import Metrices from "../Data/Metrices.js";
import OverAll from "../Data/OverAll.js";
import puppeteer_cheerio from "../Tools/puppeteer_cheerio.js";
import puppeteers from "../Tools/puppeteers.js";
import googleAPI from "../Tools/googleAPI.js";
import robotsRes from "../Tools/robotsRes.js";
import { performance } from "perf_hooks";

export default async function main(message) {

  var url = message[0].trim();
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }
  let device = message[1]

    console.log(`URL Received: ${url} and Device: ${device}`);

    let start, end;

    start = performance.now();
    const googleApi_Data = await googleAPI(url,device);
    // const puppeteer_cheerio_Data = await puppeteer_cheerio(url);
    // const puppeteer_Data = await puppeteers(url);
    // const robotsRes_Data = await robotsRes(url);

    const MetricesCalculation_Data = await MetricesCalculation(url,googleApi_Data)
    const Overall_Data = await OverAll(MetricesCalculation_Data)
    end = performance.now();
    const timeTaken = ((end-start)/1000).toFixed(0);
    const Metrices_Data = Metrices(url,MetricesCalculation_Data,Overall_Data,timeTaken,device)

    return  Metrices_Data


}
