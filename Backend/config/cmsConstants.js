// Single source of truth for every CMS enum. One file so the literal lists can
// never drift apart — the failure mode already latent between
// controllers/adminController.js (ASSIGNABLE_ROLES) and routes/adminRoutes.js
// (body('role').isIn([...])), which declare the same set in two places.

export const DEFAULT_LOCALE = 'en';

// Editorial states stay lowercase, matching models/singleAuditReport.js.
export const CONTENT_STATUS = ['draft', 'scheduled', 'published', 'archived'];
export const LIVE_STATUS = ['published', 'scheduled'];

export const FIELD_TYPES = [
  'text', 'textarea', 'richtext', 'markdown', 'number', 'boolean',
  'date', 'datetime', 'select', 'multiselect', 'radio', 'checkbox',
  'media', 'gallery', 'file', 'relation', 'taxonomy',
  'url', 'email', 'slug', 'color', 'icon', 'json', 'group', 'repeater',
];

// A colour field stores the KEY, never a class or a hex value. Tailwind's JIT
// only sees literals present in the source, so a class name assembled at runtime
// from CMS data would never be generated.
export const COLOR_KEYS = ['orange', 'blue', 'purple', 'red', 'cyan', 'amber', 'indigo'];

export const REVISION_ENTITIES = ['entry', 'contentType', 'menu', 'term', 'settings', 'form'];

// UPPER_SNAKE to match the audit-log convention in models/ActivityLog.js and
// models/ConfigAuditLog.js.
export const REVISION_ACTIONS = [
  'CREATE', 'UPDATE', 'PUBLISH', 'UNPUBLISH', 'SCHEDULE',
  'ROLLBACK', 'RESTORE', 'AUTOSAVE', 'DELETE',
];

export const MEDIA_BACKENDS = ['gridfs', 'azure_blob', 's3', 'local', 'external'];
export const SUBMISSION_STATUS = ['new', 'read', 'replied', 'spam', 'archived'];

// Slugs that would shadow a real route. AppContent.jsx registers a flat <Routes>
// with a catch-all, so a page published at one of these would be unreachable.
export const RESERVED_SLUGS = [
  'admin', 'api', 'login', 'register', 'dashboard', 'logout', 'auth',
  'about', 'services', 'contact', 'documentation', 'help',
  'privacy', 'terms', 'cookies', 'do-not-sell',
  'new', 'edit', 'create', 'delete', 'preview', 'assets', 'static',
];

export const AUTOSAVE_TTL_SECONDS = 7 * 24 * 60 * 60;
