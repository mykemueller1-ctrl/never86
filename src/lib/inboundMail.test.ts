import { describe, expect, it } from 'vitest';
import {
  inboundOperatorId,
  isSafeSnsSubscribeUrl,
  normalizeInboundPayload,
  parseSimpleMime,
} from './inboundMail';
import { extractNativePdfText } from './pdqEodParse';

const MIME = [
  'From: PDQ Reports <pdqreports@pdqpos.com>',
  'To: close+1000001@inbound.never86.ai',
  'Subject: EOD Reports',
  'Content-Type: multipart/mixed; boundary=b1',
  '',
  '--b1',
  'Content-Type: text/plain; charset=utf-8',
  '',
  'ZReport_Summary',
  'Business Date: 08/28/2026',
  'Subtotal: $1,000.00',
  '--b1--',
].join('\n');

describe('SNS subscribe URL allowlist', () => {
  it('allows amazonaws.com HTTPS only', () => {
    expect(isSafeSnsSubscribeUrl('https://sns.us-east-1.amazonaws.com/?Action=ConfirmSubscription&Token=abc')).toBe(true);
    expect(isSafeSnsSubscribeUrl('https://evil.example/confirm')).toBe(false);
    expect(isSafeSnsSubscribeUrl('http://sns.us-east-1.amazonaws.com/?Action=ConfirmSubscription')).toBe(false);
  });
});

describe('simple MIME', () => {
  it('reads plus-address, PDQ sender, and body text', () => {
    const mail = parseSimpleMime(MIME);
    expect(mail.to).toBe('close+1000001@inbound.never86.ai');
    expect(mail.from).toMatch(/pdqreports@pdqpos.com/i);
    expect(mail.subject).toBe('EOD Reports');
    expect(mail.text).toMatch(/ZReport_Summary/);
    expect(inboundOperatorId(mail)).toBe(1_000_001);
  });
});

describe('normalizeInboundPayload', () => {
  it('keeps the existing JSON shape', () => {
    const result = normalizeInboundPayload({
      from: 'pdqreports@pdqpos.com',
      to: 'close+1000002@inbound.never86.ai',
      subject: 'EOD Reports',
      text: 'Void_Promo',
    });
    expect(result.kind).toBe('mail');
    if (result.kind !== 'mail') return;
    expect(inboundOperatorId(result.mail)).toBe(1_000_002);
  });

  it('reads Postmark aliases', () => {
    const result = normalizeInboundPayload({
      From: 'pdqreports@pdqpos.com',
      To: 'close+1000003@inbound.never86.ai',
      Subject: 'EOD Reports',
      TextBody: 'Hourly_Sales',
    });
    expect(result.kind).toBe('mail');
    if (result.kind !== 'mail') return;
    expect(result.mail.text).toBe('Hourly_Sales');
    expect(inboundOperatorId(result.mail)).toBe(1_000_003);
  });

  it('confirms SES SNS subscribe only for amazonaws HTTPS', () => {
    const result = normalizeInboundPayload({
      Type: 'SubscriptionConfirmation',
      SubscribeURL: 'https://sns.us-east-1.amazonaws.com/?Action=ConfirmSubscription&Token=t',
    });
    expect(result).toEqual({
      kind: 'sns-subscribe',
      subscribeUrl: 'https://sns.us-east-1.amazonaws.com/?Action=ConfirmSubscription&Token=t',
    });
    expect(normalizeInboundPayload({
      Type: 'SubscriptionConfirmation',
      SubscribeURL: 'https://evil.test/steal',
    }).kind).toBe('empty');
  });

  it('unwraps SES Received notification with raw MIME content', () => {
    const result = normalizeInboundPayload({
      Type: 'Notification',
      Message: JSON.stringify({
        notificationType: 'Received',
        mail: {
          source: 'pdqreports@pdqpos.com',
          destination: ['close+1000001@inbound.never86.ai'],
          commonHeaders: { subject: 'EOD Reports', from: ['pdqreports@pdqpos.com'] },
        },
        content: MIME,
      }),
    });
    expect(result.kind).toBe('mail');
    if (result.kind !== 'mail') return;
    expect(inboundOperatorId(result.mail)).toBe(1_000_001);
    expect(result.mail.text).toMatch(/ZReport_Summary/);
  });

  it('reads Postmark Name/Content attachments', () => {
    const result = normalizeInboundPayload({
      From: 'pdqreports@pdqpos.com',
      To: 'close+1000003@inbound.never86.ai',
      Subject: 'EOD Reports',
      TextBody: 'EOD Reports Generated From Sample Kitchen',
      Attachments: [
        { Name: '9-2-2026 Void_Promo_Report Sample Kitchen.pdf', Content: Buffer.from('%PDF-1.1\n(Void_Promo)\n').toString('base64') },
      ],
    });
    expect(result.kind).toBe('mail');
    if (result.kind !== 'mail') return;
    expect(result.mail.attachments).toEqual([
      expect.objectContaining({ filename: '9-2-2026 Void_Promo_Report Sample Kitchen.pdf' }),
    ]);
  });
});

function syntheticPdf(label: string): string {
  return Buffer.from(`%PDF-1.1\n(${label})\n`).toString('base64');
}

function eodMime(filenames: string[]): string {
  const parts = [
    'From: PDQ Reports <pdqreports@pdqpos.com>',
    'To: close+1000001@inbound.never86.ai',
    'Subject: EOD Reports Generated From Sample Kitchen',
    'Content-Type: multipart/mixed; boundary=b1',
    '',
    '--b1',
    'Content-Type: text/plain; charset=utf-8',
    '',
    'EOD Reports Generated From Sample Kitchen',
    filenames.join('\n'),
  ];
  for (const filename of filenames) {
    parts.push(
      '--b1',
      `Content-Type: application/pdf; name="${filename}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${filename}"`,
      '',
      syntheticPdf(filename),
    );
  }
  parts.push('--b1--');
  return parts.join('\n');
}

describe('PDQ EOD MIME attachments', () => {
  it('extracts Z, Hourly, and Void PDF parts from one EOD message', () => {
    const mail = parseSimpleMime(eodMime([
      '9-2-2026 ZReport_Summary Sample Kitchen.pdf',
      '9-2-2026 Hourly_Sales_Report Sample Kitchen.pdf',
      '9-2-2026 Void_Promo_Report Sample Kitchen.pdf',
    ]));
    expect(mail.attachments?.map((row) => row.filename)).toEqual([
      '9-2-2026 ZReport_Summary Sample Kitchen.pdf',
      '9-2-2026 Hourly_Sales_Report Sample Kitchen.pdf',
      '9-2-2026 Void_Promo_Report Sample Kitchen.pdf',
    ]);
    expect(mail.text).toMatch(/EOD Reports Generated From Sample Kitchen/);
    const labels = (mail.attachments || []).map((row) => extractNativePdfText(
      Uint8Array.from(Buffer.from(row.content || '', 'base64')),
    ));
    expect(labels.join('\n')).toMatch(/ZReport_Summary/);
    expect(labels.join('\n')).toMatch(/Hourly_Sales_Report/);
    expect(labels.join('\n')).toMatch(/Void_Promo_Report/);
  });

  it('keeps a Void-only EOD as one attachment so missing Z/Hourly stay labeled', () => {
    const mail = parseSimpleMime(eodMime([
      '9-2-2026 Void_Promo_Report Sample Kitchen.pdf',
    ]));
    expect(mail.attachments).toHaveLength(1);
    expect(mail.attachments?.[0].filename).toBe('9-2-2026 Void_Promo_Report Sample Kitchen.pdf');
  });

  it('unwraps SES content with the three PDF attachments', () => {
    const result = normalizeInboundPayload({
      Type: 'Notification',
      Message: JSON.stringify({
        notificationType: 'Received',
        mail: {
          source: 'pdqreports@pdqpos.com',
          destination: ['close+1000001@inbound.never86.ai'],
          commonHeaders: { subject: 'EOD Reports', from: ['pdqreports@pdqpos.com'] },
        },
        content: eodMime([
          '9-2-2026 ZReport_Summary Sample Kitchen.pdf',
          '9-2-2026 Hourly_Sales_Report Sample Kitchen.pdf',
          '9-2-2026 Void_Promo_Report Sample Kitchen.pdf',
        ]),
      }),
    });
    expect(result.kind).toBe('mail');
    if (result.kind !== 'mail') return;
    expect(result.mail.attachments).toHaveLength(3);
  });
});
