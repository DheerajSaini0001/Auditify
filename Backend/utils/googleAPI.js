import fetch from 'node-fetch'
import configService from '../services/configService.js';

export default async function googleAPI(url, device) {
  try {
    const API_KEY = configService.getConfig('API_KEY');
    const googleAPI = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&strategy=${device}&key=${API_KEY}`;
    const response = await fetch(googleAPI);
    const data = await response.json();

    return data;
  }
  catch (error) {
    console.error("Error fetching Google API data:", error);
    throw error;
  }
}
