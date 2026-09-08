import { NextResponse } from 'next/server';
import { z } from 'zod';
import { activateOperatorSeat } from '@/lib/operatorActivation';
import {
  attachActivateCookie,
  planActivateHttpResponse,
} from '@/lib/operatorActivateHttp';
import { operatorSessionSecret, signOperatorSession } from '@/lib/operatorSession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  token: z.string().min(10),
});

function jsonWithActivateCookie(plan: ReturnType<typeof planActivateHttpResponse>) {
  const res = NextResponse.json(plan.body, { status: plan.status });
  attachActivateCookie(res, plan.cookie);
  return res;
}

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
    const session = result.ok
      ? await signOperatorSession(result.operatorId, result.email, Date.now())
      : null;

    return jsonWithActivateCookie(planActivateHttpResponse(result, session));
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return jsonWithActivateCookie({
        status: 400,
        body: { success: false, error: 'Invalid sign-in link.' },
        cookie: { kind: 'clear' },
      });
    }
    return NextResponse.json({ success: false, error: 'Activation failed.' }, { status: 500 });
  }
}
