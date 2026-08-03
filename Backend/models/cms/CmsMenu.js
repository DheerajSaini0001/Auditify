import mongoose from 'mongoose';
import { DEFAULT_LOCALE } from '../../config/cmsConstants.js';

const menuItemSchema = new mongoose.Schema({
  label:  { type: String, required: true, trim: true, maxlength: 120 },
  type:   {
    type: String,
    enum: ['internal', 'external', 'entry', 'term', 'heading', 'divider'],
    required: true,
    default: 'internal',
  },
  url:    { type: String, trim: true, default: null },
  entry:  { type: mongoose.Schema.Types.ObjectId, ref: 'CmsContentEntry', default: null },
  term:   { type: mongoose.Schema.Types.ObjectId, ref: 'CmsTerm', default: null },
  target: { type: String, enum: ['_self', '_blank'], default: '_self' },
  rel:    { type: String, trim: true, default: null },
  icon:   { type: String, trim: true, default: null }, // lucide component name
  // Preserves per-link gating — the footer's "My Reports" link is rendered only
  // when authenticated, and migrating it to a CMS menu without this would
  // silently expose it to guests.
  visibility: { type: String, enum: ['always', 'guest', 'authenticated', 'role'], default: 'always' },
  roles:  { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
  // _id retained (verified preserved 3 levels deep): the drag-and-drop library
  // needs stable keys and menu items have no natural key.
}, { _id: true });

menuItemSchema.add({ children: { type: [menuItemSchema], default: [] } });

const menuSchema = new mongoose.Schema({
  key:    { type: String, required: true, lowercase: true, trim: true, immutable: true },
  locale: { type: String, default: DEFAULT_LOCALE, lowercase: true, trim: true },
  name:   { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  isSystem: { type: Boolean, default: false },
  maxDepth: { type: Number, default: 3, min: 1, max: 5 },
  // Ordering is array position, not an `order` integer. A drag-reorder produces a
  // whole new tree and the API replaces `items` wholesale in one atomic
  // single-document write — no renumbering pass, no gap handling, and (given
  // there are no transactions) no partial-failure state where half the items
  // took their new order.
  items:  { type: [menuItemSchema], default: [] },
  version: { type: Number, default: 1 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

menuSchema.index({ key: 1, locale: 1 }, { unique: true, name: 'cms_menu_key_unique' });

const CmsMenu = mongoose.model('CmsMenu', menuSchema, 'cms_menus');

export default CmsMenu;
