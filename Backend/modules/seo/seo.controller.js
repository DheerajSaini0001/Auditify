import * as seoService from './seo.service.js';
import { sendSuccess, sendCreated, catchAsync } from '../../utils/apiResponse.js';

/**
 * Thin by design (architecture doc §3): parse the request, call the service, shape
 * the response. No business logic, no Mongoose import — a controller that needed
 * either would be a layering violation, and the acceptance checklist tests for it.
 *
 * Every handler is wrapped in catchAsync, so a rejection lands in the central error
 * handler instead of needing a try/catch here whose only job is next(err).
 */

const requestMeta = (req) => ({ ip: req.ip, userAgent: req.headers?.['user-agent'] });

export const getSummary = catchAsync(async (req, res) => {
  const data = await seoService.getSummary(req.user);
  return sendSuccess(res, data, 200, 'SEO summary computed.');
});

export const listPages = catchAsync(async (req, res) => {
  const data = await seoService.listPages(req.user, req.query);
  return sendSuccess(res, data, 200, 'Pages retrieved.');
});

export const getPage = catchAsync(async (req, res) => {
  const data = await seoService.getPage(req.user, req.params.id);
  return sendSuccess(res, data, 200, 'Page retrieved.');
});

export const createPage = catchAsync(async (req, res) => {
  const data = await seoService.createPage(req.user, req.body);
  return sendCreated(res, data, 'Page created.');
});

export const updatePageSeo = catchAsync(async (req, res) => {
  const data = await seoService.updatePageSeo(req.user, req.params.id, req.body.seo, requestMeta(req));
  return sendSuccess(res, data, 200, 'SEO settings saved.');
});

export const deletePage = catchAsync(async (req, res) => {
  const data = await seoService.deletePage(req.user, req.params.id, requestMeta(req));
  return sendSuccess(res, data, 200, 'Page deleted.');
});

export const listRevisions = catchAsync(async (req, res) => {
  const data = await seoService.listRevisions(req.user, req.params.id);
  return sendSuccess(res, data, 200, 'History retrieved.');
});

export const rollbackPage = catchAsync(async (req, res) => {
  const { id, version } = req.params;
  const data = await seoService.rollbackPage(req.user, id, version, requestMeta(req));
  return sendSuccess(res, data, 200, `Rolled back to version ${version}.`);
});

export const importRoutes = catchAsync(async (req, res) => {
  const data = await seoService.importRoutes(req.user, req.body.routes);
  const { created, skipped } = data;
  const message = `Imported ${created.length} page${created.length === 1 ? '' : 's'}`
    + `${skipped.length ? `, skipped ${skipped.length} already present` : ''}.`;
  return sendSuccess(res, data, 200, message);
});

export const getPublicPageMeta = catchAsync(async (req, res) => {
  const data = await seoService.getPublicPageMeta(req.query.path);
  return sendSuccess(res, data, 200, 'Page metadata retrieved.');
});
