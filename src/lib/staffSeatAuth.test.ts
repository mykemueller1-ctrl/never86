import { describe, expect, it } from 'vitest';
import { CTAP_LAB_STATION_SEATS } from './ctapLabPack';
import {
  MANAGER_FIRST_SEAT_KEYS,
  PRIVATE_INPUTS_BEFORE_REAL_CTAP_LOGIN,
  STAFF_CREDENTIAL_ISSUANCE,
  STATION_SEAT_KEYS,
  authenticateStaffSeat,
  capabilitiesForSeat,
  canManageTargetSeat,
  inviteStaffSeat,
  issueLiveStaffCredential,
  labStationSeatsMatchAuthModel,
  liveStaffCredentialGate,
  provePrivilegedShiftItem,
  resetStaffSeat,
  revokeStaffSeat,
  sameStaffTenant,
  seatHasCapability,
  sessionGrantsFullOperatorAccess,
  toStaffSeatSession,
} from './staffSeatAuth';
import {
  SYNTHETIC_OPERATOR_A_ID,
  SYNTHETIC_OPERATOR_B_ID,
  SYNTHETIC_STAFF_ROSTER,
  SYNTHETIC_STAFF_ROSTER_CSV,
  SYNTHETIC_STAFF_SCHEDULE,
  SYNTHETIC_STAFF_SCHEDULE_CSV,
  buildSyntheticStaffDirectory,
  staffFixtureContainsPrivatePayload,
  syntheticActor,
  syntheticRosterUsesLabStationSeats,
  syntheticSeatId,
} from './staffSeatFixtures';

const NOW = '2026-08-24T16:00:00.000-05:00';
const EXPIRES = '2026-08-25T16:00:00.000-05:00';

describe('staff seat auth model', () => {
  it('maps owner, FOH manager, kitchen manager, bartender, server, prep, and driver as station seats', () => {
    expect([...STATION_SEAT_KEYS]).toEqual([
      'owner',
      'foh_manager',
      'kitchen_manager',
      'bartender',
      'server',
      'prep',
      'driver',
    ]);
    expect(labStationSeatsMatchAuthModel()).toBe(true);
    expect(CTAP_LAB_STATION_SEATS.every((seat) => seat.kind === 'station_seat')).toBe(true);
    expect([...MANAGER_FIRST_SEAT_KEYS]).toEqual(['foh_manager', 'kitchen_manager']);
  });

  it('keeps staff sessions least-privilege and distinct from the full operator credential', () => {
    const owner = toStaffSeatSession(syntheticActor(SYNTHETIC_OPERATOR_A_ID, 'owner'));
    const bartender = toStaffSeatSession(syntheticActor(SYNTHETIC_OPERATOR_A_ID, 'bartender'));
    expect(owner.grantsFullOperatorAccess).toBe(false);
    expect(sessionGrantsFullOperatorAccess(owner)).toBe(false);
    expect(sessionGrantsFullOperatorAccess({ kind: 'operator' })).toBe(true);
    expect(seatHasCapability('bartender', 'invite_station')).toBe(false);
    expect(seatHasCapability('bartender', 'prove_cash')).toBe(false);
    expect(seatHasCapability('server', 'revoke_seat')).toBe(false);
    expect(seatHasCapability('prep', 'prove_dough')).toBe(false);
    expect(seatHasCapability('driver', 'prove_alarm')).toBe(false);
    expect(capabilitiesForSeat('foh_manager')).toContain('invite_station');
    expect(capabilitiesForSeat('foh_manager')).not.toContain('invite_manager');
    expect(capabilitiesForSeat('foh_manager')).not.toContain('prove_dough');
    expect(capabilitiesForSeat('kitchen_manager')).toContain('prove_dough');
    expect(capabilitiesForSeat('kitchen_manager')).not.toContain('prove_cash');
    expect(canManageTargetSeat('foh_manager', 'bartender')).toBe(true);
    expect(canManageTargetSeat('foh_manager', 'kitchen_manager')).toBe(false);
    expect(canManageTargetSeat('kitchen_manager', 'prep')).toBe(true);
    expect(canManageTargetSeat('kitchen_manager', 'server')).toBe(false);
    expect(canManageTargetSeat('server', 'bartender')).toBe(false);
    expect(bartender.capabilities).toEqual(['view_own_station', 'acknowledge_shift']);
  });
});

describe('tenant boundary', () => {
  it('refuses operator A owning, proving, inviting, or revoking operator B', () => {
    const start = buildSyntheticStaffDirectory();
    const actorA = syntheticActor(SYNTHETIC_OPERATOR_A_ID, 'owner');
    const targetB = syntheticSeatId(SYNTHETIC_OPERATOR_B_ID, 'foh_manager');

    expect(sameStaffTenant(
      syntheticActor(SYNTHETIC_OPERATOR_A_ID, 'owner'),
      syntheticActor(SYNTHETIC_OPERATOR_B_ID, 'owner'),
    )).toBe(false);

    const invited = inviteStaffSeat({
      directory: start,
      actor: actorA,
      targetSeatId: targetB,
      now: NOW,
      expiresAt: EXPIRES,
    });
    expect(invited.ok).toBe(false);
    if (invited.ok) return;
    expect(invited.error).toMatch(/operator A cannot invite operator B/i);
    expect(invited.receipt.outcome).toBe('denied');
    expect(invited.receipt.mailSent).toBe(false);

    const reset = resetStaffSeat({
      directory: invited.directory,
      actor: actorA,
      targetSeatId: targetB,
      now: NOW,
      expiresAt: EXPIRES,
    });
    expect(reset.ok).toBe(false);
    if (reset.ok) return;
    expect(reset.error).toMatch(/operator A cannot reset operator B/i);

    const revoked = revokeStaffSeat({
      directory: reset.directory,
      actor: actorA,
      targetSeatId: targetB,
      now: NOW,
    });
    expect(revoked.ok).toBe(false);
    if (revoked.ok) return;
    expect(revoked.error).toMatch(/operator A cannot revoke operator B/i);

    const proved = provePrivilegedShiftItem({
      directory: revoked.directory,
      actor: actorA,
      target: {
        operatorId: SYNTHETIC_OPERATOR_B_ID,
        locationId: 22,
        seatId: targetB,
        family: 'cash',
      },
      outcome: 'verified',
      proofKind: 'deposit-slip',
      now: NOW,
    });
    expect(proved.ok).toBe(false);
    if (proved.ok) return;
    expect(proved.error).toMatch(/cannot prove operator B/i);
    expect(proved.directory.seats.find((seat) => seat.id === targetB)?.credentialState).toBe('not_issued');
  });
});

describe('invite / reset / revoke with audit receipts', () => {
  it('lets the owner invite a manager-first FOH seat, reset it, then revoke it with receipts and no mail', () => {
    const invited = inviteStaffSeat({
      directory: buildSyntheticStaffDirectory(),
      actor: syntheticActor(SYNTHETIC_OPERATOR_A_ID, 'owner'),
      targetSeatId: syntheticSeatId(SYNTHETIC_OPERATOR_A_ID, 'foh_manager'),
      now: NOW,
      expiresAt: EXPIRES,
    });
    expect(invited.ok).toBe(true);
    if (!invited.ok) return;
    expect(invited.deliverySecret).toMatch(/^[a-f0-9]{64}$/);
    expect(invited.receipt.tokenFingerprint).not.toBe(invited.deliverySecret);
    expect(JSON.stringify(invited.receipt)).not.toContain(invited.deliverySecret);
    expect(invited.receipt.mailSent).toBe(false);
    expect(invited.receipt.liveIssuance).toBe('blocked');
    expect(invited.directory.seats.find((seat) => seat.seatKey === 'foh_manager' && seat.operatorId === SYNTHETIC_OPERATOR_A_ID)?.credentialState).toBe('invited');

    const authed = authenticateStaffSeat({
      directory: invited.directory,
      inviteHandle: `synth-${SYNTHETIC_OPERATOR_A_ID}-foh-manager`,
      deliverySecret: invited.deliverySecret,
      now: NOW,
    });
    expect(authed.ok).toBe(true);
    if (!authed.ok) return;
    expect(authed.session.kind).toBe('staff-seat');
    expect(authed.session.grantsFullOperatorAccess).toBe(false);
    expect(authed.session.seatKey).toBe('foh_manager');

    const reset = resetStaffSeat({
      directory: authed.directory,
      actor: syntheticActor(SYNTHETIC_OPERATOR_A_ID, 'owner'),
      targetSeatId: syntheticSeatId(SYNTHETIC_OPERATOR_A_ID, 'foh_manager'),
      now: NOW,
      expiresAt: EXPIRES,
    });
    expect(reset.ok).toBe(true);
    if (!reset.ok) return;
    expect(reset.deliverySecret).not.toBe(invited.deliverySecret);
    expect(reset.directory.invites.filter((row) => row.seatId === syntheticSeatId(SYNTHETIC_OPERATOR_A_ID, 'foh_manager') && !row.consumedAt)).toHaveLength(1);

    const stale = authenticateStaffSeat({
      directory: reset.directory,
      inviteHandle: `synth-${SYNTHETIC_OPERATOR_A_ID}-foh-manager`,
      deliverySecret: invited.deliverySecret,
      now: NOW,
    });
    expect(stale.ok).toBe(false);

    const revoked = revokeStaffSeat({
      directory: stale.directory,
      actor: syntheticActor(SYNTHETIC_OPERATOR_A_ID, 'owner'),
      targetSeatId: syntheticSeatId(SYNTHETIC_OPERATOR_A_ID, 'foh_manager'),
      now: NOW,
    });
    expect(revoked.ok).toBe(true);
    if (!revoked.ok) return;
    expect(revoked.directory.seats.find((seat) => seat.id === syntheticSeatId(SYNTHETIC_OPERATOR_A_ID, 'foh_manager'))?.status).toBe('revoked');
    expect(revoked.receipt.action).toBe('revoke');
    expect(revoked.directory.receipts.map((row) => row.action)).toEqual([
      'invite',
      'login_attempt',
      'reset',
      'login_attempt',
      'revoke',
    ]);
  });

  it('lets FOH manager invite a bartender but not a kitchen manager', () => {
    const ok = inviteStaffSeat({
      directory: buildSyntheticStaffDirectory(),
      actor: syntheticActor(SYNTHETIC_OPERATOR_A_ID, 'foh_manager'),
      targetSeatId: syntheticSeatId(SYNTHETIC_OPERATOR_A_ID, 'bartender'),
      now: NOW,
      expiresAt: EXPIRES,
    });
    expect(ok.ok).toBe(true);

    const denied = inviteStaffSeat({
      directory: buildSyntheticStaffDirectory(),
      actor: syntheticActor(SYNTHETIC_OPERATOR_A_ID, 'foh_manager'),
      targetSeatId: syntheticSeatId(SYNTHETIC_OPERATOR_A_ID, 'kitchen_manager'),
      now: NOW,
      expiresAt: EXPIRES,
    });
    expect(denied.ok).toBe(false);
    if (denied.ok) return;
    expect(denied.error).toMatch(/cannot invite kitchen manager/i);
    expect(denied.receipt.outcome).toBe('denied');
  });

  it('lets kitchen manager invite prep but not a server, and crew cannot invite anyone', () => {
    const prep = inviteStaffSeat({
      directory: buildSyntheticStaffDirectory(),
      actor: syntheticActor(SYNTHETIC_OPERATOR_A_ID, 'kitchen_manager'),
      targetSeatId: syntheticSeatId(SYNTHETIC_OPERATOR_A_ID, 'prep'),
      now: NOW,
      expiresAt: EXPIRES,
    });
    expect(prep.ok).toBe(true);

    const server = inviteStaffSeat({
      directory: buildSyntheticStaffDirectory(),
      actor: syntheticActor(SYNTHETIC_OPERATOR_A_ID, 'kitchen_manager'),
      targetSeatId: syntheticSeatId(SYNTHETIC_OPERATOR_A_ID, 'server'),
      now: NOW,
      expiresAt: EXPIRES,
    });
    expect(server.ok).toBe(false);

    const crew = inviteStaffSeat({
      directory: buildSyntheticStaffDirectory(),
      actor: syntheticActor(SYNTHETIC_OPERATOR_A_ID, 'server'),
      targetSeatId: syntheticSeatId(SYNTHETIC_OPERATOR_A_ID, 'bartender'),
      now: NOW,
      expiresAt: EXPIRES,
    });
    expect(crew.ok).toBe(false);
    if (crew.ok) return;
    expect(crew.error).toMatch(/cannot invite bartender/i);
  });
});

describe('Action Shift proof rules on staff seats', () => {
  it('will not close cash, dough, or alarm from a verbal yes', () => {
    const directory = buildSyntheticStaffDirectory();
    for (const family of ['cash', 'dough', 'alarm'] as const) {
      const result = provePrivilegedShiftItem({
        directory,
        actor: syntheticActor(SYNTHETIC_OPERATOR_A_ID, 'owner'),
        target: {
          operatorId: SYNTHETIC_OPERATOR_A_ID,
          locationId: 11,
          seatId: syntheticSeatId(SYNTHETIC_OPERATOR_A_ID, 'owner'),
          family,
        },
        outcome: 'verified',
        proofKind: 'verbal',
        now: NOW,
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBe(`A verbal yes does not close ${family}. Attach the proof object from the shift.`);
    }
  });

  it('lets FOH manager close cash with a deposit slip and refuses crew cash close', () => {
    const cash = provePrivilegedShiftItem({
      directory: buildSyntheticStaffDirectory(),
      actor: syntheticActor(SYNTHETIC_OPERATOR_A_ID, 'foh_manager'),
      target: {
        operatorId: SYNTHETIC_OPERATOR_A_ID,
        locationId: 11,
        seatId: syntheticSeatId(SYNTHETIC_OPERATOR_A_ID, 'foh_manager'),
        family: 'cash',
      },
      outcome: 'verified',
      proofKind: 'deposit-slip',
      now: NOW,
    });
    expect(cash.ok).toBe(true);

    const crew = provePrivilegedShiftItem({
      directory: buildSyntheticStaffDirectory(),
      actor: syntheticActor(SYNTHETIC_OPERATOR_A_ID, 'bartender'),
      target: {
        operatorId: SYNTHETIC_OPERATOR_A_ID,
        locationId: 11,
        seatId: syntheticSeatId(SYNTHETIC_OPERATOR_A_ID, 'bartender'),
        family: 'cash',
      },
      outcome: 'verified',
      proofKind: 'deposit-slip',
      now: NOW,
    });
    expect(crew.ok).toBe(false);
    if (crew.ok) return;
    expect(crew.error).toMatch(/cannot close cash/i);
  });
});

describe('synthetic roster and live issuance stop', () => {
  it('ships synthetic roster and schedule fixtures with no private CTap payload', () => {
    expect(syntheticRosterUsesLabStationSeats()).toBe(true);
    expect(SYNTHETIC_STAFF_ROSTER).toHaveLength(14);
    expect(SYNTHETIC_STAFF_SCHEDULE).toHaveLength(14);
    expect(new Set(SYNTHETIC_STAFF_ROSTER.map((row) => row.operatorId))).toEqual(new Set([
      SYNTHETIC_OPERATOR_A_ID,
      SYNTHETIC_OPERATOR_B_ID,
    ]));
    expect(staffFixtureContainsPrivatePayload(buildSyntheticStaffDirectory())).toBe(false);
    expect(staffFixtureContainsPrivatePayload(SYNTHETIC_STAFF_ROSTER_CSV)).toBe(false);
    expect(staffFixtureContainsPrivatePayload(SYNTHETIC_STAFF_SCHEDULE_CSV)).toBe(false);
    expect(SYNTHETIC_STAFF_ROSTER.every((row) => row.displayName.startsWith('Example '))).toBe(true);
    expect(SYNTHETIC_STAFF_SCHEDULE.every((row) => row.businessDate === '2026-08-24')).toBe(true);
  });

  it('stops live credential issuance and names the exact private inputs still needed', () => {
    expect(issueLiveStaffCredential()).toEqual({
      ok: false,
      issuance: STAFF_CREDENTIAL_ISSUANCE,
      error: liveStaffCredentialGate().reason,
      privateInputIds: PRIVATE_INPUTS_BEFORE_REAL_CTAP_LOGIN.map((item) => item.id),
    });
    expect(liveStaffCredentialGate('bartender').reason).toMatch(/Manager-first/i);
    expect(PRIVATE_INPUTS_BEFORE_REAL_CTAP_LOGIN.map((item) => item.id)).toEqual([
      'approved-roster-source',
      'approved-schedule-source',
      'owner-credential-stays-owner-only',
      'first-manager-seats',
      'authorized-work-emails',
      'invite-delivery-channel',
      'live-schema-apply-approval',
      'store-timezone-cutoff',
    ]);
    expect(PRIVATE_INPUTS_BEFORE_REAL_CTAP_LOGIN.every((item) => item.required && item.destination.includes('never git'))).toBe(true);
    expect(staffFixtureContainsPrivatePayload(PRIVATE_INPUTS_BEFORE_REAL_CTAP_LOGIN)).toBe(false);
  });
});
