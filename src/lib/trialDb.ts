import { opsDb, opsDbConfigured } from './opsDb';
import crypto from 'crypto';

export type TrialSession = {
  id: number;
  sessionToken: string;
  startedAt: string;
  expiresAt: string;
  email: string | null;
  restaurantName: string | null;
  posType: string | null;
  sourceCampaign: string | null;
  csvRunsCount: number;
};

export const TRIAL_DURATION_MS = 60 * 60 * 1000; // 1 hour

export function newSessionToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

export async function startTrial(input: {
  sourceCampaign?: string;
  ip?: string;
  userAgent?: string;
}): Promise<TrialSession | null> {
  if (!opsDbConfigured()) return null;
  const sql = opsDb();
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + TRIAL_DURATION_MS);
  try {
    const rows = await sql<TrialSession[]>`
      INSERT INTO admin.trial_sessions (
        session_token, expires_at, source_campaign, ip, user_agent
      ) VALUES (
        ${token}, ${expiresAt}, ${input.sourceCampaign ?? null}, ${input.ip ?? null}, ${input.userAgent ?? null}
      )
      RETURNING
        id, session_token AS "sessionToken", started_at AS "startedAt",
        expires_at AS "expiresAt", email, restaurant_name AS "restaurantName",
        pos_type AS "posType", source_campaign AS "sourceCampaign",
        csv_runs_count AS "csvRunsCount"
    `;
    return rows[0] ?? null;
  } catch (e) {
    console.error('startTrial failed:', e);
    return null;
  }
}

export async function getTrial(token: string): Promise<TrialSession | null> {
  if (!opsDbConfigured()) return null;
  const sql = opsDb();
  try {
    const rows = await sql<TrialSession[]>`
      SELECT
        id, session_token AS "sessionToken", started_at AS "startedAt",
        expires_at AS "expiresAt", email, restaurant_name AS "restaurantName",
        pos_type AS "posType", source_campaign AS "sourceCampaign",
        csv_runs_count AS "csvRunsCount"
      FROM admin.trial_sessions
      WHERE session_token = ${token}
      LIMIT 1
    `;
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function attachLeadToTrial(
  token: string,
  fields: { email?: string; restaurantName?: string; posType?: string },
): Promise<void> {
  if (!opsDbConfigured()) return;
  const sql = opsDb();
  try {
    await sql`
      UPDATE admin.trial_sessions SET
        email           = COALESCE(${fields.email ?? null}, email),
        restaurant_name = COALESCE(${fields.restaurantName ?? null}, restaurant_name),
        pos_type        = COALESCE(${fields.posType ?? null}, pos_type)
      WHERE session_token = ${token}
    `;
  } catch (e) {
    console.error('attachLeadToTrial failed:', e);
  }
}

export async function bumpTrialRunCount(token: string): Promise<void> {
  if (!opsDbConfigured()) return;
  const sql = opsDb();
  try {
    await sql`UPDATE admin.trial_sessions SET csv_runs_count = csv_runs_count + 1 WHERE session_token = ${token}`;
  } catch {}
}

export type IntegrationInterest = {
  email: string;
  restaurantName?: string;
  pos: 'Toast' | 'Lightspeed' | 'Aloha' | 'Square' | 'Clover' | 'Other';
  units?: number | null;
  sourcePage?: string;
  notes?: string;
};

export async function captureIntegrationInterest(input: IntegrationInterest): Promise<boolean> {
  if (!opsDbConfigured()) return false;
  const sql = opsDb();
  try {
    await sql`
      INSERT INTO admin.integration_waitlist (
        email, restaurant_name, pos, units, source_page, notes
      ) VALUES (
        ${input.email.toLowerCase()},
        ${input.restaurantName ?? null},
        ${input.pos},
        ${input.units ?? null},
        ${input.sourcePage ?? null},
        ${input.notes ?? null}
      )
      ON CONFLICT (LOWER(email), pos) DO NOTHING
    `;
    return true;
  } catch (e) {
    console.error('captureIntegrationInterest failed:', e);
    return false;
  }
}
