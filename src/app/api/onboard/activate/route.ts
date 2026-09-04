import { NextResponse } from 'next/server';
import { z } from 'zod';
import { activateOperatorSeat } from '@/lib/operatorActivation';
import {
  signOperatorSession,
  operatorSessionSecret,
  OPERATOR_COOKIE,
  OPERATOR_COOKIE_OPTS,
} from '@/lib/operatorSession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  token: z.string().min(10),
});

// POST /api/onboard/activate — consume one email link, create or open the operator seat.
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const data = bodySchema.parse(json);

    if (!operatorSessionSecret()) {
      return NextResponse.json(
        { success: false, error: "Operator login isn't switched on yet." },
        { status: 503 },
      );
    }

    const result = await activateOperatorSeat({
      rawToken: data.token,
    });

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }

    const session = await signOperatorSession(result.operatorId, result.email, Date.now());
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Activated, but session signing failed. Sign in at /login." },
        { status: 503 },
      );
    }

    const res = NextResponse.json({
      success: true,
      redirect: '/dashboard',
      restaurantName: result.restaurantName,
    });
    res.cookies.set(OPERATOR_COOKIE, session, OPERATOR_COOKIE_OPTS);
    return res;
  } catch (err: unknown) {
    if (err instanceof z.ZodError) return NextResponse.json({ success: false, error: 'Invalid sign-in link.' }, { status: 400 });
    return NextResponse.json({ success: false, error: 'Activation failed.' }, { status: 500 });
  }
}
