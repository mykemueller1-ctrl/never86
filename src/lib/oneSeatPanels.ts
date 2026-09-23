/**
 * Public One Seat panels. Ask routes to a paper. It does not invent dollars.
 * A ready Google client is not a connected inbox.
 */

import { chatLineMentionsDollars } from './papersChatIntake';
import {
  GOLD_LABOR,
  GOLD_MOZZARELLA,
  GOLD_RECIPE,
  money,
  pctLabel,
  type HonestyLabel,
} from './oneSeatPublicWin';

export const SEAT_TABS = [
  { id: 'missing', label: "What's missing" },
  { id: 'invoices', label: 'Invoices' },
  { id: 'labor', label: 'Labor' },
  { id: 'menu', label: 'Menu' },
  { id: 'ask', label: "Ask Never86'd" },
] as const;

export type SeatTabId = (typeof SEAT_TABS)[number]['id'];

export type SeatAskAnswer = {
  tab: SeatTabId;
  honesty: HonestyLabel;
  reply: string;
};

function dollarNote(question: string): string {
  return chatLineMentionsDollars(question) ? ' Dollars typed here are not evidence.' : '';
}

export function answerSeatAsk(question: string, input?: { googleReady?: boolean }): SeatAskAnswer {
  const text = question.trim();
  const extra = dollarNote(text);
  const googleNote = input?.googleReady
    ? 'Google client is ready. Gmail is not connected on this page. Papers stay Missing until a pull lands.'
    : 'Gmail stays Missing until the Google client exists and an owner connects. No invented papers.';

  if (!text) {
    return {
      tab: 'missing',
      honesty: 'Missing',
      reply: `Ask about invoices, labor, menu, or what is still Missing. ${googleNote}`,
    };
  }

  const invoice = /\b(invoice|truck|sku|vendor|mozzarella|cheese)\b/i.test(text);
  const labor = /\b(labor|schedule|punch|clock|hours?)\b/i.test(text);
  const menu = /\b(menu|recipe|plate|food cost)\b/i.test(text);
  const google = /\b(gmail|google|drive|missing|connect|papers)\b/i.test(text);
  const hits = [invoice, labor, menu].filter(Boolean).length;

  if (hits > 1) {
    return {
      tab: 'missing',
      honesty: 'Missing',
      reply: `Those are separate papers. Open Invoices, Labor, or Menu. ${googleNote}${extra}`,
    };
  }

  if (invoice) {
    const prices = chatLineMentionsDollars(text)
      ? `${GOLD_MOZZARELLA.sku} on the same ${GOLD_MOZZARELLA.pack} is the disclosed sample.`
      : `Disclosed sample ${GOLD_MOZZARELLA.sku}: ${money(GOLD_MOZZARELLA.priorPrice)} to ${money(GOLD_MOZZARELLA.currentPrice)} on the same ${GOLD_MOZZARELLA.pack}.`;
    return {
      tab: 'invoices',
      honesty: 'Estimated',
      reply: `${prices} ${GOLD_MOZZARELLA.claimBoundary} Your invoices stay Missing until a file parses.${extra}`,
    };
  }

  if (labor) {
    const dollars = chatLineMentionsDollars(text) ? '' : ` Sample $${GOLD_LABOR.sampleDollars}.`;
    return {
      tab: 'labor',
      honesty: 'Estimated',
      reply: `Disclosed sample: scheduled ${GOLD_LABOR.scheduledHours.toFixed(2)} h, clocked ${GOLD_LABOR.clockedHours.toFixed(2)} h.${dollars} ${GOLD_LABOR.claimBoundary}${extra}`,
    };
  }

  if (menu) {
    const plate = chatLineMentionsDollars(text)
      ? 'Disclosed sample plate math is labeled Estimated.'
      : `Disclosed sample plate ${money(GOLD_RECIPE.plateCost)} on menu ${money(GOLD_RECIPE.menuPrice)}. Sample food cost ${pctLabel(GOLD_RECIPE.foodCostPct)}.`;
    return {
      tab: 'menu',
      honesty: 'Estimated',
      reply: `${plate} ${GOLD_RECIPE.claimBoundary}${extra}`,
    };
  }

  if (google) {
    return {
      tab: 'missing',
      honesty: 'Missing',
      reply: `${googleNote}${extra} No invented $.`,
    };
  }

  return {
    tab: 'ask',
    honesty: 'Missing',
    reply: `That did not match invoices, labor, menu, or Gmail. Still Missing.${extra} No invented $.`,
  };
}
