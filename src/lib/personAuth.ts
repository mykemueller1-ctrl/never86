import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { seatCredentials, seatOperators, seatPersonAccess, seatPersonPasswords } from '../db/schema';
import { ensureFreeSeatSchema } from './ensureFreeSeatSchema';
import {
  findFreeSeatCredential,
  findFreeSeatOperator,
  listNeonOperatorsForEmail,
  neonConfigured,
  normalizeEmail,
  normalizeRestaurant,
  restaurantsMatch,
} from './operatorActivation';
import {
  findOpsOperatorName,
  findOperatorCredential,
  hashPassword,
  operatorExists,
  updateOpsPasswordByEmail,
  verifyPassword,
} from './operatorAuth';
import { MAX_FREE_SEAT_PASSWORD_LEN, MIN_FREE_SEAT_PASSWORD_LEN } from './ownerDeskAuth';

/**
 * Person-level password: one email, one hash, every attached isolated seat.
 * Does not merge stores. CTAP stays PDQ on its operatorId; Max stays Toast.
 */

export type AccessibleSeat = {
  operatorId: number;
  email: string;
  restaurantName: string;
  plane: 'neon' | 'ops';
};

export type PersonLoginPlane = 'person' | 'neon' | 'deny' | 'ops';

export type PickSeatResult =
  | { ok: true; seat: AccessibleSeat }
  | { ok: false; code: 'none' | 'pick_store' | 'unknown_store'; seats: AccessibleSeat[] };

export type SetSharedPasswordResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

export function isPlusAliasEmail(email: string): boolean {
  const local = normalizeEmail(email).split('@')[0] ?? '';
  return local.includes('+');
}

export function validatePersonPassword(password: string): SetSharedPasswordResult {
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
  return { ok: true };
}

/**
 * If this email already has a person or Neon hash, a bad password never
 * falls through to a different OPS password for the same address.
 */
export function choosePersonLoginPlane(input: {
  personHash: string | null;
  neonHash: string | null;
  personOk: boolean;
  neonOk: boolean;
}): PersonLoginPlane {
  if (input.personHash) return input.personOk ? 'person' : 'deny';
  if (input.neonHash) return input.neonOk ? 'neon' : 'deny';
  return 'ops';
}

export { restaurantsMatch };

export function pickAccessibleSeat(seats: AccessibleSeat[], storeName?: string): PickSeatResult {
  if (seats.length === 0) return { ok: false, code: 'none', seats };
  const wanted = storeName?.trim() ? normalizeRestaurant(storeName) : '';
  if (wanted) {
    const match = seats.find((seat) => restaurantsMatch(seat.restaurantName, wanted));
    if (!match) return { ok: false, code: 'unknown_store', seats };
    return { ok: true, seat: match };
  }
  if (seats.length === 1) return { ok: true, seat: seats[0] };
  return { ok: false, code: 'pick_store', seats };
}

export function publicSeatsForPicker(seats: AccessibleSeat[]): { restaurantName: string }[] {
  const seen = new Set<string>();
  const out: { restaurantName: string }[] = [];
  for (const seat of seats) {
    const name = normalizeRestaurant(seat.restaurantName) || seat.restaurantName;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ restaurantName: name });
  }
  return out;
}

export async function findPersonPassword(email: string): Promise<{
  email: string;
  passwordHash: string;
  passwordSetAt: Date | null;
} | null> {
  if (!neonConfigured()) return null;
  await ensureFreeSeatSchema();
  const normalized = normalizeEmail(email);
  const rows = await db
    .select({
      email: seatPersonPasswords.email,
      passwordHash: seatPersonPasswords.passwordHash,
      passwordSetAt: seatPersonPasswords.passwordSetAt,
    })
    .from(seatPersonPasswords)
    .where(eq(seatPersonPasswords.email, normalized))
    .limit(1);
  const row = rows[0];
  return row
    ? { email: row.email, passwordHash: row.passwordHash, passwordSetAt: row.passwordSetAt }
    : null;
}

export async function listPersonAccessOperatorIds(email: string): Promise<number[]> {
  if (!neonConfigured()) return [];
  await ensureFreeSeatSchema();
  const normalized = normalizeEmail(email);
  const rows = await db
    .select({ operatorId: seatPersonAccess.operatorId })
    .from(seatPersonAccess)
    .where(eq(seatPersonAccess.email, normalized));
  return rows.map((row) => row.operatorId);
}

async function addSeat(
  seats: AccessibleSeat[],
  seen: Set<number>,
  seat: AccessibleSeat,
): Promise<void> {
  if (seen.has(seat.operatorId)) return;
  seen.add(seat.operatorId);
  seats.push(seat);
}

export async function listAccessibleSeats(email: string): Promise<AccessibleSeat[]> {
  const normalized = normalizeEmail(email);
  const seats: AccessibleSeat[] = [];
  const seen = new Set<number>();

  const neonOps = await listNeonOperatorsForEmail(normalized).catch(() => []);
  for (const neon of neonOps) {
    await addSeat(seats, seen, {
      operatorId: neon.operatorId,
      email: neon.email,
      restaurantName: neon.restaurantName || 'My restaurant',
      plane: 'neon',
    });
  }

  const accessIds = await listPersonAccessOperatorIds(normalized).catch(() => []);
  for (const operatorId of accessIds) {
    const neonOp = await findFreeSeatOperator(operatorId).catch(() => null);
    if (neonOp) {
      await addSeat(seats, seen, {
        operatorId: neonOp.operatorId,
        email: neonOp.email,
        restaurantName: neonOp.restaurantName,
        plane: 'neon',
      });
      continue;
    }
    const opsName = await findOpsOperatorName(operatorId).catch(() => null);
    if (opsName) {
      await addSeat(seats, seen, {
        operatorId,
        email: normalized,
        restaurantName: opsName,
        plane: 'ops',
      });
    }
  }

  const ops = await findOperatorCredential(normalized).catch(() => null);
  if (ops) {
    await addSeat(seats, seen, {
      operatorId: ops.operatorId,
      email: ops.email,
      restaurantName: ops.name || 'My restaurant',
      plane: 'ops',
    });
  }

  return seats;
}

export async function writeSharedPassword(
  email: string,
  password: string,
  nowMs = Date.now(),
): Promise<SetSharedPasswordResult> {
  const length = validatePersonPassword(password);
  if (!length.ok) return length;
  if (!neonConfigured()) {
    return { ok: false, error: 'Primary database (Neon) is not configured.', status: 503 };
  }
  await ensureFreeSeatSchema();
  const normalized = normalizeEmail(email);
  const hash = hashPassword(password);
  const setAt = new Date(nowMs);

  const existing = await db
    .select({ id: seatPersonPasswords.id })
    .from(seatPersonPasswords)
    .where(eq(seatPersonPasswords.email, normalized))
    .limit(1);
  if (existing[0]) {
    await db
      .update(seatPersonPasswords)
      .set({ passwordHash: hash, passwordSetAt: setAt })
      .where(eq(seatPersonPasswords.email, normalized));
  } else {
    await db.insert(seatPersonPasswords).values({
      email: normalized,
      passwordHash: hash,
      passwordSetAt: setAt,
      createdAt: setAt,
    });
  }

  await db
    .update(seatCredentials)
    .set({ passwordHash: hash, passwordSetAt: setAt })
    .where(eq(seatCredentials.email, normalized));

  await updateOpsPasswordByEmail(normalized, password).catch(() => false);
  return { ok: true };
}

export async function grantPersonAccess(
  email: string,
  operatorId: number,
): Promise<SetSharedPasswordResult> {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes('@')) {
    return { ok: false, error: 'Enter a valid email.', status: 400 };
  }
  if (isPlusAliasEmail(normalized)) {
    return {
      ok: false,
      error: 'Do not mint plus-alias seats. Use the real person email.',
      status: 400,
    };
  }
  if (!Number.isInteger(operatorId) || operatorId <= 0) {
    return { ok: false, error: 'Pick a valid operator.', status: 400 };
  }
  if (!neonConfigured()) {
    return { ok: false, error: 'Primary database (Neon) is not configured.', status: 503 };
  }
  await ensureFreeSeatSchema();

  const neonOp = await findFreeSeatOperator(operatorId).catch(() => null);
  const opsOk = neonOp ? true : await operatorExists(operatorId).catch(() => false);
  if (!neonOp && !opsOk) {
    return { ok: false, error: `No operator with id ${operatorId}.`, status: 400 };
  }

  const existing = await db
    .select({ id: seatPersonAccess.id })
    .from(seatPersonAccess)
    .where(and(eq(seatPersonAccess.email, normalized), eq(seatPersonAccess.operatorId, operatorId)))
    .limit(1);
  if (!existing[0]) {
    await db.insert(seatPersonAccess).values({
      email: normalized,
      operatorId,
      createdAt: new Date(),
    });
  }
  return { ok: true };
}

/** Detach one isolated operator from this person email. Does not delete the store. */
export async function revokePersonAccess(
  email: string,
  operatorId: number,
): Promise<SetSharedPasswordResult> {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes('@')) {
    return { ok: false, error: 'Enter a valid email.', status: 400 };
  }
  if (isPlusAliasEmail(normalized)) {
    return {
      ok: false,
      error: 'Do not mint plus-alias seats. Use the real person email.',
      status: 400,
    };
  }
  if (!Number.isInteger(operatorId) || operatorId <= 0) {
    return { ok: false, error: 'Pick a valid operator.', status: 400 };
  }
  if (!neonConfigured()) {
    return { ok: false, error: 'Primary database (Neon) is not configured.', status: 503 };
  }
  await ensureFreeSeatSchema();
  await db
    .delete(seatPersonAccess)
    .where(and(eq(seatPersonAccess.email, normalized), eq(seatPersonAccess.operatorId, operatorId)));
  return { ok: true };
}

/** Hyphen, not plus — plus-alias emails are refused by the person plane. */
export function retiredNativeSeatEmail(operatorId: number): string {
  return `fun-retired-${operatorId}@invalid.never86`;
}

/**
 * Native seat_operators.email still feeds the picker after person-access detach.
 * Fun 1000000 is always retired when asked. Other ids only if this person
 * owns the row or the restaurant name is Fun.
 */
export function shouldRetireNativeOperatorEmail(input: {
  operatorId: number;
  operatorEmail: string;
  personEmail: string;
  restaurantName: string;
}): boolean {
  if (input.operatorId === 1_000_000) return true;
  if (normalizeEmail(input.operatorEmail) === normalizeEmail(input.personEmail)) return true;
  return input.restaurantName.toLowerCase().includes('fun');
}

export type RetireNativeOperatorSuccess = {
  ok: true;
  retiredEmail: string;
  nativeRetired: boolean;
};

export type RetireNativeOperatorResult =
  | RetireNativeOperatorSuccess
  | { ok: false; error: string; status: number };

/** Narrow grant/detach `{ ok: true }` away from the retire success object. */
export function isRetireNativeSuccess(
  result: SetSharedPasswordResult | RetireNativeOperatorResult,
): result is RetireNativeOperatorSuccess {
  if (!result.ok) return false;
  const candidate = result as Partial<RetireNativeOperatorSuccess>;
  return typeof candidate.retiredEmail === 'string' && typeof candidate.nativeRetired === 'boolean';
}

/**
 * Kill native ownership + person_access + credentials email for one operator.
 * Does not delete the store. Re-points seat_operators.email off this person.
 */
export async function retireNativeOperator(
  email: string,
  operatorId: number,
): Promise<RetireNativeOperatorResult> {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes('@')) {
    return { ok: false, error: 'Enter a valid email.', status: 400 };
  }
  if (isPlusAliasEmail(normalized)) {
    return {
      ok: false,
      error: 'Do not mint plus-alias seats. Use the real person email.',
      status: 400,
    };
  }
  if (!Number.isInteger(operatorId) || operatorId <= 0) {
    return { ok: false, error: 'Pick a valid operator.', status: 400 };
  }
  if (!neonConfigured()) {
    return { ok: false, error: 'Primary database (Neon) is not configured.', status: 503 };
  }
  await ensureFreeSeatSchema();

  const neonOp = await findFreeSeatOperator(operatorId).catch(() => null);
  if (!neonOp) {
    return { ok: false, error: `No operator with id ${operatorId}.`, status: 400 };
  }

  const retiredEmail = retiredNativeSeatEmail(operatorId);
  const nativeRetired = shouldRetireNativeOperatorEmail({
    operatorId,
    operatorEmail: neonOp.email,
    personEmail: normalized,
    restaurantName: neonOp.restaurantName,
  });

  if (nativeRetired) {
    await db
      .update(seatOperators)
      .set({ email: retiredEmail })
      .where(eq(seatOperators.id, operatorId));
  }
  await db
    .update(seatCredentials)
    .set({ email: retiredEmail })
    .where(and(eq(seatCredentials.operatorId, operatorId), eq(seatCredentials.email, normalized)));

  await db
    .delete(seatPersonAccess)
    .where(and(eq(seatPersonAccess.email, normalized), eq(seatPersonAccess.operatorId, operatorId)));

  return { ok: true, retiredEmail, nativeRetired };
}

/**
 * Copy the existing person password hash from one real email to another.
 * No plaintext. Used when CoS cannot paste a live password.
 */
export async function copyPersonPasswordHash(
  fromEmail: string,
  toEmail: string,
  nowMs = Date.now(),
): Promise<SetSharedPasswordResult> {
  const from = normalizeEmail(fromEmail);
  const to = normalizeEmail(toEmail);
  if (!from || !from.includes('@') || !to || !to.includes('@')) {
    return { ok: false, error: 'Enter a valid email.', status: 400 };
  }
  if (isPlusAliasEmail(from) || isPlusAliasEmail(to)) {
    return {
      ok: false,
      error: 'Do not mint plus-alias seats. Use the real person email.',
      status: 400,
    };
  }
  if (from === to) {
    return { ok: false, error: 'Source and destination emails must differ.', status: 400 };
  }
  if (!neonConfigured()) {
    return { ok: false, error: 'Primary database (Neon) is not configured.', status: 503 };
  }
  await ensureFreeSeatSchema();
  const source = await findPersonPassword(from);
  if (!source?.passwordHash) {
    return { ok: false, error: 'No person password hash on the source email.', status: 404 };
  }
  const setAt = new Date(nowMs);
  const existing = await db
    .select({ id: seatPersonPasswords.id })
    .from(seatPersonPasswords)
    .where(eq(seatPersonPasswords.email, to))
    .limit(1);
  if (existing[0]) {
    await db
      .update(seatPersonPasswords)
      .set({ passwordHash: source.passwordHash, passwordSetAt: setAt })
      .where(eq(seatPersonPasswords.email, to));
  } else {
    await db.insert(seatPersonPasswords).values({
      email: to,
      passwordHash: source.passwordHash,
      passwordSetAt: setAt,
      createdAt: setAt,
    });
  }
  await db
    .update(seatCredentials)
    .set({ passwordHash: source.passwordHash, passwordSetAt: setAt })
    .where(eq(seatCredentials.email, to));
  return { ok: true };
}

/** Session-gated set: this email may only write the password it already owns. */
export async function setFreeSeatPassword(
  operatorId: number,
  email: string,
  password: string,
  nowMs = Date.now(),
): Promise<SetSharedPasswordResult> {
  const length = validatePersonPassword(password);
  if (!length.ok) return length;
  if (!neonConfigured()) {
    return { ok: false, error: 'Primary database (Neon) is not configured.', status: 503 };
  }
  await ensureFreeSeatSchema();
  const normalized = normalizeEmail(email);
  const native = await findFreeSeatCredential(normalized).catch(() => null);
  const seats = await listAccessibleSeats(normalized).catch(() => []);
  const allowed =
    (native && native.operatorId === operatorId) ||
    seats.some((seat) => seat.operatorId === operatorId);
  if (!allowed) {
    return { ok: false, error: 'No seat found for this session.', status: 404 };
  }
  const written = await writeSharedPassword(normalized, password, nowMs);
  if (!written.ok) return written;
  const existing = await db
    .select({ id: seatPersonAccess.id })
    .from(seatPersonAccess)
    .where(and(eq(seatPersonAccess.email, normalized), eq(seatPersonAccess.operatorId, operatorId)))
    .limit(1);
  if (!existing[0]) {
    await db.insert(seatPersonAccess).values({
      email: normalized,
      operatorId,
      createdAt: new Date(nowMs),
    });
  }
  return { ok: true };
}

export async function setAdminPersonPassword(
  email: string,
  password: string,
  nowMs = Date.now(),
): Promise<SetSharedPasswordResult> {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes('@')) {
    return { ok: false, error: 'Enter a valid email.', status: 400 };
  }
  if (isPlusAliasEmail(normalized)) {
    return {
      ok: false,
      error: 'Do not mint plus-alias seats. Use the real person email.',
      status: 400,
    };
  }
  return writeSharedPassword(normalized, password, nowMs);
}

export async function touchPersonLogin(email: string): Promise<void> {
  if (!neonConfigured()) return;
  const normalized = normalizeEmail(email);
  try {
    await db
      .update(seatPersonPasswords)
      .set({ lastLoginAt: new Date() })
      .where(eq(seatPersonPasswords.email, normalized));
  } catch {
    /* non-fatal */
  }
}

export function personPasswordOk(
  password: string,
  personHash: string | null,
  neonHash: string | null,
): { personOk: boolean; neonOk: boolean } {
  return {
    personOk: personHash ? verifyPassword(password, personHash) : false,
    neonOk: neonHash ? verifyPassword(password, neonHash) : false,
  };
}
