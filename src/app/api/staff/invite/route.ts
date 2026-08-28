import { NextResponse } from 'next/server';
import { issueLiveStaffCredential } from '@/lib/staffSeatAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NOINDEX = { 'X-Robots-Tag': 'noindex, nofollow' } as const;

function blocked(action: 'invite' | 'reset' | 'revoke') {
  const result = issueLiveStaffCredential();
  return NextResponse.json(
    {
      success: false,
      action,
      issuance: result.issuance,
      error: `Live staff ${action} is not issued. No mail sent. ${result.error}`,
      privateInputIds: result.privateInputIds,
      mailSent: false,
    },
    { status: 403, headers: NOINDEX },
  );
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const action = body?.action === 'reset' || body?.action === 'revoke' ? body.action : 'invite';
  return blocked(action);
}
