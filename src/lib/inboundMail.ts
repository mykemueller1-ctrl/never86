/**
 * Normalize inbound close mail from Resend, Postmark, Mailgun, or SES SNS.
 * MX for inbound.never86.ai already points at inbound-smtp.us-east-1.amazonaws.com.
 */

import { parseIntakeOperatorId } from './closeIntake';

export type NormalizedInboundAttachment = {
  filename?: string;
  content?: string;
  data?: string;
};

export type NormalizedInboundMail = {
  from?: string;
  to?: string | string[];
  cc?: string | string[];
  subject?: string;
  text?: string;
  html?: string;
  attachments?: NormalizedInboundAttachment[];
};

export type InboundNormalizeResult =
  | { kind: 'mail'; mail: NormalizedInboundMail }
  | { kind: 'sns-subscribe'; subscribeUrl: string }
  | { kind: 'empty' };

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value : undefined;

export function isSafeSnsSubscribeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return host === 'sns.amazonaws.com' || host.endsWith('.amazonaws.com');
  } catch {
    return false;
  }
}

function headerValue(raw: string, name: string): string | undefined {
  const re = new RegExp(`^${name}:\\s*(.+)$`, 'im');
  const match = raw.match(re);
  return match?.[1]?.replace(/\r/g, '').trim();
}

function headerBlock(raw: string): { headers: string; body: string } {
  const normalized = raw.replace(/\r\n/g, '\n');
  const split = normalized.split(/\n\n/);
  return { headers: split[0] ?? '', body: split.slice(1).join('\n\n') };
}

function contentTypeBoundary(headers: string): string | null {
  const ct = headerValue(headers, 'Content-Type');
  if (!ct) return null;
  const m = ct.match(/boundary=(?:"([^"]+)"|([^\s;]+))/i);
  return m?.[1] || m?.[2] || null;
}

function decodeRfc5987Filename(raw: string): string {
  try {
    const m = raw.match(/^[^']*'[^']*'(.+)$/);
    return decodeURIComponent((m?.[1] || raw).replace(/['"]/g, ''));
  } catch {
    return raw.replace(/['"]/g, '');
  }
}

function partFilename(headers: string): string | undefined {
  const disposition = headerValue(headers, 'Content-Disposition') || '';
  const type = headerValue(headers, 'Content-Type') || '';
  const star = disposition.match(/filename\*\s*=\s*([^;]+)/i);
  if (star?.[1]) return decodeRfc5987Filename(star[1].trim());
  const quoted = disposition.match(/filename\s*=\s*"([^"]+)"/i)
    || type.match(/name\s*=\s*"([^"]+)"/i);
  if (quoted?.[1]) return quoted[1];
  const bare = disposition.match(/filename\s*=\s*([^;]+)/i)
    || type.match(/name\s*=\s*([^;]+)/i);
  return bare?.[1]?.trim().replace(/^["']|["']$/g, '');
}

function decodePartBody(body: string, encoding: string | undefined): string {
  const trimmed = body.replace(/^\n+|\n+$/g, '');
  const enc = (encoding || '').toLowerCase();
  if (enc === 'base64') {
    return trimmed.replace(/\s+/g, '');
  }
  if (enc === 'quoted-printable') {
    const decoded = trimmed
      .replace(/=\n/g, '')
      .replace(/=([0-9A-Fa-f]{2})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
    return Buffer.from(decoded, 'utf8').toString('base64');
  }
  return Buffer.from(trimmed, 'utf8').toString('base64');
}

function parseMimePart(part: string): {
  headers: string;
  body: string;
  filename?: string;
  contentType?: string;
  encoding?: string;
} {
  const { headers, body } = headerBlock(part.replace(/^\n+/, ''));
  return {
    headers,
    body,
    filename: partFilename(headers),
    contentType: headerValue(headers, 'Content-Type'),
    encoding: headerValue(headers, 'Content-Transfer-Encoding'),
  };
}

function collectMimeParts(raw: string, inheritedBoundary?: string): ReturnType<typeof parseMimePart>[] {
  const { headers, body } = headerBlock(raw);
  const boundary = inheritedBoundary || contentTypeBoundary(headers);
  if (!boundary) return [parseMimePart(raw)];
  const token = `--${boundary}`;
  const chunks = body.split(token);
  const parts: ReturnType<typeof parseMimePart>[] = [];
  for (const chunk of chunks) {
    const trimmed = chunk.replace(/^\n+/, '').replace(/--\s*$/, '').trim();
    if (!trimmed || trimmed === '--') continue;
    const nestedBoundary = contentTypeBoundary(headerBlock(trimmed).headers);
    if (nestedBoundary) parts.push(...collectMimeParts(trimmed, nestedBoundary));
    else parts.push(parseMimePart(trimmed));
  }
  return parts;
}

/** Headers plus text/plain and every named attachment part (base64 content). */
export function parseSimpleMime(raw: string): NormalizedInboundMail {
  const { headers } = headerBlock(raw);
  const from = headerValue(headers, 'From');
  const to = headerValue(headers, 'To');
  const cc = headerValue(headers, 'Cc');
  const subject = headerValue(headers, 'Subject');
  const parts = collectMimeParts(raw);
  const textParts: string[] = [];
  const attachments: NormalizedInboundAttachment[] = [];

  for (const part of parts) {
    const ct = (part.contentType || '').toLowerCase();
    const filename = part.filename;
    const isText = ct.startsWith('text/plain') || (!ct && !filename);
    const isHtml = ct.startsWith('text/html');
    const isPdf = ct.includes('application/pdf') || (filename || '').toLowerCase().endsWith('.pdf');
    if ((filename || isPdf) && !isText && !isHtml) {
      attachments.push({
        filename,
        content: decodePartBody(part.body, part.encoding),
      });
      continue;
    }
    if (isText && part.body.trim()) {
      const encoding = (part.encoding || '').toLowerCase();
      if (encoding === 'base64') {
        try {
          textParts.push(Buffer.from(part.body.replace(/\s+/g, ''), 'base64').toString('utf8'));
        } catch {
          textParts.push(part.body);
        }
      } else {
        textParts.push(part.body.trim());
      }
    }
  }

  if (!textParts.length && !attachments.length) {
    const { body } = headerBlock(raw);
    if (body.trim()) textParts.push(body.trim());
  }

  return {
    from,
    to,
    cc,
    subject,
    text: textParts.join('\n\n').trim() || undefined,
    attachments: attachments.length ? attachments : undefined,
  };
}

function normalizeAttachment(value: unknown): NormalizedInboundAttachment | null {
  const rec = asRecord(value);
  if (!rec) return null;
  const filename = asString(rec.filename) ?? asString(rec.Name) ?? asString(rec.name) ?? asString(rec.fileName);
  const content = asString(rec.content)
    ?? asString(rec.Content)
    ?? asString(rec.data)
    ?? asString(rec.contentBase64)
    ?? asString(rec.ContentBase64);
  if (!filename && !content) return null;
  return { filename, content, data: asString(rec.data) };
}

function providerAttachments(rec: Record<string, unknown>): NormalizedInboundAttachment[] | undefined {
  const raw = rec.attachments ?? rec.Attachments;
  if (!Array.isArray(raw)) return undefined;
  const attachments = raw.map(normalizeAttachment).filter((row): row is NormalizedInboundAttachment => Boolean(row));
  return attachments.length ? attachments : undefined;
}

function fromProviderAliases(rec: Record<string, unknown>): NormalizedInboundMail {
  const to = asString(rec.to) ?? asString(rec.To) ?? asString(rec.recipient);
  const cc = asString(rec.cc) ?? asString(rec.Cc);
  const from = asString(rec.from) ?? asString(rec.From) ?? asString(rec.sender);
  const subject = asString(rec.subject) ?? asString(rec.Subject);
  const text = asString(rec.text) ?? asString(rec.TextBody) ?? asString(rec['body-plain']);
  const html = asString(rec.html) ?? asString(rec.HtmlBody) ?? asString(rec['body-html']);
  return {
    from,
    to,
    cc,
    subject,
    text,
    html,
    attachments: providerAttachments(rec),
  };
}

function fromSesNotification(rec: Record<string, unknown>): NormalizedInboundMail | null {
  const messageRaw = asString(rec.Message);
  if (!messageRaw) return null;
  let inner: Record<string, unknown>;
  try {
    inner = JSON.parse(messageRaw) as Record<string, unknown>;
  } catch {
    return parseSimpleMime(messageRaw);
  }
  const mail = asRecord(inner.mail);
  const common = mail ? asRecord(mail.commonHeaders) : null;
  const content = asString(inner.content);
  const mime = content ? parseSimpleMime(content) : {};
  const dest = mail && Array.isArray(mail.destination) ? (mail.destination as unknown[]).map(String) : undefined;
  return {
    from: mime.from ?? asString(common?.from) ?? asString(mail?.source),
    to: mime.to ?? dest ?? asString(common?.to),
    cc: mime.cc,
    subject: mime.subject ?? asString(common?.subject),
    text: mime.text,
    html: mime.html,
    attachments: mime.attachments,
  };
}

export function normalizeInboundPayload(raw: unknown): InboundNormalizeResult {
  const rec = asRecord(raw);
  if (!rec) return { kind: 'empty' };

  const type = asString(rec.Type);
  if (type === 'SubscriptionConfirmation' || type === 'UnsubscribeConfirmation') {
    const url = asString(rec.SubscribeURL);
    if (url && isSafeSnsSubscribeUrl(url)) return { kind: 'sns-subscribe', subscribeUrl: url };
    return { kind: 'empty' };
  }
  if (type === 'Notification') {
    const mail = fromSesNotification(rec);
    if (mail && (mail.to || mail.text || mail.subject)) return { kind: 'mail', mail };
    return { kind: 'empty' };
  }

  const aliased = fromProviderAliases(rec);
  if (aliased.to || aliased.text || aliased.subject || aliased.from) {
    return { kind: 'mail', mail: aliased };
  }
  return { kind: 'empty' };
}

export function inboundOperatorId(mail: NormalizedInboundMail): number | null {
  return parseIntakeOperatorId(mail.to) ?? parseIntakeOperatorId(mail.cc);
}
