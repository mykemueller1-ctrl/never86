import crypto from 'crypto';
import { and, eq, gt, isNull, sql as dsql } from 'drizzle-orm';
import { db } from '../db';
import { withSeatTransaction } from '../db/tx';
import {
  seatActivationTokens,
  seatCredentials,
  seatLocations,
  seatOperators,
} from '../db/schema';
import { restaurantNameForSeatClaim } from './ctapSeat1';
import { MAX_FREE_SEAT_PASSWORD_LEN, MIN_FREE_SEAT_PASSWORD_LEN } from './ownerDeskAuth';
import { ensureFreeSeatSchema } from './ensureFreeSeatSchema';
import { hashPassword, verifyPassword } from './operatorAuth';
import { databaseUrlPresent } from './persistHealth';

// Monday gate (#118) — free seat on Neon (DATABASE_URL).
// Supabase OPS is deferred; Toast/CTAP data comes back later.
// Email links are the credential. Never log or return a raw link token.

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24h
export const RATE_LIMIT_WINDOW_MS = 1000 * 60 * 60; // 1h
export const RATE_LIMIT_EMAIL_MAX = 5;
export const RATE_LIMIT_IP_MAX = 12;

/** Neon free-seat ids stay above this floor to avoid OPS operator_users id collisions. */
export const FREE_SEAT_ID_FLOOR = 1_000_000;

export function isFreeSeatOperatorId(operatorId: number): boolean {
  return operatorId >= FREE_SEAT_ID_FLOOR;
}

export function neonConfigured(): boolean {
  return databaseUrlPresent();
}

export function activationEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

/** Same predicate as the atomic UPDATE ... WHERE consumed_at IS NULL AND expires_at > now. */
export function activationTokenIsConsumable(
  row: { consumedAt: Date | null; expiresAt: Date },
  nowMs: number,
): boolean {
  return row.consumedAt == null && new Date(row.expiresAt).getTime() > nowMs;
}

export type LoginPlaneDecision = 'neon' | 'deny-neon' | 'ops';

/**
 * If Neon already has this email, never fall through to OPS on a bad password.
 * OPS is only tried when Neon has no credential for the normalized email.
 */
export function chooseLoginPlane(
  neonCredential: { passwordHash: string } | null,
  neonPasswordOk: boolean,
): LoginPlaneDecision {
  if (neonCredential) return neonPasswordOk ? 'neon' : 'deny-neon';
  return 'ops';
}

export function publicActivationAccepted(expiresAt: Date): {
  success: true;
  message: string;
  expiresAt: string;
} {
  return {
    success: true,
    message: 'Check your email for a secure sign-in link.',
    expiresAt: expiresAt.toISOString(),
  };
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
  restaurantName?: string;
  sourcePage?: string;
  requestIp?: string;
  userAgent?: string;
};

export type ActivationRequestCode =
  | 'activation_email_unavailable'
  | 'neon_unavailable'
  | 'rate_limited';

export type ActivationRequestResult =
  | { ok: true; rawToken: string; expiresAt: Date; alreadyPending: boolean }
  | { ok: false; error: string; status: number; code?: ActivationRequestCode };

export async function requestOperatorActivation(
  input: ActivationRequestInput,
  nowMs = Date.now(),
): Promise<ActivationRequestResult> {
  if (!neonConfigured()) {
    return {
      ok: false,
      error: 'Primary database (Neon) is not configured.',
      status: 503,
      code: 'neon_unavailable',
    };
  }

  const email = normalizeEmail(input.email);
  const restaurantName = restaurantNameForSeatClaim(email, input.restaurantName);
  if (!email || !email.includes('@')) {
    return { ok: false, error: 'Enter a valid email.', status: 400 };
  }
  await ensureFreeSeatSchema();

  const windowStart = new Date(nowMs - RATE_LIMIT_WINDOW_MS);
  const recent = await db
    .select({ n: dsql<number>`count(*)::int` })
    .from(seatActivationTokens)
    .where(
      and(
        eq(seatActivationTokens.email, email),
        gt(seatActivationTokens.createdAt, windowStart),
      ),
    );
  if ((recent[0]?.n ?? 0) >= RATE_LIMIT_EMAIL_MAX) {
    return {
      ok: false,
      error: 'Too many activation emails. Try again in an hour.',
      status: 429,
      code: 'rate_limited',
    };
  }

  if (input.requestIp) {
    const recentIp = await db
      .select({ n: dsql<number>`count(*)::int` })
      .from(seatActivationTokens)
      .where(
        and(
          eq(seatActivationTokens.requestIp, input.requestIp),
          gt(seatActivationTokens.createdAt, windowStart),
        ),
      );
    if ((recentIp[0]?.n ?? 0) >= RATE_LIMIT_IP_MAX) {
      return {
        ok: false,
        error: 'Too many activation emails. Try again in an hour.',
        status: 429,
        code: 'rate_limited',
      };
    }
  }

  // After the first table hit so missing Neon tables still surface as 503 tables,
  // fail closed before minting a token that cannot be delivered.
  if (!activationEmailConfigured()) {
    return {
      ok: false,
      error: 'Activation email is unavailable. Try again later.',
      status: 503,
      code: 'activation_email_unavailable',
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

export class SeatActivationAbort extends Error {
  readonly result: ActivateResult & { ok: false };

  constructor(result: ActivateResult & { ok: false }) {
    super(result.error);
    this.name = 'SeatActivationAbort';
    this.result = result;
  }
}

export async function activateOperatorSeat(
  input: ActivateInput,
  nowMs = Date.now(),
): Promise<ActivateResult> {
  if (!neonConfigured()) {
    return { ok: false, error: 'Primary database (Neon) is not configured.', status: 503 };
  }

  await ensureFreeSeatSchema();

  const tokenHash = hashActivationToken(input.rawToken.trim());
  // Keep the legacy credential row structurally valid while making the random
  // secret impossible to use as a user-facing password. All public entry is by
  // a fresh, verified email link.
  const passwordHash = hashPassword(crypto.randomBytes(32).toString('base64url'));

  try {
    return await withSeatTransaction(async (tx) => {
      const consumed = await tx
        .update(seatActivationTokens)
        .set({ consumedAt: new Date(nowMs) })
        .where(
          and(
            eq(seatActivationTokens.tokenHash, tokenHash),
            isNull(seatActivationTokens.consumedAt),
            gt(seatActivationTokens.expiresAt, new Date(nowMs)),
          ),
        )
        .returning();

      const row = consumed[0];
      if (!row) {
        const existing = await tx
          .select()
          .from(seatActivationTokens)
          .where(eq(seatActivationTokens.tokenHash, tokenHash))
          .limit(1);
        const found = existing[0];
        if (!found) {
          throw new SeatActivationAbort({
            ok: false,
            error: 'This activation link is invalid.',
            status: 400,
          });
        }
        if (found.consumedAt) {
          throw new SeatActivationAbort({
            ok: false,
            error: 'This activation link was already used. Sign in.',
            status: 409,
          });
        }
        if (new Date(found.expiresAt).getTime() < nowMs) {
          throw new SeatActivationAbort({
            ok: false,
            error: 'This activation link expired. Request a new one.',
            status: 410,
          });
        }
        throw new SeatActivationAbort({
          ok: false,
          error: 'This activation link is invalid.',
          status: 400,
        });
      }

      const email = normalizeEmail(row.email);
      const restaurantName = restaurantNameForSeatClaim(email, row.restaurantName);
      const operatorName = (row.operatorName?.trim() || restaurantName).slice(0, 200);

      const priorCred = await tx
        .select({ operatorId: seatCredentials.operatorId })
        .from(seatCredentials)
        .where(eq(seatCredentials.email, email))
        .limit(1);
      if (priorCred[0]) {
        const existingOperator = await tx
          .select({ restaurantName: seatOperators.restaurantName })
          .from(seatOperators)
          .where(eq(seatOperators.id, priorCred[0].operatorId))
          .limit(1);
        const existingLocation = await tx
          .select({ id: seatLocations.id })
          .from(seatLocations)
          .where(eq(seatLocations.operatorId, priorCred[0].operatorId))
          .limit(1);
        await tx
          .update(seatActivationTokens)
          .set({ consumedOperatorId: priorCred[0].operatorId })
          .where(eq(seatActivationTokens.id, row.id));
        return {
          ok: true,
          operatorId: priorCred[0].operatorId,
          locationId: existingLocation[0]?.id ?? 0,
          email,
          restaurantName: existingOperator[0]?.restaurantName || restaurantName,
        } as const;
      }

      await tx.execute(dsql`
        SELECT setval(
          pg_get_serial_sequence('seat_operators', 'id'),
          GREATEST(
            (SELECT COALESCE(MAX(id), 0) FROM seat_operators),
            ${FREE_SEAT_ID_FLOOR - 1}
          )
        )
      `);

      let operatorId: number;
      const existingOp = await tx
        .select({ id: seatOperators.id })
        .from(seatOperators)
        .where(eq(seatOperators.email, email))
        .limit(1);

      if (existingOp[0]) {
        operatorId = existingOp[0].id;
        await tx
          .update(seatOperators)
          .set({
            name: operatorName,
            restaurantName,
            activatedAt: new Date(nowMs),
          })
          .where(eq(seatOperators.id, operatorId));
      } else {
        const inserted = await tx
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
        throw new SeatActivationAbort({
          ok: false,
          error: 'Free-seat id namespace misconfigured. Contact support.',
          status: 500,
        });
      }

      const existingLoc = await tx
        .select({ id: seatLocations.id, name: seatLocations.name })
        .from(seatLocations)
        .where(eq(seatLocations.operatorId, operatorId))
        .limit(1);

      let locationId: number;
      if (existingLoc[0]) {
        if (existingLoc[0].name && existingLoc[0].name !== restaurantName) {
          const second = refuseSecondFreeStore(1);
          if (!second.ok) {
            throw new SeatActivationAbort({ ok: false, error: second.error, status: 409 });
          }
        }
        locationId = existingLoc[0].id;
      } else {
        const loc = await tx
          .insert(seatLocations)
          .values({ operatorId, name: restaurantName, createdAt: new Date(nowMs) })
          .returning({ id: seatLocations.id });
        locationId = loc[0].id;
      }

      await tx.delete(seatCredentials).where(eq(seatCredentials.email, email));
      await tx.insert(seatCredentials).values({
        operatorId,
        email,
        passwordHash,
        createdAt: new Date(nowMs),
      });

      await tx
        .update(seatActivationTokens)
        .set({ consumedOperatorId: operatorId })
        .where(eq(seatActivationTokens.id, row.id));

      return {
        ok: true,
        operatorId,
        locationId,
        email,
        restaurantName,
      };
    });
  } catch (err) {
    if (err instanceof SeatActivationAbort) return err.result;
    throw err;
  }
}

export type FreeSeatCredential = {
  operatorId: number;
  email: string;
  passwordHash: string;
  name: string | null;
  /** Null until the operator sets their own password (activation writes an unusable placeholder). */
  passwordSetAt: Date | null;
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
      passwordSetAt: seatCredentials.passwordSetAt,
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
        passwordSetAt: r.passwordSetAt,
      }
    : null;
}

export type SetFreeSeatPasswordResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

/**
 * Let a signed-in free-seat operator set their OWN password once, so future
 * sign-ins can use email+password instead of a fresh magic-link email every
 * visit. Scoped to (operatorId, email) so a session can only ever set the
 * password for the seat it already belongs to.
 */
export async function setFreeSeatPassword(
  operatorId: number,
  email: string,
  password: string,
  nowMs = Date.now(),
): Promise<SetFreeSeatPasswordResult> {
  if (typeof password !== 'string' || password.length < MIN_FREE_SEAT_PASSWORD_LEN) {
    return {
      ok: false,
      error: `Password must be at least ${MIN_FREE_SEAT_PASSWORD_LEN} characters.`,
      status: 400,
    };
  }
  if (password.length > MAX_FREE_SEAT_PASSWORD_LEN) {
    return {
      ok: false,
      error: `Password must be at most ${MAX_FREE_SEAT_PASSWORD_LEN} characters.`,
      status: 400,
    };
  }
  if (!neonConfigured()) {
    return { ok: false, error: 'Primary database (Neon) is not configured.', status: 503 };
  }
  const normalized = normalizeEmail(email);
  const updated = await db
    .update(seatCredentials)
    .set({ passwordHash: hashPassword(password), passwordSetAt: new Date(nowMs) })
    .where(and(eq(seatCredentials.operatorId, operatorId), eq(seatCredentials.email, normalized)))
    .returning({ id: seatCredentials.id });
  if (!updated[0]) {
    return { ok: false, error: 'No seat found for this session.', status: 404 };
  }
  return { ok: true };
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
export { MAX_FREE_SEAT_PASSWORD_LEN, MIN_FREE_SEAT_PASSWORD_LEN };

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
