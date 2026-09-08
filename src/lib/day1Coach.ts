import {
  OPERATOR_V2_PLATES,
  nextMissingPlate,
  plateById,
  resolveOperatorV2PlateId,
  type OperatorV2Plate,
  type OperatorV2PlateId,
} from './operatorV2';

/**
 * Day-1 operator-first WOW desk. Adult ink desk + Missing honesty spine.
 * Invoice / truck is one path after they choose it — not the stiff first CTA.
 * Not order-guide ownership. Not a SaaS tour. Not a Prime Cost Coach tile.
 */
export const DAY1_INVOICE_PLATE_ID: OperatorV2PlateId = 'invoice-truck';
/** Photo folder after they choose invoice / truck. Not the empty-desk hero. */
export const DAY1_HOOK_PLATE_ID: OperatorV2PlateId = DAY1_INVOICE_PLATE_ID;
export const DAY1_COACH_ID = 'day1-coach-operator-wow';
/** Default A open — do not soften to “what’s your problem.” */
export const DAY1_OPEN_ASK =
  "You're not crazy. The stack is. I'm here to get that weight off you so you can run your shop again — and win.";
/** Positioning only. Not a Prime Cost Coach KPI tile. Not “prime coach is finally here.” */
export const DAY1_SUBLINE = 'Weight off the plate. No back-office homework.';
/** Kept for compose / chat energy. Not the first-paint hero. */
export const DAY1_OPEN_ENERGY = DAY1_SUBLINE;
export const DAY1_WEIRD_ASK = 'What got weird at the shop?';
/** Peer operator mouth. Never help-desk, never “what’s the problem today,” never SaaS CTA. */
export const DAY1_HELP_ENERGY = "What's still on the plate?";
export const DAY1_IDENTITY_LINE = "built by Myke Mueller · Never86'd · operator first";
export const DAY1_PROMISE_LINE = 'Find the leak. Assign the fix. Keep the receipt.';
export const DAY1_STORE_NAME_FALLBACK = 'Community Tap';
/** Toy / first-run junk titles. Empty desk never paints these. */
export const DAY1_TOY_STORE_TITLES = ['fun'] as const;
export const DAY1_MISSING_PAPER = 'Paper in';
export const DAY1_PREVIEW_CONTRACT =
  'Check the evidence. Name the owner. Draft the fix. Proof step. Nothing sends without you.';
export const DAY1_INVOICE_PATH_ASK =
  'Truck ticket or invoice — snap it when you want that paper off the plate.';
export const DAY1_INVOICE_PATH_HINT =
  'Liquor invoice, distributor truck ticket, or a handwritten short. One photo. Task off the plate.';
export const DAY1_BARTENDER_FOLLOW = "What's the name?";

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

export type Day1FrontPickId = 'bartender-leak' | 'behind-on-books' | 'too-many-hats' | 'invoice-truck';
export type Day1FrontAction = 'photo' | 'ask';
export type Day1MissingSpineId = 'schedules' | 'food' | 'pop' | 'beer' | 'liquor';
export type Day1MissingTray = 'labor' | 'food' | 'pop' | 'beer' | 'liquor';

export type Day1MissingSpine = {
  id: Day1MissingSpineId;
  label: string;
  tray: Day1MissingTray;
  plateId: OperatorV2PlateId;
  emptyCopy: string;
  paperCopy: string;
};

/** Honesty spine. Empty categories stay Missing — never a fake dollar. Distinct per tray. */
export const DAY1_MISSING_SPINE: readonly Day1MissingSpine[] = [
  { id: 'schedules', label: 'Schedules', tray: 'labor', plateId: 'schedule', emptyCopy: 'Missing — posted week', paperCopy: 'Week is on' },
  { id: 'food', label: 'Food', tray: 'food', plateId: 'menu', emptyCopy: 'Missing — menu paper', paperCopy: 'Menu paper in' },
  { id: 'pop', label: 'Drinks/Pop', tray: 'pop', plateId: 'invoice-truck', emptyCopy: 'Missing — pop invoice', paperCopy: 'Pop paper in' },
  { id: 'beer', label: 'Beer', tray: 'beer', plateId: 'invoice-truck', emptyCopy: 'Missing — beer ticket', paperCopy: 'Beer paper in' },
  { id: 'liquor', label: 'Liquor', tray: 'liquor', plateId: 'invoice-truck', emptyCopy: 'Missing — liquor ticket', paperCopy: 'Liquor paper in' },
];

export function day1StoreTitle(restaurantName?: string | null): string {
  const named = restaurantName?.trim().replace(/\s+/g, ' ') ?? '';
  if (!named) return DAY1_STORE_NAME_FALLBACK;
  if ((DAY1_TOY_STORE_TITLES as readonly string[]).includes(named.toLowerCase())) {
    return DAY1_STORE_NAME_FALLBACK;
  }
  return named;
}

export type Day1FrontPick = {
  id: Day1FrontPickId;
  chip: string;
  ask: string;
  action: Day1FrontAction;
  followUp?: string;
};

/** Floor-noun branches. Conversation first. Invoice / truck only when they pick it. */
export const DAY1_FRONT_PICKS: readonly Day1FrontPick[] = [
  {
    id: 'bartender-leak',
    chip: 'Bartender leak',
    ask: "Bartender leak — what's the name? Drawer and Z stay on that seat until the paper lands.",
    action: 'ask',
    followUp: DAY1_BARTENDER_FOLLOW,
  },
  {
    id: 'behind-on-books',
    chip: 'Behind on books',
    ask: "Behind on the books — 30-60-90 or a P&L surprise? Tell me what's staring at you.",
    action: 'ask',
  },
  {
    id: 'too-many-hats',
    chip: 'Too many hats',
    ask: "Wearing too many hats? That's why we're here. What's the one thing off your plate tonight?",
    action: 'ask',
  },
  {
    id: 'invoice-truck',
    chip: 'Invoice / truck',
    ask: DAY1_INVOICE_PATH_ASK,
    action: 'photo',
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
    ask: DAY1_INVOICE_PATH_ASK,
    attach: 'photo',
    attachHint: DAY1_INVOICE_PATH_HINT,
    winning:
      'That ticket is on this seat. Credit and checkout can wait. Named is not a verified close.',
  },
] as const;

const BANNED_FRONT_VOICE =
  /\b(layer|spine|unlock|insight|orchestration|empower|leverage|holistic|flywheel|north star|ecosystem|prime cost coach|all-in-one dashboard)\b/i;

const STIFF_TRUCK_LEAD = /got a truck ticket or invoice\?\s*snap it/i;

const HELP_DESK_MOUTH =
  /how can we help you|what's the problem today|what is the problem today|book a demo|get started/i;

export function day1CoachById(id: string): Day1FolderCoach | undefined {
  const resolved = resolveOperatorV2PlateId(id) ?? id;
  return DAY1_FOLDER_COACH.find((row) => row.id === resolved);
}

export function day1FrontPickById(id: string): Day1FrontPick | undefined {
  return DAY1_FRONT_PICKS.find((row) => row.id === id);
}

export function day1FrontNeedsPhoto(pickId: string | null | undefined): boolean {
  if (!pickId) return false;
  return day1FrontPickById(pickId)?.action === 'photo';
}

function filledHasPlate(filled: ReadonlySet<string>, id: OperatorV2PlateId): boolean {
  if (filled.has(id)) return true;
  return [...filled].some((row) => resolveOperatorV2PlateId(row) === id);
}

/** Photo folder after they choose invoice / truck — never the empty-desk hero. */
export function day1HookPlate(filled: ReadonlySet<OperatorV2PlateId | 'order-guide'>): OperatorV2Plate {
  if (!filledHasPlate(filled, DAY1_INVOICE_PLATE_ID)) {
    return plateById(DAY1_INVOICE_PLATE_ID) ?? OPERATOR_V2_PLATES[3];
  }
  return nextMissingPlate(
    new Set([...filled].map((id) => resolveOperatorV2PlateId(id) ?? id) as OperatorV2PlateId[]),
  );
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
  return /\b(vendor|invoice|truck|sysco|pepsi|humes|hy-?vee|pfg|performance|us foods|confluence|northern lights|\bnl\b|fort dodge|order guide|ticket)\b/i.test(
    question,
  );
}

export function looksLikeDay1BartenderAsk(question: string): boolean {
  return /\b(bartender|drawer|leak|theft|till)\b/i.test(question);
}

export function day1MissingSpineState(
  id: Day1MissingSpineId,
  filled: ReadonlySet<string>,
): 'missing' | 'paper' {
  if (id === 'schedules' && (filledHasPlate(filled, 'schedule') || filledHasPlate(filled, 'labor-cards'))) {
    return 'paper';
  }
  if (id === 'food' && (filledHasPlate(filled, 'menu') || filledHasPlate(filled, 'invoice-truck'))) {
    return 'paper';
  }
  return 'missing';
}

export function day1MissingSpineCopy(
  id: Day1MissingSpineId,
  filled: ReadonlySet<string>,
): string {
  const row = DAY1_MISSING_SPINE.find((item) => item.id === id);
  if (day1MissingSpineState(id, filled) === 'paper') {
    return row?.paperCopy ?? DAY1_MISSING_PAPER;
  }
  return row?.emptyCopy ?? 'Missing';
}

export function day1FrontLeadBlob(): string {
  return [
    DAY1_OPEN_ASK,
    DAY1_SUBLINE,
    DAY1_OPEN_ENERGY,
    DAY1_WEIRD_ASK,
    DAY1_HELP_ENERGY,
    DAY1_IDENTITY_LINE,
    DAY1_PROMISE_LINE,
    DAY1_PREVIEW_CONTRACT,
    DAY1_STORE_NAME_FALLBACK,
    ...DAY1_MISSING_SPINE.map((row) => `${row.label} ${row.emptyCopy} ${row.paperCopy}`),
  ].join(' ');
}

export function day1FrontCopyBlob(): string {
  return [
    day1FrontLeadBlob(),
    ...DAY1_FRONT_PICKS.map((row) => `${row.chip} ${row.ask}`),
    ...DAY1_FOLDER_COACH.map((row) => `${row.chip} ${row.ask} ${row.winning}`),
  ].join(' ');
}

export function day1FrontVoiceIsClean(text = day1FrontCopyBlob()): boolean {
  return (
    !BANNED_FRONT_VOICE.test(text) &&
    !HELP_DESK_MOUTH.test(text) &&
    !/\$\d/.test(text) &&
    !STIFF_TRUCK_LEAD.test(day1FrontLeadBlob())
  );
}

export function day1LeadIsConversationFirst(text = day1FrontLeadBlob()): boolean {
  return (
    /you're not crazy\. the stack is/i.test(text) &&
    /weight off the plate/i.test(text) &&
    /no back-office homework/i.test(text) &&
    /what's still on the plate/i.test(text) &&
    /schedules/i.test(text) &&
    /drinks\/pop/i.test(text) &&
    /missing — posted week/i.test(text) &&
    /missing — menu paper/i.test(text) &&
    /missing — pop invoice/i.test(text) &&
    /missing — beer ticket/i.test(text) &&
    /missing — liquor ticket/i.test(text) &&
    !HELP_DESK_MOUTH.test(text) &&
    !/prime coach is finally here/i.test(text) &&
    !/was you/i.test(text) &&
    !/missing \/ bring a paper/i.test(text) &&
    !STIFF_TRUCK_LEAD.test(text) &&
    !/order guide/i.test(text) &&
    !/all-in-one dashboard/i.test(text) &&
    !/prime cost coach/i.test(text)
  );
}
