import mongoose from 'mongoose';

/**
 * ConfigVersion — stores a snapshot of a config value before each update.
 * Enables rollback to any previous version with the encrypted value preserved.
 */
const configVersionSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    index: true
  },
  value: {
    type: String,     // Encrypted — stored as-is from AppConfig.value
    required: true
  },
  version: {
    type: Number,
    required: true
  },
  isSensitive: {
    type: Boolean,
    default: true
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  changeReason: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient version lookups
configVersionSchema.index({ key: 1, version: -1 });

const ConfigVersion = mongoose.model('ConfigVersion', configVersionSchema);
export default ConfigVersion;
