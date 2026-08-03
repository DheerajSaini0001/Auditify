import mongoose from 'mongoose';
import { CmsContentEntry, CmsContentType, CmsRevision } from '../../models/cms/index.js';
import User from '../../models/User.js';

/**
 * The ONLY layer permitted to import a model or write a Mongoose query
 * (architecture doc §3). Everything here is a data access primitive: no branching
 * on business rules, no scoring, no permission decisions — those belong in the
 * service, which is why this file has no idea what a "score" or a "role" is.
 *
 * Callers pass an explicit `scope` object. Ownership scoping is a business rule the
 * service owns; the repository just applies whatever filter it is handed.
 */

export const isValidId = (id) => mongoose.isValidObjectId(id);

export const findPageType = () => CmsContentType.findOne({ key: 'page' });

export const createPageType = (payload) => CmsContentType.create(payload);

export const findEntries = (scope, { sort = { updatedAt: -1 }, skip = 0, limit = 25, select } = {}) =>
  CmsContentEntry.find(scope).select(select).sort(sort).skip(skip).limit(limit).lean();

export const countEntries = (scope) => CmsContentEntry.countDocuments(scope);

export const findAllForSummary = (scope) =>
  CmsContentEntry.find(scope).select('title slug path status seo updatedAt').lean();

/** Returns a hydrated document — the service needs to mutate and save it. */
export const findEntryDoc = (id, scope) => CmsContentEntry.findOne({ _id: id, ...scope });

export const findEntryLean = (id, scope) => CmsContentEntry.findOne({ _id: id, ...scope }).lean();

export const findEntryBySlug = (contentTypeKey, slug) =>
  CmsContentEntry.findOne({ contentTypeKey, slug, deletedAt: null }).select('_id').lean();

/** Published-only lookup for the public metadata endpoint. */
export const findPublishedByPath = (path, slug) =>
  CmsContentEntry.findOne({
    deletedAt: null,
    status: 'published',
    $or: [{ path }, { slug }],
  }).select('title excerpt seo path slug').lean();

export const createEntry = (payload) => CmsContentEntry.create(payload);

export const saveEntry = (doc) => doc.save();

export const findLatestRevision = (entityId) =>
  CmsRevision.findOne({ entityType: 'entry', entityId }).sort({ version: -1 }).select('version').lean();

export const findRevision = (entityId, version) =>
  CmsRevision.findOne({ entityType: 'entry', entityId, version }).lean();

export const listRevisionsFor = (entityId, limit = 50) =>
  CmsRevision.find({ entityType: 'entry', entityId })
    .select('version action changedByName createdAt sizeBytes restoredFromVersion snapshot.seo.title')
    .sort({ version: -1 })
    .limit(limit)
    .lean();

export const createRevision = (payload) => CmsRevision.create(payload);

export const findUserName = (userId) => User.findById(userId).select('name email').lean();

export default {
  isValidId, findPageType, createPageType, findEntries, countEntries, findAllForSummary,
  findEntryDoc, findEntryLean, findEntryBySlug, findPublishedByPath, createEntry, saveEntry,
  findLatestRevision, findRevision, listRevisionsFor, createRevision, findUserName,
};
