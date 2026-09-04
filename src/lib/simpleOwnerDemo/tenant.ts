import { OPERATOR_COOKIE, verifyOperatorSession } from '@/lib/operatorSession';
import { SIMPLE_OWNER_COOKIE } from './types';

const MAX_AGE = 60 * 60 * 24 * 30;

export type SimpleOwnerTenant = {
  operatorId: string;
  minted: boolean;
  cookieValue?: string;
};

export function simpleOwnerCookieOpts() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: MAX_AGE,
  };
}

export async function resolveSimpleOwnerTenant(
  cookies: { get(name: string): { value: string } | undefined },
  nowMs = Date.now(),
): Promise<SimpleOwnerTenant> {
  const session = await verifyOperatorSession(cookies.get(OPERATOR_COOKIE)?.value, nowMs);
  if (session) {
    return { operatorId: `seat:${session.operatorId}`, minted: false };
  }

  const existing = cookies.get(SIMPLE_OWNER_COOKIE)?.value;
  const verified = existing ? await verifyDemoTenant(existing, nowMs) : null;
  if (verified) {
    return { operatorId: verified, minted: false };
  }

  const operatorId = `demo:${crypto.randomUUID()}`;
  const cookieValue = await signDemoTenant(operatorId, nowMs);
  return { operatorId, minted: true, cookieValue: cookieValue ?? undefined };
}

function tenantSecret(): string | null {
  const explicit = process.env.SIMPLE_OWNER_DEMO_SECRET || process.env.OPERATOR_SESSION_SECRET;
  if (explicit) return explicit;
  const seed = process.env.REPORTS_PASSWORD || process.env.ADMIN_PASSWORD;
  return seed ? `n86-simple-owner:${seed}` : 'n86-simple-owner:dev-only-not-for-prod';
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

export async function signDemoTenant(operatorId: string, nowMs: number): Promise<string | null> {
  const secret = tenantSecret();
  if (!secret) return null;
  const payload = { operatorId, exp: Math.floor(nowMs / 1000) + MAX_AGE };
  const p = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(p)));
  return `${p}.${b64urlEncode(sig)}`;
}

export async function verifyDemoTenant(token: string, nowMs: number): Promise<string | null> {
  const secret = tenantSecret();
  if (!secret) return null;
  const dot = token.indexOf('.');
  if (dot < 0) return null;
  const p = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);
  try {
    const key = await hmacKey(secret);
    const ok = await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlDecode(sigB64) as unknown as BufferSource,
      new TextEncoder().encode(p),
    );
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(p))) as {
      operatorId?: string;
      exp?: number;
    };
    if (!payload.operatorId || typeof payload.exp !== 'number') return null;
    if (payload.exp * 1000 < nowMs) return null;
    if (!payload.operatorId.startsWith('demo:')) return null;
    return payload.operatorId;
  } catch {
    return null;
  }
}
