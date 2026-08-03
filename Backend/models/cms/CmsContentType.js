import mongoose from 'mongoose';
import { fieldDefinitionSchema } from './subschemas.js';

// The registry. This is what makes "add a Products type" a data operation rather
// than a code change: a new row here defines a new content type, and every entry
// of it lives in the shared CmsContentEntry collection.
const contentTypeSchema = new mongoose.Schema({
  key: {
    type: String, required: true, unique: true, lowercase: true, trim: true,
    // Load-bearing: CmsContentEntry denormalizes contentTypeKey so list queries
    // hit an index without resolving key -> ObjectId first, and so the slug
    // uniqueness index is scoped by a human-readable value. Denormalization is
    // only safe because the source can never change. Renaming the display name
    // is free; renaming the key is not offered.
    immutable: true,
    match: [/^[a-z][a-z0-9-]{1,39}$/, 'Type key must be lowercase kebab-case'],
  },
  name:        { type: String, required: true, trim: true },  // "Blog Post"
  namePlural:  { type: String, required: true, trim: true },  // "Blog Posts"
  description: { type: String, trim: true },
  icon:        { type: String, trim: true, default: 'FileText' }, // lucide component name
  kind:        { type: String, enum: ['collection', 'singleton'], default: 'collection' },
  isSystem:    { type: Boolean, default: false },  // page/post: undeletable
  routePrefix: { type: String, trim: true, lowercase: true, default: '' }, // '/blog'

  // These do not change storage — every entry has all the promoted columns
  // regardless. They drive which controls the editor renders and which
  // validations the service applies, so flipping one on later needs no migration.
  supports: {
    slug:          { type: Boolean, default: true },
    seo:           { type: Boolean, default: true },
    revisions:     { type: Boolean, default: true },
    scheduling:    { type: Boolean, default: true },
    excerpt:       { type: Boolean, default: false },
    featuredImage: { type: Boolean, default: false },
    hierarchy:     { type: Boolean, default: false }, // Pages: parent/path
    ordering:      { type: Boolean, default: false }, // manual drag order
    author:        { type: Boolean, default: true },
  },

  taxonomies:  { type: [String], default: [] }, // ['category','tag'] — CmsTerm.taxonomy keys
  slugSource:  { type: String, default: 'title', trim: true },
  fields:      { type: [fieldDefinitionSchema], default: [] },
  listColumns: { type: [String], default: ['title', 'status', 'updatedAt'] },
  defaultSort: { type: String, default: '-updatedAt' },

  status:    { type: String, enum: ['active', 'archived'], default: 'active' },
  version:   { type: Number, default: 1 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

contentTypeSchema.index({ status: 1, name: 1 });

const CmsContentType = mongoose.model('CmsContentType', contentTypeSchema, 'cms_content_types');

export default CmsContentType;
