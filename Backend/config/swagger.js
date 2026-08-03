import swaggerJsdoc from 'swagger-jsdoc';

/**
 * OpenAPI spec built from the @openapi JSDoc blocks on the route files, so the docs
 * live next to the routes they describe and cannot drift into fiction the way a
 * hand-maintained spec does.
 */
export const buildSwaggerSpec = () => swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Site Audit API',
      version: '1.0.0',
      description:
        'Website audit engine + CMS-backed SEO management.\n\n'
        + 'Newer endpoints are mounted under /api/v1 and answer in the standard shape '
        + '`{ success, message, data }`. Legacy unversioned mounts (/api/auth, /single-audit, …) '
        + 'remain for the existing client and are migrating module by module.',
    },
    servers: [{ url: 'http://localhost:2000', description: 'Local' },
      { url: 'https://site-audit-backend.azurewebsites.net', description: 'Production' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    tags: [
      { name: 'System', description: 'Health and diagnostics' },
      { name: 'SEO', description: 'CMS-backed SEO management' },
    ],
  },
  apis: ['./modules/**/*.routes.js'],
});

export default buildSwaggerSpec;
