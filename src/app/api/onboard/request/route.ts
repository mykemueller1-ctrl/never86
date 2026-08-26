import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requestOperatorActivation } from '@/lib/operatorActivation';
import { sendNotification } from '@/lib/email';
import { Resend } from 'resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  restaurantName: z.string().min(1),
  sourcePage: z.string().optional(),
});

function activationEmailHtml(firstName: string, link: string, expiresAt: Date): string {
  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#111;font-family:system-ui,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <p style="color:#d4a017;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">Never 86'd · Free seat</p>
    <h1 style="color:#fff;font-size:28px;margin:12px 0;">Hey ${firstName}, activate your one store.</h1>
    <p style="color:#ddd;font-size:16px;line-height:1.6;">
      One location. One login. Yesterday’s numbers → one next action → night proof.
      No portal passwords. You choose your password on the next screen — we never email one.
    </p>
    <p style="margin:28px 0;">
      <a href="${link}" style="background:#0066ff;color:#fff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:600;">
        Activate my free seat →
      </a>
    </p>
    <p style="color:#888;font-size:13px;line-height:1.5;">
      Link expires ${expiresAt.toUTCString()}. If you didn’t ask for this, ignore it.
    </p>
  </div>
</body></html>`;
}

async function sendActivationEmail(email: string, name: string | undefined, link: string, expiresAt: Date) {
  if (!process.env.RESEND_API_KEY) return;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const firstName = name?.split(' ')[0] || 'there';
  await resend.emails.send({
    from: "Never 86'd <hello@never86.ai>",
    to: email,
    subject: 'Activate your free Never 86’d seat',
    html: activationEmailHtml(firstName, link, expiresAt),
  });
}

// POST /api/onboard/request — mint a one-time activation token (hashed at rest).
export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const data = bodySchema.parse(json);
    const result = await requestOperatorActivation({
      email: data.email,
      name: data.name,
      restaurantName: data.restaurantName,
      sourcePage: data.sourcePage ?? '/onboard',
      requestIp: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
    });

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }

    const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.never86.ai';
    const link = `${base.replace(/\/$/, '')}/activate?token=${encodeURIComponent(result.rawToken)}`;

    try {
      await sendActivationEmail(data.email, data.name, link, result.expiresAt);
    } catch {
      /* best-effort; token still exists */
    }

    try {
      await sendNotification(
        process.env.OWNER_EMAIL || 'myke@n86.app',
        `Activation requested · ${data.name || data.email}`,
        `<p><strong>${data.name || 'Someone'}</strong> requested the free seat.</p>
         <p>Email: ${data.email}<br/>Restaurant: ${data.restaurantName}</p>
         <p>Token minted. Password is never emailed.</p>`,
      );
    } catch {
      /* best-effort */
    }

    // Never return the raw token to the browser in production responses that
    // also email — but for local/dev without Resend, include it so the
    // stranger path can be tested.
    const includeToken = !process.env.RESEND_API_KEY || process.env.NODE_ENV !== 'production';
    return NextResponse.json({
      success: true,
      message: 'Check your email for the activation link.',
      expiresAt: result.expiresAt.toISOString(),
      ...(includeToken ? { debugActivatePath: `/activate?token=${result.rawToken}` } : {}),
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Check email and restaurant name.' }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : 'Activation request failed';
    // Missing activation table → clear blocker, not a vague 500.
    if (/operator_activation_tokens/i.test(msg)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Activation table not applied yet. Apply sql/0005_operator_activation.sql after Supabase never86 is restored.',
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ success: false, error: 'Activation request failed.' }, { status: 500 });
  }
}
