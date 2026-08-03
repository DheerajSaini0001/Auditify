import mongoose from 'mongoose';
import { SUBMISSION_STATUS, DEFAULT_LOCALE } from '../../config/cmsConstants.js';

const formSubmissionSchema = new mongoose.Schema({
  form:    { type: mongoose.Schema.Types.ObjectId, ref: 'CmsFormDefinition', required: true },
  formKey: { type: String, required: true, lowercase: true, trim: true },
  data:    { type: mongoose.Schema.Types.Mixed, required: true },
  searchText: { type: String, default: '' },
  status:  { type: String, enum: SUBMISSION_STATUS, default: 'new' },
  spamScore: { type: Number, default: 0 },
  meta: {
    ipAddress: String,
    userAgent: String,
    referer:   String,
    locale:    { type: String, default: DEFAULT_LOCALE },
  },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  handledBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  notifiedAt:  { type: Date, default: null },
  // Submissions are PII, so retention is a first-class field rather than an
  // afterthought. Computed from the form's retentionDays at insert; null keeps
  // the row forever.
  expiresAt:   { type: Date, default: null },
  deletedAt:   { type: Date, default: null },
}, { timestamps: true, minimize: false });

formSubmissionSchema.index({ form: 1, createdAt: -1 }, { name: 'cms_sub_by_form' });
formSubmissionSchema.index({ status: 1, createdAt: -1 }, { name: 'cms_sub_by_status' });
formSubmissionSchema.index({ searchText: 'text' }, { name: 'cms_sub_text' });
formSubmissionSchema.index({ 'data.$**': 1 }, { name: 'cms_sub_data_wildcard' });
// Per-document TTL: expireAfterSeconds:0 means "expire at the date in this field".
formSubmissionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'cms_sub_retention_ttl' });

const CmsFormSubmission = mongoose.model('CmsFormSubmission', formSubmissionSchema, 'cms_form_submissions');

export default CmsFormSubmission;
