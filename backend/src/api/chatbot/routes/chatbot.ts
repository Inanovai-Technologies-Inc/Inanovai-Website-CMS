/**
 * chatbot router
 *
 * Custom route, not backed by a content type — there is nothing to manage
 * in the admin panel, so this folder intentionally has no content-types
 * subfolder. `auth: false` makes it public without needing a Users &
 * Permissions role toggle (that toggle only applies to core CRUD routers).
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/chatbot',
      handler: 'chatbot.sendMessage',
      config: {
        auth: false,
      },
    },
  ],
};
