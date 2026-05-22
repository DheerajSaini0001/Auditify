import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SingleAuditReport from './models/singleAuditReport.js';

dotenv.config();

const checkAudits = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        const audits = await SingleAuditReport.find({}).sort({ createdAt: -1 }).limit(10);
        console.log('Recent Audits:');
        audits.forEach(a => {
            console.log(`ID: ${a._id}, URL: ${a.url}, Status: ${a.status}`);
            if (a.onPageSEO) {
                console.log('onPageSEO.Contextual_Linking:', JSON.stringify(a.onPageSEO.Contextual_Linking, null, 2));
            }
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkAudits();
