/**
 * Custom application submission route.
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/applications/submit',
      handler: 'application-submit.submit',
      config: {
        auth: false,
      },
    },
  ],
};
