import { handleGoogleCallback, oneSeatBlocked, oneSeatOk } from '@/lib/oneSeatClaimHttp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Google callback stays fail-closed in this PR: we never exchange a live
 * authorization code against Google without verified secrets in the private
 * operator plane. Tests inject verified claims through handleGoogleCallback.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const state = url.searchParams.get('state') ?? '';
  const email = url.searchParams.get('email');
  const googleSub = url.searchParams.get('sub') ?? '';
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return oneSeatBlocked('Google callback fails closed without provider secrets. No tenant access.');
  }
  const result = handleGoogleCallback({ state, email, googleSub });
  if (!result.ok) return oneSeatBlocked(result.error ?? 'Google verification failed.');
  return oneSeatOk({
    status: 'pending',
    hasTenantAccess: false,
    redirect: '/staff/pending',
  });
}
