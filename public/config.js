/**
 * Runtime frontend configuration.
 *
 * Loaded before the app script, so the same static build works in every
 * environment without a rebuild.
 *
 * Local development (backend serves this page): leave apiBaseUrl empty and the
 * app talks to the same origin at /api/v1.
 *
 * Vercel: set apiBaseUrl to your Render backend URL, e.g.
 *   apiBaseUrl: 'https://cee-nepal-backend.onrender.com'
 * The trailing /api/v1 is appended automatically.
 */
window.__CEE_CONFIG__ = {
  apiBaseUrl: ''
};
