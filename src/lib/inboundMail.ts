/**
 * Normalize inbound close mail from Resend, Postmark, Mailgun, or SES SNS.
 * MX for inbound.never86.ai already points at inbound-smtp.us-east-1.amazonaws.com.
 */

import { parseIntakeOperatorId } from './closeIntake';

export type NormalizedInboundMail = {
  from?: string;
  to?: string | string[];
  cc?: string | string[];
  subject?: string;
  text?: string;
  html?: string;
  attachments?: Array<{ filename?: string; content?: string; data?: string }>;
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

/** First text/plain part, else the body after the header blank line. */
export function parseSimpleMime(raw: string): NormalizedInboundMail {
  const normalized = raw.replace(/\r\n/g, '\n');
  const split = normalized.split(/\n\n/);
  const headers = split[0] ?? '';
  const rest = split.slice(1).join('\n\n');
  const from = headerValue(headers, 'From');
  const to = headerValue(headers, 'To');
  const cc = headerValue(headers, 'Cc');
  const subject = headerValue(headers, 'Subject');

  const textPlain = rest.match(/Content-Type:\s*text\/plain[\s\S]*?\n\n([\s\S]*?)(?=\n--|\nContent-Type:|$)/i);
  const text = (textPlain?.[1] ?? rest).trim();

  return {
    from,
    to,
    cc,
    subject,
    text,
  };
}

function fromProviderAliases(rec: Record<string, unknown>): NormalizedInboundMail {
  const to = asString(rec.to) ?? asString(rec.To) ?? asString(rec.recipient);
  const cc = asString(rec.cc) ?? asString(rec.Cc);
  const from = asString(rec.from) ?? asString(rec.From) ?? asString(rec.sender);
  const subject = asString(rec.subject) ?? asString(rec.Subject);
  const text = asString(rec.text) ?? asString(rec.TextBody) ?? asString(rec['body-plain']);
  const html = asString(rec.html) ?? asString(rec.HtmlBody) ?? asString(rec['body-html']);
  const attachments = Array.isArray(rec.attachments) ? rec.attachments : undefined;
  return {
    from,
    to,
    cc,
    subject,
    text,
    html,
    attachments: attachments as NormalizedInboundMail['attachments'],
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
