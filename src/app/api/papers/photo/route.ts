import { NextRequest, NextResponse } from 'next/server';
import { intakeFileTooLarge, MAX_INVOICE_UPLOAD_BYTES, paperFromPhoto } from '@/lib/papersDirectIntake';
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
        error: 'Attach a photo as file.',
        note: 'No photo landed. The paper is Missing — not $0. No invented $.',
        text: '',
        connection: papersConnectionFor(operatorId),
      }, { status: 400 });
    }
    if (intakeFileTooLarge(file.size)) {
      return NextResponse.json({
        success: false,
        honesty: 'Missing',
        error: `File is over ${MAX_INVOICE_UPLOAD_BYTES} bytes.`,
        note: 'Photo is too large. The paper stays Missing. No invented $.',
        text: '',
        filename: file.name,
        connection: papersConnectionFor(operatorId),
      }, { status: 413 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const paper = await rememberDirectPaper(operatorId, paperFromPhoto(bytes, file.name || 'photo', file.type || ''));
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
