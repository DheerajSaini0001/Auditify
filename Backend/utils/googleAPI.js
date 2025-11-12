import dotenv from 'dotenv'
dotenv.config()


const API_KEY=process.env.API_KEY;
export default async function googleAPI(url,device) {
    try{
    const googleAPI =`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&strategy=${device}&key=${API_KEY}`;
    // console.log(googleAPI);
    const response = await fetch(googleAPI);
    const data = await response.json(); 
    
    return data;
    }
    catch (error) {
    console.error("Error fetching Google API data:", error);
    res.status(500).json({ success: false, error: "Failed to fetch Google API data" });
  }


}
