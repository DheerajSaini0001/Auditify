import dotenv from 'dotenv'
import fetch from 'node-fetch'
dotenv.config()


const API_KEY = process.env.API_KEY;
export default async function googleAPI(url, device) {
  try {
    const googleAPI = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&strategy=${device}&key=${API_KEY}`;
    // console.log(googleAPI);
    const response = await fetch(googleAPI);
    const data = await response.json();

    return data;
  }
  catch (error) {
    console.error("Error fetching Google API data:", error);
    throw error;
  }


}
