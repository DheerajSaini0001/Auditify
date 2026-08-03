import mongoose from 'mongoose';
import { MEDIA_BACKENDS } from '../../config/cmsConstants.js';

const mediaVariantSchema = new mongoose.Schema({
  label: { type: String, required: true }, // 'thumb' | 'medium' | 'large'
  width: Number,
  height: Number,
  sizeBytes: Number,
  storageKey: String,
  url: String,
}, { _id: false });

// Deliberately storage-agnostic: the backend choice is isolated to the
// `storage` + `storageKey` pair, so moving to Azure Blob later is a per-document
// backfill and a config flip, not a schema change.
//
// Default is gridfs. The API runs as a container on Azure App Service, where the
// local filesystem is ephemeral and not shared across instances — 'local' would
// lose every upload on restart or scale-out. GridFS needs no new infrastructure
// (Mongo is already the durable store) and it streams, which sidesteps the 5mb
// express.json cap rather than working around it.
const mediaSchema = new mongoose.Schema({
  filename:     { type: String, required: true, trim: true },
  originalName: { type: String, required: true, trim: true },
  mimeType:     { type: String, required: true, trim: true, lowercase: true },
  ext:          { type: String, trim: true, lowercase: true },
  kind:         { type: String, enum: ['image', 'video', 'audio', 'document', 'other'], required: true },
  sizeBytes:    { type: Number, required: true },
  width:  { type: Number, default: null },
  height: { type: Number, default: null },
  durationMs: { type: Number, default: null },
  checksum: { type: String, required: true, lowercase: true, trim: true }, // sha256

  storage:    { type: String, enum: MEDIA_BACKENDS, required: true, default: 'gridfs' },
  storageKey: { type: String, default: null }, // GridFS file id / blob path / S3 key
  url:        { type: String, default: null }, // set when externally served
  variants:   { type: [mediaVariantSchema], default: [] },
  blurhash:   { type: String, default: null },

  alt:     { type: String, trim: true, maxlength: 300 },
  caption: { type: String, trim: true, maxlength: 600 },
  credit:  { type: String, trim: true },
  folder:  { type: String, trim: true, lowercase: true, default: '/' },
  tags:    { type: [String], default: [] },

  usageCount: { type: Number, default: 0 },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deletedAt:  { type: Date, default: null },
}, { timestamps: true });

// Unique-per-live checksum gives free dedupe: re-uploading the same logo returns
// the existing document instead of a duplicate. Soft-deleted rows escape the
// partial index, so a re-upload after deletion still works.
mediaSchema.index({ checksum: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null }, name: 'cms_media_dedupe' });
mediaSchema.index({ folder: 1, createdAt: -1 }, { name: 'cms_media_browse' });
mediaSchema.index({ kind: 1, createdAt: -1 }, { name: 'cms_media_by_kind' });
mediaSchema.index({ tags: 1 }, { name: 'cms_media_tags' });
mediaSchema.index({ originalName: 'text', alt: 'text', caption: 'text', tags: 'text' },
  { weights: { originalName: 8, alt: 5, caption: 3, tags: 2 }, name: 'cms_media_text' });

const CmsMedia = mongoose.model('CmsMedia', mediaSchema, 'cms_media');

export default CmsMedia;
