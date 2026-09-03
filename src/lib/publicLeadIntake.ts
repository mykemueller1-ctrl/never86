import { db } from '@/db';
import { waitlist } from '@/db/schema';
import { escapeHtml } from './escapeHtml';
import {
  emailDeliveryConfigured,
  emailSendSucceeded,
  getOwnerEmail,
  sendAuditIntakeEmail,
  sendNotification,
  sendWelcomeEmail,
} from './email';
import { databaseUrlPresent } from './persistHealth';

export type PublicLeadKind = 'audit_request' | 'waitlist' | 'trial_claim';

export type PublicLeadInput = {
  kind: PublicLeadKind;
  email: string;
  name?: string;
  restaurantName?: string;
  units?: number | null;
  role?: string;
  sourcePage?: string;
  platform?: string;
  agentRequested?: string;
  interestedAgent?: string;
  posType?: string;
  dataPreference?: string;
  utm?: { source?: string; medium?: string; campaign?: string; content?: string };
};

export type PublicLeadResult =
  | {
      ok: true;
      ownerNotified: true;
      operatorEmailed: boolean;
      persisted: boolean;
      confirmation: string;
    }
  | {
      ok: false;
      error: string;
      code: 'email_unavailable' | 'owner_notify_failed';
    };

export type PublicLeadDeps = {
  emailConfigured?: () => boolean;
  ownerEmail?: () => string;
  notifyOwner?: (
    to: string,
    subject: string,
    html: string,
  ) => Promise<{ data?: unknown; error?: unknown }>;
  emailOperator?: (
    input: PublicLeadInput,
  ) => Promise<{ data?: unknown; error?: unknown }>;
  persist?: (input: PublicLeadInput) => Promise<boolean>;
};

function safeLabel(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim().slice(0, 160);
}

export function publicLeadSubject(input: PublicLeadInput): string {
  const label = safeLabel(input.restaurantName || input.name || input.email);
  if (input.kind === 'audit_request') {
    return `Free audit request · ${label}`;
  }
  if (input.kind === 'trial_claim') {
    return `Trial read saved · ${label}`;
  }
  if (input.agentRequested) {
    return `⚡ ${safeLabel(input.agentRequested)} unlock · ${label}`;
  }
  if (input.interestedAgent) {
    return `🚪 Self-onboard · ${label} · ${safeLabel(input.interestedAgent)}`;
  }
  return `New lead · ${label}${input.restaurantName ? ` · ${safeLabel(input.restaurantName)}` : ''}`;
}

export function publicLeadOwnerHtml(input: PublicLeadInput): string {
  const who = escapeHtml(input.name || 'A restaurant operator');
  const lines = [
    input.kind === 'audit_request'
      ? `<p><strong>${who}</strong> requested a free ${escapeHtml(input.platform || 'marketplace')} audit.</p>`
      : input.kind === 'trial_claim'
        ? `<p><strong>${who}</strong> saved a trial read.</p>`
        : `<p>${input.agentRequested ? `⚡ <strong>UNLOCK REQUEST · ${escapeHtml(input.agentRequested)}</strong><br/>` : ''}<strong>${who}</strong> just hit the form.</p>`,
    `<p>Email: ${escapeHtml(input.email)}<br/>`,
    input.restaurantName ? `Restaurant: ${escapeHtml(input.restaurantName)}<br/>` : '',
    input.units ? `Units: ${input.units}<br/>` : '',
    input.role ? `Role: ${escapeHtml(input.role)}<br/>` : '',
    input.platform ? `Platform: ${escapeHtml(input.platform)}<br/>` : '',
    input.posType ? `POS: ${escapeHtml(input.posType)}<br/>` : '',
    input.interestedAgent ? `Wants agent: ${escapeHtml(input.interestedAgent)}<br/>` : '',
    input.dataPreference ? `Data-share: ${escapeHtml(input.dataPreference)}<br/>` : '',
    input.utm?.source ? `Source: ${escapeHtml(input.utm.source)}<br/>` : '',
    input.utm?.medium ? `Medium: ${escapeHtml(input.utm.medium)}<br/>` : '',
    input.utm?.campaign ? `Campaign: ${escapeHtml(input.utm.campaign)}<br/>` : '',
    input.utm?.content ? `Content: ${escapeHtml(input.utm.content)}<br/>` : '',
    input.sourcePage ? `Page: ${escapeHtml(input.sourcePage)}` : '',
    `</p>`,
    input.kind === 'audit_request'
      ? '<p><strong>Next move:</strong> Wait for the operator to reply with the redacted statement, then run the audit and return the receipt.</p>'
      : '<p>Owner alert via alerts@never86.ai. Neon persist is optional and fail-closed.</p>',
  ];
  return lines.join('');
}

export function publicLeadConfirmation(input: PublicLeadInput, operatorEmailed: boolean): string {
  if (input.kind === 'audit_request') {
    return operatorEmailed
      ? 'Check your inbox. Reply to Myke with one redacted marketplace statement.'
      : 'Your request is in. Email one redacted marketplace statement to hello@never86.ai.';
  }
  if (input.kind === 'trial_claim') {
    return operatorEmailed
      ? "You're saved. Check your inbox — Myke has the request."
      : "You're saved. Myke has the request and will reach out.";
  }
  return operatorEmailed ? "You're on the list." : "You're on the list. Myke has the request.";
}

/** Neon waitlist write. Fail-closed when DATABASE_URL is missing. Never fakes a write. */
export async function persistPublicLeadToNeon(input: PublicLeadInput): Promise<boolean> {
  if (!databaseUrlPresent()) return false;
  try {
    await db.insert(waitlist).values({
      email: input.email.toLowerCase().trim(),
      name: input.name,
      restaurantName: input.restaurantName,
      role: input.role,
    }).onConflictDoNothing({ target: waitlist.email });
    return true;
  } catch (err) {
    console.error('publicLead Neon persist failed:', err);
    return false;
  }
}

async function defaultOperatorEmail(
  input: PublicLeadInput,
): Promise<{ data?: unknown; error?: unknown }> {
  if (input.kind === 'audit_request') {
    return sendAuditIntakeEmail(input.email, input.name);
  }
  return sendWelcomeEmail(input.email, input.name);
}

/**
 * Public customer intake: Gmail via hello@ / alerts@ is required.
 * Neon persist is optional and fail-closed. No Supabase. No fake success.
 */
export async function deliverPublicLead(
  input: PublicLeadInput,
  deps: PublicLeadDeps = {},
): Promise<PublicLeadResult> {
  const emailConfigured = deps.emailConfigured ?? emailDeliveryConfigured;
  const ownerEmail = deps.ownerEmail ?? getOwnerEmail;
  const notifyOwner = deps.notifyOwner ?? sendNotification;
  const emailOperator = deps.emailOperator ?? defaultOperatorEmail;
  const persist = deps.persist ?? persistPublicLeadToNeon;

  if (!emailConfigured()) {
    return {
      ok: false,
      error: 'Email delivery is unavailable. Email hello@never86.ai and we will pick it up.',
      code: 'email_unavailable',
    };
  }

  let ownerResult: { data?: unknown; error?: unknown };
  try {
    ownerResult = await notifyOwner(
      ownerEmail(),
      publicLeadSubject(input),
      publicLeadOwnerHtml(input),
    );
  } catch (err) {
    console.error('publicLead owner notify threw:', err);
    return {
      ok: false,
      error: 'Unable to deliver your request. Email hello@never86.ai and we will pick it up.',
      code: 'owner_notify_failed',
    };
  }

  if (!emailSendSucceeded(ownerResult)) {
    console.error('publicLead owner notify failed:', ownerResult?.error);
    return {
      ok: false,
      error: 'Unable to deliver your request. Email hello@never86.ai and we will pick it up.',
      code: 'owner_notify_failed',
    };
  }

  let operatorEmailed = false;
  try {
    const operatorResult = await emailOperator(input);
    operatorEmailed = emailSendSucceeded(operatorResult);
    if (!operatorEmailed) {
      console.error('publicLead operator email failed:', operatorResult?.error);
    }
  } catch (err) {
    console.error('publicLead operator email threw:', err);
  }

  let persisted = false;
  try {
    persisted = await persist(input);
  } catch (err) {
    console.error('publicLead persist threw:', err);
    persisted = false;
  }

  return {
    ok: true,
    ownerNotified: true,
    operatorEmailed,
    persisted,
    confirmation: publicLeadConfirmation(input, operatorEmailed),
  };
}

export function publicLeadHttpStatus(result: PublicLeadResult): number {
  if (result.ok) return 200;
  return 503;
}
