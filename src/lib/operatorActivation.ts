import crypto from 'crypto';
import { opsDb, opsDbConfigured } from './opsDb';
import { hashPassword } from './operatorAuth';

// Monday gate (#118) — self-serve one-store activation.
// Columns used here are proven by applied sql/0003 + sql/0004 only.
// Never email, log, or return a plaintext starter password.

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24h
const RATE_LIMIT_WINDOW_MS = 1000 * 60 * 60; // 1h
const RATE_LIMIT_MAX = 5;

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
  if (!opsDbConfigured()) {
    return { ok: false, error: 'Activation database is offline.', status: 503 };
  }

  const email = normalizeEmail(input.email);
  const restaurantName = normalizeRestaurant(input.restaurantName);
  if (!email || !email.includes('@')) {
    return { ok: false, error: 'Enter a valid email.', status: 400 };
  }
  if (!restaurantName) {
    return { ok: false, error: 'Enter your restaurant name.', status: 400 };
  }

  const sql = opsDb();

  const recent = await sql<{ n: number }[]>`
    select count(*)::int as n
    from operator_activation_tokens
    where lower(email) = ${email}
      and created_at > ${new Date(nowMs - RATE_LIMIT_WINDOW_MS)}`;
  if ((recent[0]?.n ?? 0) >= RATE_LIMIT_MAX) {
    return { ok: false, error: 'Too many activation emails. Try again in an hour.', status: 429 };
  }

  // If this email already has a login, do not mint a second free store path.
  const existingCred = await sql<{ operator_id: number }[]>`
    select operator_id from operator_credentials
    where lower(email) = ${email}
    limit 1`;
  if (existingCred[0]) {
    return {
      ok: false,
      error: 'This email already has a seat. Sign in instead.',
      status: 409,
    };
  }

  const { rawToken, tokenHash, expiresAt } = mintActivationToken(nowMs);
  await sql`
    insert into operator_activation_tokens (
      email, restaurant_name, operator_name, token_hash,
      source_page, consent_at, created_at, expires_at, request_ip, user_agent
    ) values (
      ${email},
      ${restaurantName},
      ${input.name?.trim() || null},
      ${tokenHash},
      ${input.sourcePage ?? null},
      ${new Date(nowMs)},
      ${new Date(nowMs)},
      ${expiresAt},
      ${input.requestIp ?? null},
      ${input.userAgent ?? null}
    )`;

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
  if (!opsDbConfigured()) {
    return { ok: false, error: 'Activation database is offline.', status: 503 };
  }

  const password = input.password;
  if (typeof password !== 'string' || password.length < 10) {
    return { ok: false, error: 'Password must be at least 10 characters.', status: 400 };
  }

  const tokenHash = hashActivationToken(input.rawToken.trim());
  const sql = opsDb();

  const rows = await sql<
    {
      id: number;
      email: string;
      restaurant_name: string;
      operator_name: string | null;
      expires_at: Date;
      consumed_at: Date | null;
    }[]
  >`
    select id, email, restaurant_name, operator_name, expires_at, consumed_at
    from operator_activation_tokens
    where token_hash = ${tokenHash}
    limit 1`;

  const row = rows[0];
  if (!row) {
    return { ok: false, error: 'This activation link is invalid.', status: 400 };
  }
  if (row.consumed_at) {
    return { ok: false, error: 'This activation link was already used. Sign in.', status: 409 };
  }
  if (new Date(row.expires_at).getTime() < nowMs) {
    return { ok: false, error: 'This activation link expired. Request a new one.', status: 410 };
  }

  const email = normalizeEmail(row.email);
  const restaurantName = normalizeRestaurant(row.restaurant_name);
  const operatorName = (row.operator_name?.trim() || restaurantName).slice(0, 200);

  // Idempotent by normalized email: reuse operator if credential already exists.
  const priorCred = await sql<{ operator_id: number }[]>`
    select operator_id from operator_credentials
    where lower(email) = ${email}
    limit 1`;
  if (priorCred[0]) {
    await sql`
      update operator_activation_tokens
      set consumed_at = ${new Date(nowMs)},
          consumed_operator_id = ${priorCred[0].operator_id}
      where id = ${row.id} and consumed_at is null`;
    return {
      ok: false,
      error: 'This email already has a seat. Sign in instead.',
      status: 409,
    };
  }

  // Idempotent by restaurant+email: reuse an uncredentialed operator row if present.
  let operatorId: number | null = null;
  const priorOps = await sql<{ id: number }[]>`
    select id from operator_users
    where lower(email) = ${email}
       or (lower(coalesce(restaurant_name, '')) = lower(${restaurantName})
           and lower(coalesce(email, '')) = ${email})
    order by id asc
    limit 1`;
  if (priorOps[0]) {
    operatorId = priorOps[0].id;
  }

  const passwordHash = hashPassword(password);

  // One server-side transaction: operator + exactly one free location + one credential.
  const result = await sql.begin(async (tx) => {
    if (operatorId == null) {
      const inserted = await tx<{ id: number }[]>`
        insert into operator_users (name, restaurant_name, email)
        values (${operatorName}, ${restaurantName}, ${email})
        returning id`;
      operatorId = inserted[0].id;
    } else {
      await tx`
        update operator_users
        set name = coalesce(nullif(name, ''), ${operatorName}),
            restaurant_name = coalesce(nullif(restaurant_name, ''), ${restaurantName}),
            email = coalesce(nullif(email, ''), ${email})
        where id = ${operatorId}`;
    }

    const existingLoc = await tx<{ id: number }[]>`
      select id from operator_locations
      where operator_id = ${operatorId}
      order by id asc
      limit 1`;

    let locationId: number;
    if (existingLoc[0]) {
      // Free plan: one store only. Never create a second location.
      locationId = existingLoc[0].id;
    } else {
      const loc = await tx<{ id: number }[]>`
        insert into operator_locations (operator_id, name, city, state)
        values (${operatorId}, ${restaurantName}, ${''}, ${''})
        returning id`;
      locationId = loc[0].id;
    }

    // Delete-then-insert matches upsertOperatorCredential (unique on lower(email)).
    await tx`delete from operator_credentials where lower(email) = ${email}`;
    await tx`
      insert into operator_credentials (operator_id, email, password_hash)
      values (${operatorId}, ${email}, ${passwordHash})`;

    await tx`
      update operator_activation_tokens
      set consumed_at = ${new Date(nowMs)},
          consumed_operator_id = ${operatorId}
      where id = ${row.id} and consumed_at is null`;

    return { operatorId: operatorId!, locationId };
  });

  return {
    ok: true,
    operatorId: result.operatorId,
    locationId: result.locationId,
    email,
    restaurantName,
  };
}
