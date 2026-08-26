export type WorkforceSeat = {
  id: string;
  operatorId: number;
  status: 'invited' | 'active' | 'inactive' | 'archived';
};

export type WorkforceRoleAssignment = {
  operatorId: number;
  seatId: string;
  locationId: number | null;
  roleKey: string;
  activeFrom: string;
  activeUntil?: string | null;
};

export type WorkforceIdentityLink = {
  operatorId: number;
  seatId: string;
  providerKey: string;
  externalWorkerId: string;
  active: boolean;
};

export type WorkforceShift = {
  operatorId: number;
  locationId: number;
  providerKey: string;
  externalShiftId: string;
  externalWorkerId?: string | null;
  businessDate?: string | null;
  startsAt: string;
  endsAt: string;
};

export type WorkforceChecklistTemplate = {
  id: string;
  operatorId: number;
  locationId: number | null;
  roleKey: string | null;
  status: 'draft' | 'active' | 'retired';
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
};

export type WorkforcePlan = {
  assignments: Array<{
    externalShiftId: string;
    seatId: string;
    roleKeys: string[];
    checklistTemplateIds: string[];
  }>;
  unmatched: Array<{
    externalShiftId: string;
    reason:
      | 'invalid_time_window'
      | 'missing_external_worker_id'
      | 'identity_not_found'
      | 'seat_inactive'
      | 'role_not_assigned';
  }>;
};

type WorkforcePlanInput = {
  seats: WorkforceSeat[];
  roleAssignments: WorkforceRoleAssignment[];
  identityLinks: WorkforceIdentityLink[];
  shifts: WorkforceShift[];
  checklistTemplates: WorkforceChecklistTemplate[];
};

function normalizedKey(value: string): string {
  return value.trim().toLowerCase();
}

function identityKey(operatorId: number, providerKey: string, externalWorkerId: string): string {
  return `${operatorId}:${normalizedKey(providerKey)}:${normalizedKey(externalWorkerId)}`;
}

function shiftKey(shift: WorkforceShift): string {
  return `${shift.operatorId}:${normalizedKey(shift.providerKey)}:${normalizedKey(shift.externalShiftId)}`;
}

function validBusinessDate(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value
    ? null
    : value;
}

function isActiveOn(date: string, start?: string | null, end?: string | null): boolean {
  return (!start || start <= date) && (!end || end >= date);
}

export function planActionShiftWorkforce(
  input: WorkforcePlanInput,
): { ok: true; plan: WorkforcePlan } | { ok: false; error: string } {
  const identityByExternal = new Map<string, WorkforceIdentityLink>();
  for (const identity of input.identityLinks) {
    if (!identity.active) continue;
    const key = identityKey(identity.operatorId, identity.providerKey, identity.externalWorkerId);
    if (identityByExternal.has(key)) {
      return { ok: false, error: `Duplicate active workforce identity: ${key}.` };
    }
    identityByExternal.set(key, identity);
  }

  const seenShifts = new Set<string>();
  const seatById = new Map(input.seats.map((seat) => [seat.id, seat]));
  const plan: WorkforcePlan = { assignments: [], unmatched: [] };

  for (const shift of input.shifts) {
    const uniqueShiftKey = shiftKey(shift);
    if (seenShifts.has(uniqueShiftKey)) {
      return { ok: false, error: `Duplicate imported shift: ${uniqueShiftKey}.` };
    }
    seenShifts.add(uniqueShiftKey);

    const startsAt = new Date(shift.startsAt);
    const endsAt = new Date(shift.endsAt);
    const businessDate = validBusinessDate(shift.businessDate ?? shift.startsAt.slice(0, 10));
    if (Number.isNaN(startsAt.valueOf()) || !businessDate || Number.isNaN(endsAt.valueOf()) || endsAt <= startsAt) {
      plan.unmatched.push({ externalShiftId: shift.externalShiftId, reason: 'invalid_time_window' });
      continue;
    }
    if (!shift.externalWorkerId?.trim()) {
      plan.unmatched.push({ externalShiftId: shift.externalShiftId, reason: 'missing_external_worker_id' });
      continue;
    }

    const identity = identityByExternal.get(
      identityKey(shift.operatorId, shift.providerKey, shift.externalWorkerId),
    );
    if (!identity) {
      plan.unmatched.push({ externalShiftId: shift.externalShiftId, reason: 'identity_not_found' });
      continue;
    }

    const seat = seatById.get(identity.seatId);
    if (!seat || seat.operatorId !== shift.operatorId || seat.status !== 'active') {
      plan.unmatched.push({ externalShiftId: shift.externalShiftId, reason: 'seat_inactive' });
      continue;
    }

    const roleKeys = [...new Set(input.roleAssignments
      .filter((role) => role.operatorId === shift.operatorId
        && role.seatId === seat.id
        && (role.locationId === null || role.locationId === shift.locationId)
        && isActiveOn(businessDate, role.activeFrom, role.activeUntil))
      .map((role) => role.roleKey))]
      .sort();

    if (roleKeys.length === 0) {
      plan.unmatched.push({ externalShiftId: shift.externalShiftId, reason: 'role_not_assigned' });
      continue;
    }

    const checklistTemplateIds = input.checklistTemplates
      .filter((template) => template.operatorId === shift.operatorId
        && template.status === 'active'
        && (template.locationId === null || template.locationId === shift.locationId)
        && (template.roleKey === null || roleKeys.includes(template.roleKey))
        && isActiveOn(businessDate, template.effectiveFrom, template.effectiveUntil))
      .map((template) => template.id)
      .sort();

    plan.assignments.push({
      externalShiftId: shift.externalShiftId,
      seatId: seat.id,
      roleKeys,
      checklistTemplateIds,
    });
  }

  return { ok: true, plan };
}
