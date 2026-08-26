import { NextResponse } from 'next/server';
import { ingestCloseDocuments } from '@/lib/deskClose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const json = await req.json().catch(() => null) as {
    text?: string;
    filename?: string;
    documents?: Array<{ text: string; filename?: string }>;
  } | null;
  const docs = [
    ...(json?.text ? [{ channel: 'paste' as const, text: json.text, filename: json.filename }] : []),
    ...((json?.documents ?? []).map((d) => ({ channel: 'paste' as const, text: d.text, filename: d.filename }))),
  ];
  const ingested = ingestCloseDocuments(docs);
  if (!ingested.ok) {
    return NextResponse.json({ success: false, error: ingested.error }, { status: ingested.status });
  }
  return NextResponse.json({ success: true, desk: ingested.desk });
}
