import { handleGoogleStart, oneSeatBlocked, oneSeatOk } from '@/lib/oneSeatClaimHttp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const result = handleGoogleStart({});
  if (!result.ok) return oneSeatBlocked(result.error);
  return oneSeatOk({
    status: 'google_redirect',
    hasTenantAccess: false,
    authorizationUrl: result.authorizationUrl,
  });
}

export async function GET() {
  return POST();
}
