import { STAFF_ROLE_DAY_POLICIES } from './staffRoleDayPack';

/**
 * Closed Ask pack for CTap Worker Home.
 * Answers only from waitress/server training (quiz), dress SOP, menu-special
 * extracts, and the pour spec already on the public desk. No invented dollars.
 */
export const STAFF_WORKER_ASK_PACK_ID = 'staff-worker-ask-v1';
export const STAFF_WORKER_ASK_STATUS = 'drafted' as const;

export type StaffAskSource = 'waitress_quiz' | 'dress_sop' | 'menu_specials' | 'pour_spec';

export type StaffAskHit = {
  id: string;
  source: StaffAskSource;
  title: string;
  prompts: readonly string[];
  answer: string;
  moneyKind: 'none';
};

export type StaffAskResult =
  | {
      ok: true;
      packId: typeof STAFF_WORKER_ASK_PACK_ID;
      source: StaffAskSource;
      title: string;
      answer: string;
      moneyKind: 'none';
      inventedDollars: false;
    }
  | {
      ok: false;
      packId: typeof STAFF_WORKER_ASK_PACK_ID;
      cannotAnswer: true;
      reason: string;
      needed: string;
      inventedDollars: false;
    };

const POUR_RULES = STAFF_ROLE_DAY_POLICIES.find((policy) => policy.id === 'pour-spec')?.rules ?? [];

export const STAFF_WORKER_ASK_HITS: readonly StaffAskHit[] = [
  {
    id: 'community-special',
    source: 'menu_specials',
    title: 'Community Special',
    prompts: ['community special', 'specialty pizza', 'menu special'],
    moneyKind: 'none',
    answer: [
      'Community Special is a posted specialty pizza on the house menu.',
      'Ring the posted POS button. Do not invent toppings or a price on this desk.',
      'Posted size-tier prices in the menu extract and the POS seed do not agree, so this Ask box does not print a dollar.',
    ].join(' '),
  },
  {
    id: 'weekly-food-specials',
    source: 'waitress_quiz',
    title: 'Weekly food specials (waitress quiz)',
    prompts: ['weekly special', 'wing special', 'fish fry', 'medium pizza', 'breakfast menu'],
    moneyKind: 'none',
    answer: [
      'Waitress / bartender Day 2: go through weekly food specials — how to ring in wing specials, fish fry night, and any medium pizza.',
      'Go over the breakfast menu and how to ring breakfast items.',
      'This desk does not invent a specials dollar.',
    ].join(' '),
  },
  {
    id: 'dress-sop',
    source: 'dress_sop',
    title: 'What can I wear',
    prompts: ['what can i wear', 'dress code', 'uniform', 'ctap shirt', 'hat', 'headphones', 'jeans'],
    moneyKind: 'none',
    answer: [
      'Employee dress SOP (effective November 6): sweatpants, basketball shorts, and jeans with holes are not permitted on shift.',
      'Wear a CTap shirt. If a hat is worn, it faces forward. Headphones are not permitted on shift.',
      'Waitress Day 1 attire: Community Shirt, beer shirts, or game-day apparel. No holes in jeans. Hair pulled back.',
    ].join(' '),
  },
  {
    id: 'pour-spec',
    source: 'pour_spec',
    title: 'Pour spec',
    prompts: ['pour spec', 'pilsner', 'shot', 'wine pour', 'rocks', 'mixed drink'],
    moneyKind: 'none',
    answer: POUR_RULES.join(' '),
  },
  {
    id: 'waitress-day-1',
    source: 'waitress_quiz',
    title: 'Waitress / bartender Day 1',
    prompts: ['day 1', 'waitress quiz', 'server training', 'split a tab', 'request-off book'],
    moneyKind: 'none',
    answer: [
      'Day 1: attire as above, then the whole menu — popular food, sides with entrees.',
      'Tour: back-storage (pop, condiments, coffee, napkins), cleaning supplies in the beer storage room, kids cups/lids/straws behind the bar, walk-in beer cooler, old and new parmesans.',
      'POS: split a tab, second half on pizzas, special instructions for kitchen, split food items, upsell liquor and food.',
      'Show the request-off book and how the schedule works (which side of the restaurant).',
    ].join(' '),
  },
  {
    id: 'waitress-day-2',
    source: 'waitress_quiz',
    title: 'Waitress / bartender Day 2',
    prompts: ['day 2', 'approach a table', 'side work', 'pdq'],
    moneyKind: 'none',
    answer: [
      'Day 2: approach a table, take the order, and ask follow-ups (meat temperature, side choices).',
      'Enter the order on POS — practice orders. Follow a trainer to tables.',
      'Side work rotation so nothing goes bad. Daily tasks: tables, napkin holders, ice, pop machine, salt/pepper, marry ketchups/mustards, fill BBQ sauces, clean menus.',
      'Retrieve from cold/dry storage. Roll silverware. Full close-out, including bartender tip-out and closing duties.',
    ].join(' '),
  },
  {
    id: 'waitress-day-3',
    source: 'waitress_quiz',
    title: 'Waitress / bartender Day 3 quiz',
    prompts: ['day 3', '80 percent', 'written test', 'closing checklist'],
    moneyKind: 'none',
    answer: [
      'Day 3: take tables solo. Be comfortable with split tickets, split pizzas, and special instructions.',
      'Do your own checkout. Every closing-checklist item is crossed off before checkout with the bartender.',
      'Written test: 80% or higher to pass training. The trainee stays the entire shift.',
    ].join(' '),
  },
];

export const STAFF_WORKER_ASK_PROMPTS = [
  'Community Special',
  'What can I wear?',
  'Pour spec',
] as const;

const DOLLAR_INTENT = /\$|how much|price|cost|dollar|paycheck|wage|paid\b|bonus/i;
const OUT_OF_SCOPE = /\b(drawer|counting|cash count|payroll|pin|password)\b/i;

function normalizeAsk(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s.%]/g, ' ').replace(/\s+/g, ' ').trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasWholePhrase(hay: string, phrase: string): boolean {
  return new RegExp(`(?:^|\\s)${escapeRegExp(phrase)}(?:\\s|$)`).test(hay);
}

function scoreHit(query: string, hit: StaffAskHit): number {
  const hay = normalizeAsk(`${hit.title} ${hit.prompts.join(' ')} ${hit.answer}`);
  let score = 0;
  for (const prompt of hit.prompts) {
    if (hasWholePhrase(query, prompt)) score += 8;
  }
  for (const token of query.split(' ').filter((part) => part.length > 3)) {
    if (hasWholePhrase(hay, token)) score += 1;
  }
  return score;
}

export function answerStaffWorkerAsk(question: string): StaffAskResult {
  const raw = question.trim();
  const query = normalizeAsk(raw);
  if (!query) {
    return {
      ok: false,
      packId: STAFF_WORKER_ASK_PACK_ID,
      cannotAnswer: true,
      reason: 'Ask is empty.',
      needed: 'A question from the waitress quiz, dress SOP, Community Special, or pour spec.',
      inventedDollars: false,
    };
  }

  if (OUT_OF_SCOPE.test(raw) || OUT_OF_SCOPE.test(query)) {
    return {
      ok: false,
      packId: STAFF_WORKER_ASK_PACK_ID,
      cannotAnswer: true,
      reason: 'I don\'t know from the waitress quiz, dress SOP, or menu-special extracts on this desk.',
      needed: 'An operator-approved source for that question. This desk does not invent dollars, counting, or recipes.',
      inventedDollars: false,
    };
  }

  if (DOLLAR_INTENT.test(raw) || DOLLAR_INTENT.test(query)) {
    return {
      ok: false,
      packId: STAFF_WORKER_ASK_PACK_ID,
      cannotAnswer: true,
      reason: 'This Ask box does not invent dollars. Posted prices in the menu extract and POS seed do not agree.',
      needed: 'Operator-approved current posted price, still in-app, never guessed here.',
      inventedDollars: false,
    };
  }

  let best: { hit: StaffAskHit; score: number } | null = null;
  for (const hit of STAFF_WORKER_ASK_HITS) {
    const score = scoreHit(query, hit);
    if (!best || score > best.score) best = { hit, score };
  }

  if (!best || best.score < 8) {
    return {
      ok: false,
      packId: STAFF_WORKER_ASK_PACK_ID,
      cannotAnswer: true,
      reason: 'I don\'t know from the waitress quiz, dress SOP, or menu-special extracts on this desk.',
      needed: 'An operator-approved source for that question. This desk does not invent dollars or recipes.',
      inventedDollars: false,
    };
  }

  return {
    ok: true,
    packId: STAFF_WORKER_ASK_PACK_ID,
    source: best.hit.source,
    title: best.hit.title,
    answer: best.hit.answer,
    moneyKind: 'none',
    inventedDollars: false,
  };
}

const PRIVATE_HITS: readonly RegExp[] = [
  /\bkarlee\b/i,
  /\bsturtz\b/i,
  /\bashley\b/i,
  /\bholding\b/i,
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /\b(pin|password|ssn|social security)\b/i,
  /\$\s?\d{2,4}\s*\/\s*week/i,
  /\bfacebook\b/i,
];

export function findStaffWorkerAskPrivacyHits(value: unknown): string[] {
  const text = JSON.stringify(value);
  return PRIVATE_HITS.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
}
