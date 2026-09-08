import {
  OPERATOR_V2_PLATES,
  nextMissingPlate,
  plateById,
  resolveOperatorV2PlateId,
  type OperatorV2Plate,
  type OperatorV2PlateId,
} from './operatorV2';

/**
 * Day-1 Option C hybrid. Open ask + soft default physical artifact.
 * Not order-guide ownership. Not a SaaS tour. Not a module sitemap.
 */
export const DAY1_HOOK_PLATE_ID: OperatorV2PlateId = 'invoice-truck';
export const DAY1_COACH_ID = 'day1-coach-option-c';
export const DAY1_OPEN_ASK = 'How can we help you?';
export const DAY1_SOFT_DEFAULT = 'Got a truck ticket or invoice? Snap it.';
export const DAY1_SOFT_DEFAULT_HINT =
  'Liquor invoice, distributor truck ticket, or a handwritten short. One photo. Task off the plate.';

export type Day1AttachKind = 'photo' | 'file';

export type Day1FolderCoach = {
  id: OperatorV2PlateId;
  label: string;
  chip: string;
  ask: string;
  attach: Day1AttachKind;
  attachHint: string;
  winning: string;
};

export type Day1FrontPickId = 'doordash-statement' | 'fee-line' | 'whats-86d';
export type Day1FrontAction = 'photo' | 'ask';

export type Day1FrontPick = {
  id: Day1FrontPickId;
  chip: string;
  ask: string;
  action: Day1FrontAction;
};

/** Floor-noun secondaries. One pick → one action. Not a sitemap. */
export const DAY1_FRONT_PICKS: readonly Day1FrontPick[] = [
  {
    id: 'doordash-statement',
    chip: 'DoorDash statement',
    ask: 'DoorDash statement — what is the take on the fee line?',
    action: 'photo',
  },
  {
    id: 'fee-line',
    chip: 'Fee line',
    ask: 'What is the DoorDash take on the fee line?',
    action: 'ask',
  },
  {
    id: 'whats-86d',
    chip: "What's 86'd",
    ask: "What's 86'd?",
    action: 'ask',
  },
];

export const DAY1_FOLDER_COACH: readonly Day1FolderCoach[] = [
  {
    id: 'schedule',
    label: 'Schedule',
    chip: 'Week schedule',
    ask: 'Can you snap this week’s schedule? We’ll see who’s posted in and out. Labor lives on that grid.',
    attach: 'photo',
    attachHint: 'Photo the posted week — phone camera is enough.',
    winning: 'Schedule is on this seat. Labor cards can wait until you want the next snap.',
  },
  {
    id: 'labor-cards',
    label: 'Labor cards',
    chip: 'Labor cards',
    ask: 'Got labor cards, or is it shift / role specific? Snap how this shop runs the seats.',
    attach: 'photo',
    attachHint: 'Photo the cards or a role grid. Punch stays Missing until the clock lands.',
    winning: 'Labor cards are on this seat. Punch still waits on the clock.',
  },
  {
    id: 'menu',
    label: 'Menu',
    chip: 'Menu',
    ask: 'Picture of the menu — top money plates first. Recipes suck; we figure the chaos.',
    attach: 'photo',
    attachHint: 'One menu photo. No recipe book week 1.',
    winning: 'Menu is on this seat. Top plates only — no food-cost % from a photo.',
  },
  {
    id: 'invoice-truck',
    label: 'Invoice / truck',
    chip: 'Invoice / truck',
    ask: DAY1_SOFT_DEFAULT,
    attach: 'photo',
    attachHint: DAY1_SOFT_DEFAULT_HINT,
    winning:
      'That ticket is on this seat. Credit and checkout can wait. Named is not a verified close.',
  },
] as const;

const BANNED_FRONT_VOICE =
  /\b(layer|spine|unlock|insight|orchestration|empower|leverage|holistic|flywheel|north star|ecosystem)\b/i;

export function day1CoachById(id: string): Day1FolderCoach | undefined {
  const resolved = resolveOperatorV2PlateId(id) ?? id;
  return DAY1_FOLDER_COACH.find((row) => row.id === resolved);
}

export function day1FrontPickById(id: string): Day1FrontPick | undefined {
  return DAY1_FRONT_PICKS.find((row) => row.id === id);
}

function filledHasPlate(filled: ReadonlySet<string>, id: OperatorV2PlateId): boolean {
  if (filled.has(id)) return true;
  return [...filled].some((row) => resolveOperatorV2PlateId(row) === id);
}

/** Empty desk → invoice / truck folder. After that, remaining folders in Schedule → Labor → Menu order. */
export function day1HookPlate(filled: ReadonlySet<OperatorV2PlateId | 'order-guide'>): OperatorV2Plate {
  if (!filledHasPlate(filled, DAY1_HOOK_PLATE_ID)) {
    return plateById(DAY1_HOOK_PLATE_ID) ?? OPERATOR_V2_PLATES[3];
  }
  return nextMissingPlate(new Set([...filled].map((id) => resolveOperatorV2PlateId(id) ?? id) as OperatorV2PlateId[]));
}

export function day1HookCoach(filled: ReadonlySet<OperatorV2PlateId>): Day1FolderCoach {
  const plate = day1HookPlate(filled);
  return day1CoachById(plate.id) ?? DAY1_FOLDER_COACH[3];
}

export function firstPhotoWinLine(readyFolderId: string): string {
  const coach = day1CoachById(readyFolderId);
  return coach?.winning ?? 'That paper is on this seat. Named is not a verified close.';
}

export function looksLikeDay1VendorAsk(question: string): boolean {
  return /\b(vendor|invoice|truck|sysco|pepsi|humes|hy-?vee|pfg|performance|confluence|northern lights|\bnl\b|fort dodge|order guide|ticket)\b/i.test(
    question,
  );
}

export function day1FrontCopyBlob(): string {
  return [
    DAY1_OPEN_ASK,
    DAY1_SOFT_DEFAULT,
    DAY1_SOFT_DEFAULT_HINT,
    ...DAY1_FRONT_PICKS.map((row) => `${row.chip} ${row.ask}`),
    ...DAY1_FOLDER_COACH.map((row) => `${row.chip} ${row.ask} ${row.winning}`),
  ].join(' ');
}

export function day1FrontVoiceIsClean(text = day1FrontCopyBlob()): boolean {
  return !BANNED_FRONT_VOICE.test(text) && !/\$\d/.test(text);
}
