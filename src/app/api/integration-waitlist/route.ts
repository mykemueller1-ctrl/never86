import { NextRequest, NextResponse } from 'next/server';
import { captureIntegrationInterest } from '@/lib/trialDb';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const POS_VALUES = ['Toast', 'Lightspeed', 'Aloha', 'Square', 'Clover', 'PDQ', 'Other'] as const;
const schema = z.object({
  email: z.string().email(),
  restaurantName: z.string().optional(),
  pos: z.enum(POS_VALUES),
  units: z.union([z.string(), z.number()]).optional(),
  sourcePage: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    const units = typeof data.units === 'number' ? data.units : data.units ? Number(data.units) || null : null;
    const ok = await captureIntegrationInterest({
      email: data.email,
      restaurantName: data.restaurantName,
      pos: data.pos,
      units,
      sourcePage: data.sourcePage,
      notes: data.notes,
    });
    return NextResponse.json(
      { ok, message: ok ? "We'll email you the moment that integration ships." : 'Waitlist temporarily unavailable.' },
      // Non-2xx on persistence failure so the client's res.ok check trips its
      // visible error state instead of showing "✓ On the list" for a lost lead.
      { status: ok ? 200 : 503 },
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Bad request';
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
