import mongoose from 'mongoose';
import SingleAuditReport from './models/singleAuditReport.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const audits = await SingleAuditReport.find({ url: /fusz\.com/i }).sort({ createdAt: -1 }).limit(10);
  audits.forEach(a => {
    console.log(`Date: ${a.createdAt}, Status: ${a.status}, Error: ${a.error}, isBotProtected: ${a.isBotProtected}`);
  });
  mongoose.connection.close();
}
check();
