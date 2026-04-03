import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: String, required: true },   // uuid.v4() generated per login
  ip:        { type: String, required: true },
  device:    { type: String },                   // 'Desktop' | 'Mobile' | 'Tablet'
  browser:   { type: String },                   // e.g. 'Chrome 123'
  os:        { type: String },                   // e.g. 'Windows 11'
  action: {
    type: String,
    enum: ['LOGIN','LOGOUT','REGISTER','AUDIT_RUN','AUDIT_RUN_CACHED','REPORT_DOWNLOAD',
           'PROFILE_UPDATE','FAILED_LOGIN','BLOCKED','UNBLOCKED'],
    required: true
  },
  metadata:  { type: mongoose.Schema.Types.Mixed },  // extra context per action
  timestamp: { type: Date, default: Date.now }
}, { timestamps: false });

ActivityLogSchema.index({ userId: 1, timestamp: -1 });
ActivityLogSchema.index({ action: 1 });
ActivityLogSchema.index({ ip: 1 });

const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);

export default ActivityLog;
