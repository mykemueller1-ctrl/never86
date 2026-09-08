import { NextRequest, NextResponse } from 'next/server';
import { listAccessibleSeats, publicSeatsForPicker } from '@/lib/personAuth';
import { OPERATOR_COOKIE, verifyOperatorSession } from '@/lib/operatorSession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/operator/stores — seats this signed-in email may open.
export async function GET(req: NextRequest) {
  const token = req.cookies.get(OPERATOR_COOKIE)?.value;
  const session = await verifyOperatorSession(token, Date.now());
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sign in first.' }, { status: 401 });
  }

  const seats = await listAccessibleSeats(session.email);
  const current = seats.find((seat) => seat.operatorId === session.operatorId);
  return NextResponse.json({
    success: true,
    email: session.email,
    current: current
      ? { restaurantName: current.restaurantName, operatorId: current.operatorId }
      : null,
    seats: publicSeatsForPicker(seats),
  });
}
