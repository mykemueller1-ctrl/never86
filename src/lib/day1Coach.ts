import {
  OPERATOR_V2_PLATES,
  nextMissingPlate,
  plateById,
  resolveOperatorV2PlateId,
  type OperatorV2Plate,
  type OperatorV2PlateId,
} from './operatorV2';

/**
 * Day-1 conversation-first coach. Open human ask + floor-noun branches.
 * Invoice / truck is one path after they choose it — not the stiff first CTA.
 * Not order-guide ownership. Not a SaaS tour. Not a module sitemap.
 */
export const DAY1_INVOICE_PLATE_ID: OperatorV2PlateId = 'invoice-truck';
/** Photo folder after they choose invoice / truck. Not the empty-desk hero. */
export const DAY1_HOOK_PLATE_ID: OperatorV2PlateId = DAY1_INVOICE_PLATE_ID;
export const DAY1_COACH_ID = 'day1-coach-conversation';
export const DAY1_OPEN_ASK = "What's the problem today?";
export const DAY1_OPEN_ENERGY = "What's going on?";
export const DAY1_WEIRD_ASK = 'What got weird at the shop?';
export const DAY1_HELP_ENERGY = 'How can we help you?';
/** Floor nouns after the open ask — not a first CTA, not a tour. */
export const DAY1_ONBOARD_AFTER = 'Trucks, order day, who yells, what sucks.';
export const DAY1_IDENTITY_LINE = "built by Myke Mueller · Never86'd · operator first · was you";
export const DAY1_PROMISE_LINE = 'Find the leak. Assign the fix. Keep the receipt.';
export const DAY1_SEAT_LINE = "one store, one login, yesterday's numbers, one move, one receipt";
export const DAY1_NO_RIP_LINE = "We don't rip-and-replace — next action already in the data.";
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
  return /\b(vendor|invoice|truck|sysco|pepsi|humes|hy-?vee|pfg|performance|confluence|northern lights|\bnl\b|fort dodge|order guide|ticket)\b/i.test(
    question,
  );
}

export function looksLikeDay1BartenderAsk(question: string): boolean {
  return /\b(bartender|drawer|leak|theft|till)\b/i.test(question);
}

export function day1FrontLeadBlob(): string {
  return [
    DAY1_OPEN_ASK,
    DAY1_OPEN_ENERGY,
    DAY1_WEIRD_ASK,
    DAY1_HELP_ENERGY,
    DAY1_ONBOARD_AFTER,
    DAY1_IDENTITY_LINE,
    DAY1_PROMISE_LINE,
    DAY1_SEAT_LINE,
    DAY1_NO_RIP_LINE,
    DAY1_PREVIEW_CONTRACT,
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
  return !BANNED_FRONT_VOICE.test(text) && !/\$\d/.test(text) && !STIFF_TRUCK_LEAD.test(day1FrontLeadBlob());
}

export function day1LeadIsConversationFirst(text = day1FrontLeadBlob()): boolean {
  return (
    /what's the problem today/i.test(text) &&
    /what's going on|what got weird/i.test(text) &&
    /trucks, order day, who yells, what sucks/i.test(text) &&
    /find the leak/i.test(text) &&
    /one store, one login/i.test(text) &&
    /don't rip-and-replace/i.test(text) &&
    !STIFF_TRUCK_LEAD.test(text) &&
    !/order guide/i.test(text) &&
    !/all-in-one dashboard/i.test(text)
  );
}
