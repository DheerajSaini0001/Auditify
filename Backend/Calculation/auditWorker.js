import { workerData } from 'worker_threads';
import mongoose from 'mongoose';
import MetricesCalculation from './MetricesCalculation.js'; // Iska path check kar lein
import dbConnect from '../DB/db.js';
import SiteReport from '../Model/SiteReport.js';

// 1. Yahaan 'workerData' router se milta hai
const { Site, Device, Report, auditId } = workerData;

console.log(`WORKER [${auditId}]: Kaam mila. ${Site} ka ${Report} audit shuru.`);

async function runAudit() {
  try {
    // 2. DB Connect karo
    await dbConnect(); 
    console.log(`WORKER [${auditId}]: DB connected.`);

    // 3. Heavy function call karo
    await MetricesCalculation(Site, Device, Report, auditId);

    console.log(`WORKER [${auditId}]: Kaam poora hua.`);
    
    process.exit(0); // Success exit

  } catch (error) {
    console.error(`WORKER [${auditId}]: Error aaya:`, error.message);

    // 4. Error update karo
    try {
      if (mongoose.connection.readyState !== 1) {
        await dbConnect();
      }
      await SiteReport.findByIdAndUpdate(auditId, { Status: 'failed', error: error.message });
      console.log(`WORKER [${auditId}]: DB status 'failed' update kar diya.`);
    } catch (dbError) {
      console.error(`WORKER [${auditId}]: Error ko DB mein update nahi kar paaya:`, dbError);
    }
    
    process.exit(1); // Failure exit
  }
}

// Audit shuru karo
runAudit();