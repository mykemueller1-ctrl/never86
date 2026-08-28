import type { ActionShiftRoleKey } from './actionShiftSetup';
import {
  CTAP_LAB_TEMPLATES,
  CTAP_LAB_WEEKDAYS,
  type CtapLabShiftPhase,
  type CtapLabSource,
  type CtapLabTemplate,
  type CtapLabWeekday,
} from './ctapLabTemplates';

export {
  CTAP_LAB_TEMPLATES,
  CTAP_LAB_WEEKDAYS,
  type CtapLabShiftPhase,
  type CtapLabSource,
  type CtapLabTemplate,
  type CtapLabWeekday,
};

export const CTAP_LAB_PACK_ID = 'ctap-lab-templates-v1';
export const CTAP_LAB_PACK_STATUS = 'drafted' as const;

export type CtapLabStationSeat = {
  seatKey: string;
  label: string;
  roleKey: ActionShiftRoleKey;
  stations: readonly string[];
  kind: 'station_seat';
};

export const CTAP_LAB_STATION_SEATS: readonly CtapLabStationSeat[] = [
  { seatKey: 'owner', label: 'Owner', roleKey: 'owner', stations: ['owner_desk'], kind: 'station_seat' },
  { seatKey: 'foh_manager', label: 'FOH Manager', roleKey: 'manager', stations: ['bar_side', 'pizza_side'], kind: 'station_seat' },
  { seatKey: 'kitchen_manager', label: 'Kitchen Manager', roleKey: 'kitchen_manager', stations: ['kitchen'], kind: 'station_seat' },
  { seatKey: 'bartender', label: 'Bartender', roleKey: 'bartender', stations: ['bar'], kind: 'station_seat' },
  { seatKey: 'server', label: 'Server', roleKey: 'server', stations: ['dining'], kind: 'station_seat' },
  { seatKey: 'prep', label: 'Prep', roleKey: 'prep_cook', stations: ['prep'], kind: 'station_seat' },
  { seatKey: 'driver', label: 'Driver', roleKey: 'driver', stations: ['delivery'], kind: 'station_seat' },
];

export type CtapVendorCadenceRule = {
  weekday: CtapLabWeekday;
  action: 'receive' | 'order';
  vendor: 'Hy-Vee' | 'Humes' | 'Fort Dodge Distributing' | 'Bud';
  category: 'wine_liquor' | 'beer';
  ownerRoleKey: ActionShiftRoleKey;
  note: string;
};

export const CTAP_VENDOR_CADENCE_RULES: readonly CtapVendorCadenceRule[] = [
  {
    weekday: 'Monday',
    action: 'receive',
    vendor: 'Hy-Vee',
    category: 'wine_liquor',
    ownerRoleKey: 'manager',
    note: 'Wine and liquor delivery. Schedule rule only — not a live purchase order.',
  },
  {
    weekday: 'Tuesday',
    action: 'receive',
    vendor: 'Humes',
    category: 'beer',
    ownerRoleKey: 'manager',
    note: 'Beer delivery. Schedule rule only — not a live purchase order.',
  },
  {
    weekday: 'Tuesday',
    action: 'receive',
    vendor: 'Fort Dodge Distributing',
    category: 'beer',
    ownerRoleKey: 'manager',
    note: 'Beer delivery. Schedule rule only — not a live purchase order.',
  },
  {
    weekday: 'Tuesday',
    action: 'order',
    vendor: 'Humes',
    category: 'beer',
    ownerRoleKey: 'manager',
    note: 'Night order for Friday receive. Schedule rule only — not a live purchase order.',
  },
  {
    weekday: 'Friday',
    action: 'receive',
    vendor: 'Humes',
    category: 'beer',
    ownerRoleKey: 'manager',
    note: 'Beer delivery. Schedule rule only — not a live purchase order.',
  },
  {
    weekday: 'Sunday',
    action: 'order',
    vendor: 'Bud',
    category: 'beer',
    ownerRoleKey: 'manager',
    note: 'Night order for Tuesday receive. Schedule rule only — not a live purchase order.',
  },
];

export type CtapCogsBonusPolicy = {
  category: 'food' | 'beer' | 'liquor';
  targetMinPct: number;
  targetMaxPct: number;
  unit: 'percent_of_category_sales';
};

export const CTAP_COGS_BONUS_POLICY: readonly CtapCogsBonusPolicy[] = [
  { category: 'food', targetMinPct: 28, targetMaxPct: 30, unit: 'percent_of_category_sales' },
  { category: 'beer', targetMinPct: 22, targetMaxPct: 25, unit: 'percent_of_category_sales' },
  { category: 'liquor', targetMinPct: 18, targetMaxPct: 20, unit: 'percent_of_category_sales' },
];

const FOH_MANAGER_ROLES: readonly ActionShiftRoleKey[] = ['manager', 'general_manager'];

export function weekdayFromBusinessDate(businessDate: string): CtapLabWeekday | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(businessDate)) return null;
  const parsed = new Date(`${businessDate}T00:00:00Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== businessDate) return null;
  const weekday = CTAP_LAB_WEEKDAYS[(parsed.getUTCDay() + 6) % 7];
  return weekday ?? null;
}

export function inferCtapLabShiftPhase(startsAt: string): Exclude<CtapLabShiftPhase, 'weekly'> {
  const match = startsAt.match(/T(\d{2}):/);
  const hour = match ? Number(match[1]) : Number.NaN;
  if (!Number.isFinite(hour) || hour >= 15) return 'close';
  return 'open';
}

function roleMatches(templateRole: ActionShiftRoleKey, roleKey: ActionShiftRoleKey): boolean {
  if (templateRole === roleKey) return true;
  if (FOH_MANAGER_ROLES.includes(templateRole) && FOH_MANAGER_ROLES.includes(roleKey)) return true;
  return false;
}

export function selectCtapLabTemplates(input: {
  roleKey: ActionShiftRoleKey;
  weekday?: CtapLabWeekday | null;
  shiftPhase?: CtapLabShiftPhase | null;
}): CtapLabTemplate[] {
  return CTAP_LAB_TEMPLATES.filter((template) => {
    if (!roleMatches(template.roleKey, input.roleKey)) return false;
    if (input.weekday && template.weekday && template.weekday !== input.weekday) return false;
    if (input.shiftPhase && template.shiftPhase !== input.shiftPhase && template.shiftPhase !== 'weekly') {
      return false;
    }
    return true;
  });
}

export function checklistItemsForCtapLabShift(input: {
  roleKey: ActionShiftRoleKey;
  businessDate: string;
  startsAt: string;
}): string[] {
  const weekday = weekdayFromBusinessDate(input.businessDate);
  const phase = inferCtapLabShiftPhase(input.startsAt);
  const phases: CtapLabShiftPhase[] = input.roleKey === 'driver'
    ? ['open', 'mid', 'close']
    : [phase, 'weekly'];
  const selected = CTAP_LAB_TEMPLATES.filter((template) => {
    if (!roleMatches(template.roleKey, input.roleKey)) return false;
    if (template.weekday && weekday && template.weekday !== weekday) return false;
    if (template.weekday && !weekday) return false;
    return phases.includes(template.shiftPhase);
  });
  return [...new Set(selected.flatMap((template) => template.steps.map((step) => step.instruction)))];
}

export function vendorCadenceForWeekday(weekday: CtapLabWeekday): CtapVendorCadenceRule[] {
  return CTAP_VENDOR_CADENCE_RULES.filter((rule) => rule.weekday === weekday);
}

export type CtapLabPack = {
  id: string;
  status: typeof CTAP_LAB_PACK_STATUS;
  boundary: {
    livePayroll: false;
    livePurchaseOrders: false;
    liveWeeklyDollars: false;
    inventedCurrentWeekSales: false;
    publicSafe: true;
  };
  stationSeats: readonly CtapLabStationSeat[];
  vendorCadenceRules: readonly CtapVendorCadenceRule[];
  cogsBonusPolicy: readonly CtapCogsBonusPolicy[];
  templates: readonly CtapLabTemplate[];
  sources: readonly CtapLabSource[];
};

export function buildCtapLabPack(): CtapLabPack {
  return {
    id: CTAP_LAB_PACK_ID,
    status: CTAP_LAB_PACK_STATUS,
    boundary: {
      livePayroll: false,
      livePurchaseOrders: false,
      liveWeeklyDollars: false,
      inventedCurrentWeekSales: false,
      publicSafe: true,
    },
    stationSeats: CTAP_LAB_STATION_SEATS,
    vendorCadenceRules: CTAP_VENDOR_CADENCE_RULES,
    cogsBonusPolicy: CTAP_COGS_BONUS_POLICY,
    templates: CTAP_LAB_TEMPLATES,
    sources: [
      'manager-expectations',
      'waitstaff-mon-sun',
      'bar-open-close',
      'kitchen-open-close',
      'driver-between-runs',
    ],
  };
}

const PII_PATTERNS: readonly RegExp[] = [
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  /\b\d{3}-\d{2}-\d{4}\b/,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /\b(pin|password|ssn|social security)\b/i,
  /\$\s?\d{2,4}\s*\/\s*week/i,
  /\b8\/26\b/,
  /\bfacebook\b/i,
];

export function findCtapLabPackPrivacyHits(value: unknown): string[] {
  const text = JSON.stringify(value);
  return PII_PATTERNS.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
}
