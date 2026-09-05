import { NextRequest, NextResponse } from 'next/server';
import { HOUSE_CODE_SEAT_DOOR, verifyHouseCodeFromEnv } from '@/lib/houseCode';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function closedJson(code: string) {
  const result = verifyHouseCodeFromEnv(code);
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        hint: result.hint,
        seatDoor: HOUSE_CODE_SEAT_DOOR,
        liveIssuance: 'blocked',
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    ok: true,
    operatorId: result.session.operatorId,
    seatDoor: result.session.seatDoor,
    liveIssuance: result.session.liveIssuance,
    hint: 'Seat opened for this operator_id only. No private store data returned.',
  });
}

/** House-code seat door. Enabled, fail-closed. Never returns private store data. */
export async function GET() {
  return closedJson('');
}

export async function POST(request: NextRequest) {
  let code = '';
  try {
    const body = (await request.json()) as { code?: unknown };
    code = typeof body.code === 'string' ? body.code : '';
  } catch {
    code = '';
  }
  return closedJson(code);
}
