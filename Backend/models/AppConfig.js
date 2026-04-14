import mongoose from 'mongoose';

const appConfigSchema = new mongoose.Schema({
  key: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    uppercase: true,
    index: true
  },
  value: { 
    type: String,  // AES-256 encrypted
    required: true 
  },
  isSensitive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['auth', 'email', 'api', 'database', 'security', 'general', 'frontend'],
    default: 'general'
  },
  environment: {
    type: String,
    enum: ['all', 'development', 'staging', 'production'],
    default: 'all'
  },
  version: {
    type: Number,
    default: 1
  }
}, { timestamps: true });

const AppConfig = mongoose.model('AppConfig', appConfigSchema);
export default AppConfig;
