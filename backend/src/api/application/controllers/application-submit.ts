/**
 * Custom application submission controller.
 */

import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async submit(ctx: any) {
    const result = await strapi.service('api::application.application-submit').submit({
      body: ctx.request.body,
      files: ctx.request.files,
    });

    ctx.status = result.status;
    ctx.body = result.body;
  },
});
