import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email:     { type: String, required: true },
  otp:       { type: String, required: true },   // bcrypt-hashed 6-digit code
  purpose:   { type: String, enum: ['email_verify'], default: 'email_verify' },
  expiresAt: { type: Date, required: true },     // Date.now() + 10 minutes
  attempts:  { type: Number, default: 0 }        // max 5 wrong attempts then invalidate
}, { timestamps: true });

// MongoDB TTL auto-delete
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTP = mongoose.model('OTP', otpSchema);
export default OTP;
