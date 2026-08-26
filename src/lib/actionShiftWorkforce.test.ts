import { describe, expect, it } from 'vitest';
import { planActionShiftWorkforce } from './actionShiftWorkforce';

const baseInput = {
  seats: [
    { id: 'seat-manager', operatorId: 1, status: 'active' as const },
    { id: 'seat-inactive', operatorId: 1, status: 'inactive' as const },
  ],
  roleAssignments: [{
    operatorId: 1,
    seatId: 'seat-manager',
    locationId: 10,
    roleKey: 'manager',
    activeFrom: '2026-01-01',
  }],
  identityLinks: [
    {
      operatorId: 1,
      seatId: 'seat-manager',
      providerKey: 'example-time-clock',
      externalWorkerId: 'worker-101',
      active: true,
    },
    {
      operatorId: 1,
      seatId: 'seat-inactive',
      providerKey: 'example-time-clock',
      externalWorkerId: 'worker-102',
      active: true,
    },
  ],
  checklistTemplates: [
    {
      id: 'all-staff-close',
      operatorId: 1,
      locationId: 10,
      roleKey: null,
      status: 'active' as const,
    },
    {
      id: 'manager-close',
      operatorId: 1,
      locationId: 10,
      roleKey: 'manager',
      status: 'active' as const,
    },
    {
      id: 'other-tenant',
      operatorId: 2,
      locationId: 10,
      roleKey: 'manager',
      status: 'active' as const,
    },
  ],
};

describe('Action Shift workforce planner', () => {
  it('maps an external time-clock worker to one tenant seat and its role checklists', () => {
    const result = planActionShiftWorkforce({
      ...baseInput,
      shifts: [{
        operatorId: 1,
        locationId: 10,
        providerKey: 'EXAMPLE-TIME-CLOCK',
        externalShiftId: 'shift-1',
        externalWorkerId: ' worker-101 ',
        startsAt: '2026-08-25T16:00:00-05:00',
        endsAt: '2026-08-25T23:00:00-05:00',
      }],
    });

    expect(result).toEqual({
      ok: true,
      plan: {
        assignments: [{
          externalShiftId: 'shift-1',
          seatId: 'seat-manager',
          roleKeys: ['manager'],
          checklistTemplateIds: ['all-staff-close', 'manager-close'],
        }],
        unmatched: [],
      },
    });
  });

  it('keeps another tenant identity from matching and flags inactive seats', () => {
    const result = planActionShiftWorkforce({
      ...baseInput,
      shifts: [
        {
          operatorId: 2,
          locationId: 10,
          providerKey: 'example-time-clock',
          externalShiftId: 'shift-other-tenant',
          externalWorkerId: 'worker-101',
          startsAt: '2026-08-25T16:00:00-05:00',
          endsAt: '2026-08-25T23:00:00-05:00',
        },
        {
          operatorId: 1,
          locationId: 10,
          providerKey: 'example-time-clock',
          externalShiftId: 'shift-inactive',
          externalWorkerId: 'worker-102',
          startsAt: '2026-08-25T16:00:00-05:00',
          endsAt: '2026-08-25T23:00:00-05:00',
        },
      ],
    });

    expect(result.ok && result.plan.unmatched).toEqual([
      { externalShiftId: 'shift-other-tenant', reason: 'identity_not_found' },
      { externalShiftId: 'shift-inactive', reason: 'seat_inactive' },
    ]);
  });

  it('rejects duplicate identities and duplicate imported shifts', () => {
    const duplicateIdentity = planActionShiftWorkforce({
      ...baseInput,
      identityLinks: [...baseInput.identityLinks, { ...baseInput.identityLinks[0], seatId: 'seat-other' }],
      shifts: [],
    });
    expect(duplicateIdentity).toEqual({
      ok: false,
      error: 'Duplicate active workforce identity: 1:example-time-clock:worker-101.',
    });

    const shift = {
      operatorId: 1,
      locationId: 10,
      providerKey: 'example-time-clock',
      externalShiftId: 'shift-duplicate',
      externalWorkerId: 'worker-101',
      startsAt: '2026-08-25T16:00:00-05:00',
      endsAt: '2026-08-25T23:00:00-05:00',
    };
    const duplicateShift = planActionShiftWorkforce({
      ...baseInput,
      shifts: [shift, { ...shift }],
    });
    expect(duplicateShift).toEqual({
      ok: false,
      error: 'Duplicate imported shift: 1:example-time-clock:shift-duplicate.',
    });
  });

  it('does not assign a future or expired role or checklist', () => {
    const result = planActionShiftWorkforce({
      ...baseInput,
      roleAssignments: [{
        ...baseInput.roleAssignments[0],
        activeFrom: '2026-09-01',
      }],
      shifts: [{
        operatorId: 1,
        locationId: 10,
        providerKey: 'example-time-clock',
        externalShiftId: 'shift-before-role',
        externalWorkerId: 'worker-101',
        startsAt: '2026-08-25T16:00:00-05:00',
        endsAt: '2026-08-25T23:00:00-05:00',
      }],
    });

    expect(result.ok && result.plan.unmatched).toEqual([
      { externalShiftId: 'shift-before-role', reason: 'role_not_assigned' },
    ]);
  });

  it('uses the provider-local business date instead of shifting the date to UTC', () => {
    const result = planActionShiftWorkforce({
      ...baseInput,
      roleAssignments: [{
        ...baseInput.roleAssignments[0],
        activeUntil: '2026-08-25',
      }],
      shifts: [{
        operatorId: 1,
        locationId: 10,
        providerKey: 'example-time-clock',
        externalShiftId: 'late-close',
        externalWorkerId: 'worker-101',
        startsAt: '2026-08-25T23:30:00-05:00',
        endsAt: '2026-08-26T01:30:00-05:00',
      }],
    });

    expect(result.ok && result.plan.assignments).toHaveLength(1);
  });
});
