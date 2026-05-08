import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const USER_ID_SCHEMA = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9:_-]+$/);

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const globalRateLimitStore = globalThis as typeof globalThis & {
  __never86RateLimits?: Map<string, RateLimitEntry>;
};

const rateLimitStore = globalRateLimitStore.__never86RateLimits ?? new Map<string, RateLimitEntry>();
globalRateLimitStore.__never86RateLimits = rateLimitStore;
let lastRateLimitCleanupAt = Date.now();

function extractBearerToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7).trim();
}

function secureTokenMatch(provided: string | null, expected: string) {
  if (!provided) return false;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export function responseUnauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function responseBadRequest(message = 'Invalid request') {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function responseRateLimited(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: 'Too many requests' },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfterSeconds.toString(),
      },
    }
  );
}

export function responseInternalError() {
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function requireBearerTokenFromEnv(req: NextRequest, envName: string) {
  const expected = process.env[envName];
  if (!expected) {
    return { ok: false as const, response: responseInternalError() };
  }

  const provided = extractBearerToken(req);
  if (!secureTokenMatch(provided, expected)) {
    return { ok: false as const, response: responseUnauthorized() };
  }

  return { ok: true as const };
}

export function requireUserIdHeader(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  const validatedUserId = validateUserId(userId);
  if (!validatedUserId) {
    return { ok: false as const, response: responseBadRequest('Invalid request') };
  }
  return { ok: true as const, userId: validatedUserId };
}

export function validateUserId(userId: string | null | undefined) {
  const parsed = USER_ID_SCHEMA.safeParse(userId);
  return parsed.success ? parsed.data : null;
}

export function checkRateLimit(req: NextRequest, key: string, max: number, windowMs: number) {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const forwardedIp = forwardedFor?.split(',')[0]?.trim();
  let ip = forwardedIp || req.ip?.trim();
  if (!ip) {
    if (process.env.NODE_ENV === 'production') {
      return responseBadRequest('Unable to determine client identity');
    }
    ip = 'local-dev';
  }

  const now = Date.now();
  if (now - lastRateLimitCleanupAt >= windowMs) {
    rateLimitStore.forEach((entry, entryKey) => {
      if (now >= entry.resetAt) {
        rateLimitStore.delete(entryKey);
      }
    });
    lastRateLimitCleanupAt = now;
  }

  const storeKey = `${key}:${ip}`;
  const existing = rateLimitStore.get(storeKey);

  if (!existing || now >= existing.resetAt) {
    rateLimitStore.set(storeKey, { count: 1, resetAt: now + windowMs });
    return null;
  }

  existing.count += 1;
  rateLimitStore.set(storeKey, existing);

  if (existing.count > max) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return responseRateLimited(retryAfterSeconds);
  }

  return null;
}
