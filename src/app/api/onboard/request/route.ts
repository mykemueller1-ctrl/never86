import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  activationEmailConfigured,
  activationEmailUnavailable,
  classifyActivationEmailFailure,
  isResetActivationSource,
  listNeonOperatorsForEmail,
  normalizeEmail,
  publicActivationAccepted,
  requestOperatorActivation,
  type ActivationEmailFailure,
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
  restaurantName: z.string().min(1).max(120).optional(),
  storeName: z.string().min(1).max(120).optional(),
  sourcePage: z.string().optional(),
  purpose: z.enum(['activate', 'reset']).optional(),
});

class ActivationEmailSendError extends Error {
  readonly failure: ActivationEmailFailure;

  constructor(failure: ActivationEmailFailure) {
    super(failure.error);
    this.name = 'ActivationEmailSendError';
    this.failure = failure;
  }
}

async function sendActivationEmail(email: string, link: string, expiresAt: Date) {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    throw new ActivationEmailSendError(activationEmailUnavailable());
  }
  const resend = new Resend(key);
  const sent = await resend.emails.send(activationEmailPayload(email, link, expiresAt));
  if (sent.error) {
    console.error('[onboard/request] Resend send failed', {
      to: email,
      name: sent.error.name,
      message: sent.error.message,
    });
    throw new ActivationEmailSendError(classifyActivationEmailFailure(sent.error));
  }
  if (!sent.data?.id) {
    console.error('[onboard/request] Resend returned no message id', { to: email });
    throw new ActivationEmailSendError(activationEmailUnavailable());
  }
  console.info('[onboard/request] activation email queued', { to: email, resendId: sent.data.id });
}

// POST /api/onboard/request — mint a one-time activation token on Neon (hashed at rest).
export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const data = bodySchema.parse(json);
    const resetOnly = data.purpose === 'reset' || isResetActivationSource(data.sourcePage);
    let restaurantName = (data.restaurantName || data.storeName || '').trim().replace(/\s+/g, ' ');
    if (resetOnly) {
      const existing = await listNeonOperatorsForEmail(data.email);
      if (existing.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No seat on this email yet. Claim one at /onboard.', code: 'no_seat' },
          { status: 404 },
        );
      }
      if (!restaurantName) restaurantName = existing[0].restaurantName;
    } else if (!restaurantName) {
      return NextResponse.json(
        { success: false, error: 'Enter your email and store name.' },
        { status: 400 },
      );
    }

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
      restaurantName,
      sourcePage: resetOnly ? '/login/reset' : (data.sourcePage ?? '/onboard'),
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
        throw new ActivationEmailSendError(activationEmailUnavailable());
      }
      await sendActivationEmail(data.email, link, result.expiresAt);
    } catch (err) {
      const failure =
        err instanceof ActivationEmailSendError ? err.failure : activationEmailUnavailable();
      return NextResponse.json(
        { success: false, error: failure.error, code: failure.code },
        { status: failure.status },
      );
    }

    return NextResponse.json(publicActivationAccepted(result.expiresAt));
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Enter a valid email and store name.' }, { status: 400 });
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
