import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, maxlength: 100 },
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:    { type: String, required: true },          // bcrypt hash, cost factor = 10
  role:        { type: String, enum: ['admin', 'user'], default: 'user' },
  isBlocked:   { type: Boolean, default: false },
  blockReason: { type: String, default: null },
  lastLogin:   { type: Date, default: null },
  loginCount:  { type: Number, default: 0 },
}, { timestamps: true });

UserSchema.index({ role: 1 });

const User = mongoose.model('User', UserSchema);

export default User;
