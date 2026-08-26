import { and, eq, gt, sql as dsql } from 'drizzle-orm';
import { db } from '../db';
import { seatAuthAttempts } from '../db/schema';
import { neonConfigured } from './operatorActivation';

export const AUTH_THROTTLE_WINDOW_MS = 1000 * 60 * 60;

export const AUTH_THROTTLE_LIMITS = {
  login: { email: 8, ip: 30 },
  activation: { email: 5, ip: 12 },
} as const;

export type AuthThrottleKind = keyof typeof AUTH_THROTTLE_LIMITS;

const buckets = new Map<string, number[]>();

function prune(key: string, nowMs: number): number[] {
  const times = (buckets.get(key) ?? []).filter((t) => nowMs - t < AUTH_THROTTLE_WINDOW_MS);
  buckets.set(key, times);
  return times;
}

export function resetAuthThrottleForTests(): void {
  buckets.clear();
}

function authAttemptsTableMissing(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /seat_auth_attempts|relation .* does not exist/i.test(msg);
}

/**
 * Record one attempt. Returns false when the normalized-email or trusted-IP
 * window is already full. Missing email/IP keys are skipped, not treated as a
 * shared global bucket.
 */
export function allowAuthAttempt(input: {
  kind: AuthThrottleKind;
  email?: string;
  ip?: string;
  nowMs?: number;
}): boolean {
  const nowMs = input.nowMs ?? Date.now();
  const limits = AUTH_THROTTLE_LIMITS[input.kind];
  const email = input.email?.trim().toLowerCase();
  const ip = input.ip?.trim();
  const keys: { key: string; max: number }[] = [];
  if (email) keys.push({ key: `${input.kind}:email:${email}`, max: limits.email });
  if (ip) keys.push({ key: `${input.kind}:ip:${ip}`, max: limits.ip });
  if (keys.length === 0) return true;

  for (const { key, max } of keys) {
    if (prune(key, nowMs).length >= max) return false;
  }
  for (const { key } of keys) {
    const times = prune(key, nowMs);
    times.push(nowMs);
    buckets.set(key, times);
  }
  return true;
}

/**
 * Durable login throttle on Neon so concurrent Vercel instances share the
 * window. Falls back to the in-process map if 0004 is not applied yet.
 */
export async function allowDurableLoginAttempt(input: {
  email: string;
  ip?: string;
  nowMs?: number;
}): Promise<boolean> {
  const email = input.email.trim().toLowerCase();
  const ip = input.ip?.trim();
  const nowMs = input.nowMs ?? Date.now();
  if (!neonConfigured()) {
    return allowAuthAttempt({ kind: 'login', email, ip, nowMs });
  }
  try {
    await db.insert(seatAuthAttempts).values({
      kind: 'login',
      email,
      requestIp: ip ?? null,
      createdAt: new Date(nowMs),
    });
    const windowStart = new Date(nowMs - AUTH_THROTTLE_WINDOW_MS);
    const emailRows = await db
      .select({ n: dsql<number>`count(*)::int` })
      .from(seatAuthAttempts)
      .where(
        and(
          eq(seatAuthAttempts.kind, 'login'),
          eq(seatAuthAttempts.email, email),
          gt(seatAuthAttempts.createdAt, windowStart),
        ),
      );
    if ((emailRows[0]?.n ?? 0) > AUTH_THROTTLE_LIMITS.login.email) return false;
    if (ip) {
      const ipRows = await db
        .select({ n: dsql<number>`count(*)::int` })
        .from(seatAuthAttempts)
        .where(
          and(
            eq(seatAuthAttempts.kind, 'login'),
            eq(seatAuthAttempts.requestIp, ip),
            gt(seatAuthAttempts.createdAt, windowStart),
          ),
        );
      if ((ipRows[0]?.n ?? 0) > AUTH_THROTTLE_LIMITS.login.ip) return false;
    }
    return true;
  } catch (err) {
    if (authAttemptsTableMissing(err)) {
      return allowAuthAttempt({ kind: 'login', email, ip, nowMs });
    }
    throw err;
  }
}
