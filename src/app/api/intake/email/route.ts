import { NextResponse } from 'next/server';
import { ingestCloseDocuments } from '@/lib/deskClose';
import {
  isPdqEodSender,
  isPdqEodSubject,
  parseIntakeOperatorId,
  type IntakeDocument,
} from '@/lib/closeIntake';
import { extractNativePdfText } from '@/lib/pdqEodParse';
import { findFreeSeatOperator, isFreeSeatOperatorId } from '@/lib/operatorActivation';
import { recordIntakeAndClose } from '@/lib/seatCloseStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeAttachment(filename: string, content: string): string {
  try {
    const bytes = Uint8Array.from(Buffer.from(content, 'base64'));
    return filename.toLowerCase().endsWith('.pdf') || bytes[0] === 0x25
      ? extractNativePdfText(bytes)
      : Buffer.from(bytes).toString('utf8');
  } catch {
    return content;
  }
}

type InboundMail = {
  from?: string;
  to?: string | string[];
  cc?: string | string[];
  subject?: string;
  text?: string;
  html?: string;
  attachments?: Array<{ filename?: string; content?: string; data?: string }>;
};

export async function POST(req: Request) {
  const json = await req.json().catch(() => null) as InboundMail | null;
  if (!json) {
    return NextResponse.json({ success: false, error: 'Expected JSON inbound mail.' }, { status: 400 });
  }

  const operatorId = parseIntakeOperatorId(json.to) ?? parseIntakeOperatorId(json.cc);
  if (!operatorId || !isFreeSeatOperatorId(operatorId)) {
    return NextResponse.json({
      success: false,
      error: 'Forward the PDQ EOD to close+{operatorId}@inbound.never86.ai for the free seat.',
    }, { status: 400 });
  }

  const docs: IntakeDocument[] = [];
  const bodyText = json.text || (json.html ? stripHtml(json.html) : '');
  if (bodyText) {
    docs.push({
      channel: 'email',
      from: json.from,
      filename: json.subject || 'forwarded-email.txt',
      text: bodyText,
    });
  }
  for (const att of json.attachments || []) {
    const filename = att.filename || 'attachment.txt';
    const content = att.content || att.data;
    if (!content) continue;
    docs.push({
      channel: 'email',
      from: json.from,
      filename,
      text: decodeAttachment(filename, content),
    });
  }

  const looksLikePdq = isPdqEodSender(json.from) || isPdqEodSubject(json.subject)
    || docs.some((d) => /zreport|hourly_sales|void_promo|z report|hourly sales/i.test(d.filename || d.text.slice(0, 400)));
  if (!looksLikePdq) {
    return NextResponse.json({
      success: false,
      error: 'Inbox only accepts PDQ EOD Reports (Z / Void / Hourly). No portal passwords.',
    }, { status: 422 });
  }

  const operator = await findFreeSeatOperator(operatorId).catch(() => null);
  const ingested = ingestCloseDocuments(docs, operator?.restaurantName);
  if (!ingested.ok) {
    return NextResponse.json({ success: false, error: ingested.error }, { status: ingested.status });
  }

  let persisted = false;
  if (operator?.locationId) {
    try {
      const saved = await recordIntakeAndClose({
        operatorId,
        locationId: operator.locationId,
        docs,
        desk: ingested.desk,
      });
      persisted = saved.persisted;
    } catch {
      persisted = false;
    }
  }

  return NextResponse.json({
    success: true,
    businessDate: ingested.desk.businessDate,
    families: ingested.desk.families,
    persisted,
  });
}
