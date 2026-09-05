import { NextRequest, NextResponse } from 'next/server';
import { verifyHouseCodeFromEnv } from '@/lib/orchestration';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** House-code seat door. Fail-closed. Never returns private store data. */
export async function POST(request: NextRequest) {
  let code = '';
  try {
    const body = (await request.json()) as { code?: unknown };
    code = typeof body.code === 'string' ? body.code : '';
  } catch {
    code = '';
  }

  const result = verifyHouseCodeFromEnv(code);
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        hint: result.hint,
        seatDoor: '/portal',
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
    hint: 'Seat opened for this operator_id only. Supervisor may route. No dollars computed.',
  });
}
