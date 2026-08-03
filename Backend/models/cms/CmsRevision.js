import mongoose from 'mongoose';
import {
  REVISION_ENTITIES,
  REVISION_ACTIONS,
  AUTOSAVE_TTL_SECONDS,
} from '../../config/cmsConstants.js';

// Modelled on models/ConfigVersion.js + models/ConfigAuditLog.js, merged into one
// collection: for content the snapshot and the audit row have identical
// cardinality, so splitting them would just double the writes.
const revisionSchema = new mongoose.Schema({
  entityType:     { type: String, enum: REVISION_ENTITIES, required: true },
  entityId:       { type: mongoose.Schema.Types.ObjectId, required: true },
  contentTypeKey: { type: String, lowercase: true, trim: true, default: null },
  version:        { type: Number, required: true },
  // Snapshots are full, not diffs. Diffing a Mixed bag whose shape a super_admin
  // can change underneath you is a correctness problem nobody needs. Documents
  // stay small because media is referenced, never embedded.
  snapshot:       { type: mongoose.Schema.Types.Mixed, required: true },
  action:         { type: String, enum: REVISION_ACTIONS, required: true },
  changeReason:   { type: String, trim: true, maxlength: 500 },
  isAutosave:     { type: Boolean, default: false },
  restoredFromVersion: { type: Number, default: null },
  changedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Denormalized on purpose. adminController.js deletes a user's ActivityLog rows
  // when the account is removed; a content audit trail must outlive its author,
  // so the display name is captured at write time and populate() returning null
  // must not blank the history UI.
  changedByName:  { type: String, trim: true, required: true },
  ipAddress:      { type: String },
  userAgent:      { type: String },
  sizeBytes:      { type: Number, default: 0 },
  createdAt:      { type: Date, default: Date.now },
}, { timestamps: false }); // hand-rolled createdAt, matching ActivityLog.js

// This unique is how version allocation stays crash-safe WITHOUT transactions —
// the deployment is a standalone Mongo, so there are none. ConfigVersion.js has
// the same compound index but not unique, so two concurrent writers there can
// both compute max+1 and both succeed, producing two v7s. Here the database
// rejects the second and the service retries with version+1.
revisionSchema.index({ entityType: 1, entityId: 1, version: -1 },
  { unique: true, name: 'cms_rev_version_unique' });
revisionSchema.index({ entityType: 1, entityId: 1, createdAt: -1 }, { name: 'cms_rev_timeline' });
revisionSchema.index({ changedBy: 1, createdAt: -1 }, { name: 'cms_rev_by_user' });

// Autosaves self-prune. Declared standalone rather than as a field-level
// `expires` so syncIndexes() can migrate a changed TTL later.
revisionSchema.index({ createdAt: 1 }, {
  expireAfterSeconds: AUTOSAVE_TTL_SECONDS,
  partialFilterExpression: { isAutosave: true },
  name: 'cms_rev_autosave_ttl',
});

const CmsRevision = mongoose.model('CmsRevision', revisionSchema, 'cms_revisions');

export default CmsRevision;
