import mongoose from 'mongoose';
import { FIELD_TYPES, COLOR_KEYS } from '../../config/cmsConstants.js';

// SEO block attached to every entry. The maxlengths are the SERP truncation
// points, and the shape matches what Component/CanonicalTag.jsx already consumes
// ({ path, title, description }) so a CMS lookup can be added there as a first
// branch with the existing SEO_CONFIGS left intact as the fallback.
// A single applied JSON-LD block. `structuredData` below still holds one free-form
// object; this array is the typed, toggleable form — a page usually needs several
// (Organization AND BreadcrumbList AND FAQPage), which one Mixed field cannot express.
const schemaBlockSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Organization', 'WebSite', 'FAQPage', 'Article', 'Product', 'BreadcrumbList',
      'Review', 'VideoObject', 'Person', 'Event', 'LocalBusiness'],
    required: true,
  },
  jsonLd:      { type: mongoose.Schema.Types.Mixed, default: {} },
  isActive:    { type: Boolean, default: true },
  generatedBy: { type: String, enum: ['manual', 'ai'], default: 'manual' },
}, { _id: true, timestamps: true });

export const seoSchema = new mongoose.Schema({
  title:        { type: String, trim: true, maxlength: 70 },
  description:  { type: String, trim: true, maxlength: 200 },
  keywords:     { type: [String], default: undefined },
  canonicalUrl: { type: String, trim: true },
  noIndex:      { type: Boolean, default: false },
  noFollow:     { type: Boolean, default: false },
  ogTitle:       { type: String, trim: true, maxlength: 95 },
  ogDescription: { type: String, trim: true, maxlength: 200 },
  ogImage:       { type: mongoose.Schema.Types.ObjectId, ref: 'CmsMedia', default: null },
  ogType:        { type: String, trim: true, default: 'website' },
  twitterCard:   { type: String, enum: ['summary', 'summary_large_image'], default: 'summary_large_image' },
  structuredData: { type: mongoose.Schema.Types.Mixed, default: null }, // JSON-LD

  // Per-page keyword work. `keywords` above stays the flat list the head tag is
  // built from; this is the analysis around it. primaryKeyword mirrors keywords[0]
  // and the controller keeps the two in step, so neither can silently disagree.
  keywordSeo: {
    primaryKeyword:    { type: String, trim: true, default: '' },
    secondaryKeywords: { type: [String], default: [] },
    relatedKeywords:   { type: [String], default: [] },
    density:           { type: Number, default: 0, min: 0, max: 100 },
    position:          { type: Number, default: 0 },
    searchIntent: {
      type: String,
      enum: ['informational', 'navigational', 'transactional', 'commercial', ''],
      default: '',
    },
    // Derived server-side on every save — never accepted from the client.
    presence: {
      title:       { type: Boolean, default: false },
      description: { type: Boolean, default: false },
      slug:        { type: Boolean, default: false },
      excerpt:     { type: Boolean, default: false },
    },
  },

  schemas: { type: [schemaBlockSchema], default: [] },

  advanced: {
    // Alternate-language versions of this page.
    hreflang: { type: [{ _id: false, lang: String, url: String }], default: [] },
    language: { type: String, trim: true, default: 'en' },
    pageRedirect: {
      type:   { type: Number, enum: [301, 302, null], default: null },
      target: { type: String, trim: true, default: '' },
    },
    // SECURITY: raw script text is stored but MUST NOT be injected into the DOM.
    // Rendering these would be stored XSS with an author-supplied payload. Nothing
    // reads them today; the CSP in server.js (script-src 'self') is the second line
    // of defence. If a future change ever renders them, that change owns the problem
    // and needs sanitisation plus a narrowed write path — writes are already
    // restricted to super_admin.
    headerScripts: { type: String, default: '' },
    footerScripts: { type: String, default: '' },
  },
}, { _id: false });

const validationRuleSchema = new mongoose.Schema({
  min: Number, max: Number, step: Number,
  minLength: Number, maxLength: Number,
  minItems: Number, maxItems: Number,
  // Length-capped deliberately: this pattern is author-supplied and compiled at
  // validation time, so an unbounded regex is a ReDoS vector.
  pattern:        { type: String, maxlength: 200 },
  patternMessage: { type: String, trim: true },
  accept:         { type: [String], default: undefined }, // mime allowlist for media fields
  maxFileSize:    Number,
}, { _id: false });

const fieldOptionSchema = new mongoose.Schema({
  label:    { type: String, required: true, trim: true },
  value:    { type: String, required: true, trim: true },
  colorKey: { type: String, enum: COLOR_KEYS, default: undefined },
}, { _id: false });

// The single most reused piece of the design: both CmsContentType.fields and
// CmsFormDefinition.fields are built from this. Custom content types and custom
// forms are the same problem, so they share one solution.
export const fieldDefinitionSchema = new mongoose.Schema({
  key: {
    type: String, required: true, trim: true,
    match: [/^[a-z][a-zA-Z0-9_]{0,39}$/, 'Field key must start with a lowercase letter, camelCase, max 40 chars'],
  },
  label:       { type: String, required: true, trim: true },
  type:        { type: String, enum: FIELD_TYPES, required: true },
  helpText:    { type: String, trim: true },
  placeholder: { type: String, trim: true },
  required:    { type: Boolean, default: false },
  unique:      { type: Boolean, default: false },  // service-enforced, deliberately not an index
  searchable:  { type: Boolean, default: false },  // contributes to entry.searchText
  localized:   { type: Boolean, default: false },
  defaultValue: { type: mongoose.Schema.Types.Mixed, default: undefined },
  validation:  { type: validationRuleSchema, default: () => ({}) },
  options:     { type: [fieldOptionSchema], default: undefined }, // select/radio/multiselect
  relation: {
    contentTypeKey: { type: String, trim: true, lowercase: true },
    taxonomy:       { type: String, trim: true, lowercase: true },
    many:           { type: Boolean, default: false },
  },
  group:  { type: String, trim: true, default: 'Content' }, // editor tab/fieldset
  order:  { type: Number, default: 0 },
  width:  { type: String, enum: ['full', 'half', 'third'], default: 'full' },
  showIf: {
    field:  { type: String, trim: true },
    equals: { type: mongoose.Schema.Types.Mixed, default: undefined },
  },
}, { _id: false });

// Self-reference, so a 'group' or 'repeater' field can nest further fields.
fieldDefinitionSchema.add({ fields: [fieldDefinitionSchema] });
