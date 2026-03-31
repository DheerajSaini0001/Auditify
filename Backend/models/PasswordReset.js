import mongoose from 'mongoose';

const passwordResetSchema = new mongoose.Schema({
  email:     { type: String, required: true },
  token:     { type: String, required: true },   // SHA-256 hash of raw UUID token
  expiresAt: { type: Date, required: true },     // Date.now() + 60 minutes
  used:      { type: Boolean, default: false }
}, { timestamps: true });

passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);
export default PasswordReset;
