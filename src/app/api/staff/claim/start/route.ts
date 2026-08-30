import { handleEmailStart, oneSeatBlocked, oneSeatOk } from '@/lib/oneSeatClaimHttp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0';
  const result = handleEmailStart({
    email: body?.email,
    provider: body?.provider,
    ip,
  });
  if (!result.ok) return oneSeatBlocked(result.error, result.error.includes('Too many') ? 429 : 503);
  return oneSeatOk({
    status: 'pending',
    hasTenantAccess: false,
    challengeIssued: result.challengeIssued,
    redirect: '/staff/pending',
  });
}

export async function GET() {
  return oneSeatBlocked('Claim start is POST only. Phone and X are not available. No mail sent.');
}
