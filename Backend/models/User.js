import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const websiteSchema = new mongoose.Schema({
  url:          { type: String, required: true },
  siteId:       { type: String },           // GSC siteUrl value e.g. sc-domain:example.com
  verified:     { type: Boolean, default: false },
  verifiedAt:   { type: Date },
  permissionLevel: { type: String, enum: ['siteOwner','siteFullUser','siteRestrictedUser','siteUnverifiedUser'], default: 'siteUnverifiedUser' },
  addedAt:      { type: Date, default: Date.now }
});

/**
 * Tombstone for a Search Console property the user deleted.
 *
 * Deleting is a hard delete on `websites`, so without this the next GSC sync
 * pulled the property straight back from Google — the user's deletion only
 * survived until the next sync (or the next browser). The url is stored
 * normalized so it matches whatever form Google returns (sc-domain:, trailing
 * slash, scheme).
 */
const removedWebsiteSchema = new mongoose.Schema({
  url:       { type: String, required: true },
  removedAt: { type: Date, default: Date.now }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name:            { type: String, required: true, trim: true },
  email:           { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:        { type: String },          // undefined for Google-only accounts
  role:            { type: String, enum: ['admin', 'user', 'super_admin'], default: 'user' }, // Preserving role from existing system
  isBlocked:       { type: Boolean, default: false }, // Preserving from existing system
  blockReason:     { type: String, default: null },   // Preserving from existing system
  authProvider:    { type: String, enum: ['local', 'google'], default: 'local' },
  googleId:        { type: String, sparse: true },
  googleAccessToken:  { type: String },       // GSC read access token
  googleRefreshToken: { type: String },       // for silent token renewal
  avatar:             { type: String },       // Google profile pic URL
  isEmailVerified: { type: Boolean, default: false },
  websites:        [websiteSchema],
  removedWebsites: [removedWebsiteSchema],
  // Whether the user has answered the "import your Search Console properties?"
  // prompt. 'unset' means we have not asked yet, so nothing is synced silently.
  gscSyncPreference: { type: String, enum: ['unset', 'enabled', 'disabled'], default: 'unset' },
  lastLogin:       { type: Date, default: null }, // Preserving from existing system
  lastLoginIp:     { type: String, default: null },
  lastLoginCountry:{ type: String, default: null },
  loginCount:      { type: Number, default: 0 },   // Preserving from existing system
  createdAt:       { type: Date, default: Date.now },
  updatedAt:       { type: Date, default: Date.now }
}, { timestamps: true });

// Pre-save: hash password only for local accounts
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function(candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
