import { NextRequest, NextResponse } from 'next/server';
import { explainWithGrok, fallbackExplain, grokSeatStatus } from '@/lib/grokSeat';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const status = grokSeatStatus();
  return NextResponse.json({
    success: true,
    ready: status.ready,
    model: status.model,
    role: 'explain-only',
    product: 'One Seat / Action Shift — not a Grok-resale product',
    error: status.ready ? null : 'XAI_API_KEY is absent. Formula cards still work. Grok explanation stays off.',
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    fact?: unknown;
    nextMove?: unknown;
    claimBoundary?: unknown;
  } | null;
  const fact = typeof body?.fact === 'string' ? body.fact.trim() : '';
  const nextMove = typeof body?.nextMove === 'string' ? body.nextMove.trim() : '';
  const claimBoundary = typeof body?.claimBoundary === 'string' ? body.claimBoundary.trim() : '';
  if (!fact || !nextMove || !claimBoundary) {
    return NextResponse.json(
      { success: false, error: 'Need fact, nextMove, and claimBoundary. Grok does not invent those.' },
      { status: 400 },
    );
  }

  const explained = await explainWithGrok({ fact, nextMove, claimBoundary });
  if (!explained.ok) {
    return NextResponse.json({
      success: true,
      usedGrok: false,
      text: fallbackExplain({ fact, nextMove, claimBoundary }),
      reason: explained.code,
    });
  }

  return NextResponse.json({
    success: true,
    usedGrok: true,
    text: explained.text,
    model: explained.model,
  });
}
