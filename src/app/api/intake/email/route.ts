import { NextResponse } from 'next/server';
import { ingestCloseDocuments } from '@/lib/deskClose';
import { describePdqEodPacket } from '@/lib/pdqEodPacket';
import {
  isPdqEodSender,
  isPdqEodSubject,
  type IntakeDocument,
} from '@/lib/closeIntake';
import { extractNativePdfText } from '@/lib/pdqEodParse';
import { findFreeSeatOperator, isFreeSeatOperatorId } from '@/lib/operatorActivation';
import { recordIntakeAndClose } from '@/lib/seatCloseStore';
import { inboundOperatorId, isSafeSnsSubscribeUrl, normalizeInboundPayload } from '@/lib/inboundMail';

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

async function confirmSnsSubscribe(url: string): Promise<boolean> {
  if (!isSafeSnsSubscribeUrl(url)) return false;
  const res = await fetch(url, { method: 'GET', redirect: 'error' });
  return res.ok;
}

export async function POST(req: Request) {
  const raw = await req.text();
  let json: unknown = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    json = null;
  }
  const normalized = normalizeInboundPayload(json);

  if (normalized.kind === 'sns-subscribe') {
    const ok = await confirmSnsSubscribe(normalized.subscribeUrl);
    return NextResponse.json({ success: ok, sns: 'confirmed' }, { status: ok ? 200 : 400 });
  }

  if (normalized.kind !== 'mail') {
    return NextResponse.json({ success: false, error: 'Expected JSON inbound mail.' }, { status: 400 });
  }

  const mail = normalized.mail;
  const operatorId = inboundOperatorId(mail);
  if (!operatorId || !isFreeSeatOperatorId(operatorId)) {
    return NextResponse.json({
      success: false,
      error: 'Forward the PDQ EOD to close+{operatorId}@inbound.never86.ai for the free seat.',
    }, { status: 400 });
  }

  const docs: IntakeDocument[] = [];
  const bodyText = mail.text || (mail.html ? stripHtml(mail.html) : '');
  if (bodyText) {
    docs.push({
      channel: 'email',
      from: mail.from,
      filename: mail.subject || 'forwarded-email.txt',
      text: bodyText,
    });
  }
  for (const att of mail.attachments || []) {
    const filename = att.filename || 'attachment.txt';
    const content = att.content || att.data;
    if (!content) continue;
    docs.push({
      channel: 'email',
      from: mail.from,
      filename,
      text: decodeAttachment(filename, content),
    });
  }

  const looksLikePdq = isPdqEodSender(mail.from) || isPdqEodSubject(mail.subject)
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
  let desk = ingested.desk;
  if (operator?.locationId) {
    try {
      const saved = await recordIntakeAndClose({
        operatorId,
        locationId: operator.locationId,
        docs,
        desk: ingested.desk,
      });
      persisted = saved.persisted;
      desk = saved.desk;
    } catch {
      persisted = false;
    }
  }

  const packet = describePdqEodPacket({
    businessDate: desk.businessDate,
    landed: desk.families,
  });

  return NextResponse.json({
    success: true,
    businessDate: desk.businessDate,
    families: desk.families,
    missingFamilies: packet.missing,
    complete: packet.complete,
    exportPath: packet.exportPath,
    persisted,
  });
}
