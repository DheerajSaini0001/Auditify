import mongoose from 'mongoose';
import { seoSchema } from './subschemas.js';
import { CONTENT_STATUS, DEFAULT_LOCALE } from '../../config/cmsConstants.js';

// Every entry of every type lives here — Pages, Posts, and anything a super_admin
// defines later. The hybrid: fields that EVERY type has and every list view
// queries are real typed, indexed columns; only genuinely type-specific fields
// go in the `data` bag.
const contentEntrySchema = new mongoose.Schema({
  contentType:    { type: mongoose.Schema.Types.ObjectId, ref: 'CmsContentType', required: true },
  contentTypeKey: { type: String, required: true, lowercase: true, trim: true, immutable: true },
  locale:         { type: String, default: DEFAULT_LOCALE, lowercase: true, trim: true },
  translationOf:  { type: mongoose.Schema.Types.ObjectId, ref: 'CmsContentEntry', default: null },

  // ── promoted columns ──
  title:         { type: String, required: true, trim: true, maxlength: 300 },
  slug:          { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
  excerpt:       { type: String, trim: true, maxlength: 600 },
  featuredImage: { type: mongoose.Schema.Types.ObjectId, ref: 'CmsMedia', default: null },
  seo:           { type: seoSchema, default: () => ({}) },

  // ── the dynamic bag: only type-specific fields ──
  data: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },

  // ── lifecycle ──
  status:           { type: String, enum: CONTENT_STATUS, default: 'draft', required: true },
  publishAt:        { type: Date, default: null },
  unpublishAt:      { type: Date, default: null },
  firstPublishedAt: { type: Date, default: null },

  // Working copy of an already-published entry: edits accumulate here so the
  // live version keeps serving until an explicit publish.
  draft:                 { type: mongoose.Schema.Types.Mixed, default: null },
  hasUnpublishedChanges: { type: Boolean, default: false },

  terms:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'CmsTerm' }],
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'CmsContentEntry', default: null },
  path:   { type: String, trim: true, lowercase: true, default: null }, // materialized: /about/team
  order:  { type: Number, default: 0 },

  // All three are required on purpose. Two incompatible req.user shapes exist in
  // this codebase — middleware/auth.js sets a plain { userId } with no _id, while
  // middleware/authMiddleware.js sets a full Mongoose document. Mixing them
  // writes undefined, and Mongoose SILENTLY OMITS the field. required:true turns
  // that silent corruption into a loud ValidationError on the first request.
  author:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, trim: true }, // denormalized — survives user deletion

  version:  { type: Number, default: 1 },
  lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  lockedAt: { type: Date, default: null },

  searchText: { type: String, default: '' }, // flattened searchable leaves of `data`
  deletedAt:  { type: Date, default: null },
  deletedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  // minimize:false keeps `data: {}` present rather than stripping it, so a $set
  // on data.x never has to create the parent object first.
}, { timestamps: true, minimize: false });

// 1. Slug uniqueness, scoped per type per locale, released by soft-delete.
//    partialFilterExpression on `deletedAt: null` matches both missing and
//    explicit null while excluding a real Date — verified against this Mongo.
contentEntrySchema.index(
  { contentTypeKey: 1, locale: 1, slug: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null }, name: 'cms_entry_slug_unique' });

// 2. Public list + admin filter + sort. ESR order: equality, then sort/range.
contentEntrySchema.index({ contentTypeKey: 1, locale: 1, status: 1, publishAt: -1 },
  { name: 'cms_entry_public_list' });

// 3. Scheduled-publish sweep.
contentEntrySchema.index({ status: 1, publishAt: 1 }, { name: 'cms_entry_scheduler' });

// 4. Admin default sort ("recently edited").
contentEntrySchema.index({ contentTypeKey: 1, updatedAt: -1 }, { name: 'cms_entry_admin_list' });

// 5. Author-role ownership scoping — mirrors the "if not privileged, narrow to
//    my userId" convention in controllers/aeoController.js.
contentEntrySchema.index({ author: 1, updatedAt: -1 }, { name: 'cms_entry_by_author' });

// 6. Category/tag archive pages (multikey).
contentEntrySchema.index({ terms: 1, status: 1, publishAt: -1 }, { name: 'cms_entry_by_term' });

// 7. Page tree.
contentEntrySchema.index({ parent: 1, order: 1 }, { name: 'cms_entry_tree' });

// 8. Trash view only — partial so it stays tiny.
contentEntrySchema.index({ deletedAt: 1 },
  { partialFilterExpression: { deletedAt: { $type: 'date' } }, name: 'cms_entry_trash' });

// 9. Search. One text index per collection is a hard Mongo limit, so this is it.
//    Deliberately NOT a wildcard text index: that would index the `draft` bag too,
//    leaking unpublished prose into public search results.
contentEntrySchema.index({ title: 'text', excerpt: 'text', searchText: 'text' },
  { weights: { title: 10, excerpt: 4, searchText: 1 }, name: 'cms_entry_text' });

// 10. The enabler: indexed filter/sort on any custom field, zero code changes.
contentEntrySchema.index({ 'data.$**': 1 }, { name: 'cms_entry_data_wildcard' });

// Mongoose does not track mutations inside a Mixed path: loading a doc, setting
// doc.data.seo.title and calling save() persists NOTHING, with no error. Writes
// should go through $set, but this marks the bags dirty as a second line of
// defence — at CMS write volume rewriting them is free.
contentEntrySchema.pre('save', function markMixedPaths(next) {
  if (!this.isNew) {
    this.markModified('data');
    if (this.draft) this.markModified('draft');
  }
  next();
});

const CmsContentEntry = mongoose.model('CmsContentEntry', contentEntrySchema, 'cms_content_entries');

export default CmsContentEntry;
