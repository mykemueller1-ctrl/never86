import { NextRequest, NextResponse } from 'next/server';
import { intakeFileTooLarge, MAX_INVOICE_UPLOAD_BYTES, paperFromChat, paperFromUpload } from '@/lib/papersDirectIntake';
import { filesFromForm, papersIntakeLead } from '@/lib/papersIntakeHelpers';
import { hydratePapersConnection, papersConnectionFor, rememberDirectPaper } from '@/lib/papersInboxHttp';
import { withSimpleOwnerTenant } from '@/lib/simpleOwnerDemo/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function readChatRequest(req: NextRequest): Promise<{ text: string; files: File[] } | null> {
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => null) as { text?: unknown } | null;
    const text = typeof body?.text === 'string' ? body.text : '';
    return { text, files: [] };
  }
  const form = await req.formData().catch(() => null);
  if (!form) return null;
  const text = String(form.get('text') ?? '');
  return { text, files: filesFromForm(form) };
}

export async function POST(req: NextRequest) {
  return withSimpleOwnerTenant(req, async (operatorId) => {
    await hydratePapersConnection(operatorId);
    const connection = papersConnectionFor(operatorId);
    const intake = papersIntakeLead(connection);
    const read = await readChatRequest(req);
    const text = read?.text.trim() ?? '';
    const files = read?.files ?? [];
    if (!text && files.length === 0) {
      return NextResponse.json({
        success: false,
        honesty: 'Missing',
        error: 'Send text or a file.',
        note: 'Chat is Missing. A sentence is not a price. No invented $.',
        text: '',
        connection,
        lead: intake.lead,
        elevated: intake.elevated,
      }, { status: 400 });
    }
    const tooBig = files.find((file) => intakeFileTooLarge(file.size));
    if (tooBig) {
      return NextResponse.json({
        success: false,
        honesty: 'Missing',
        error: `File is over ${MAX_INVOICE_UPLOAD_BYTES} bytes.`,
        note: 'That file stays Missing. No invented $.',
        text: '',
        filename: tooBig.name,
        connection,
        lead: intake.lead,
        elevated: intake.elevated,
      }, { status: 413 });
    }
    const papers = [];
    for (const file of files) {
      papers.push(await rememberDirectPaper(
        operatorId,
        paperFromUpload(new Uint8Array(await file.arrayBuffer()), file.name || 'chat-file', file.type || ''),
      ));
    }
    const chat = text ? await rememberDirectPaper(operatorId, paperFromChat(text)) : null;
    if (chat) papers.push(chat);
    const paper = chat ?? papers[0];
    return NextResponse.json({
      success: true,
      honesty: paper?.honesty ?? 'Missing',
      filename: paper?.filename ?? 'chat',
      text: paper?.text ?? '',
      note: chat?.note ?? paper?.note ?? 'Missing.',
      kind: 'chat',
      folder: paper?.folder ?? 'chat',
      paper,
      papers,
      connection,
      lead: intake.lead,
      elevated: intake.elevated,
    });
  });
}
