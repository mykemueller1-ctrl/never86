import type { StaffSeatSession } from './staffSeatAuth';
import { isStationSeatKey } from './staffSeatAuth';

export const STAFF_SEAT_COOKIE = 'n86_staff_seat';
const MAX_AGE = 60 * 60 * 12;

export const STAFF_SEAT_COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: MAX_AGE,
};

export function staffSeatSessionSecret(): string | null {
  return process.env.STAFF_SEAT_SESSION_SECRET || process.env.OPERATOR_SESSION_SECRET || null;
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

type CookiePayload = {
  kind: 'staff-seat';
  operatorId: number;
  locationId: number;
  seatId: string;
  seatKey: string;
  grantsFullOperatorAccess: false;
  exp: number;
};

export async function signStaffSeatSession(
  session: StaffSeatSession,
  nowMs: number,
): Promise<string | null> {
  const secret = staffSeatSessionSecret();
  if (!secret) return null;
  const payload: CookiePayload = {
    kind: 'staff-seat',
    operatorId: session.operatorId,
    locationId: session.locationId,
    seatId: session.seatId,
    seatKey: session.seatKey,
    grantsFullOperatorAccess: false,
    exp: Math.floor(nowMs / 1000) + MAX_AGE,
  };
  const p = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(p)));
  return `${p}.${b64urlEncode(sig)}`;
}

export async function verifyStaffSeatSession(
  token: string | undefined,
  nowMs: number,
): Promise<CookiePayload | null> {
  if (!token) return null;
  const secret = staffSeatSessionSecret();
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
  let payload: CookiePayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(b64urlDecode(p)));
  } catch {
    return null;
  }
  if (!payload || payload.kind !== 'staff-seat' || payload.grantsFullOperatorAccess !== false) return null;
  if (!isStationSeatKey(payload.seatKey)) return null;
  if (payload.exp * 1000 < nowMs) return null;
  return payload;
}
