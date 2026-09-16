import { NextRequest, NextResponse } from 'next/server';
import { buildVendorDriftActionShift } from '@/lib/vendorDriftActionShift';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    store?: unknown;
    documents?: Array<{ text?: unknown; filename?: unknown }>;
  } | null;
  const documents = (body?.documents || [])
    .map((doc) => ({
      text: typeof doc?.text === 'string' ? doc.text : '',
      filename: typeof doc?.filename === 'string' ? doc.filename : 'invoice.txt',
    }))
    .filter((doc) => doc.text.trim().length > 0);

  const built = buildVendorDriftActionShift({
    store: typeof body?.store === 'string' ? body.store : 'Your store',
    documents,
  });
  if (!built.ok) {
    return NextResponse.json({ success: false, error: built.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    result: built.result,
    compare: built.compare,
  });
}
