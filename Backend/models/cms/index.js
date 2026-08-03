import logger from '../../utils/logger.js';

import CmsContentType from './CmsContentType.js';
import CmsContentEntry from './CmsContentEntry.js';
import CmsRevision from './CmsRevision.js';
import CmsMedia from './CmsMedia.js';
import CmsMenu from './CmsMenu.js';
import CmsTerm from './CmsTerm.js';
import CmsSiteSettings from './CmsSiteSettings.js';
import CmsFormDefinition from './CmsFormDefinition.js';
import CmsFormSubmission from './CmsFormSubmission.js';

export {
  CmsContentType,
  CmsContentEntry,
  CmsRevision,
  CmsMedia,
  CmsMenu,
  CmsTerm,
  CmsSiteSettings,
  CmsFormDefinition,
  CmsFormSubmission,
};

const CMS_MODELS = [
  CmsContentType, CmsContentEntry, CmsRevision, CmsMedia,
  CmsMenu, CmsTerm, CmsSiteSettings, CmsFormDefinition, CmsFormSubmission,
];

// Mirrors the existing non-fatal index-sync hook in server.js. syncIndexes()
// DROPS indexes absent from the schema, which is safe here only because it is
// scoped per-model and every model in this list is new. Never add a pre-existing
// model to CMS_MODELS.
export async function syncCmsIndexes() {
  for (const Model of CMS_MODELS) {
    try {
      await Model.syncIndexes();
    } catch (err) {
      logger.error(`[CMS] Index sync failed for ${Model.modelName}`, err);
    }
  }
  logger.info(`[CMS] Index sync complete (${CMS_MODELS.length} collections)`);
}
