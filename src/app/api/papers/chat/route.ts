import { NextRequest, NextResponse } from 'next/server';
import { intakeFileTooLarge, MAX_INVOICE_UPLOAD_BYTES, paperFromChat, paperFromUpload } from '@/lib/papersDirectIntake';
import { hydratePapersConnection, papersConnectionFor, rememberDirectPaper } from '@/lib/papersInboxHttp';
import { withSimpleOwnerTenant } from '@/lib/simpleOwnerDemo/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function readChatRequest(req: NextRequest): Promise<{ text: string; file: File | null } | null> {
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => null) as { text?: unknown } | null;
    const text = typeof body?.text === 'string' ? body.text : '';
    return { text, file: null };
  }
  const form = await req.formData().catch(() => null);
  if (!form) return null;
  const text = String(form.get('text') ?? '');
  const file = form.get('file');
  return { text, file: file instanceof File ? file : null };
}

export async function POST(req: NextRequest) {
  return withSimpleOwnerTenant(req, async (operatorId) => {
    await hydratePapersConnection(operatorId);
    const read = await readChatRequest(req);
    const text = read?.text.trim() ?? '';
    const file = read?.file ?? null;
    if (!text && !file) {
      return NextResponse.json({
        success: false,
        honesty: 'Missing',
        error: 'Send text or a file.',
        note: 'Chat is Missing. A sentence is not a price. No invented $.',
        text: '',
        connection: papersConnectionFor(operatorId),
      }, { status: 400 });
    }
    if (file && intakeFileTooLarge(file.size)) {
      return NextResponse.json({
        success: false,
        honesty: 'Missing',
        error: `File is over ${MAX_INVOICE_UPLOAD_BYTES} bytes.`,
        note: 'That file stays Missing. No invented $.',
        text: '',
        connection: papersConnectionFor(operatorId),
      }, { status: 413 });
    }
    const chat = text ? await rememberDirectPaper(operatorId, paperFromChat(text)) : null;
    const uploaded = file
      ? await rememberDirectPaper(
        operatorId,
        paperFromUpload(new Uint8Array(await file.arrayBuffer()), file.name || 'chat-file', file.type || ''),
      )
      : null;
    const paper = uploaded ?? chat;
    return NextResponse.json({
      success: true,
      honesty: paper?.honesty ?? 'Missing',
      filename: paper?.filename ?? 'chat',
      text: paper?.text ?? '',
      note: chat?.note ?? paper?.note ?? 'Missing.',
      kind: 'chat',
      folder: paper?.folder ?? 'chat',
      paper,
      connection: papersConnectionFor(operatorId),
    });
  });
}
