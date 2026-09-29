/**
 * contact-submit service
 *
 * Stores an enquiry, then notifies the team via Strapi's core email plugin
 * (see config/plugins.ts for the provider) and raises a Frappe lead. The
 * record is written first and deliberately survives a failed notification, so
 * an outage downgrades to "we have it but nobody was paged" rather than
 * losing the enquiry outright.
 *
 * The recipient address is never hardcoded — it comes from
 * CONTACT_RECIPIENT_EMAIL, read here at request time rather than baked into
 * the config, so a missing/unset key fails loudly per submission rather than
 * needing a server restart to notice.
 */

import type { Core } from '@strapi/strapi';
import { createFrappeLead } from '../../../services/frappe';

export type ContactSubmissionInput = {
  name: string;
  company?: string;
  email: string;
  message: string;
};

export type SubmitResult =
  | { ok: true }
  | {
      ok: false;
      status: number;
      error: string;
      // Set when the enquiry is safely stored and only the notification failed,
      // so the caller can tell the visitor their message was not lost.
      saved?: boolean;
      notificationFailed?: boolean;
      submissionId?: string | number;
    };

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
    // Store the enquiry before attempting delivery. Sending is the step that
    // actually fails in practice, and an enquiry that only ever existed as an
    // email is gone for good the moment it does — the record is what makes a
    // mail outage recoverable instead of silent data loss.
    let submission: { id: number; documentId?: string };
    try {
      submission = await strapi.entityService.create('api::contact-submission.contact-submission', {
        data: {
          name: fields.name,
          email: fields.email,
          company: fields.company || undefined,
          message: fields.message,
          statuses: 'new',
          notified: false,
          submittedAt: new Date(),
        },
      }) as { id: number; documentId?: string };
    } catch (error) {
      strapi.log.error('Failed to save contact enquiry', error as Error);
      return { ok: false, status: 500, error: 'Could not save your message right now. Please try again in a moment.' };
    }

    const submissionId = submission.documentId ?? submission.id;

    const recipient = process.env.CONTACT_RECIPIENT_EMAIL?.trim();
    if (!recipient) {
      strapi.log.error(`Contact enquiry ${submissionId} saved but CONTACT_RECIPIENT_EMAIL is not configured.`);
      return {
        ok: false,
        status: 502,
        error: 'Your message was saved, but the notification could not be sent.',
        saved: true,
        notificationFailed: true,
        submissionId,
      };
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
    } catch (err) {
      strapi.log.error(`Contact enquiry ${submissionId} saved but notification email failed`, err as Error);
      return {
        ok: false,
        status: 502,
        error: 'Your message was saved, but the notification could not be sent.',
        saved: true,
        notificationFailed: true,
        submissionId,
      };
    }

    try {
      await strapi.entityService.update('api::contact-submission.contact-submission', submission.id, {
        data: { notified: true },
      });
    } catch (error) {
      // The enquiry is stored and the team has been emailed; failing to flip
      // this flag is a bookkeeping problem, not a reason to report failure.
      strapi.log.warn(`Contact enquiry ${submissionId} was emailed but could not be marked as notified.`);
    }

    const frappeResult = await createFrappeLead({
      name: fields.name,
      email: fields.email,
      company: fields.company,
      leadOwner: process.env.FRAPPE_LEAD_ASSIGNEE?.trim() ?? '',
    });

    if (!frappeResult.ok) {
      const logMessage = frappeResult.skipped
        ? 'Contact enquiry email sent, but Frappe Lead creation was skipped because the integration is not fully configured.'
        : `Contact enquiry email sent, but Frappe Lead creation failed${frappeResult.status ? ` with status ${frappeResult.status}` : ''}.`;
      strapi.log.warn(logMessage);
      if (!frappeResult.skipped) strapi.log.error(frappeResult.error ?? 'Frappe Lead creation failed.');
    }

    return { ok: true };
  },
});
