import crypto from 'crypto';
import type { NextRequest } from 'next/server';

/**
 * Admin gate for CoS/Build one-shot routes.
 *
 * Accepts either bearer already on Vercel:
 *   Authorization: Bearer <CRON_SECRET>
 *   Authorization: Bearer <ADMIN_API_SECRET>
 *
 * Cookie path stays for the /admin HTML desk (n86_admin_auth).
 * Fail closed when none of the secrets are configured.
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

function bearerMatches(header: string | null, secret: string | undefined): boolean {
  const trimmed = secret?.trim();
  if (!trimmed || !header) return false;
  return header === `Bearer ${trimmed}`;
}
