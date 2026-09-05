import { PUBLIC_OPERATOR_LOGIC } from './publicOperatorLogic';
import { ORCHESTRATION_BRAND_BLUE } from './orchestration/types';

/** Operator V2 plates — first-class project folders / Missing chips for 1–3 unit paper shops. */
export const OPERATOR_V2_BLUE = ORCHESTRATION_BRAND_BLUE;
export const OPERATOR_V2_SURFACE = 'plates-chat' as const;

export type OperatorV2PlateId = 'schedule' | 'labor-cards' | 'menu' | 'order-guide';
export type OperatorV2FolderStateId = 'NEED' | 'READY';

export type OperatorV2Plate = {
  id: OperatorV2PlateId;
  label: string;
  folder: string;
  ask: string;
  tray: 'labor' | 'food' | 'action';
  missingUntil: string;
  ocrInput: true;
  firstClass: true;
  deferred: false;
  evidenceKind: OperatorV2PlateId;
};

export const OPERATOR_V2_PLATES: readonly OperatorV2Plate[] = [
  {
    id: 'schedule',
    label: 'Schedule',
    folder: 'Schedules',
    ask: 'Here is this week’s schedule. Who is posted in and out, and what is still Missing?',
    tray: 'labor',
    missingUntil: 'A week photo or file lands. Labor lives on the schedule.',
    ocrInput: true,
    firstClass: true,
    deferred: false,
    evidenceKind: 'schedule',
  },
  {
    id: 'labor-cards',
    label: 'Labor cards',
    folder: 'Labor cards',
    ask: 'From that schedule, show labor cards by role and daily compare to the clock. Punch is Missing until the clock lands.',
    tray: 'labor',
    missingUntil: 'Roles named on the card. Punch ≠ schedule. No invented overtime.',
    ocrInput: true,
    firstClass: true,
    deferred: false,
    evidenceKind: 'labor-cards',
  },
  {
    id: 'menu',
    label: 'Menu',
    folder: 'Menu',
    ask: 'Here is the menu photo. Name the top money plates we should cost first.',
    tray: 'food',
    missingUntil: 'A menu photo lands. Top plates only — no full recipe book week 1.',
    ocrInput: true,
    firstClass: true,
    deferred: false,
    evidenceKind: 'menu',
  },
  {
    id: 'order-guide',
    label: 'Order guide',
    folder: 'Order guides',
    ask: 'Here is the order guide. What is still Missing before the next truck?',
    tray: 'food',
    missingUntil: 'An order guide or invoice email lands. Invoice ≠ COGS.',
    ocrInput: true,
    firstClass: true,
    deferred: false,
    evidenceKind: 'order-guide',
  },
] as const;

/** Paper-shop seats. Roles only — no staff names, no invented headcount. */
export const PAPER_SHOP_ROLES = [
  { id: 'foh', role: 'FOH' },
  { id: 'line', role: 'Line' },
  { id: 'dish', role: 'Dish' },
  { id: 'run', role: 'Run' },
] as const;

export type PaperShopRoleId = (typeof PAPER_SHOP_ROLES)[number]['id'];

/**
 * Daily compare uses published labor formulas.
 * Early/late leave is clock-out vs posted end. Early clock-in stays the start-side twin.
 * No invented overtime dollars.
 */
export const OPERATOR_V2_DAILY_COMPARE = {
  earlyClockIn: PUBLIC_OPERATOR_LOGIC.labor.earlyClockIn,
  lateLeave: PUBLIC_OPERATOR_LOGIC.labor.lateClockOut,
  earlyLeave: 'Clock-out more than 5 minutes before scheduled end.',
  laborDrift: PUBLIC_OPERATOR_LOGIC.labor.overtimeDrift,
  boundary: PUBLIC_OPERATOR_LOGIC.labor.boundary,
  punchRule: 'Punch ≠ schedule. No invented overtime. No staff names on the public seat.',
} as const;

export type OperatorV2FolderState = {
  id: OperatorV2PlateId;
  label: string;
  folder: string;
  state: OperatorV2FolderStateId;
  reason: string;
  ocr: true;
  firstClass: true;
};

export type LaborRoleCard = {
  id: PaperShopRoleId;
  role: string;
  state: OperatorV2FolderStateId;
  posted: 'Missing' | 'On schedule';
  punch: 'Missing' | 'Clock landed';
  line: string;
};

export type DailyCompareChipId = 'early-leave' | 'late-leave' | 'labor-drift';

export type DailyCompareChip = {
  id: DailyCompareChipId;
  label: string;
  state: OperatorV2FolderStateId;
  rule: string;
  reason: string;
};

export function plateById(id: string): OperatorV2Plate | undefined {
  return OPERATOR_V2_PLATES.find((plate) => plate.id === id);
}

export function isOperatorV2PlateId(id: string): id is OperatorV2PlateId {
  return OPERATOR_V2_PLATES.some((plate) => plate.id === id);
}

export function nextMissingPlate(filled: ReadonlySet<OperatorV2PlateId>): OperatorV2Plate {
  return OPERATOR_V2_PLATES.find((plate) => !filled.has(plate.id)) ?? OPERATOR_V2_PLATES[0];
}

export function projectFoldersFromKinds(kinds: ReadonlySet<string>): OperatorV2FolderState[] {
  return OPERATOR_V2_PLATES.map((plate) => {
    const ready = kinds.has(plate.evidenceKind);
    return {
      id: plate.id,
      label: plate.label,
      folder: plate.folder,
      state: ready ? 'READY' : 'NEED',
      reason: ready
        ? `${plate.folder} photo or file is on this seat. Named is not a verified close.`
        : `Missing · ${plate.missingUntil}`,
      ocr: true,
      firstClass: true,
    };
  });
}

export function spawnLaborRoleCards(input: {
  scheduleReady: boolean;
  laborCardsReady: boolean;
  clockReady: boolean;
}): LaborRoleCard[] {
  if (!input.scheduleReady) {
    return PAPER_SHOP_ROLES.map((row) => ({
      id: row.id,
      role: row.role,
      state: 'NEED',
      posted: 'Missing',
      punch: 'Missing',
      line: 'Drop the week schedule first. Labor cards spawn from that grid.',
    }));
  }

  return PAPER_SHOP_ROLES.map((row) => {
    const posted = input.laborCardsReady || input.scheduleReady ? 'On schedule' : 'Missing';
    const punch = input.clockReady ? 'Clock landed' : 'Missing';
    return {
      id: row.id,
      role: row.role,
      state: input.laborCardsReady || input.clockReady ? 'READY' : 'NEED',
      posted,
      punch,
      line: input.clockReady
        ? `${row.role} · posted in / out on the card. Daily compare can run. Punch ≠ schedule.`
        : `${row.role} · posted in / out. Punch Missing until the clock lands.`,
    };
  });
}

export function dailyCompareFromEvidence(input: {
  scheduleReady: boolean;
  clockReady: boolean;
}): DailyCompareChip[] {
  const canCompare = input.scheduleReady && input.clockReady;
  const reason = !input.scheduleReady
    ? 'Need the week schedule first. Posted in / out lives on that photo.'
    : !input.clockReady
      ? 'Punch Missing. Early leave, late leave, and labor drift stay open until the clock lands.'
      : 'Schedule and punches are on this seat. Compare can run. Punch ≠ schedule. No invented overtime.';

  return [
    {
      id: 'early-leave',
      label: 'Early leave',
      state: canCompare ? 'READY' : 'NEED',
      rule: OPERATOR_V2_DAILY_COMPARE.earlyLeave,
      reason,
    },
    {
      id: 'late-leave',
      label: 'Late leave',
      state: canCompare ? 'READY' : 'NEED',
      rule: OPERATOR_V2_DAILY_COMPARE.lateLeave,
      reason,
    },
    {
      id: 'labor-drift',
      label: 'Labor drift',
      state: canCompare ? 'READY' : 'NEED',
      rule: OPERATOR_V2_DAILY_COMPARE.laborDrift,
      reason,
    },
  ];
}

export function filledPlateIds(folders: readonly OperatorV2FolderState[]): Set<OperatorV2PlateId> {
  return new Set(folders.filter((folder) => folder.state === 'READY').map((folder) => folder.id));
}
