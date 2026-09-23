import { NextRequest, NextResponse } from 'next/server';
import { intakeFileTooLarge, MAX_INVOICE_UPLOAD_BYTES, paperFromUpload } from '@/lib/papersDirectIntake';
import { hydratePapersConnection, papersConnectionFor, rememberDirectPaper } from '@/lib/papersInboxHttp';
import { withSimpleOwnerTenant } from '@/lib/simpleOwnerDemo/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return withSimpleOwnerTenant(req, async (operatorId) => {
    await hydratePapersConnection(operatorId);
    const form = await req.formData().catch(() => null);
    const file = form?.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({
        success: false,
        honesty: 'Missing',
        error: 'Attach a PDF, CSV, or TXT as file.',
        note: 'No file landed. Invoice text is Missing — not $0. No invented $.',
        text: '',
        connection: papersConnectionFor(operatorId),
      }, { status: 400 });
    }
    if (intakeFileTooLarge(file.size)) {
      return NextResponse.json({
        success: false,
        honesty: 'Missing',
        error: `File is over ${MAX_INVOICE_UPLOAD_BYTES} bytes.`,
        note: 'File is too large. Invoice text stays Missing. No invented $.',
        text: '',
        filename: file.name,
        connection: papersConnectionFor(operatorId),
      }, { status: 413 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const paper = await rememberDirectPaper(operatorId, paperFromUpload(bytes, file.name || 'invoice', file.type || ''));
    return NextResponse.json({
      success: true,
      honesty: paper.honesty,
      filename: paper.filename,
      text: paper.text,
      note: paper.note,
      kind: paper.kind,
      folder: paper.folder,
      paper,
      connection: papersConnectionFor(operatorId),
    });
  });
}
