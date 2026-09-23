/**
 * contact-submit router
 *
 * Custom route added alongside the existing core `contact` router (routes/
 * contact.ts, untouched) — Strapi loads every file in routes/, so this adds
 * POST /api/contact/submit without touching the existing GET /api/contact
 * used for the section's CMS content.
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/contact/submit',
      handler: 'contact-submit.submit',
      config: {
        auth: false,
      },
    },
  ],
};
