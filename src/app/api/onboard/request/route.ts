import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  activationEmailConfigured,
  normalizeEmail,
  publicActivationAccepted,
  requestOperatorActivation,
} from '@/lib/operatorActivation';
import { Resend } from 'resend';
import { escapeHtml } from '@/lib/escapeHtml';
import { pickTrustedClientIp } from '@/lib/trustedClientIp';
import { allowAuthAttempt } from '@/lib/authThrottle';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  restaurantName: z.string().optional(),
  sourcePage: z.string().optional(),
});

function activationEmailHtml(link: string, expiresAt: Date): string {
  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#111;font-family:system-ui,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <p style="color:#d4a017;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">Never 86'd · Free seat</p>
    <h1 style="color:#fff;font-size:28px;margin:12px 0;">Open your Never 86'd operator.</h1>
    <p style="color:#ddd;font-size:16px;line-height:1.6;">
      Payroll. Prices. Process. Click once to find the leak, see the receipt, and get the next move.
      No password. No sales call.
    </p>
    <p style="margin:28px 0;">
      <a href="${escapeHtml(link)}" style="background:#0066ff;color:#fff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:600;">
        Open Never 86'd →
      </a>
    </p>
    <p style="color:#888;font-size:13px;line-height:1.5;">
      Link expires ${escapeHtml(expiresAt.toUTCString())}. If you didn’t ask for this, ignore it.
    </p>
  </div>
</body></html>`;
}

async function sendActivationEmail(email: string, link: string, expiresAt: Date) {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    throw new Error('ACTIVATION_EMAIL_UNAVAILABLE');
  }
  const resend = new Resend(key);
  const sent = await resend.emails.send({
    from: "Never 86'd <hello@never86.ai>",
    to: email,
    subject: "Your secure Never 86'd sign-in link",
    html: activationEmailHtml(link, expiresAt),
  });
  if (sent.error) {
    throw new Error('ACTIVATION_EMAIL_UNAVAILABLE');
  }
}

// POST /api/onboard/request — mint a one-time activation token on Neon (hashed at rest).
export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const data = bodySchema.parse(json);
    const requestIp = pickTrustedClientIp(req.headers);
    const email = normalizeEmail(data.email);

    if (!allowAuthAttempt({ kind: 'activation', email, ip: requestIp })) {
      return NextResponse.json(
        { success: false, error: 'Too many activation emails. Try again in an hour.', code: 'rate_limited' },
        { status: 429 },
      );
    }

    const result = await requestOperatorActivation({
      email: data.email,
      name: data.name,
      restaurantName: data.restaurantName || 'My restaurant',
      sourcePage: data.sourcePage ?? '/onboard',
      requestIp,
      userAgent: req.headers.get('user-agent') ?? undefined,
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error, ...(result.code ? { code: result.code } : {}) },
        { status: result.status },
      );
    }

    const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.never86.ai';
    const link = `${base.replace(/\/$/, '')}/activate?token=${encodeURIComponent(result.rawToken)}`;

    try {
      if (!activationEmailConfigured()) {
        throw new Error('ACTIVATION_EMAIL_UNAVAILABLE');
      }
      await sendActivationEmail(data.email, link, result.expiresAt);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Activation email is unavailable. Try again later.',
          code: 'activation_email_unavailable',
        },
        { status: 503 },
      );
    }

    return NextResponse.json(publicActivationAccepted(result.expiresAt));
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Enter a valid email.' }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : 'Activation request failed';
    if (/seat_activation_tokens|relation .* does not exist/i.test(msg)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Free-seat schema is still warming up. Retry once — tables auto-create on Neon.',
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ success: false, error: 'Activation request failed.' }, { status: 500 });
  }
}
