import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ingestCloseDocuments } from '@/lib/deskClose';
import { extractNativePdfText } from '@/lib/pdqEodParse';
import { readOperatorSession } from '@/lib/readOperatorSession';
import { findFreeSeatOperator, isFreeSeatOperatorId } from '@/lib/operatorActivation';
import { recordIntakeAndClose } from '@/lib/seatCloseStore';
import type { IntakeDocument } from '@/lib/closeIntake';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const jsonSchema = z.object({
  text: z.string().optional(),
  filename: z.string().optional(),
  documents: z.array(z.object({
    text: z.string(),
    filename: z.string().optional(),
  })).optional(),
});

function decodeUpload(file: File): Promise<IntakeDocument> {
  return file.arrayBuffer().then((buf) => {
    const bytes = new Uint8Array(buf);
    const text = file.name.toLowerCase().endsWith('.pdf') || bytes[0] === 0x25
      ? extractNativePdfText(bytes)
      : new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    return { channel: 'file' as const, filename: file.name, text };
  });
}

export async function POST(req: Request) {
  const session = await readOperatorSession();
  if (!session || !isFreeSeatOperatorId(session.operatorId)) {
    return NextResponse.json({ success: false, error: 'Sign in to your free seat first.' }, { status: 401 });
  }

  const contentType = req.headers.get('content-type') || '';
  const docs: IntakeDocument[] = [];

  try {
    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const paste = String(form.get('text') || '');
      if (paste.trim()) docs.push({ channel: 'paste', text: paste, filename: String(form.get('filename') || 'paste.txt') });
      for (const value of form.getAll('file')) {
        if (value instanceof File && value.size > 0) docs.push(await decodeUpload(value));
      }
    } else {
      const json = jsonSchema.parse(await req.json());
      if (json.text) docs.push({ channel: 'paste', text: json.text, filename: json.filename });
      for (const doc of json.documents ?? []) {
        docs.push({ channel: 'file', text: doc.text, filename: doc.filename });
      }
    }
  } catch {
    return NextResponse.json({ success: false, error: 'Could not read that close.' }, { status: 400 });
  }

  const operator = await findFreeSeatOperator(session.operatorId).catch(() => null);
  const ingested = ingestCloseDocuments(docs, operator?.restaurantName);
  if (!ingested.ok) {
    return NextResponse.json({ success: false, error: ingested.error }, { status: ingested.status });
  }

  let persisted = false;
  let closeId: number | null = null;
  if (operator?.locationId) {
    try {
      const saved = await recordIntakeAndClose({
        operatorId: operator.operatorId,
        locationId: operator.locationId,
        docs,
        desk: ingested.desk,
      });
      persisted = saved.persisted;
      closeId = saved.closeId;
    } catch {
      persisted = false;
    }
  }

  return NextResponse.json({
    success: true,
    desk: ingested.desk,
    closeId,
    persisted,
    applySql: persisted ? undefined : 'Apply drizzle/0003_free_seat_intake.sql on Neon to keep the close overnight.',
  });
}
