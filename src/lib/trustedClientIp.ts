/**
 * Platform-trusted client IP. Prefer the first X-Forwarded-For hop
 * (Vercel / Render set this), then X-Real-IP / CF-Connecting-IP.
 * Do not trust extra client-supplied hops.
 */
export function pickTrustedClientIp(headers: {
  get(name: string): string | null;
}): string | undefined {
  const forwarded = headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  if (first && first.length <= 128) return first;
  const real = headers.get('x-real-ip')?.trim();
  if (real && real.length <= 128) return real;
  const cf = headers.get('cf-connecting-ip')?.trim();
  if (cf && cf.length <= 128) return cf;
  return undefined;
}
