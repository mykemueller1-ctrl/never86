import {
  evaluateStaffSeatLoginEnablement,
  fingerprintStaffToken,
  isSafeStaffInviteHandle,
  isStationSeatKey,
  toStaffSeatSession,
  type StaffActor,
  type StaffSeatSession,
  type StationSeatKey,
} from './staffSeatAuth';

export type LiveStaffInviteRow = {
  inviteHandle: string;
  tokenHash: string;
  expiresAt: string;
  consumedAt: string | null;
  operatorId: number;
  locationId: number;
  seatId: string;
  seatKey: StationSeatKey;
  status: string;
};

export type LiveStaffLoginLookup = (input: {
  inviteHandle: string;
  tokenHash: string;
  now: string;
}) => Promise<LiveStaffInviteRow | null>;

const FAIL_CLOSED = 'Staff login fails closed. Owner /login remains owner-only. No mail sent.';

function isoNow(now?: string): string {
  return now ?? new Date().toISOString();
}

async function lookupHashedStaffInvite(input: {
  inviteHandle: string;
  tokenHash: string;
  now: string;
}): Promise<LiveStaffInviteRow | null> {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(url);
    const rows = await sql`
      select
        i.invite_handle as "inviteHandle",
        i.token_hash as "tokenHash",
        i.expires_at as "expiresAt",
        i.consumed_at as "consumedAt",
        i.operator_id as "operatorId",
        coalesce(s.default_location_id, 0) as "locationId",
        i.seat_id as "seatId",
        i.seat_key as "seatKey",
        s.status as "status"
      from public.staff_seat_invites i
      join public.operator_staff_seats s
        on s.operator_id = i.operator_id
       and s.id = i.seat_id
      where i.invite_handle = ${input.inviteHandle}
        and i.token_hash = ${input.tokenHash}
        and i.consumed_at is null
        and i.expires_at > ${input.now}::timestamptz
      limit 1
    `;
    const row = rows[0] as LiveStaffInviteRow | undefined;
    return row ?? null;
  } catch {
    return null;
  }
}

export async function attemptLiveStaffSeatLogin(input: {
  inviteHandle?: unknown;
  deliverySecret?: unknown;
  now?: string;
  lookup?: LiveStaffLoginLookup;
}): Promise<
  | { ok: true; session: StaffSeatSession; mailSent: false; issuance: 'enabled' }
  | { ok: false; error: string; mailSent: false; issuance: 'blocked' }
> {
  const enablement = evaluateStaffSeatLoginEnablement();
  if (!enablement.ready) {
    return { ok: false, error: enablement.error, mailSent: false, issuance: 'blocked' };
  }

  const handle = typeof input.inviteHandle === 'string' ? input.inviteHandle.trim() : '';
  const secret = typeof input.deliverySecret === 'string' ? input.deliverySecret : '';
  if (!isSafeStaffInviteHandle(handle) || secret.length < 16) {
    return { ok: false, error: FAIL_CLOSED, mailSent: false, issuance: 'blocked' };
  }

  const tokenHash = fingerprintStaffToken(secret);
  const now = isoNow(input.now);
  const lookup = input.lookup ?? lookupHashedStaffInvite;
  const row = await lookup({ inviteHandle: handle, tokenHash, now });
  if (!row || row.consumedAt || row.status === 'revoked' || row.status === 'inactive') {
    return { ok: false, error: FAIL_CLOSED, mailSent: false, issuance: 'blocked' };
  }
  if (row.tokenHash !== tokenHash || !isStationSeatKey(row.seatKey)) {
    return { ok: false, error: FAIL_CLOSED, mailSent: false, issuance: 'blocked' };
  }

  const actor: StaffActor = {
    operatorId: row.operatorId,
    locationId: row.locationId,
    seatId: row.seatId,
    seatKey: row.seatKey,
  };
  return {
    ok: true,
    session: toStaffSeatSession(actor),
    mailSent: false,
    issuance: 'enabled',
  };
}
