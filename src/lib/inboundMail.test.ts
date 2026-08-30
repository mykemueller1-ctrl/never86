import { describe, expect, it } from 'vitest';
import {
  inboundOperatorId,
  isSafeSnsSubscribeUrl,
  normalizeInboundPayload,
  parseSimpleMime,
} from './inboundMail';

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
});
