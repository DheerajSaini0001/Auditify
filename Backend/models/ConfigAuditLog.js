import mongoose from 'mongoose';

/**
 * ConfigAuditLog — immutable record of every configuration change.
 * Tracks who changed what, when, and from where.
 */
const configAuditLogSchema = new mongoose.Schema({
  key: { 
    type: String, 
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'ROLLBACK', 'REVEAL', 'BULK_IMPORT', 'CACHE_REFRESH'],
    required: true
  },
  oldValue: { 
    type: String   // Masked for sensitive fields
  },
  newValue: { 
    type: String   // Masked for sensitive fields
  },
  version: {
    type: Number
  },
  updatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed  // Additional context (rollback info, bulk stats, etc.)
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

// Indexes for efficient querying
configAuditLogSchema.index({ timestamp: -1 });
configAuditLogSchema.index({ key: 1, timestamp: -1 });

const ConfigAuditLog = mongoose.model('ConfigAuditLog', configAuditLogSchema);
export default ConfigAuditLog;
