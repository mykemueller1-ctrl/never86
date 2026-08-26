/** In-process sliding-window throttle keyed by normalized email and trusted IP. */

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
