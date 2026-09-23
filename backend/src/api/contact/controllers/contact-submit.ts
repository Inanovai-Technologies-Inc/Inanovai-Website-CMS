/**
 * contact-submit controller
 */

import type { Core } from '@strapi/strapi';
import { validateSubmission } from '../services/contact-submit';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async submit(ctx: any) {
    const validation = validateSubmission(ctx.request.body);

    if (!validation.ok) {
      ctx.status = 400;
      ctx.body = { error: validation.error };
      return;
    }

    const result = await strapi.service('api::contact.contact-submit').send(validation.value);

    if (!result.ok) {
      ctx.status = result.status;
      ctx.body = { error: result.error };
      return;
    }

    ctx.status = 200;
    ctx.body = { success: true };
  },
});
