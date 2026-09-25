// Base URL of the Strapi CMS backend. Set VITE_STRAPI_URL at build time
// (e.g. on the Railway frontend service) to point at the deployed backend.
export const STRAPI_URL = (import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337').replace(/\/+$/, '')
