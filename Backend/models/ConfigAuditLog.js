import mongoose from 'mongoose';

const configAuditLogSchema = new mongoose.Schema({
  key: { 
    type: String, 
    required: true 
  },
  oldValue: { 
    type: String 
  },
  newValue: { 
    type: String 
  },
  updatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  action: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE'],
    default: 'UPDATE'
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

const ConfigAuditLog = mongoose.model('ConfigAuditLog', configAuditLogSchema);
export default ConfigAuditLog;
