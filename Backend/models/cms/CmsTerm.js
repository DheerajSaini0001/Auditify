import mongoose from 'mongoose';
import { seoSchema } from './subschemas.js';
import { DEFAULT_LOCALE, COLOR_KEYS } from '../../config/cmsConstants.js';

// Category and Tag are ONE model discriminated by `taxonomy`, not two hardcoded
// models. The premise of the whole subsystem is that a super_admin can add a
// Products type without code changes — and the first thing they will want is a
// "Product Category" taxonomy. Two hardcoded models cannot deliver that; a
// registry can. CmsContentType.taxonomies declares which a type uses, mirroring
// the ContentType/ContentEntry split one level down.
const termSchema = new mongoose.Schema({
  taxonomy: { type: String, required: true, lowercase: true, trim: true, immutable: true },
  locale:   { type: String, default: DEFAULT_LOCALE, lowercase: true, trim: true },
  name:     { type: String, required: true, trim: true, maxlength: 160 },
  slug:     { type: String, required: true, lowercase: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 1000 },
  colorKey: { type: String, enum: COLOR_KEYS, default: null },
  icon:     { type: String, trim: true, default: null },
  image:    { type: mongoose.Schema.Types.ObjectId, ref: 'CmsMedia', default: null },

  // Hierarchy is optional per taxonomy: Category uses parent/ancestors, Tag
  // leaves them null. The materialized `ancestors` array makes "all posts in this
  // category or any descendant" a single indexed multikey query rather than a
  // recursive walk.
  parent:    { type: mongoose.Schema.Types.ObjectId, ref: 'CmsTerm', default: null },
  ancestors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CmsTerm' }],
  order:     { type: Number, default: 0 },
  seo:       { type: seoSchema, default: () => ({}) },
  // Denormalized counter maintained on publish/unpublish: archive pages need it
  // on every render, and countDocuments per term per page load is not acceptable.
  entryCount: { type: Number, default: 0 },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

termSchema.index({ taxonomy: 1, locale: 1, slug: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null }, name: 'cms_term_slug_unique' });
termSchema.index({ taxonomy: 1, parent: 1, order: 1 }, { name: 'cms_term_tree' });
termSchema.index({ ancestors: 1 }, { name: 'cms_term_ancestors' });

const CmsTerm = mongoose.model('CmsTerm', termSchema, 'cms_terms');

export default CmsTerm;
