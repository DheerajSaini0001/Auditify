import mongoose from 'mongoose';

const appConfigSchema = new mongoose.Schema({
  key: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  value: { 
    type: String, 
    required: true 
  },
  isSensitive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true
  }
}, { timestamps: true });

const AppConfig = mongoose.model('AppConfig', appConfigSchema);
export default AppConfig;
