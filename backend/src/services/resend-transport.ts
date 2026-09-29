/**
 * A nodemailer transport that delivers through Resend's HTTPS API.
 *
 * Railway blocks outbound SMTP entirely on this plan — ports 25, 465, 587 and
 * 2525 all time out, to every provider — so nodemailer's normal SMTP transport
 * can never connect from production. Only 443 gets out.
 *
 * `@strapi/provider-email-nodemailer` passes providerOptions straight to
 * `nodemailer.createTransport()`, which accepts a custom transport object as
 * well as SMTP settings. Plugging in here keeps the whole email plugin working
 * — including Strapi's own admin password-reset mail — without adding a
 * dependency, which matters because Railway installs with --frozen-lockfile.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const REQUEST_TIMEOUT_MS = 10000;

type Address = string | { name?: string; address: string } | undefined | null;
type AddressList = Address | Address[];

function formatAddress(value: Exclude<Address, undefined | null>): string {
  if (typeof value === 'string') return value;
  return value.name ? `${value.name} <${value.address}>` : value.address;
}

function toList(value: AddressList): string[] {
  if (!value) return [];
  const items = Array.isArray(value) ? value : [value];
  return items.filter((item): item is Exclude<Address, undefined | null> => Boolean(item)).map(formatAddress);
}

// Never let the API key reach a log line.
function sanitize(message: string, apiKey: string): string {
  const cleaned = apiKey ? message.split(apiKey).join('[REDACTED]') : message;
  return cleaned.slice(0, 500);
}

export type ResendTransportOptions = {
  apiKey: string;
};

export function createResendTransport({ apiKey }: ResendTransportOptions) {
  return {
    name: 'resend',
    version: '1.0.0',

    send(mail: { data: Record<string, unknown> }, callback: (err: Error | null, info?: unknown) => void) {
      const data = mail.data ?? {};
      const to = toList(data.to as AddressList);
      const from = toList(data.from as AddressList)[0];

      if (!apiKey) {
        callback(new Error('RESEND_API_KEY is not configured.'));
        return;
      }
      if (!from) {
        callback(new Error('No "from" address was resolved for this message.'));
        return;
      }
      if (to.length === 0) {
        callback(new Error('No recipient address was resolved for this message.'));
        return;
      }

      const payload: Record<string, unknown> = {
        from,
        to,
        subject: (data.subject as string) ?? '',
      };
      if (data.text) payload.text = data.text;
      if (data.html) payload.html = data.html;

      const cc = toList(data.cc as AddressList);
      const bcc = toList(data.bcc as AddressList);
      const replyTo = toList(data.replyTo as AddressList);
      if (cc.length) payload.cc = cc;
      if (bcc.length) payload.bcc = bcc;
      if (replyTo.length) payload.reply_to = replyTo;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
        .then(async (response) => {
          const body = await response.text();
          if (!response.ok) {
            throw new Error(`Resend rejected the message with status ${response.status}: ${body.slice(0, 300)}`);
          }
          let id: string | undefined;
          try {
            id = JSON.parse(body).id;
          } catch {
            // A 2xx without a parsable body still means Resend accepted it.
          }
          callback(null, { messageId: id, envelope: { from, to }, accepted: to, rejected: [] });
        })
        .catch((error: Error) => {
          const reason = error.name === 'AbortError'
            ? `Resend did not respond within ${REQUEST_TIMEOUT_MS}ms.`
            : sanitize(error.message, apiKey);
          callback(new Error(reason));
        })
        .finally(() => clearTimeout(timeout));
    },
  };
}
