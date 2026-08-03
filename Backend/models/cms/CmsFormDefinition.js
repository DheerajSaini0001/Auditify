import mongoose from 'mongoose';
import { fieldDefinitionSchema } from './subschemas.js';

// fields reuses fieldDefinitionSchema UNCHANGED. That reuse is the clearest
// evidence the registry abstraction is the right one: a custom content type and
// a custom form are the same problem.
const formDefinitionSchema = new mongoose.Schema({
  key:  { type: String, required: true, unique: true, lowercase: true, trim: true, immutable: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  fields: { type: [fieldDefinitionSchema], default: [] },

  submitLabel:    { type: String, trim: true, default: 'Submit' },
  successMessage: { type: String, trim: true, default: 'Thanks — we will be in touch.' },
  redirectUrl:    { type: String, trim: true, default: null },

  storeSubmissions: { type: Boolean, default: true },
  retentionDays:    { type: Number, default: 0 }, // 0 = keep forever

  notify: {
    enabled:     { type: Boolean, default: false },
    recipients:  { type: [String], default: [] },
    subject:     { type: String, trim: true },
    replyToField: { type: String, default: null },
  },
  spam: {
    honeypotField:    { type: String, default: 'website_url' },
    recaptcha:        { type: Boolean, default: false },
    minSubmitSeconds: { type: Number, default: 3 },
  },

  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  submissionCount: { type: Number, default: 0 },
  version: { type: Number, default: 1 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const CmsFormDefinition = mongoose.model('CmsFormDefinition', formDefinitionSchema, 'cms_form_definitions');

export default CmsFormDefinition;
