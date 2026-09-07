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
 */
export const DAY1_HOOK_PLATE_ID: OperatorV2PlateId = 'order-guide';
export const DAY1_COACH_ID = 'day1-coach-v1';

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

export const DAY1_FOLDER_COACH: readonly Day1FolderCoach[] = [
  {
    id: 'schedule',
    label: 'Schedule',
    chip: 'Snap the week schedule',
    ask: 'Can you snap this week’s schedule? We’ll see who’s posted in and out. Labor lives on that grid.',
    attach: 'photo',
    attachHint: 'Photo the posted week — phone camera is enough.',
    winning: 'Schedule is on this seat. You’re winning. Labor cards can wait until you want the next snap.',
  },
  {
    id: 'labor-cards',
    label: 'Labor cards',
    chip: 'Snap labor cards',
    ask: 'Got labor cards, or is it shift / role specific? Snap how this shop runs the seats.',
    attach: 'photo',
    attachHint: 'Photo the cards or a role grid. Punch stays Missing until the clock lands.',
    winning: 'Labor cards are on this seat. You’re winning. Punch still waits on the clock.',
  },
  {
    id: 'menu',
    label: 'Menu',
    chip: 'Snap the menu',
    ask: 'Picture of the menu — top money plates first. Recipes suck; we figure the chaos.',
    attach: 'photo',
    attachHint: 'One menu photo. No recipe book week 1.',
    winning: 'Menu is on this seat. You’re winning. Top plates only — no food-cost % from a photo.',
  },
  {
    id: 'order-guide',
    label: 'Order guide',
    chip: 'Snap the order guide',
    ask: 'Snap this week’s order guide — or the liquor / truck ticket. One photo and you’re winning.',
    attach: 'photo',
    attachHint: 'Photo the guide or the ticket. Invoice ≠ COGS.',
    winning: 'Order guide is on this seat. You’re winning. Missing a truck later is “forget to snap?” — not “you didn’t order.”',
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
