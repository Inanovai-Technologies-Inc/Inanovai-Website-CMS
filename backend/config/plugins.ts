import type { Core } from '@strapi/strapi';
import { createResendTransport } from '../src/services/resend-transport';

const allowedMediaTypes = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.*',
  'text/plain',
  'text/csv',
];

const deniedTypes = [
  'image/svg+xml',
  'application/vnd.microsoft.portable-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-dosexec',
  'application/x-sh',
  'text/x-shellscript',
  'application/x-mach-binary',
];

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  'users-permissions': {
    config: {
      jwtManagement: 'refresh',
      sessions: {
        httpOnly: true,
      },
    },
  },
  upload: {
    config: {
      security: {
        allowedTypes: allowedMediaTypes,
        deniedTypes,
      },
    },
  },
  // No provider was configured before this — Strapi's unconfigured default
  // ("sendmail") needs a local MTA binary and isn't viable for actually
  // delivering mail here. Credentials live entirely in .env; nothing
  // is hardcoded.
  //
  // Railway blocks outbound SMTP on this plan (25/465/587/2525 all time out,
  // to every provider), so production has to deliver over HTTPS. Setting
  // RESEND_API_KEY swaps nodemailer's SMTP socket for Resend's API while
  // leaving the rest of the email plugin untouched. Local development has no
  // such restriction, so it keeps using SMTP when that key is absent.
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: env('RESEND_API_KEY')
        ? createResendTransport({ apiKey: env('RESEND_API_KEY')! })
        : {
            host: env('SMTP_HOST'),
            port: env.int('SMTP_PORT', 587),
            secure: env.bool('SMTP_SECURE', false),
            auth: {
              user: env('SMTP_USERNAME'),
              pass: env('SMTP_PASSWORD'),
            },
          },
      settings: {
        // Resend only accepts a "from" on a domain you have verified with it,
        // which a personal mailbox address will not satisfy — RESEND_FROM
        // carries that verified sender without disturbing replies, which
        // should still reach the mailbox people actually read.
        defaultFrom: env('RESEND_FROM', env('EMAIL_DEFAULT_FROM')),
        defaultReplyTo: env('EMAIL_DEFAULT_FROM'),
      },
    },
  },
});

export default config;
