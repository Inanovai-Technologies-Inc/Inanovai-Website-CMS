export type FrappeLeadInput = {
  name: string;
  email: string;
  company?: string;
  leadOwner: string;
};

export type FrappeLeadResult = {
  ok: boolean;
  skipped?: boolean;
  status?: number;
  error?: string;
};

const DEFAULT_SOURCE = 'Reference';
const DEFAULT_TIMEOUT_MS = 5000;
const MAX_DIAGNOSTIC_LENGTH = 2000;
const SENSITIVE_FIELD_PATTERN = /authorization|api[_-]?key|api[_-]?secret|password|token|cookie|set-cookie/i;

function readEnv(name: string): string {
  return process.env[name]?.trim() ?? '';
}

function sanitizeText(value: string): string {
  return value
    .replace(/(authorization|api[_-]?key|api[_-]?secret|password|token|cookie|set-cookie)\s*[:=]\s*("[^"]*"|'[^']*'|[^,\s}]+)/gi, '$1=[REDACTED]')
    .slice(0, MAX_DIAGNOSTIC_LENGTH);
}

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (!value || typeof value !== 'object') return typeof value === 'string' ? sanitizeText(value) : value;

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, SENSITIVE_FIELD_PATTERN.test(key) ? '[REDACTED]' : sanitizeValue(entry)]),
  );
}

function sanitizeResponseBody(body: string): string {
  if (!body) return '[empty response body]';

  try {
    return sanitizeText(JSON.stringify(sanitizeValue(JSON.parse(body))));
  } catch {
    return sanitizeText(body);
  }
}

export async function createFrappeLead(fields: FrappeLeadInput): Promise<FrappeLeadResult> {
  const baseUrl = readEnv('FRAPPE_BASE_URL').replace(/\/$/, '');
  const endpoint = readEnv('FRAPPE_LEAD_ENDPOINT') || '/api/resource/Lead';
  const apiKey = readEnv('FRAPPE_API_KEY');
  const apiSecret = readEnv('FRAPPE_API_SECRET');

  if (!baseUrl || !apiKey || !apiSecret || !fields.leadOwner) {
    return {
      ok: false,
      skipped: true,
      error: 'Frappe Lead integration is not fully configured.',
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Host: 'marsol.localhost',
        Authorization: `token ${apiKey}:${apiSecret}`,
      },
      body: JSON.stringify({
        lead_name: fields.name,
        email_id: fields.email,
        company_name: fields.company || undefined,
        source: DEFAULT_SOURCE,
        lead_owner: fields.leadOwner,
      }),
      signal: controller.signal,
    });

    const responseBody = await response.text().catch(() => '');

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: `Frappe Lead request failed with status ${response.status}. Response: ${sanitizeResponseBody(responseBody)}`,
      };
    }

    return { ok: true };
  } catch (err) {
    const errorType = err instanceof Error ? err.name : typeof err;
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Frappe Lead request failed with ${errorType}: ${sanitizeText(errorMessage)}` };
  } finally {
    clearTimeout(timeout);
  }
}