import type { CCException } from './commandCenter';

// The "now what" layer. Turns a governance exception (fact: a store is off its
// benchmark, with a $ figure) into a coach card an operator can act on:
//   fact -> why it matters -> WHO OWNS IT -> the ONE next action -> $ at stake.
// This is the north-star discipline: every number carries its next step.
//
// Pure + testable: exceptions in, coach cards out. No I/O.

export type CoachLevel = 'verified' | 'estimated';

export type CoachCard = {
  store: string;
  rule: string;
  owner: string; // who owns the response (from the escalation tier)
  title: string; // the name / where + the leak, in plain words
  why: string; // one line: why it matters
  action: string; // the one thing to do next
  dollarsYr: number | null; // $ at stake per year
  level: CoachLevel; // measured leak -> verified, opportunity -> estimated
  priority: number; // higher = show first
};

// Escalation tier -> the human who owns the fix.
const OWNER: Record<string, string> = {
  frontline_gm: 'Store GM',
  store_manager: 'Store Manager',
  area_director: 'Area Director',
  regional_vp: 'Regional VP',
  coo: 'COO',
  cfo: 'CFO',
  ceo: 'CEO',
};

function ownerFor(tier: string): string {
  return OWNER[tier] ?? tier.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Per-rule playbook: the plain-words title, the "why it matters", and the ONE
// action. `{store}`, `{observed}`, `{benchmark}` are filled from the exception.
type Play = { title: string; why: string; action: string };

const PLAYBOOK: Record<string, Play> = {
  void_excess: {
    title: '{store} — voids above the pack',
    why: 'Voids at {store} are running {observed}% vs {benchmark}% across your stores — a refund after the sale closes is the classic skim.',
    action: "Sit down with {store}'s GM this week, pull the void log, and put a reason code on every void. Re-check next period.",
  },
  discount_excess: {
    title: '{store} — discounts running hot',
    why: 'Discounts at {store} are {observed}% vs {benchmark}% network — margin walking out the door as comps.',
    action: 'Route every comp over a set amount through a manager at {store}, and review who’s approving. Watch it next week.',
  },
  first_party_below_network: {
    title: '{store} — too many orders on delivery apps',
    why: "Only {observed}% of {store}'s digital orders are first-party (vs {benchmark}% network) — every third-party order hands over ~20–30% and the customer.",
    action: 'Push first-party ordering at {store} — receipt QR, table tents, staff ask at the register. Aim to lift it 5 points this quarter.',
  },
  catering_under_index: {
    title: '{store} — catering under-indexing',
    why: 'Catering is {observed}% of {store}’s sales vs {benchmark}% network — group orders you’re leaving on the table.',
    action: 'Give {store} a call-back list from last quarter’s big orders and work catering leads. Track the catering share next month.',
  },
};

const SEVERITY_WEIGHT: Record<string, number> = { high: 3, medium: 2, low: 1, info: 0 };

function fill(tpl: string, e: CCException): string {
  return tpl
    .replace(/\{store\}/g, e.store)
    .replace(/\{observed\}/g, e.observed)
    .replace(/\{benchmark\}/g, e.benchmark);
}

/** Build coach cards from governance exceptions, highest priority first. */
export function buildCoachCards(exceptions: CCException[]): CoachCard[] {
  return exceptions
    .map((e) => {
      const play = PLAYBOOK[e.rule];
      const humanRule = e.rule.replace(/_/g, ' ');
      const title = play ? fill(play.title, e) : `${e.store} — ${humanRule}`;
      const why = play
        ? fill(play.why, e)
        : `${e.store}: ${humanRule} at ${e.observed}% vs ${e.benchmark}% network.`;
      const owner = ownerFor(e.tier);
      const action = play
        ? fill(play.action, e)
        : `Review this with the ${owner} this week and re-check next period.`;
      const level: CoachLevel = e.basis === 'measured_leak' ? 'verified' : 'estimated';
      // Priority: severity first, then dollars, then measured over opportunity.
      const priority =
        (SEVERITY_WEIGHT[e.severity] ?? 0) * 1_000_000 +
        (e.dollarsYr ?? 0) +
        (level === 'verified' ? 1 : 0);
      return { store: e.store, rule: e.rule, owner, title, why, action, dollarsYr: e.dollarsYr, level, priority };
    })
    .sort((a, b) => b.priority - a.priority);
}
