import mongoose from 'mongoose';

const platformConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  value: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  group: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  isSecret: {
    type: Boolean,
    default: false
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  version: {
    type: Number,
    default: 1
  }
}, { timestamps: true });

const PlatformConfig = mongoose.model('PlatformConfig', platformConfigSchema);
export default PlatformConfig;
