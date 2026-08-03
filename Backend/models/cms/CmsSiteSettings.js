import mongoose from 'mongoose';
import { seoSchema } from './subschemas.js';
import { DEFAULT_LOCALE } from '../../config/cmsConstants.js';

const socialLinkSchema = new mongoose.Schema({
  platform: { type: String, required: true, trim: true },
  url:      { type: String, required: true, trim: true },
  icon:     { type: String, trim: true, default: null }, // lucide component name
}, { _id: false });

// Deliberately NOT reused from configService: AppConfig/PlatformConfig store
// AES-encrypted single strings for server-side secrets. Site settings are public,
// structured, versioned and editor-facing — a different problem with a different
// security posture.
const settingsSchema = new mongoose.Schema({
  key:    { type: String, default: 'default', immutable: true },
  locale: { type: String, default: DEFAULT_LOCALE, lowercase: true, trim: true },

  site: {
    name:        { type: String, trim: true, default: '' },
    tagline:     { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    baseUrl:     { type: String, trim: true, default: '' },
  },
  brand: {
    logo:     { type: mongoose.Schema.Types.ObjectId, ref: 'CmsMedia', default: null },
    logoDark: { type: mongoose.Schema.Types.ObjectId, ref: 'CmsMedia', default: null },
    favicon:  { type: mongoose.Schema.Types.ObjectId, ref: 'CmsMedia', default: null },
    // Delivered as a CSS custom property, never as a Tailwind class — the JIT
    // scanner cannot see a class name assembled from database values.
    accentHex: { type: String, match: [/^#[0-9a-fA-F]{6}$/, 'accentHex must be a 6-digit hex colour'], default: '#EA580C' },
  },
  contact: {
    email:   { type: String, trim: true, default: '' },
    phone:   { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    hours:   { type: String, trim: true, default: '' },
  },
  social: { type: [socialLinkSchema], default: [] },
  seoDefaults: { type: seoSchema, default: () => ({}) },
  analytics: {
    ga4Id: { type: String, trim: true, default: '' },
    gtmId: { type: String, trim: true, default: '' },
  },
  features: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },

  // There is deliberately no scripts.head / scripts.bodyEnd field. Helmet's CSP
  // permits no 'unsafe-inline' and no 'unsafe-eval', so a CMS-injected inline
  // script would be silently blocked by the browser. Offering the field would be
  // offering a broken feature.

  version:   { type: Number, default: 1 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, minimize: false });

// Singleton-ness is enforced by a unique index on a defaulted immutable key, not
// by a "there can be only one" convention — a second insert fails with E11000.
settingsSchema.index({ key: 1, locale: 1 }, { unique: true, name: 'cms_settings_singleton' });

const CmsSiteSettings = mongoose.model('CmsSiteSettings', settingsSchema, 'cms_site_settings');

export default CmsSiteSettings;
