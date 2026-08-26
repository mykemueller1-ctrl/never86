import crypto from 'crypto';
import { and, eq, gt, sql as dsql } from 'drizzle-orm';
import { db } from '../db';
import {
  seatActivationTokens,
  seatCredentials,
  seatLocations,
  seatOperators,
} from '../db/schema';
import { hashPassword, verifyPassword } from './operatorAuth';

// Monday gate (#118) — free seat on Neon (DATABASE_URL).
// Supabase OPS is deferred; Toast/CTAP data comes back later.
// Never email, log, or return a plaintext starter password.

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24h
const RATE_LIMIT_WINDOW_MS = 1000 * 60 * 60; // 1h
const RATE_LIMIT_MAX = 5;

/** Neon free-seat ids stay above this floor to avoid OPS operator_users id collisions. */
export const FREE_SEAT_ID_FLOOR = 1_000_000;

export function isFreeSeatOperatorId(operatorId: number): boolean {
  return operatorId >= FREE_SEAT_ID_FLOOR;
}

export function neonConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeRestaurant(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function hashActivationToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken, 'utf8').digest('hex');
}

export function mintActivationToken(nowMs = Date.now()): {
  rawToken: string;
  tokenHash: string;
  expiresAt: Date;
} {
  const rawToken = crypto.randomBytes(TOKEN_BYTES).toString('base64url');
  return {
    rawToken,
    tokenHash: hashActivationToken(rawToken),
    expiresAt: new Date(nowMs + TOKEN_TTL_MS),
  };
}

export type ActivationRequestInput = {
  email: string;
  name?: string;
  restaurantName: string;
  sourcePage?: string;
  requestIp?: string;
  userAgent?: string;
};

export type ActivationRequestResult =
  | { ok: true; rawToken: string; expiresAt: Date; alreadyPending: boolean }
  | { ok: false; error: string; status: number };

export async function requestOperatorActivation(
  input: ActivationRequestInput,
  nowMs = Date.now(),
): Promise<ActivationRequestResult> {
  if (!neonConfigured()) {
    return { ok: false, error: 'Primary database (Neon) is not configured.', status: 503 };
  }

  const email = normalizeEmail(input.email);
  const restaurantName = normalizeRestaurant(input.restaurantName);
  if (!email || !email.includes('@')) {
    return { ok: false, error: 'Enter a valid email.', status: 400 };
  }
  if (!restaurantName) {
    return { ok: false, error: 'Enter your restaurant name.', status: 400 };
  }

  const recent = await db
    .select({ n: dsql<number>`count(*)::int` })
    .from(seatActivationTokens)
    .where(
      and(
        eq(seatActivationTokens.email, email),
        gt(seatActivationTokens.createdAt, new Date(nowMs - RATE_LIMIT_WINDOW_MS)),
      ),
    );
  if ((recent[0]?.n ?? 0) >= RATE_LIMIT_MAX) {
    return { ok: false, error: 'Too many activation emails. Try again in an hour.', status: 429 };
  }

  const existingCred = await db
    .select({ operatorId: seatCredentials.operatorId })
    .from(seatCredentials)
    .where(eq(seatCredentials.email, email))
    .limit(1);
  if (existingCred[0]) {
    return {
      ok: false,
      error: 'This email already has a seat. Sign in instead.',
      status: 409,
    };
  }

  const { rawToken, tokenHash, expiresAt } = mintActivationToken(nowMs);
  await db.insert(seatActivationTokens).values({
    email,
    restaurantName,
    operatorName: input.name?.trim() || null,
    tokenHash,
    sourcePage: input.sourcePage ?? null,
    consentAt: new Date(nowMs),
    createdAt: new Date(nowMs),
    expiresAt,
    requestIp: input.requestIp ?? null,
    userAgent: input.userAgent ?? null,
  });

  return { ok: true, rawToken, expiresAt, alreadyPending: false };
}

export type ActivateInput = {
  rawToken: string;
  password: string;
};

export type ActivateResult =
  | {
      ok: true;
      operatorId: number;
      locationId: number;
      email: string;
      restaurantName: string;
    }
  | { ok: false; error: string; status: number };

export async function activateOperatorSeat(
  input: ActivateInput,
  nowMs = Date.now(),
): Promise<ActivateResult> {
  if (!neonConfigured()) {
    return { ok: false, error: 'Primary database (Neon) is not configured.', status: 503 };
  }

  const password = input.password;
  if (typeof password !== 'string' || password.length < 10) {
    return { ok: false, error: 'Password must be at least 10 characters.', status: 400 };
  }

  const tokenHash = hashActivationToken(input.rawToken.trim());
  const rows = await db
    .select()
    .from(seatActivationTokens)
    .where(eq(seatActivationTokens.tokenHash, tokenHash))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return { ok: false, error: 'This activation link is invalid.', status: 400 };
  }
  if (row.consumedAt) {
    return { ok: false, error: 'This activation link was already used. Sign in.', status: 409 };
  }
  if (new Date(row.expiresAt).getTime() < nowMs) {
    return { ok: false, error: 'This activation link expired. Request a new one.', status: 410 };
  }

  const email = normalizeEmail(row.email);
  const restaurantName = normalizeRestaurant(row.restaurantName);
  const operatorName = (row.operatorName?.trim() || restaurantName).slice(0, 200);

  const priorCred = await db
    .select({ operatorId: seatCredentials.operatorId })
    .from(seatCredentials)
    .where(eq(seatCredentials.email, email))
    .limit(1);
  if (priorCred[0]) {
    await db
      .update(seatActivationTokens)
      .set({ consumedAt: new Date(nowMs), consumedOperatorId: priorCred[0].operatorId })
      .where(eq(seatActivationTokens.id, row.id));
    return {
      ok: false,
      error: 'This email already has a seat. Sign in instead.',
      status: 409,
    };
  }

  const passwordHash = hashPassword(password);

  // Ensure free-seat serial stays above OPS collision floor.
  await db.execute(dsql`
    SELECT setval(
      pg_get_serial_sequence('seat_operators', 'id'),
      GREATEST(
        (SELECT COALESCE(MAX(id), 0) FROM seat_operators),
        ${FREE_SEAT_ID_FLOOR - 1}
      )
    )
  `);

  let operatorId: number;
  const existingOp = await db
    .select({ id: seatOperators.id })
    .from(seatOperators)
    .where(eq(seatOperators.email, email))
    .limit(1);

  if (existingOp[0]) {
    operatorId = existingOp[0].id;
    await db
      .update(seatOperators)
      .set({
        name: operatorName,
        restaurantName,
        activatedAt: new Date(nowMs),
      })
      .where(eq(seatOperators.id, operatorId));
  } else {
    const inserted = await db
      .insert(seatOperators)
      .values({
        email,
        name: operatorName,
        restaurantName,
        sourcePage: row.sourcePage,
        consentAt: row.consentAt,
        activatedAt: new Date(nowMs),
        createdAt: new Date(nowMs),
      })
      .returning({ id: seatOperators.id });
    operatorId = inserted[0].id;
  }

  if (operatorId < FREE_SEAT_ID_FLOOR) {
    // Should not happen after setval; refuse rather than collide with OPS.
    return {
      ok: false,
      error: 'Free-seat id namespace misconfigured. Contact support.',
      status: 500,
    };
  }

  const existingLoc = await db
    .select({ id: seatLocations.id })
    .from(seatLocations)
    .where(eq(seatLocations.operatorId, operatorId))
    .limit(1);

  let locationId: number;
  if (existingLoc[0]) {
    locationId = existingLoc[0].id;
  } else {
    const loc = await db
      .insert(seatLocations)
      .values({ operatorId, name: restaurantName, createdAt: new Date(nowMs) })
      .returning({ id: seatLocations.id });
    locationId = loc[0].id;
  }

  await db.delete(seatCredentials).where(eq(seatCredentials.email, email));
  await db.insert(seatCredentials).values({
    operatorId,
    email,
    passwordHash,
    createdAt: new Date(nowMs),
  });

  await db
    .update(seatActivationTokens)
    .set({ consumedAt: new Date(nowMs), consumedOperatorId: operatorId })
    .where(eq(seatActivationTokens.id, row.id));

  return {
    ok: true,
    operatorId,
    locationId,
    email,
    restaurantName,
  };
}

export type FreeSeatCredential = {
  operatorId: number;
  email: string;
  passwordHash: string;
  name: string | null;
};

export async function findFreeSeatCredential(email: string): Promise<FreeSeatCredential | null> {
  if (!neonConfigured()) return null;
  const normalized = normalizeEmail(email);
  const rows = await db
    .select({
      operatorId: seatCredentials.operatorId,
      email: seatCredentials.email,
      passwordHash: seatCredentials.passwordHash,
      name: seatOperators.restaurantName,
    })
    .from(seatCredentials)
    .leftJoin(seatOperators, eq(seatOperators.id, seatCredentials.operatorId))
    .where(eq(seatCredentials.email, normalized))
    .limit(1);
  const r = rows[0];
  return r
    ? {
        operatorId: r.operatorId,
        email: r.email,
        passwordHash: r.passwordHash,
        name: r.name,
      }
    : null;
}

export async function touchFreeSeatLogin(operatorId: number, email: string): Promise<void> {
  if (!neonConfigured()) return;
  try {
    await db
      .update(seatCredentials)
      .set({ lastLoginAt: new Date() })
      .where(
        and(eq(seatCredentials.operatorId, operatorId), eq(seatCredentials.email, normalizeEmail(email))),
      );
  } catch {
    /* non-fatal */
  }
}

export function refuseSecondFreeStore(existingLocationCount: number): {
  ok: true;
} | { ok: false; error: string } {
  if (existingLocationCount >= 1) {
    return { ok: false, error: 'The free plan is one store. Extra locations are paid expansion.' };
  }
  return { ok: true };
}

export function refuseSecondFreeSeat(existingCredentialCount: number): {
  ok: true;
} | { ok: false; error: string } {
  if (existingCredentialCount >= 1) {
    return { ok: false, error: 'The free plan is one login. Extra seats are paid expansion.' };
  }
  return { ok: true };
}

export { verifyPassword };

export async function findFreeSeatOperator(operatorId: number): Promise<{
  operatorId: number;
  email: string;
  restaurantName: string;
  locationId: number | null;
} | null> {
  if (!neonConfigured() || !isFreeSeatOperatorId(operatorId)) return null;
  const op = await db
    .select({
      operatorId: seatOperators.id,
      email: seatOperators.email,
      restaurantName: seatOperators.restaurantName,
    })
    .from(seatOperators)
    .where(eq(seatOperators.id, operatorId))
    .limit(1);
  if (!op[0]) return null;
  const loc = await db
    .select({ id: seatLocations.id })
    .from(seatLocations)
    .where(eq(seatLocations.operatorId, operatorId))
    .limit(1);
  return {
    operatorId: op[0].operatorId,
    email: op[0].email,
    restaurantName: op[0].restaurantName,
    locationId: loc[0]?.id ?? null,
  };
}
