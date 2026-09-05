import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  activationEmailConfigured,
  normalizeEmail,
  publicActivationAccepted,
  requestOperatorActivation,
} from '@/lib/operatorActivation';
import { Resend } from 'resend';
import { pickTrustedClientIp } from '@/lib/trustedClientIp';
import { allowAuthAttempt } from '@/lib/authThrottle';
import { activationEmailPayload, buildOwnerDeskActivationLink } from '@/lib/ownerDeskAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  restaurantName: z.string().optional(),
  sourcePage: z.string().optional(),
});

async function sendActivationEmail(email: string, link: string, expiresAt: Date) {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    throw new Error('ACTIVATION_EMAIL_UNAVAILABLE');
  }
  const resend = new Resend(key);
  const sent = await resend.emails.send(activationEmailPayload(email, link, expiresAt));
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
    const link = buildOwnerDeskActivationLink(base, result.rawToken);

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
