import { NextRequest, NextResponse } from 'next/server';
import { attachEmailToRun } from '@/lib/trialRunsDb';
import { captureLead } from '@/lib/leadCapture';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  shareToken: z.string().min(1),
  email: z.string().email(),
  name: z.string().optional(),
  restaurantName: z.string().optional(),
});

// POST /api/trial/claim · attach email to a saved trial run so the
// operator can come back to the exact same read tomorrow.
// Also runs the standard lead capture so /admin/never86 sees it.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    const ok = await attachEmailToRun(data.shareToken, data.email, data.restaurantName);

    await captureLead({
      email: data.email,
      name: data.name,
      restaurantName: data.restaurantName,
      sourcePage: '/trial · run claim',
      requestedAgent: 'Trial run · saved',
      referrer: req.headers.get('referer') ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
      ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
    });

    return NextResponse.json({
      ok,
      shareUrl: `https://never86.ai/trial/run/${data.shareToken}`,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Bad request';
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
