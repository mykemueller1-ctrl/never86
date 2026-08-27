import { ACTION_SHIFT_ROLE_PACKS, type ActionShiftRoleKey } from './actionShiftSetup';
import { PROOF_KINDS, type ProofKind, type ProofOutcome } from './deskClose';

export const MANAGER_STATION_KEYS = [
  'manager',
  'opener',
  'closer',
  'kitchen_prep',
  'foh',
  'driver',
] as const;

export type ManagerStationKey = (typeof MANAGER_STATION_KEYS)[number];
export type ChecklistPhase = 'open' | 'mid' | 'close';
export type ManagerStepStatus =
  | 'assigned'
  | 'in_progress'
  | 'done_awaiting_proof'
  | 'verified'
  | 'not_done'
  | 'data_missing'
  | 'fix_failed'
  | 'escalated';
export type ManagerRunStatus =
  | 'assigned'
  | 'in_progress'
  | 'submitted'
  | 'verified'
  | 'exception'
  | 'escalated';

export type ManagerActor = {
  seatId: string;
  operatorId: number;
  locationId: number;
  kind: 'manager' | 'station';
};

export type ManagerTenant = {
  operatorId: number;
  locationId: number;
  locationLabel: string;
  tenantKind: 'fixture';
  boundary: string;
};

export type ManagerSeat = {
  id: string;
  label: string;
  kind: 'manager' | 'station';
  stationKey: ManagerStationKey;
  roleKeys: readonly ActionShiftRoleKey[];
};

export type ManagerChecklistStep = {
  id: string;
  order: number;
  instruction: string;
  phase: ChecklistPhase;
  evidenceType: string;
  acceptedProofKinds: readonly ProofKind[];
  isRequired: boolean;
  escalationMinutes: number;
  status: ManagerStepStatus;
  proofKind: ProofKind | null;
  proofNote: string | null;
  ownerSeatId: string;
  escalateToSeatId: string;
};

export type ManagerChecklistTemplate = {
  id: string;
  stationKey: ManagerStationKey;
  roleKey: ActionShiftRoleKey;
  name: string;
  phase: ChecklistPhase;
  status: 'active';
  steps: Array<Omit<ManagerChecklistStep, 'status' | 'proofKind' | 'proofNote' | 'ownerSeatId' | 'escalateToSeatId'>>;
};

export type ManagerChecklistRun = {
  id: string;
  templateId: string;
  stationKey: ManagerStationKey;
  roleKey: ActionShiftRoleKey;
  phase: ChecklistPhase;
  ownerSeatId: string;
  ownerLabel: string;
  status: ManagerRunStatus;
  businessDate: string;
  dueAt: string;
  steps: ManagerChecklistStep[];
};

export type ManagerException = {
  id: string;
  runId: string;
  stepId: string;
  stationKey: ManagerStationKey;
  ownerSeatId: string;
  escalateToSeatId: string;
  reason: 'not_done' | 'data_missing' | 'fix_failed' | 'overdue_unverified';
  instruction: string;
  status: 'open';
};

export type ManagerEvidenceContract = {
  family: 'pdq' | 'vendor' | 'prime-cost';
  required: string;
  doesNotProve: string;
};

export type ManagerBoard = {
  tenant: ManagerTenant;
  managerSeat: ManagerSeat;
  seats: ManagerSeat[];
  businessDate: string;
  persistence: 'local-only';
  staffLogins: 'manager-seat-only';
  templates: ManagerChecklistTemplate[];
  runs: ManagerChecklistRun[];
  exceptions: ManagerException[];
  evidenceContracts: readonly ManagerEvidenceContract[];
  summary: {
    assigned: number;
    inProgress: number;
    awaitingProof: number;
    verified: number;
    exceptions: number;
    escalations: number;
  };
};

export const SYNTHETIC_MANAGER_TENANT: ManagerTenant = {
  operatorId: 0,
  locationId: 0,
  locationLabel: 'Synthetic lab location',
  tenantKind: 'fixture',
  boundary: 'Operator 0 / location 0 only. A guessed ID from another tenant cannot own, prove, or escalate these runs.',
};

export const MANAGER_EVIDENCE_CONTRACTS: readonly ManagerEvidenceContract[] = [
  {
    family: 'pdq',
    required: 'Prior complete business-day Z, void/promo, and hourly files. Typed paste stays Unverified until reconciled to the source.',
    doesNotProve: 'Marketplace payout, bank receipt, theft, or food cost.',
  },
  {
    family: 'vendor',
    required: 'Same-scope invoice, confirmation, or receiving log. Quiet cadence is a follow-up signal, not a missed truck.',
    doesNotProve: 'COGS, theoretical vs actual, or inventory shortage without a count.',
  },
  {
    family: 'prime-cost',
    required: 'Complete same-scope sales, labor dollars, and invoice or count packet before any prime-cost claim.',
    doesNotProve: 'A percent built from an incomplete week, missing count, or unentered cash.',
  },
];

export const MANAGER_STATIONS: Record<ManagerStationKey, {
  stationKey: ManagerStationKey;
  label: string;
  roleKeys: readonly ActionShiftRoleKey[];
  phases: readonly ChecklistPhase[];
}> = {
  manager: {
    stationKey: 'manager',
    label: 'Manager',
    roleKeys: ['manager', 'general_manager'],
    phases: ['open', 'mid', 'close'],
  },
  opener: {
    stationKey: 'opener',
    label: 'Opener',
    roleKeys: ['manager', 'shift_lead'],
    phases: ['open'],
  },
  closer: {
    stationKey: 'closer',
    label: 'Closer',
    roleKeys: ['manager', 'shift_lead'],
    phases: ['close'],
  },
  kitchen_prep: {
    stationKey: 'kitchen_prep',
    label: 'Kitchen prep',
    roleKeys: ['prep_cook'],
    phases: ['open', 'mid', 'close'],
  },
  foh: {
    stationKey: 'foh',
    label: 'FOH',
    roleKeys: ['server', 'host', 'bartender'],
    phases: ['open', 'mid', 'close'],
  },
  driver: {
    stationKey: 'driver',
    label: 'Driver',
    roleKeys: ['driver'],
    phases: ['open', 'mid', 'close'],
  },
};

const MANAGER_SEAT_ID = 'seat-manager';
const FIXTURE_NOW = '2026-08-26T16:00:00.000-05:00';
const FIXTURE_DATE = '2026-08-26';

function phaseFromInstruction(instruction: string): ChecklistPhase {
  const prefix = instruction.split(':')[0]?.trim().toLowerCase() ?? '';
  if (['open', 'start', 'morning'].includes(prefix)) return 'open';
  if (['close', 'finish', 'night'].includes(prefix)) return 'close';
  return 'mid';
}

function evidenceFor(instruction: string): { evidenceType: string; acceptedProofKinds: ProofKind[]; escalationMinutes: number } {
  const text = instruction.toLowerCase();
  if (/deposit|cash|drawer/.test(text)) {
    return { evidenceType: 'deposit-proof', acceptedProofKinds: ['deposit-slip', 'pos-close'], escalationMinutes: 30 };
  }
  if (/labor|time clock|schedule|staffing/.test(text)) {
    return { evidenceType: 'labor-proof', acceptedProofKinds: ['time-clock', 'schedule'], escalationMinutes: 45 };
  }
  if (/temperatur|sanitation|cool|label|food-safety/.test(text)) {
    return { evidenceType: 'photo', acceptedProofKinds: ['photo', 'exception-log'], escalationMinutes: 15 };
  }
  if (/invoice|vendor|pars|receiving/.test(text)) {
    return { evidenceType: 'invoice-packet', acceptedProofKinds: ['invoice-packet', 'receiving-log', 'po-packet'], escalationMinutes: 60 };
  }
  if (/delivery|order|route/.test(text)) {
    return { evidenceType: 'ticket-detail', acceptedProofKinds: ['ticket-detail', 'exception-log'], escalationMinutes: 20 };
  }
  return { evidenceType: 'attestation', acceptedProofKinds: ['exception-log', 'photo', 'other-source'], escalationMinutes: 60 };
}

export function buildManagerRoleTemplates(): ManagerChecklistTemplate[] {
  return MANAGER_STATION_KEYS.flatMap((stationKey) => {
    const station = MANAGER_STATIONS[stationKey];
    return station.roleKeys.flatMap((roleKey) => station.phases.map((phase) => {
      const steps = ACTION_SHIFT_ROLE_PACKS[roleKey]
        .map((instruction, index) => ({ instruction, index, phase: phaseFromInstruction(instruction) }))
        .filter((item) => item.phase === phase)
        .map((item, order) => {
          const evidence = evidenceFor(item.instruction);
          return {
            id: `${stationKey}-${roleKey}-${phase}-${order + 1}`,
            order: order + 1,
            instruction: item.instruction,
            phase,
            evidenceType: evidence.evidenceType,
            acceptedProofKinds: evidence.acceptedProofKinds,
            isRequired: true,
            escalationMinutes: evidence.escalationMinutes,
          };
        });
      return {
        id: `tmpl-${stationKey}-${roleKey}-${phase}`,
        stationKey,
        roleKey,
        name: `${station.label} · ${roleKey.replaceAll('_', ' ')} · ${phase}`,
        phase,
        status: 'active' as const,
        steps,
      };
    }));
  }).filter((template) => template.steps.length > 0);
}

function seatFor(stationKey: ManagerStationKey): ManagerSeat {
  const station = MANAGER_STATIONS[stationKey];
  if (stationKey === 'manager') {
    return {
      id: MANAGER_SEAT_ID,
      label: 'Manager seat',
      kind: 'manager',
      stationKey,
      roleKeys: station.roleKeys,
    };
  }
  return {
    id: `station-${stationKey}`,
    label: `${station.label} station`,
    kind: 'station',
    stationKey,
    roleKeys: station.roleKeys,
  };
}

function cloneSteps(
  template: ManagerChecklistTemplate,
  ownerSeatId: string,
  escalateToSeatId: string,
  patch?: Partial<Pick<ManagerChecklistStep, 'status' | 'proofKind' | 'proofNote'>> & { stepOrder?: number },
): ManagerChecklistStep[] {
  return template.steps.map((step) => {
    const matched = patch?.stepOrder === step.order;
    return {
      ...step,
      ownerSeatId,
      escalateToSeatId,
      status: matched && patch?.status ? patch.status : 'assigned',
      proofKind: matched ? patch?.proofKind ?? null : null,
      proofNote: matched ? patch?.proofNote ?? null : null,
    };
  });
}

function runStatusFromSteps(steps: ManagerChecklistStep[], dueAt: string, now: string): ManagerRunStatus {
  if (steps.some((step) => step.status === 'escalated' || (step.isRequired && step.status !== 'verified' && dueAt <= now))) {
    return 'escalated';
  }
  if (steps.some((step) => step.status === 'not_done' || step.status === 'data_missing' || step.status === 'fix_failed')) {
    return 'exception';
  }
  if (steps.length > 0 && steps.every((step) => !step.isRequired || step.status === 'verified')) {
    return 'verified';
  }
  if (steps.some((step) => step.status === 'done_awaiting_proof' || step.status === 'in_progress' || step.status === 'verified')) {
    return steps.every((step) => step.status === 'verified' || step.status === 'done_awaiting_proof')
      ? 'submitted'
      : 'in_progress';
  }
  return 'assigned';
}

function buildExceptions(runs: ManagerChecklistRun[], now: string): ManagerException[] {
  return runs.flatMap((run) => run.steps.flatMap((step) => {
    const overdue = step.isRequired && step.status !== 'verified' && run.dueAt <= now;
    const reason: ManagerException['reason'] | null = step.status === 'not_done'
      ? 'not_done'
      : step.status === 'data_missing'
        ? 'data_missing'
        : step.status === 'fix_failed'
          ? 'fix_failed'
          : overdue
            ? 'overdue_unverified'
            : null;
    if (!reason) return [];
    return [{
      id: `exc-${run.id}-${step.id}`,
      runId: run.id,
      stepId: step.id,
      stationKey: run.stationKey,
      ownerSeatId: step.ownerSeatId,
      escalateToSeatId: step.escalateToSeatId,
      reason,
      instruction: step.instruction,
      status: 'open' as const,
    }];
  }));
}

function summarize(runs: ManagerChecklistRun[], exceptions: ManagerException[]): ManagerBoard['summary'] {
  return {
    assigned: runs.filter((run) => run.status === 'assigned').length,
    inProgress: runs.filter((run) => run.status === 'in_progress' || run.status === 'submitted').length,
    awaitingProof: runs.flatMap((run) => run.steps).filter((step) => step.status === 'done_awaiting_proof').length,
    verified: runs.filter((run) => run.status === 'verified').length,
    exceptions: exceptions.filter((item) => item.reason !== 'overdue_unverified').length,
    escalations: exceptions.filter((item) => item.reason === 'overdue_unverified').length + runs.filter((run) => run.status === 'escalated').length,
  };
}

function withDerived(board: Omit<ManagerBoard, 'exceptions' | 'summary'>, now: string): ManagerBoard {
  const runs = board.runs.map((run) => ({ ...run, status: runStatusFromSteps(run.steps, run.dueAt, now) }));
  const exceptions = buildExceptions(runs, now);
  return { ...board, runs, exceptions, summary: summarize(runs, exceptions) };
}

export function sameTenant(a: Pick<ManagerTenant, 'operatorId' | 'locationId'>, b: Pick<ManagerTenant, 'operatorId' | 'locationId'>): boolean {
  return a.operatorId === b.operatorId && a.locationId === b.locationId;
}

export function buildSyntheticManagerBoard(now: string = FIXTURE_NOW): ManagerBoard {
  const templates = buildManagerRoleTemplates();
  const seats = MANAGER_STATION_KEYS.map(seatFor);
  const managerSeat = seats[0];
  const byId = Object.fromEntries(templates.map((template) => [template.id, template]));

  const managerOpen = byId['tmpl-manager-manager-open'];
  const opener = byId['tmpl-opener-manager-open'];
  const closer = byId['tmpl-closer-manager-close'];
  const prep = byId['tmpl-kitchen_prep-prep_cook-open'];
  const foh = byId['tmpl-foh-server-open'];
  const driver = byId['tmpl-driver-driver-open'];

  const runs: ManagerChecklistRun[] = [
    {
      id: 'run-manager-open',
      templateId: managerOpen.id,
      stationKey: 'manager',
      roleKey: 'manager',
      phase: 'open',
      ownerSeatId: MANAGER_SEAT_ID,
      ownerLabel: 'Manager seat',
      status: 'assigned',
      businessDate: FIXTURE_DATE,
      dueAt: '2026-08-26T10:00:00.000-05:00',
      steps: cloneSteps(managerOpen, MANAGER_SEAT_ID, MANAGER_SEAT_ID, {
        stepOrder: 1,
        status: 'verified',
        proofKind: 'schedule',
        proofNote: 'Synthetic staffing sheet attached. Not a live roster.',
      }),
    },
    {
      id: 'run-opener',
      templateId: opener.id,
      stationKey: 'opener',
      roleKey: 'manager',
      phase: 'open',
      ownerSeatId: MANAGER_SEAT_ID,
      ownerLabel: 'Manager seat · opener station',
      status: 'assigned',
      businessDate: FIXTURE_DATE,
      dueAt: '2026-08-26T21:00:00.000-05:00',
      steps: cloneSteps(opener, MANAGER_SEAT_ID, MANAGER_SEAT_ID, {
        stepOrder: 1,
        status: 'done_awaiting_proof',
      }),
    },
    {
      id: 'run-kitchen-prep',
      templateId: prep.id,
      stationKey: 'kitchen_prep',
      roleKey: 'prep_cook',
      phase: 'open',
      ownerSeatId: MANAGER_SEAT_ID,
      ownerLabel: 'Manager seat · kitchen-prep station',
      status: 'assigned',
      businessDate: FIXTURE_DATE,
      dueAt: '2026-08-26T21:00:00.000-05:00',
      steps: cloneSteps(prep, MANAGER_SEAT_ID, MANAGER_SEAT_ID, {
        stepOrder: 1,
        status: 'data_missing',
        proofNote: 'Prep list source not on the desk. Missing Evidence, not a counted zero.',
      }),
    },
    {
      id: 'run-foh',
      templateId: foh.id,
      stationKey: 'foh',
      roleKey: 'server',
      phase: 'open',
      ownerSeatId: MANAGER_SEAT_ID,
      ownerLabel: 'Manager seat · FOH station',
      status: 'assigned',
      businessDate: FIXTURE_DATE,
      dueAt: '2026-08-26T22:00:00.000-05:00',
      steps: cloneSteps(foh, MANAGER_SEAT_ID, MANAGER_SEAT_ID),
    },
    {
      id: 'run-driver',
      templateId: driver.id,
      stationKey: 'driver',
      roleKey: 'driver',
      phase: 'open',
      ownerSeatId: MANAGER_SEAT_ID,
      ownerLabel: 'Manager seat · driver station',
      status: 'assigned',
      businessDate: FIXTURE_DATE,
      dueAt: '2026-08-26T15:00:00.000-05:00',
      steps: cloneSteps(driver, MANAGER_SEAT_ID, MANAGER_SEAT_ID),
    },
    {
      id: 'run-closer',
      templateId: closer.id,
      stationKey: 'closer',
      roleKey: 'manager',
      phase: 'close',
      ownerSeatId: MANAGER_SEAT_ID,
      ownerLabel: 'Manager seat · closer station',
      status: 'assigned',
      businessDate: FIXTURE_DATE,
      dueAt: '2026-08-26T23:00:00.000-05:00',
      steps: cloneSteps(closer, MANAGER_SEAT_ID, MANAGER_SEAT_ID),
    },
  ];

  return withDerived({
    tenant: SYNTHETIC_MANAGER_TENANT,
    managerSeat,
    seats,
    businessDate: FIXTURE_DATE,
    persistence: 'local-only',
    staffLogins: 'manager-seat-only',
    templates,
    runs,
    evidenceContracts: MANAGER_EVIDENCE_CONTRACTS,
  }, now);
}

export function applyManagerStepProof(input: {
  board: ManagerBoard;
  runId: string;
  stepId: string;
  actor: ManagerActor;
  outcome: ProofOutcome | 'escalated';
  proofKind?: string;
  proofNote?: string;
  now?: string;
}): { ok: true; board: ManagerBoard } | { ok: false; error: string } {
  if (!sameTenant(input.actor, input.board.tenant)) {
    return { ok: false, error: 'Tenant boundary: that seat cannot change another operator location\'s checklist.' };
  }

  const run = input.board.runs.find((item) => item.id === input.runId);
  if (!run) return { ok: false, error: 'That checklist run is not on this manager board.' };
  const step = run.steps.find((item) => item.id === input.stepId);
  if (!step) return { ok: false, error: 'That checklist step is not on this run.' };

  if (input.actor.kind !== 'manager' && input.actor.seatId !== run.ownerSeatId) {
    return { ok: false, error: 'Only the owning manager seat or the assigned station owner can attach proof.' };
  }

  if (input.outcome === 'verified') {
    if (!input.proofKind || input.proofKind === 'verbal') {
      return { ok: false, error: 'A verbal yes does not close the checklist. Attach the proof object from the shift.' };
    }
    if (!PROOF_KINDS.includes(input.proofKind as ProofKind)) {
      return { ok: false, error: 'Choose a source proof object (deposit slip, close, clock, ticket, photo, or exception log).' };
    }
    if (!step.acceptedProofKinds.includes(input.proofKind as ProofKind)) {
      return { ok: false, error: `This step needs ${step.acceptedProofKinds.join(', ')} — not a mismatched source.` };
    }
  }

  const now = input.now ?? FIXTURE_NOW;
  const nextStatus: ManagerStepStatus = input.outcome === 'verified'
    ? 'verified'
    : input.outcome === 'done-awaiting-proof'
      ? 'done_awaiting_proof'
      : input.outcome === 'not-done'
        ? 'not_done'
        : input.outcome === 'data-missing'
          ? 'data_missing'
          : input.outcome === 'fix-failed'
            ? 'fix_failed'
            : input.outcome === 'escalated'
              ? 'escalated'
              : 'in_progress';

  const runs = input.board.runs.map((item) => {
    if (item.id !== run.id) return item;
    const steps = item.steps.map((current) => current.id === step.id
      ? {
        ...current,
        status: nextStatus,
        proofKind: input.outcome === 'verified' ? input.proofKind as ProofKind : current.proofKind,
        proofNote: input.proofNote ?? current.proofNote,
        ownerSeatId: nextStatus === 'escalated' ? MANAGER_SEAT_ID : current.ownerSeatId,
      }
      : current);
    return { ...item, steps };
  });

  return { ok: true, board: withDerived({ ...input.board, runs }, now) };
}

export function fixtureContainsPrivatePayload(value: unknown): boolean {
  const blob = JSON.stringify(value).toLowerCase();
  return /@|\bpin\b|password|sally|community tap|\$\d/.test(blob);
}
