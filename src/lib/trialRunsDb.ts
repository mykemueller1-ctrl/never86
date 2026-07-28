import { opsDb, opsDbConfigured } from './opsDb';
import crypto from 'crypto';

// Persistent storage for trial CSV runs. When an operator drops a CSV at
// /trial or /connect, the parsed result gets saved here against a
// share_token they can bookmark or get emailed. So they can return to
// the exact same read tomorrow morning at standup.

export type SavedRun = {
  id: number;
  sessionToken: string;
  shareToken: string;
  agent: string;
  filename: string | null;
  rowsParsed: number | null;
  result: unknown;
  email: string | null;
  restaurantName: string | null;
  createdAt: string;
};

export function newShareToken(): string {
  return crypto.randomBytes(12).toString('hex');
}

export async function saveTrialRun(input: {
  sessionToken: string;
  agent: 'void-hunter' | 'leak-detector';
  filename?: string;
  rowsParsed?: number;
  result: unknown;
  ip?: string;
  userAgent?: string;
}): Promise<{ shareToken: string } | null> {
  if (!opsDbConfigured()) return null;
  const sql = opsDb();
  const shareToken = newShareToken();
  try {
    await sql`
      INSERT INTO admin.trial_runs (
        session_token, share_token, agent, filename, rows_parsed, result, ip, user_agent
      ) VALUES (
        ${input.sessionToken},
        ${shareToken},
        ${input.agent},
        ${input.filename ?? null},
        ${input.rowsParsed ?? null},
        ${JSON.stringify(input.result)}::jsonb,
        ${input.ip ?? null},
        ${input.userAgent ?? null}
      )
    `;
    return { shareToken };
  } catch (e) {
    console.error('saveTrialRun failed:', e);
    return null;
  }
}

export async function getTrialRunByShareToken(shareToken: string): Promise<SavedRun | null> {
  if (!opsDbConfigured()) return null;
  const sql = opsDb();
  try {
    const rows = await sql<SavedRun[]>`
      SELECT
        id, session_token AS "sessionToken", share_token AS "shareToken",
        agent, filename, rows_parsed AS "rowsParsed",
        result, email, restaurant_name AS "restaurantName",
        created_at::text AS "createdAt"
      FROM admin.trial_runs
      WHERE share_token = ${shareToken}
      LIMIT 1
    `;
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function attachEmailToRun(
  shareToken: string,
  email: string,
  restaurantName?: string,
): Promise<boolean> {
  if (!opsDbConfigured()) return false;
  const sql = opsDb();
  try {
    await sql`
      UPDATE admin.trial_runs
      SET email = ${email.toLowerCase()},
          restaurant_name = COALESCE(${restaurantName ?? null}, restaurant_name)
      WHERE share_token = ${shareToken}
    `;
    return true;
  } catch (e) {
    console.error('attachEmailToRun failed:', e);
    return false;
  }
}

export async function listRunsForEmail(email: string): Promise<SavedRun[]> {
  if (!opsDbConfigured()) return [];
  const sql = opsDb();
  try {
    return await sql<SavedRun[]>`
      SELECT
        id, session_token AS "sessionToken", share_token AS "shareToken",
        agent, filename, rows_parsed AS "rowsParsed",
        result, email, restaurant_name AS "restaurantName",
        created_at::text AS "createdAt"
      FROM admin.trial_runs
      WHERE LOWER(email) = ${email.toLowerCase()}
      ORDER BY created_at DESC
      LIMIT 50
    `;
  } catch {
    return [];
  }
}
