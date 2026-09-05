import type { PrimeCostCategory } from '../primeCostDesks/types';
import type { BenchmarkRow } from '../benchmarks2026';
import { getBenchmark } from '../benchmarks2026';

// 2026 logic pack — the reasoning layer behind the prime-cost views.
//
// This registry does not compute a single dollar. Every specialist skill
// below reads the operator's own evidence-backed numbers (via the desk it is
// attached to) and the 2026 benchmark ranges in `src/lib/benchmarks2026`, and
// proposes a flag threshold — never a verdict, never an invented number.
//
// Canonical skill files: `src/skills/*.md`. Prime-cost desk contract:
// `src/lib/primeCostDesks/terminals.ts`.

export type LogicPackSkillId =
  | 'labor-analyst'
  | 'vendor-scout'
  | 'void-tracker'
  | 'cash-closeout'
  | 'prime-cost-coach'
  | 'menu-mix';

export type LogicPackSkill = {
  skillId: LogicPackSkillId;
  path: string;
  title: string;
  summary: string;
  /** Prime-cost desks this specialist reads/annotates. Empty = board-level. */
  desks: PrimeCostCategory[];
  benchmarkIds: string[];
  gates: readonly string[];
};

export const LOGIC_PACK_2026_VERSION = '2026.1';

export const LOGIC_PACK_SKILLS: readonly LogicPackSkill[] = [
  {
    skillId: 'labor-analyst',
    path: 'src/skills/labor-analyst.md',
    title: 'Labor Analyst',
    summary: 'Reads the Labor desk. Flags labor % drift against the 2026 turnover/hiring-difficulty benchmark, never against an invented target.',
    desks: ['labor'],
    benchmarkIds: ['labor-turnover-rate', 'labor-hiring-difficulty'],
    gates: [
      'Missing labor dollars is Open, not 0%.',
      'Turnover and hiring-difficulty benchmarks explain pressure. They do not replace a store\'s own labor %.',
    ],
  },
  {
    skillId: 'vendor-scout',
    path: 'src/skills/vendor-scout.md',
    title: 'Vendor Scout',
    summary: 'Reads Food, Liquor, and Beer desks. Maintains the vendor directory and photo intake; flags POS/processing fee drag when a vendor bill looks out of the 2026 range.',
    desks: ['food', 'liquor', 'beer', 'inventory'],
    benchmarkIds: ['toast-effective-fee-load', 'toast-card-processing-rate'],
    gates: [
      'A vendor row is a directory entry, not a live-priced catalog.',
      'A photo is Estimated at best until a human confirms it. No photo is Open.',
    ],
  },
  {
    skillId: 'void-tracker',
    path: 'src/skills/void-tracker.md',
    title: 'Void Tracker',
    summary: 'Reads the Sales desk. Flags void/comp/discount rate against the 2026 comp-void-abuse benchmark. A flag is a prompt to review reason codes, never an accusation.',
    desks: ['sales'],
    benchmarkIds: ['comp-void-revenue-leak'],
    gates: [
      'A flag names a rate, not a person.',
      'Reason codes and manager approvals are read, never invented.',
    ],
  },
  {
    skillId: 'cash-closeout',
    path: 'src/skills/cash-closeout.md',
    title: 'Cash Closeout',
    summary: 'Reads the Sales desk\'s cash tender line at night close. Flags till variance against the 2026 cash-variance benchmark.',
    desks: ['sales'],
    benchmarkIds: ['cash-shrinkage-internal-share', 'cash-shrinkage-pct-of-sales'],
    gates: [
      'Variance is a number, not a verdict. Theft is never the default explanation.',
      'A missing count is Open. It is never assumed to reconcile to $0 variance.',
    ],
  },
  {
    skillId: 'prime-cost-coach',
    path: 'src/skills/prime-cost-coach.md',
    title: 'Prime Cost Coach',
    summary: 'Board-level. Synthesizes Food + Labor into prime cost %, and reads every specialist below it, but never overrides a desk\'s own Open/Verified state.',
    desks: [],
    benchmarkIds: ['prime-cost-full-service'],
    gates: [
      'Prime cost % stays Open until both Food and Labor are Verified.',
      'Coaching is a next action + an owner, never a lecture.',
    ],
  },
  {
    skillId: 'menu-mix',
    path: 'src/skills/menu-mix.md',
    title: 'Menu Mix',
    summary: 'Reads the Menu desk. Flags delivery-marketplace commission drag on 3P-channel mix items against the 2026 "dashtax" benchmark.',
    desks: ['menu'],
    benchmarkIds: ['delivery-marketplace-commission'],
    gates: [
      'Aug-style p-mix is category-only. Item-to-recipe mapping stays Open until approved.',
      'A 3P channel item\'s true margin needs the marketplace commission subtracted, never assumed at $0.',
    ],
  },
] as const;

export type ReasoningLayer = {
  skills: LogicPackSkill[];
  benchmarks: BenchmarkRow[];
};

/** The reasoning layer for one prime-cost desk category. Empty arrays are valid — a desk with no specialist yet stays Open, not invented. */
export function getReasoningLayer(category: PrimeCostCategory): ReasoningLayer {
  const skills = LOGIC_PACK_SKILLS.filter((skill) => skill.desks.includes(category));
  const benchmarks = skills
    .flatMap((skill) => skill.benchmarkIds)
    .map((id) => getBenchmark(id))
    .filter((row): row is BenchmarkRow => row != null);
  return { skills, benchmarks };
}

/** The board-level reasoning layer (skills with no single desk, e.g. Prime Cost Coach). */
export function getBoardReasoningLayer(): ReasoningLayer {
  const skills = LOGIC_PACK_SKILLS.filter((skill) => skill.desks.length === 0);
  const benchmarks = skills
    .flatMap((skill) => skill.benchmarkIds)
    .map((id) => getBenchmark(id))
    .filter((row): row is BenchmarkRow => row != null);
  return { skills, benchmarks };
}

export function getLogicPackSkill(skillId: LogicPackSkillId): LogicPackSkill | undefined {
  return LOGIC_PACK_SKILLS.find((skill) => skill.skillId === skillId);
}
