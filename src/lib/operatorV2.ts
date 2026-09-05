import { ORCHESTRATION_BRAND_BLUE } from './orchestration/types';

/** Operator V2 plates — Codex-style chips that open the next LLM suck-in question. */
export const OPERATOR_V2_BLUE = ORCHESTRATION_BRAND_BLUE;
export const OPERATOR_V2_SURFACE = 'plates-chat' as const;

export type OperatorV2PlateId = 'schedule' | 'labor-cards' | 'menu' | 'order-guide';

export type OperatorV2Plate = {
  id: OperatorV2PlateId;
  label: string;
  folder: string;
  ask: string;
  tray: 'labor' | 'food' | 'action';
  missingUntil: string;
};

export const OPERATOR_V2_PLATES: readonly OperatorV2Plate[] = [
  {
    id: 'schedule',
    label: 'Schedule',
    folder: 'Schedules',
    ask: 'Here is this week’s schedule. Who is posted in and out, and what is still Missing?',
    tray: 'labor',
    missingUntil: 'A week photo or file lands. Labor lives on the schedule.',
  },
  {
    id: 'labor-cards',
    label: 'Labor cards',
    folder: 'Labor cards',
    ask: 'From that schedule, show labor cards and on-time vs drift. Punch is Missing until the clock lands.',
    tray: 'labor',
    missingUntil: 'A punch exists. Punch ≠ schedule. No invented overtime.',
  },
  {
    id: 'menu',
    label: 'Menu',
    folder: 'Menu',
    ask: 'Here is the menu photo. Name the top money plates we should cost first.',
    tray: 'food',
    missingUntil: 'A menu photo lands. Top plates only — no full recipe book week 1.',
  },
  {
    id: 'order-guide',
    label: 'Order guide',
    folder: 'Order guides',
    ask: 'Here is the order guide. What is still Missing before the next truck?',
    tray: 'food',
    missingUntil: 'An order guide or invoice email lands. Invoice ≠ COGS.',
  },
] as const;

export function plateById(id: string): OperatorV2Plate | undefined {
  return OPERATOR_V2_PLATES.find((plate) => plate.id === id);
}

export function nextMissingPlate(filled: ReadonlySet<OperatorV2PlateId>): OperatorV2Plate {
  return OPERATOR_V2_PLATES.find((plate) => !filled.has(plate.id)) ?? OPERATOR_V2_PLATES[0];
}
