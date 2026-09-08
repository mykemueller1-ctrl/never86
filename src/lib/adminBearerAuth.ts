import crypto from 'crypto';
import type { NextRequest } from 'next/server';
import { OPERATOR_COOKIE, verifyOperatorSession } from './operatorSession';

/** Forever-login owner. Exact match after trim + lower-case. Plus-alias is not this address. */
export const OWNER_PERSON_EMAIL = 'mykemueller1@gmail.com';

/**
 * Admin gate for CoS/Build one-shot routes.
 *
 * Accepts either bearer already on Vercel:
 *   Authorization: Bearer <CRON_SECRET>
 *   Authorization: Bearer <ADMIN_API_SECRET>
 *
 * Cookie path stays for the /admin HTML desk (n86_admin_auth).
 *
 * Also accepts the same signed n86_operator person session /operator already
 * verifies, when the session email is exactly OWNER_PERSON_EMAIL or
 * process.env.OWNER_EMAIL (trimmed, lower-case). No new cookie. Fail closed
 * on plus-alias, random sessions, and missing/forged tokens.
 *
 * Fail closed when none of the secrets are configured and no owner session.
 */
export function adminBearerOk(req: NextRequest): boolean {
  const bearer = req.headers.get('authorization');
  if (bearerMatches(bearer, process.env.CRON_SECRET)) return true;
  if (bearerMatches(bearer, process.env.ADMIN_API_SECRET)) return true;

  const adminPw = process.env.ADMIN_PASSWORD;
  if (!adminPw) return false;
  const token = crypto.createHash('sha256').update(adminPw).digest('hex');
  return req.cookies.get('n86_admin_auth')?.value === token;
}

export function isOwnerPersonEmail(email: string | undefined | null): boolean {
  if (typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized || normalized.includes('+')) return false;
  if (normalized === OWNER_PERSON_EMAIL) return true;
  const envOwner = process.env.OWNER_EMAIL?.trim().toLowerCase();
  return Boolean(envOwner) && !envOwner.includes('+') && normalized === envOwner;
}

export async function ownerPersonSessionOk(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(OPERATOR_COOKIE)?.value;
  const session = await verifyOperatorSession(token, Date.now());
  if (!session) return false;
  return isOwnerPersonEmail(session.email);
}

export async function adminOk(req: NextRequest): Promise<boolean> {
  if (adminBearerOk(req)) return true;
  return ownerPersonSessionOk(req);
}

function bearerMatches(header: string | null, secret: string | undefined): boolean {
  const trimmed = secret?.trim();
  if (!trimmed || !header) return false;
  return header === `Bearer ${trimmed}`;
}
