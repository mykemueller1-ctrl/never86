/**
 * Papers chat step — maps Missing papers. Not a chatbot.
 * A named paper stays Missing until a file parses. Chat text never becomes $.
 * A ready Google client is not a connected inbox. Papers stay Missing until a pull lands.
 */

import type { HonestyLabel } from './oneSeatPublicWin';

export const CHAT_INTAKE_SLOTS = [
  { id: 'invoices', label: 'Invoice / truck', ask: 'Two invoices from the same vendor. Same SKU and pack.' },
  { id: 'labor', label: 'Labor / schedule', ask: 'Posted week and the matching clock. Punch ≠ schedule.' },
  { id: 'menu', label: 'Menu', ask: 'Menu paper. No count → no food cost. Invoice ≠ COGS.' },
  { id: 'z-eod', label: 'Z / end of day', ask: 'POS end-of-day. POS ≠ payout.' },
  { id: 'photo', label: 'Photo', ask: 'One photo if Gmail is not connected. HEIC has no OCR here.' },
] as const;

export type ChatSlotId = (typeof CHAT_INTAKE_SLOTS)[number]['id'];
export type ChatPaperMark = 'absent' | 'named' | 'parsed';

export type ChatIntakeRow = {
  id: ChatSlotId | 'google';
  label: string;
  honesty: HonestyLabel;
  note: string;
};

const SLOT_PATTERNS: Array<{ id: ChatSlotId; re: RegExp }> = [
  { id: 'invoices', re: /\b(invoice|truck|sysco|pfg|us foods|vendor)\b/i },
  { id: 'labor', re: /\b(labor|schedule|punch|clock|time\s*clock)\b/i },
  { id: 'menu', re: /\b(menu|recipe|plate)\b/i },
  { id: 'z-eod', re: /\b(z[-\s]?report|eod|end of day|sales summary)\b/i },
  { id: 'photo', re: /\b(photo|picture|heic|heif|camera)\b/i },
];

export function chatLineMentionsDollars(text: string): boolean {
  return /\$\s*\d/.test(text);
}

export function readChatIntakeLine(text: string): { slot: ChatSlotId | 'google' | null; ignoredDollars: boolean } {
  const ignoredDollars = chatLineMentionsDollars(text);
  if (/\b(gmail|google|drive)\b/i.test(text)) {
    return { slot: 'google', ignoredDollars };
  }
  const hit = SLOT_PATTERNS.find((row) => row.re.test(text));
  return { slot: hit?.id ?? null, ignoredDollars };
}

export function chatIntakeMap(input: {
  googleReady: boolean;
  marks: Partial<Record<ChatSlotId, ChatPaperMark>>;
}): ChatIntakeRow[] {
  const google: ChatIntakeRow = {
    id: 'google',
    label: 'Gmail + Drive',
    honesty: 'Missing',
    note: input.googleReady
      ? 'Google client is ready. This chat does not pull mail. Papers stay Missing until Gmail is connected. No invented papers.'
      : 'Missing — GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not on this deploy. Gmail stays off. No invented papers.',
  };

  const slots: ChatIntakeRow[] = CHAT_INTAKE_SLOTS.map((slot) => {
    const mark = input.marks[slot.id] ?? 'absent';
    if (mark === 'parsed') {
      return {
        id: slot.id,
        label: slot.label,
        honesty: 'Estimated',
        note: `${slot.label} parsed from a file on this chat. Not Verified until the matching papers compare. No invented $.`,
      };
    }
    if (mark === 'named') {
      return {
        id: slot.id,
        label: slot.label,
        honesty: 'Missing',
        note: `${slot.label} was named in chat. The file is still Missing — not $0. ${slot.ask}`,
      };
    }
    return {
      id: slot.id,
      label: slot.label,
      honesty: 'Missing',
      note: `${slot.label} is Missing. ${slot.ask}`,
    };
  });

  return [google, ...slots];
}

export function chatReplyForLine(
  text: string,
  map: ChatIntakeRow[],
): string {
  const read = readChatIntakeLine(text);
  const dollars = read.ignoredDollars
    ? ' Dollars typed here are not evidence.'
    : '';
  if (!read.slot) {
    return `That did not match a paper on this seat. Still Missing.${dollars} No invented $.`;
  }
  const row = map.find((item) => item.id === read.slot);
  return `${row?.note ?? 'Missing.'}${dollars}`;
}
