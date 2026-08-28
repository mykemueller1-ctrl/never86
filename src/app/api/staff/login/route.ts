import { NextResponse } from 'next/server';
import {
  PRIVATE_INPUTS_BEFORE_REAL_CTAP_LOGIN,
  issueLiveStaffCredential,
} from '@/lib/staffSeatAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NOINDEX = { 'X-Robots-Tag': 'noindex, nofollow' } as const;

function blocked() {
  const result = issueLiveStaffCredential();
  return NextResponse.json(
    {
      success: false,
      issuance: result.issuance,
      error: result.error,
      privateInputIds: result.privateInputIds,
      privateInputs: PRIVATE_INPUTS_BEFORE_REAL_CTAP_LOGIN,
      mailSent: false,
    },
    { status: 503, headers: NOINDEX },
  );
}

/** Live staff credentials are not issued. Operator login remains at /login. */
export async function POST() {
  return blocked();
}

export async function GET() {
  return blocked();
}
