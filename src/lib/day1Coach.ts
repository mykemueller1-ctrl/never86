import {
  OPERATOR_V2_PLATES,
  nextMissingPlate,
  plateById,
  type OperatorV2Plate,
  type OperatorV2PlateId,
} from './operatorV2';

/**
 * Day-1 10-minute hook. First win = one folder Ready from a photo.
 * Prefer Order guide (1–2 snaps). Other folders stay chips, not a tour.
 * Review Fail includes this hook — do not swap it for a dashboard or silo tour.
 */
export const DAY1_HOOK_PLATE_ID: OperatorV2PlateId = 'order-guide';
export const DAY1_COACH_ID = 'day1-coach-v1';

/** Research Stream A — must-not-violate. Review Fail if any flag is broken. */
export const DAY1_SOR_OPTIONS = ['POS', 'app', 'Sheets', 'paper'] as const;
export type Day1SystemOfRecord = (typeof DAY1_SOR_OPTIONS)[number];

export const STREAM_A_LOCKS = {
  id: 'stream-a-must-not-violate-v1',
  siloNames: 'optional-cues-only',
  optionalSiloCues: ['7shifts', 'Toast'] as const,
  replacesSilosOnDay1: false,
  dashboardFirst: false,
  orderGuideOcr: 'outside-pos',
  orderGuideSources: ['paper', 'photo', 'marginedge-class'] as const,
  nativeToastOrderGuide: false,
  systemOfRecordAsk: true,
  systemOfRecordOptions: DAY1_SOR_OPTIONS,
  systemOfRecordFolders: ['schedule', 'labor-cards', 'menu'] as const,
  hardcodedVendorPath: false,
  inventedUsagePct: false,
  tenMinuteHook: true,
  reviewFailIncludesTenMinuteHook: true,
} as const;

/** ICP wedge — do not blur. Review Fail if day-1 copy sells the wrong shop. */
export const ICP_WEDGE_LOCK = {
  id: 'icp-wedge-v1',
  primary: '1-3-unit-independents',
  shopClass: 'community-tap',
  concepts: ['sports-bar', 'pizza', 'casual-tavern'] as const,
  problems: ['paper-invoices', 'labor-schedule-chaos', 'menu-86-drift', 'fee-fatigue'] as const,
  notPrimary: ['fine-dining-tasting-menu', 'enterprise-franchise-command-center', 'pure-qsr-drive-thru'] as const,
  tenMinuteHook: true,
  firstWin: 'order-guide-photo',
} as const;

/** Empty-desk line. 1–3 owner should feel this gets their mess. */
export const ICP_WEDGE_FIRST_PAINT = 'Paper invoices. One photo. This gets your mess. Not a tour.';

export type Day1AttachKind = 'photo' | 'file';

export type Day1FolderCoach = {
  id: OperatorV2PlateId;
  label: string;
  chip: string;
  ask: string;
  attach: Day1AttachKind;
  attachHint: string;
  winning: string;
  /** Schedule / labor / menu ask which system-of-record. Order guide is paper-first. */
  askSystemOfRecord: boolean;
};

export const DAY1_FOLDER_COACH: readonly Day1FolderCoach[] = [
  {
    id: 'schedule',
    label: 'Schedule',
    chip: 'Snap the week schedule',
    ask: 'Schedule chaos this week? Snap the grid — POS, an app, Sheets, or the paper on the wall. We’ll see who’s posted in and out. Labor lives on that grid.',
    attach: 'photo',
    attachHint:
      'Photo the posted week — paper, Sheets print, or app screen. 7shifts or Toast is a cue only. We don’t replace them on day 1.',
    winning: 'Schedule is on this seat. You’re winning. Labor cards can wait until you want the next snap.',
    askSystemOfRecord: true,
  },
  {
    id: 'labor-cards',
    label: 'Labor cards',
    chip: 'Snap labor cards',
    ask: 'Got labor cards, or is it shift / role specific? Snap how this shop runs the seats — POS, app, Sheets, or paper.',
    attach: 'photo',
    attachHint: 'Photo the cards or a role grid. Punch stays Missing until the clock lands. We don’t swap your labor app on day 1.',
    winning: 'Labor cards are on this seat. You’re winning. Punch still waits on the clock.',
    askSystemOfRecord: true,
  },
  {
    id: 'menu',
    label: 'Menu',
    chip: 'Snap the menu',
    ask: 'Picture of the menu — 86s and top money plates first. Paper, POS print, Sheets, or the app — wherever it lives. Recipes suck; we figure the chaos.',
    attach: 'photo',
    attachHint: 'One menu photo. No recipe book week 1. No invented plate mix.',
    winning: 'Menu is on this seat. You’re winning. Top plates only — no food-cost from a photo.',
    askSystemOfRecord: true,
  },
  {
    id: 'order-guide',
    label: 'Order guide',
    chip: 'Snap the order guide',
    ask: 'Snap this week’s order guide — paper invoice, liquor ticket, or the truck print you hang. One photo and you’re winning.',
    attach: 'photo',
    attachHint:
      'Photo the paper guide, binder, or MarginEdge-class print. Outside the POS. Invoice ≠ COGS. Fee fatigue later — ticket first.',
    winning: 'Order guide is on this seat. You’re winning. Missing a truck later is “forget to snap?” — not “you didn’t order.”',
    askSystemOfRecord: false,
  },
] as const;

export function day1CoachById(id: string): Day1FolderCoach | undefined {
  return DAY1_FOLDER_COACH.find((row) => row.id === id);
}

/** Empty desk → Order guide. After that, remaining folders in Schedule → Labor → Menu order. */
export function day1HookPlate(filled: ReadonlySet<OperatorV2PlateId>): OperatorV2Plate {
  if (!filled.has(DAY1_HOOK_PLATE_ID)) {
    return plateById(DAY1_HOOK_PLATE_ID) ?? OPERATOR_V2_PLATES[3];
  }
  return nextMissingPlate(filled);
}

export function day1HookCoach(filled: ReadonlySet<OperatorV2PlateId>): Day1FolderCoach {
  const plate = day1HookPlate(filled);
  return day1CoachById(plate.id) ?? DAY1_FOLDER_COACH[3];
}

export function firstPhotoWinLine(readyFolderId: string): string {
  const coach = day1CoachById(readyFolderId);
  return coach?.winning ?? 'That paper is on this seat. You’re winning. Named is not a verified close.';
}

export function looksLikeDay1VendorAsk(question: string): boolean {
  return /\b(vendor|invoice|truck|sysco|pepsi|humes|hy-?vee|pfg|performance|confluence|northern lights|\bnl\b|fort dodge|order guide|ticket)\b/i.test(
    question,
  );
}

export function day1CoachCorpus(): string {
  return DAY1_FOLDER_COACH.map((row) => `${row.chip} ${row.ask} ${row.attachHint} ${row.winning}`).join('\n');
}

/** Silo names may appear only as optional cues — never as the required path. */
export function siloCueIsOptional(text: string, silo: string): boolean {
  const lower = text.toLowerCase();
  const name = silo.toLowerCase();
  if (!lower.includes(name)) return true;
  return /cue only|don’t replace|do not replace|don’t swap|do not swap|optional/i.test(text);
}
