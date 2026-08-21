import crypto from 'crypto';
import { opsDb, opsDbConfigured } from './opsDb';

// Node-only operator auth helpers: password hashing (scrypt) + credential
// lookup against public.operator_credentials. Imported ONLY from nodejs route
// handlers — never from middleware (which is edge). Middleware uses
// operatorSession.ts (Web Crypto) for cookie verification.

const SCRYPT_KEYLEN = 64;

/** Hash a password as `scrypt$<saltHex>$<hashHex>` with a per-user salt. */
export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pw, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

/** Constant-time verify of a password against a stored `scrypt$salt$hash`. */
export function verifyPassword(pw: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(parts[1], 'hex');
    expected = Buffer.from(parts[2], 'hex');
  } catch {
    return false;
  }
  const actual = crypto.scryptSync(pw, salt, expected.length);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

export type OperatorCredential = {
  operatorId: number;
  email: string;
  passwordHash: string;
  name: string | null;
};

/** Look up a login by email (case-insensitive). Null if not found / DB off. */
export async function findOperatorCredential(email: string): Promise<OperatorCredential | null> {
  if (!opsDbConfigured()) return null;
  const sql = opsDb();
  const rows = await sql<
    { operator_id: number; email: string; password_hash: string; name: string | null }[]
  >`
    select c.operator_id, c.email, c.password_hash,
           coalesce(u.restaurant_name, u.name) as name
    from operator_credentials c
    left join operator_users u on u.id = c.operator_id
    where lower(c.email) = lower(${email})
    limit 1`;
  const r = rows[0];
  return r
    ? { operatorId: r.operator_id, email: r.email, passwordHash: r.password_hash, name: r.name }
    : null;
}

/** Record a successful login timestamp (best-effort). */
export async function touchOperatorLogin(operatorId: number, email: string): Promise<void> {
  if (!opsDbConfigured()) return;
  const sql = opsDb();
  try {
    await sql`update operator_credentials set last_login_at = now()
              where operator_id = ${operatorId} and lower(email) = lower(${email})`;
  } catch {
    /* non-fatal */
  }
}

/** Admin: create or reset a login for an operator (delete-then-insert). */
export async function upsertOperatorCredential(
  operatorId: number,
  email: string,
  password: string,
): Promise<void> {
  const sql = opsDb();
  const hash = hashPassword(password);
  await sql`delete from operator_credentials where lower(email) = lower(${email})`;
  await sql`insert into operator_credentials (operator_id, email, password_hash)
            values (${operatorId}, lower(${email}), ${hash})`;
}

/** Does an operator_users row exist for this id? Guards credential creation. */
export async function operatorExists(operatorId: number): Promise<boolean> {
  if (!opsDbConfigured()) return false;
  const sql = opsDb();
  const rows = await sql<{ ok: boolean }[]>`
    select true as ok from operator_users where id = ${operatorId} limit 1`;
  return rows.length > 0;
}
