import { NextRequest, NextResponse } from 'next/server';
import { intakeFileTooLarge, MAX_INVOICE_UPLOAD_BYTES, paperFromPhoto } from '@/lib/papersDirectIntake';
import { filesFromForm, papersIntakeLead } from '@/lib/papersIntakeHelpers';
import { hydratePapersConnection, papersConnectionFor, rememberDirectPaper } from '@/lib/papersInboxHttp';
import { withSimpleOwnerTenant } from '@/lib/simpleOwnerDemo/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return withSimpleOwnerTenant(req, async (operatorId) => {
    await hydratePapersConnection(operatorId);
    const connection = papersConnectionFor(operatorId);
    const intake = papersIntakeLead(connection);
    const form = await req.formData().catch(() => null);
    const files = filesFromForm(form);
    if (files.length === 0) {
      return NextResponse.json({
        success: false,
        honesty: 'Missing',
        error: 'Attach a photo as file or files.',
        note: 'No photo landed. The paper is Missing — not $0. No invented $.',
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
        note: 'Photo is too large. The paper stays Missing. No invented $.',
        text: '',
        filename: tooBig.name,
        connection,
        lead: intake.lead,
        elevated: intake.elevated,
      }, { status: 413 });
    }
    const papers = [];
    for (const file of files) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      papers.push(await rememberDirectPaper(
        operatorId,
        paperFromPhoto(bytes, file.name || 'photo', file.type || ''),
      ));
    }
    const paper = papers[0];
    return NextResponse.json({
      success: true,
      honesty: paper.honesty,
      filename: paper.filename,
      text: paper.text,
      note: paper.note,
      kind: paper.kind,
      folder: paper.folder,
      paper,
      papers,
      connection,
      lead: intake.lead,
      elevated: intake.elevated,
    });
  });
}
