/**
 * contact-submit service
 *
 * Validates an enquiry and sends it via Strapi's core email plugin (see
 * config/plugins.ts for the provider). The recipient address is never
 * hardcoded — it comes from CONTACT_RECIPIENT_EMAIL, read here at request
 * time rather than baked into the config, so a missing/unset key fails
 * loudly per submission rather than needing a server restart to notice.
 */

import type { Core } from '@strapi/strapi';

export type ContactSubmissionInput = {
  name: string;
  company?: string;
  email: string;
  message: string;
};

export type SubmitResult = { ok: true } | { ok: false; status: number; error: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FIELD_LENGTH = 5000;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function validateSubmission(body: unknown): { ok: true; value: ContactSubmissionInput } | { ok: false; error: string } {
  const data = (body ?? {}) as Record<string, unknown>;
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const email = typeof data.email === 'string' ? data.email.trim() : '';
  const message = typeof data.message === 'string' ? data.message.trim() : '';
  const company = typeof data.company === 'string' ? data.company.trim() : '';

  if (!name) return { ok: false, error: 'Name is required.' };
  if (!email) return { ok: false, error: 'Email is required.' };
  if (!EMAIL_PATTERN.test(email)) return { ok: false, error: 'Email is not valid.' };
  if (!message) return { ok: false, error: 'Message is required.' };

  if (name.length > MAX_FIELD_LENGTH || email.length > MAX_FIELD_LENGTH || message.length > MAX_FIELD_LENGTH || company.length > MAX_FIELD_LENGTH) {
    return { ok: false, error: 'One of the fields is too long.' };
  }

  return { ok: true, value: { name, email, message, company: company || undefined } };
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async send(fields: ContactSubmissionInput): Promise<SubmitResult> {
    const recipient = process.env.CONTACT_RECIPIENT_EMAIL?.trim();
    if (!recipient) {
      strapi.log.error('Contact form submission received but CONTACT_RECIPIENT_EMAIL is not configured.');
      return { ok: false, status: 503, error: 'The contact form is not fully configured yet. Please try again later.' };
    }

    const subject = `New website enquiry from ${fields.name}${fields.company ? ` (${fields.company})` : ''}`;
    const text = [
      `Name: ${fields.name}`,
      fields.company ? `Company: ${fields.company}` : null,
      `Email: ${fields.email}`,
      '',
      'Message:',
      fields.message,
    ]
      .filter((line): line is string => line !== null)
      .join('\n');

    const html = [
      `<p><strong>Name:</strong> ${escapeHtml(fields.name)}</p>`,
      fields.company ? `<p><strong>Company:</strong> ${escapeHtml(fields.company)}</p>` : '',
      `<p><strong>Email:</strong> ${escapeHtml(fields.email)}</p>`,
      '<p><strong>Message:</strong></p>',
      `<p>${escapeHtml(fields.message).replace(/\n/g, '<br />')}</p>`,
    ].join('\n');

    try {
      await strapi.plugin('email').service('email').send({
        to: recipient,
        replyTo: fields.email,
        subject,
        text,
        html,
      });
      return { ok: true };
    } catch (err) {
      strapi.log.error('Failed to send contact enquiry email', err as Error);
      return { ok: false, status: 502, error: 'Could not send your message right now. Please try again in a moment.' };
    }
  },
});
