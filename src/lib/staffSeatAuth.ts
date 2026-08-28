import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { CTAP_LAB_STATION_SEATS } from './ctapLabPack';

/**
 * Seat-scoped staff auth readiness.
 *
 * Live operator login (`/login`) still grants full operator access.
 * This module is the least-privilege replacement plane for manager and
 * station seats. It does not issue real credentials, send mail, or write
 * to Neon / Supabase.
 */

export const STAFF_SEAT_AUTH_STATUS = 'drafted' as const;
export const STAFF_CREDENTIAL_ISSUANCE = 'blocked' as const;

export const STATION_SEAT_KEYS = [
  'owner',
  'foh_manager',
  'kitchen_manager',
  'bartender',
  'server',
  'prep',
  'driver',
] as const;

export type StationSeatKey = (typeof STATION_SEAT_KEYS)[number];

export const MANAGER_FIRST_SEAT_KEYS = ['foh_manager', 'kitchen_manager'] as const;
export const CREW_STATION_SEAT_KEYS = ['bartender', 'server', 'prep', 'driver'] as const;

export const STAFF_CAPABILITIES = [
  'view_own_station',
  'view_all_stations',
  'acknowledge_shift',
  'invite_manager',
  'invite_station',
  'reset_seat',
  'revoke_seat',
  'prove_cash',
  'prove_dough',
  'prove_alarm',
  'assign_action',
] as const;

export type StaffCapability = (typeof STAFF_CAPABILITIES)[number];

export const PRIVILEGED_PROOF_FAMILIES = ['cash', 'dough', 'alarm'] as const;
export type PrivilegedProofFamily = (typeof PRIVILEGED_PROOF_FAMILIES)[number];

export const STAFF_AUDIT_ACTIONS = ['invite', 'reset', 'revoke', 'prove', 'login_attempt'] as const;
export type StaffAuditAction = (typeof STAFF_AUDIT_ACTIONS)[number];

export type StaffSeatKind = 'manager' | 'station';

export type StaffActor = {
  operatorId: number;
  locationId: number;
  seatId: string;
  seatKey: StationSeatKey;
};

export type StaffSeatRecord = {
  id: string;
  operatorId: number;
  locationId: number;
  seatKey: StationSeatKey;
  label: string;
  kind: StaffSeatKind;
  status: 'invited' | 'active' | 'inactive' | 'revoked';
  credentialState: 'not_issued' | 'invited' | 'active' | 'revoked';
  inviteHandle: string;
  tokenFingerprint: string | null;
};

export type StaffInvite = {
  id: string;
  operatorId: number;
  seatId: string;
  action: 'invite' | 'reset';
  tokenFingerprint: string;
  expiresAt: string;
  consumedAt: string | null;
  createdBySeatId: string;
};

export type StaffAuditReceipt = {
  id: string;
  action: StaffAuditAction;
  actorOperatorId: number;
  actorSeatId: string;
  actorSeatKey: StationSeatKey;
  targetOperatorId: number;
  targetSeatId: string;
  targetSeatKey: StationSeatKey | null;
  outcome: 'accepted' | 'denied';
  reason: string;
  tokenFingerprint: string | null;
  at: string;
  liveIssuance: typeof STAFF_CREDENTIAL_ISSUANCE;
  mailSent: false;
};

export type StaffDirectory = {
  seats: StaffSeatRecord[];
  invites: StaffInvite[];
  receipts: StaffAuditReceipt[];
};

export type StaffSeatSession = {
  kind: 'staff-seat';
  operatorId: number;
  locationId: number;
  seatId: string;
  seatKey: StationSeatKey;
  capabilities: readonly StaffCapability[];
  grantsFullOperatorAccess: false;
};

export type PrivateInputNeeded = {
  id: string;
  required: true;
  destination: 'private tenant database only — never git, logs, fixtures, or this PR';
  what: string;
};

const FOH_STATION_TARGETS: readonly StationSeatKey[] = ['bartender', 'server', 'driver'];
const KITCHEN_STATION_TARGETS: readonly StationSeatKey[] = ['prep'];

const CAPABILITY_BY_SEAT: Record<StationSeatKey, readonly StaffCapability[]> = {
  owner: [
    'view_own_station',
    'view_all_stations',
    'acknowledge_shift',
    'invite_manager',
    'invite_station',
    'reset_seat',
    'revoke_seat',
    'prove_cash',
    'prove_dough',
    'prove_alarm',
    'assign_action',
  ],
  foh_manager: [
    'view_own_station',
    'view_all_stations',
    'acknowledge_shift',
    'invite_station',
    'reset_seat',
    'revoke_seat',
    'prove_cash',
    'prove_alarm',
    'assign_action',
  ],
  kitchen_manager: [
    'view_own_station',
    'acknowledge_shift',
    'invite_station',
    'reset_seat',
    'revoke_seat',
    'prove_dough',
    'prove_alarm',
    'assign_action',
  ],
  bartender: ['view_own_station', 'acknowledge_shift'],
  server: ['view_own_station', 'acknowledge_shift'],
  prep: ['view_own_station', 'acknowledge_shift'],
  driver: ['view_own_station', 'acknowledge_shift'],
};

export const PRIVATE_INPUTS_BEFORE_REAL_CTAP_LOGIN: readonly PrivateInputNeeded[] = [
  {
    id: 'approved-roster-source',
    required: true,
    destination: 'private tenant database only — never git, logs, fixtures, or this PR',
    what: 'Operator-approved roster: one row per seat with station key, status, location, and a work email Myke authorizes. Names stay private.',
  },
  {
    id: 'approved-schedule-source',
    required: true,
    destination: 'private tenant database only — never git, logs, fixtures, or this PR',
    what: 'Operator-approved current schedule file or export for the first live week. Not a screenshot of a live board pasted into git.',
  },
  {
    id: 'owner-credential-stays-owner-only',
    required: true,
    destination: 'private tenant database only — never git, logs, fixtures, or this PR',
    what: 'Written confirmation that the existing /login operator credential stays the owner plane and is not copied onto manager or crew seats.',
  },
  {
    id: 'first-manager-seats',
    required: true,
    destination: 'private tenant database only — never git, logs, fixtures, or this PR',
    what: 'Which manager seats go live first (FOH manager and/or kitchen manager). Crew station logins wait until those manager seats work.',
  },
  {
    id: 'authorized-work-emails',
    required: true,
    destination: 'private tenant database only — never git, logs, fixtures, or this PR',
    what: 'Per-seat work emails Myke authorizes for invite delivery. No personal phones, POS PINs, or payroll files.',
  },
  {
    id: 'invite-delivery-channel',
    required: true,
    destination: 'private tenant database only — never git, logs, fixtures, or this PR',
    what: 'Human-approved delivery path for invite links. This slice does not auto-mail, CRM-write, or post.',
  },
  {
    id: 'live-schema-apply-approval',
    required: true,
    destination: 'private tenant database only — never git, logs, fixtures, or this PR',
    what: 'Explicit Myke approval to apply staff-seat invite + audit-receipt tables to Neon or Supabase. This PR does not apply them.',
  },
  {
    id: 'store-timezone-cutoff',
    required: true,
    destination: 'private tenant database only — never git, logs, fixtures, or this PR',
    what: 'Store timezone and business-day cutoff so invites, resets, and cash/dough/alarm proof stay on the restaurant day.',
  },
];

export function isStationSeatKey(value: string): value is StationSeatKey {
  return (STATION_SEAT_KEYS as readonly string[]).includes(value);
}

export function staffSeatKind(seatKey: StationSeatKey): StaffSeatKind {
  return seatKey === 'owner' || seatKey === 'foh_manager' || seatKey === 'kitchen_manager'
    ? 'manager'
    : 'station';
}

export function capabilitiesForSeat(seatKey: StationSeatKey): readonly StaffCapability[] {
  return CAPABILITY_BY_SEAT[seatKey];
}

export function seatHasCapability(seatKey: StationSeatKey, capability: StaffCapability): boolean {
  return CAPABILITY_BY_SEAT[seatKey].includes(capability);
}

export function labStationSeatsMatchAuthModel(): boolean {
  const labKeys = CTAP_LAB_STATION_SEATS.map((seat) => seat.seatKey);
  return labKeys.length === STATION_SEAT_KEYS.length
    && labKeys.every((key, index) => key === STATION_SEAT_KEYS[index]);
}

export function sameStaffTenant(
  a: Pick<StaffActor, 'operatorId' | 'locationId'>,
  b: Pick<StaffActor, 'operatorId' | 'locationId'>,
): boolean {
  return a.operatorId === b.operatorId && a.locationId === b.locationId;
}

export function canManageTargetSeat(actorKey: StationSeatKey, targetKey: StationSeatKey): boolean {
  if (actorKey === 'owner') return targetKey !== 'owner';
  if (actorKey === 'foh_manager') return FOH_STATION_TARGETS.includes(targetKey);
  if (actorKey === 'kitchen_manager') return KITCHEN_STATION_TARGETS.includes(targetKey);
  return false;
}

export function liveStaffCredentialGate(seatKey?: StationSeatKey): {
  allowed: false;
  issuance: typeof STAFF_CREDENTIAL_ISSUANCE;
  reason: string;
} {
  if (seatKey && (CREW_STATION_SEAT_KEYS as readonly string[]).includes(seatKey)) {
    return {
      allowed: false,
      issuance: STAFF_CREDENTIAL_ISSUANCE,
      reason: 'Manager-first: crew station logins wait until FOH and kitchen manager seats are live. Live staff credentials are not issued.',
    };
  }
  return {
    allowed: false,
    issuance: STAFF_CREDENTIAL_ISSUANCE,
    reason: 'Live staff credentials are not issued. The operator credential at /login still grants full operator access. Remaining private inputs are listed in PRIVATE_INPUTS_BEFORE_REAL_CTAP_LOGIN.',
  };
}

export function sessionGrantsFullOperatorAccess(session: { kind: string }): boolean {
  return session.kind === 'operator';
}

export function toStaffSeatSession(actor: StaffActor): StaffSeatSession {
  return {
    kind: 'staff-seat',
    operatorId: actor.operatorId,
    locationId: actor.locationId,
    seatId: actor.seatId,
    seatKey: actor.seatKey,
    capabilities: capabilitiesForSeat(actor.seatKey),
    grantsFullOperatorAccess: false,
  };
}

export function fingerprintStaffToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function tokensMatchFingerprint(token: string, fingerprint: string): boolean {
  const actual = Buffer.from(fingerprintStaffToken(token), 'hex');
  const expected = Buffer.from(fingerprint, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function mintToken(): { token: string; fingerprint: string } {
  const token = randomBytes(32).toString('hex');
  return { token, fingerprint: fingerprintStaffToken(token) };
}

function receiptId(prefix: string, now: string, nonce: string): string {
  return `${prefix}-${fingerprintStaffToken(`${now}:${nonce}`).slice(0, 12)}`;
}

function deny(
  directory: StaffDirectory,
  input: {
    action: StaffAuditAction;
    actor: StaffActor;
    targetOperatorId: number;
    targetSeatId: string;
    targetSeatKey: StationSeatKey | null;
    reason: string;
    now: string;
  },
): { ok: false; error: string; directory: StaffDirectory; receipt: StaffAuditReceipt } {
  const receipt: StaffAuditReceipt = {
    id: receiptId('deny', input.now, `${input.action}:${input.targetSeatId}`),
    action: input.action,
    actorOperatorId: input.actor.operatorId,
    actorSeatId: input.actor.seatId,
    actorSeatKey: input.actor.seatKey,
    targetOperatorId: input.targetOperatorId,
    targetSeatId: input.targetSeatId,
    targetSeatKey: input.targetSeatKey,
    outcome: 'denied',
    reason: input.reason,
    tokenFingerprint: null,
    at: input.now,
    liveIssuance: STAFF_CREDENTIAL_ISSUANCE,
    mailSent: false,
  };
  return {
    ok: false,
    error: input.reason,
    directory: { ...directory, receipts: [...directory.receipts, receipt] },
    receipt,
  };
}

function findSeat(directory: StaffDirectory, seatId: string): StaffSeatRecord | undefined {
  return directory.seats.find((seat) => seat.id === seatId);
}

function assertActorSeat(directory: StaffDirectory, actor: StaffActor): StaffSeatRecord | { error: string } {
  const seat = findSeat(directory, actor.seatId);
  if (!seat) return { error: 'That actor seat is not in this directory.' };
  if (seat.operatorId !== actor.operatorId || seat.locationId !== actor.locationId) {
    return { error: 'Tenant boundary: actor seat does not match the signed operator location.' };
  }
  if (seat.seatKey !== actor.seatKey) return { error: 'Actor seat key does not match the directory record.' };
  if (seat.status === 'revoked' || seat.status === 'inactive') {
    return { error: 'A revoked or inactive seat cannot invite, reset, revoke, or prove.' };
  }
  return seat;
}

export function inviteStaffSeat(input: {
  directory: StaffDirectory;
  actor: StaffActor;
  targetSeatId: string;
  now: string;
  expiresAt: string;
}):
  | { ok: true; directory: StaffDirectory; receipt: StaffAuditReceipt; deliverySecret: string }
  | { ok: false; error: string; directory: StaffDirectory; receipt: StaffAuditReceipt } {
  const actorSeat = assertActorSeat(input.directory, input.actor);
  if ('error' in actorSeat) {
    return deny(input.directory, {
      action: 'invite',
      actor: input.actor,
      targetOperatorId: input.actor.operatorId,
      targetSeatId: input.targetSeatId,
      targetSeatKey: null,
      reason: actorSeat.error,
      now: input.now,
    });
  }

  const target = findSeat(input.directory, input.targetSeatId);
  if (!target) {
    return deny(input.directory, {
      action: 'invite',
      actor: input.actor,
      targetOperatorId: input.actor.operatorId,
      targetSeatId: input.targetSeatId,
      targetSeatKey: null,
      reason: 'That seat is not in this directory.',
      now: input.now,
    });
  }

  if (!sameStaffTenant(input.actor, target)) {
    return deny(input.directory, {
      action: 'invite',
      actor: input.actor,
      targetOperatorId: target.operatorId,
      targetSeatId: target.id,
      targetSeatKey: target.seatKey,
      reason: 'Tenant boundary: operator A cannot invite operator B.',
      now: input.now,
    });
  }

  if (!seatHasCapability(input.actor.seatKey, target.kind === 'manager' ? 'invite_manager' : 'invite_station')
    || !canManageTargetSeat(input.actor.seatKey, target.seatKey)) {
    return deny(input.directory, {
      action: 'invite',
      actor: input.actor,
      targetOperatorId: target.operatorId,
      targetSeatId: target.id,
      targetSeatKey: target.seatKey,
      reason: `Least privilege: ${input.actor.seatKey.replaceAll('_', ' ')} cannot invite ${target.seatKey.replaceAll('_', ' ')}.`,
      now: input.now,
    });
  }

  if (target.status === 'revoked') {
    return deny(input.directory, {
      action: 'invite',
      actor: input.actor,
      targetOperatorId: target.operatorId,
      targetSeatId: target.id,
      targetSeatKey: target.seatKey,
      reason: 'Re-invite a revoked seat with reset, not invite.',
      now: input.now,
    });
  }

  const minted = mintToken();
  const invite: StaffInvite = {
    id: receiptId('inv', input.now, target.id),
    operatorId: target.operatorId,
    seatId: target.id,
    action: 'invite',
    tokenFingerprint: minted.fingerprint,
    expiresAt: input.expiresAt,
    consumedAt: null,
    createdBySeatId: input.actor.seatId,
  };
  const receipt: StaffAuditReceipt = {
    id: receiptId('ok-invite', input.now, target.id),
    action: 'invite',
    actorOperatorId: input.actor.operatorId,
    actorSeatId: input.actor.seatId,
    actorSeatKey: input.actor.seatKey,
    targetOperatorId: target.operatorId,
    targetSeatId: target.id,
    targetSeatKey: target.seatKey,
    outcome: 'accepted',
    reason: 'Synthetic invite recorded. Delivery secret is not stored on the receipt. No mail sent. Live issuance blocked.',
    tokenFingerprint: minted.fingerprint,
    at: input.now,
    liveIssuance: STAFF_CREDENTIAL_ISSUANCE,
    mailSent: false,
  };

  const seats = input.directory.seats.map((seat) => seat.id === target.id
    ? { ...seat, status: 'invited' as const, credentialState: 'invited' as const, tokenFingerprint: minted.fingerprint }
    : seat);

  return {
    ok: true,
    deliverySecret: minted.token,
    directory: {
      seats,
      invites: [...input.directory.invites.filter((row) => row.seatId !== target.id || row.consumedAt), invite],
      receipts: [...input.directory.receipts, receipt],
    },
    receipt,
  };
}

export function resetStaffSeat(input: {
  directory: StaffDirectory;
  actor: StaffActor;
  targetSeatId: string;
  now: string;
  expiresAt: string;
}):
  | { ok: true; directory: StaffDirectory; receipt: StaffAuditReceipt; deliverySecret: string }
  | { ok: false; error: string; directory: StaffDirectory; receipt: StaffAuditReceipt } {
  const actorSeat = assertActorSeat(input.directory, input.actor);
  if ('error' in actorSeat) {
    return deny(input.directory, {
      action: 'reset',
      actor: input.actor,
      targetOperatorId: input.actor.operatorId,
      targetSeatId: input.targetSeatId,
      targetSeatKey: null,
      reason: actorSeat.error,
      now: input.now,
    });
  }

  const target = findSeat(input.directory, input.targetSeatId);
  if (!target) {
    return deny(input.directory, {
      action: 'reset',
      actor: input.actor,
      targetOperatorId: input.actor.operatorId,
      targetSeatId: input.targetSeatId,
      targetSeatKey: null,
      reason: 'That seat is not in this directory.',
      now: input.now,
    });
  }

  if (!sameStaffTenant(input.actor, target)) {
    return deny(input.directory, {
      action: 'reset',
      actor: input.actor,
      targetOperatorId: target.operatorId,
      targetSeatId: target.id,
      targetSeatKey: target.seatKey,
      reason: 'Tenant boundary: operator A cannot reset operator B.',
      now: input.now,
    });
  }

  if (!seatHasCapability(input.actor.seatKey, 'reset_seat')
    || !canManageTargetSeat(input.actor.seatKey, target.seatKey)) {
    return deny(input.directory, {
      action: 'reset',
      actor: input.actor,
      targetOperatorId: target.operatorId,
      targetSeatId: target.id,
      targetSeatKey: target.seatKey,
      reason: `Least privilege: ${input.actor.seatKey.replaceAll('_', ' ')} cannot reset ${target.seatKey.replaceAll('_', ' ')}.`,
      now: input.now,
    });
  }

  const minted = mintToken();
  const invite: StaffInvite = {
    id: receiptId('rst', input.now, target.id),
    operatorId: target.operatorId,
    seatId: target.id,
    action: 'reset',
    tokenFingerprint: minted.fingerprint,
    expiresAt: input.expiresAt,
    consumedAt: null,
    createdBySeatId: input.actor.seatId,
  };
  const receipt: StaffAuditReceipt = {
    id: receiptId('ok-reset', input.now, target.id),
    action: 'reset',
    actorOperatorId: input.actor.operatorId,
    actorSeatId: input.actor.seatId,
    actorSeatKey: input.actor.seatKey,
    targetOperatorId: target.operatorId,
    targetSeatId: target.id,
    targetSeatKey: target.seatKey,
    outcome: 'accepted',
    reason: 'Synthetic reset recorded. Prior invite fingerprints are superseded. No mail sent. Live issuance blocked.',
    tokenFingerprint: minted.fingerprint,
    at: input.now,
    liveIssuance: STAFF_CREDENTIAL_ISSUANCE,
    mailSent: false,
  };

  const seats = input.directory.seats.map((seat) => seat.id === target.id
    ? {
      ...seat,
      status: seat.status === 'revoked' ? 'invited' as const : seat.status,
      credentialState: 'invited' as const,
      tokenFingerprint: minted.fingerprint,
    }
    : seat);

  return {
    ok: true,
    deliverySecret: minted.token,
    directory: {
      seats,
      invites: [
        ...input.directory.invites.map((row) => row.seatId === target.id && !row.consumedAt
          ? { ...row, consumedAt: input.now }
          : row),
        invite,
      ],
      receipts: [...input.directory.receipts, receipt],
    },
    receipt,
  };
}

export function revokeStaffSeat(input: {
  directory: StaffDirectory;
  actor: StaffActor;
  targetSeatId: string;
  now: string;
}):
  | { ok: true; directory: StaffDirectory; receipt: StaffAuditReceipt }
  | { ok: false; error: string; directory: StaffDirectory; receipt: StaffAuditReceipt } {
  const actorSeat = assertActorSeat(input.directory, input.actor);
  if ('error' in actorSeat) {
    return deny(input.directory, {
      action: 'revoke',
      actor: input.actor,
      targetOperatorId: input.actor.operatorId,
      targetSeatId: input.targetSeatId,
      targetSeatKey: null,
      reason: actorSeat.error,
      now: input.now,
    });
  }

  const target = findSeat(input.directory, input.targetSeatId);
  if (!target) {
    return deny(input.directory, {
      action: 'revoke',
      actor: input.actor,
      targetOperatorId: input.actor.operatorId,
      targetSeatId: input.targetSeatId,
      targetSeatKey: null,
      reason: 'That seat is not in this directory.',
      now: input.now,
    });
  }

  if (!sameStaffTenant(input.actor, target)) {
    return deny(input.directory, {
      action: 'revoke',
      actor: input.actor,
      targetOperatorId: target.operatorId,
      targetSeatId: target.id,
      targetSeatKey: target.seatKey,
      reason: 'Tenant boundary: operator A cannot revoke operator B.',
      now: input.now,
    });
  }

  if (target.seatKey === 'owner') {
    return deny(input.directory, {
      action: 'revoke',
      actor: input.actor,
      targetOperatorId: target.operatorId,
      targetSeatId: target.id,
      targetSeatKey: target.seatKey,
      reason: 'The owner station seat is not revoked from the staff plane. Operator credential stays owner-only.',
      now: input.now,
    });
  }

  if (!seatHasCapability(input.actor.seatKey, 'revoke_seat')
    || !canManageTargetSeat(input.actor.seatKey, target.seatKey)) {
    return deny(input.directory, {
      action: 'revoke',
      actor: input.actor,
      targetOperatorId: target.operatorId,
      targetSeatId: target.id,
      targetSeatKey: target.seatKey,
      reason: `Least privilege: ${input.actor.seatKey.replaceAll('_', ' ')} cannot revoke ${target.seatKey.replaceAll('_', ' ')}.`,
      now: input.now,
    });
  }

  const receipt: StaffAuditReceipt = {
    id: receiptId('ok-revoke', input.now, target.id),
    action: 'revoke',
    actorOperatorId: input.actor.operatorId,
    actorSeatId: input.actor.seatId,
    actorSeatKey: input.actor.seatKey,
    targetOperatorId: target.operatorId,
    targetSeatId: target.id,
    targetSeatKey: target.seatKey,
    outcome: 'accepted',
    reason: 'Synthetic revoke recorded. Seat cannot authenticate. No mail sent. Live issuance blocked.',
    tokenFingerprint: null,
    at: input.now,
    liveIssuance: STAFF_CREDENTIAL_ISSUANCE,
    mailSent: false,
  };

  const seats = input.directory.seats.map((seat) => seat.id === target.id
    ? { ...seat, status: 'revoked' as const, credentialState: 'revoked' as const, tokenFingerprint: null }
    : seat);

  return {
    ok: true,
    directory: {
      seats,
      invites: input.directory.invites.map((row) => row.seatId === target.id && !row.consumedAt
        ? { ...row, consumedAt: input.now }
        : row),
      receipts: [...input.directory.receipts, receipt],
    },
    receipt,
  };
}

export function provePrivilegedShiftItem(input: {
  directory: StaffDirectory;
  actor: StaffActor;
  target: { operatorId: number; locationId: number; seatId: string; family: PrivilegedProofFamily };
  outcome: 'acknowledged' | 'verified';
  proofKind?: string;
  now: string;
}):
  | { ok: true; directory: StaffDirectory; receipt: StaffAuditReceipt; state: 'acknowledged' | 'verified' }
  | { ok: false; error: string; directory: StaffDirectory; receipt: StaffAuditReceipt } {
  const actorSeat = assertActorSeat(input.directory, input.actor);
  if ('error' in actorSeat) {
    return deny(input.directory, {
      action: 'prove',
      actor: input.actor,
      targetOperatorId: input.target.operatorId,
      targetSeatId: input.target.seatId,
      targetSeatKey: null,
      reason: actorSeat.error,
      now: input.now,
    });
  }

  if (!sameStaffTenant(input.actor, input.target)) {
    return deny(input.directory, {
      action: 'prove',
      actor: input.actor,
      targetOperatorId: input.target.operatorId,
      targetSeatId: input.target.seatId,
      targetSeatKey: null,
      reason: 'Tenant boundary: operator A cannot prove operator B cash, dough, or alarm.',
      now: input.now,
    });
  }

  const capability: StaffCapability = input.target.family === 'cash'
    ? 'prove_cash'
    : input.target.family === 'dough'
      ? 'prove_dough'
      : 'prove_alarm';

  if (!seatHasCapability(input.actor.seatKey, capability)) {
    return deny(input.directory, {
      action: 'prove',
      actor: input.actor,
      targetOperatorId: input.target.operatorId,
      targetSeatId: input.target.seatId,
      targetSeatKey: actorSeat.seatKey,
      reason: `Least privilege: ${input.actor.seatKey.replaceAll('_', ' ')} cannot close ${input.target.family}.`,
      now: input.now,
    });
  }

  if (input.outcome === 'verified') {
    if (!input.proofKind || input.proofKind === 'verbal') {
      return deny(input.directory, {
        action: 'prove',
        actor: input.actor,
        targetOperatorId: input.target.operatorId,
        targetSeatId: input.target.seatId,
        targetSeatKey: actorSeat.seatKey,
        reason: `A verbal yes does not close ${input.target.family}. Attach the proof object from the shift.`,
        now: input.now,
      });
    }
  }

  const receipt: StaffAuditReceipt = {
    id: receiptId('ok-prove', input.now, `${input.target.family}:${input.target.seatId}`),
    action: 'prove',
    actorOperatorId: input.actor.operatorId,
    actorSeatId: input.actor.seatId,
    actorSeatKey: input.actor.seatKey,
    targetOperatorId: input.target.operatorId,
    targetSeatId: input.target.seatId,
    targetSeatKey: actorSeat.seatKey,
    outcome: 'accepted',
    reason: input.outcome === 'acknowledged'
      ? `${input.target.family} acknowledged. Still open until source proof arrives.`
      : `${input.target.family} verified with ${input.proofKind}.`,
    tokenFingerprint: null,
    at: input.now,
    liveIssuance: STAFF_CREDENTIAL_ISSUANCE,
    mailSent: false,
  };

  return {
    ok: true,
    state: input.outcome,
    directory: { ...input.directory, receipts: [...input.directory.receipts, receipt] },
    receipt,
  };
}

export function authenticateStaffSeat(input: {
  directory: StaffDirectory;
  inviteHandle: string;
  deliverySecret: string;
  now: string;
}):
  | { ok: true; session: StaffSeatSession; directory: StaffDirectory }
  | { ok: false; error: string; directory: StaffDirectory; receipt: StaffAuditReceipt } {
  const target = input.directory.seats.find((seat) => seat.inviteHandle === input.inviteHandle);
  const actor: StaffActor = target
    ? {
      operatorId: target.operatorId,
      locationId: target.locationId,
      seatId: target.id,
      seatKey: target.seatKey,
    }
    : {
      operatorId: 0,
      locationId: 0,
      seatId: 'unknown',
      seatKey: 'server',
    };

  if (!target || !target.tokenFingerprint || target.credentialState === 'revoked' || target.status === 'revoked') {
    return deny(input.directory, {
      action: 'login_attempt',
      actor,
      targetOperatorId: target?.operatorId ?? 0,
      targetSeatId: target?.id ?? 'unknown',
      targetSeatKey: target?.seatKey ?? null,
      reason: 'Staff seat login refused. Live credentials are not issued.',
      now: input.now,
    });
  }

  const invite = input.directory.invites.find((row) => row.seatId === target.id && !row.consumedAt);
  if (!invite || invite.expiresAt <= input.now || !tokensMatchFingerprint(input.deliverySecret, target.tokenFingerprint)) {
    return deny(input.directory, {
      action: 'login_attempt',
      actor,
      targetOperatorId: target.operatorId,
      targetSeatId: target.id,
      targetSeatKey: target.seatKey,
      reason: 'Staff seat login refused. Live credentials are not issued.',
      now: input.now,
    });
  }

  const session = toStaffSeatSession(actor);
  const receipt: StaffAuditReceipt = {
    id: receiptId('ok-login', input.now, target.id),
    action: 'login_attempt',
    actorOperatorId: actor.operatorId,
    actorSeatId: actor.seatId,
    actorSeatKey: actor.seatKey,
    targetOperatorId: target.operatorId,
    targetSeatId: target.id,
    targetSeatKey: target.seatKey,
    outcome: 'accepted',
    reason: 'Synthetic staff-seat session only. grantsFullOperatorAccess remains false. Live issuance blocked.',
    tokenFingerprint: target.tokenFingerprint,
    at: input.now,
    liveIssuance: STAFF_CREDENTIAL_ISSUANCE,
    mailSent: false,
  };

  return {
    ok: true,
    session,
    directory: { ...input.directory, receipts: [...input.directory.receipts, receipt] },
  };
}

export function issueLiveStaffCredential(): {
  ok: false;
  issuance: typeof STAFF_CREDENTIAL_ISSUANCE;
  error: string;
  privateInputIds: readonly string[];
} {
  const gate = liveStaffCredentialGate();
  return {
    ok: false,
    issuance: gate.issuance,
    error: gate.reason,
    privateInputIds: PRIVATE_INPUTS_BEFORE_REAL_CTAP_LOGIN.map((item) => item.id),
  };
}
