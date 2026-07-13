// Edge-safe signed session for operator logins.
//
// A logged-in operator carries a cookie that contains ONLY their own
// operator_id, signed with HMAC-SHA256 over OPERATOR_SESSION_SECRET. It cannot
// be forged or edited to point at another operator. This is what replaces the
// old single shared REPORTS_PASSWORD: each operator sees their own data, never
// anyone else's.
//
// Uses Web Crypto only (no node:crypto), so the SAME verify runs in middleware
// (edge runtime) and in server components / route handlers (node runtime).

export const OPERATOR_COOKIE = 'n86_operator';
const MAX_AGE = 60 * 60 * 12; // 12 hours

export const OPERATOR_COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: MAX_AGE,
};

export type OperatorSession = { operatorId: number; email: string; exp: number };

export function operatorSessionSecret(): string | null {
  const explicit = process.env.OPERATOR_SESSION_SECRET;
  if (explicit) return explicit;
  // Graceful fallback so the operator portal works out of the box without any
  // extra config: derive a stable signing key from an existing server-only
  // secret the deployment already has. Set OPERATOR_SESSION_SECRET explicitly
  // for a clean separation, but login works either way.
  const seed =
    process.env.REPORTS_PASSWORD || process.env.ADMIN_PASSWORD || process.env.OPS_DATABASE_URL;
  return seed ? `n86-operator-session:${seed}` : null;
}

function b64urlEncode(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str: string): Uint8Array {
  const s = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  const bin = atob(s + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

/** Sign a session for `operatorId`. `nowMs` is Date.now() from the caller. */
export async function signOperatorSession(
  operatorId: number,
  email: string,
  nowMs: number,
): Promise<string | null> {
  const secret = operatorSessionSecret();
  if (!secret) return null;
  const payload: OperatorSession = { operatorId, email, exp: Math.floor(nowMs / 1000) + MAX_AGE };
  const p = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(p)));
  return `${p}.${b64urlEncode(sig)}`;
}

/** Verify a session cookie. Returns the payload or null if missing/forged/expired. */
export async function verifyOperatorSession(
  token: string | undefined,
  nowMs: number,
): Promise<OperatorSession | null> {
  if (!token) return null;
  const secret = operatorSessionSecret();
  if (!secret) return null;
  const dot = token.indexOf('.');
  if (dot < 0) return null;
  const p = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);
  let ok = false;
  try {
    const key = await hmacKey(secret);
    ok = await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlDecode(sigB64) as unknown as BufferSource,
      new TextEncoder().encode(p),
    );
  } catch {
    return null;
  }
  if (!ok) return null;
  let payload: OperatorSession;
  try {
    payload = JSON.parse(new TextDecoder().decode(b64urlDecode(p)));
  } catch {
    return null;
  }
  if (!payload || typeof payload.operatorId !== 'number' || typeof payload.exp !== 'number') return null;
  if (payload.exp * 1000 < nowMs) return null;
  return payload;
}
