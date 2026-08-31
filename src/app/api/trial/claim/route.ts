import { NextRequest, NextResponse } from 'next/server';
import { attachEmailToRun } from '@/lib/trialRunsDb';
import {
  deliverPublicLead,
  publicLeadHttpStatus,
} from '@/lib/publicLeadIntake';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  shareToken: z.string().min(1),
  email: z.string().email(),
  name: z.string().optional(),
  restaurantName: z.string().optional(),
});

// POST /api/trial/claim · email Myke via hello@ / alerts@, then optionally
// attach the email to a saved trial run. Run persist is extra and fail-soft.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const result = await deliverPublicLead({
      kind: 'trial_claim',
      email: data.email,
      name: data.name,
      restaurantName: data.restaurantName,
      sourcePage: '/trial · run claim',
      agentRequested: 'Trial run · saved',
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, success: false, error: result.error, code: result.code },
        { status: publicLeadHttpStatus(result) },
      );
    }

    let runAttached = false;
    try {
      runAttached = await attachEmailToRun(data.shareToken, data.email, data.restaurantName);
    } catch (err) {
      console.error('trial claim attachEmailToRun failed:', err);
    }

    return NextResponse.json({
      ok: true,
      success: true,
      emailSent: result.operatorEmailed,
      ownerNotified: result.ownerNotified,
      persisted: result.persisted,
      runAttached,
      message: result.confirmation,
      shareUrl: `https://www.never86.ai/trial/run/${data.shareToken}`,
    });
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ ok: false, success: false, error: 'Check the form and try again.' }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : 'Bad request';
    return NextResponse.json({ ok: false, success: false, error: msg }, { status: 400 });
  }
}
