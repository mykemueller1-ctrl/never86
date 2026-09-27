import { NextRequest, NextResponse } from 'next/server';
import {
  invoiceUploadTooLarge,
  MAX_INVOICE_UPLOAD_BYTES,
  readPublicInvoiceUpload,
} from '@/lib/invoiceFileIntake';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json(
      {
        success: false,
        honesty: 'Missing',
        error: 'Attach a PDF, CSV, TXT, or HEIC as file.',
        note: 'No file landed. Invoice text is Missing — not $0.',
        text: '',
      },
      { status: 400 },
    );
  }
  if (invoiceUploadTooLarge(file.size)) {
    return NextResponse.json(
      {
        success: false,
        honesty: 'Missing',
        error: `File is over ${MAX_INVOICE_UPLOAD_BYTES} bytes.`,
        note: 'File is too large to read on this seat. Invoice text stays Missing. No invented $.',
        text: '',
        filename: file.name,
      },
      { status: 413 },
    );
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const read = readPublicInvoiceUpload(bytes, file.name || 'invoice', file.type || '');
  return NextResponse.json(read);
}
