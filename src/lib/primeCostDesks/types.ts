import type { EvidenceStatus, SalesLaborTenantId } from '../bambaSalesLabor/types';
import type { ReasoningLayer } from '../logicPack2026/skillRegistry';

export const PRIME_COST_CATEGORIES = ['sales', 'labor', 'food', 'menu', 'liquor', 'beer', 'inventory'] as const;
export type PrimeCostCategory = (typeof PRIME_COST_CATEGORIES)[number];

export const PRIME_COST_HUB_PATH = '/command-center/prime-cost';
export const PRIME_COST_MAX_SUB_AGENTS_PER_TERMINAL = 3;
export const PRIME_COST_MAX_SUB_AGENTS = 21;

export type PrimeCostNeed =
  | 'parsed-sales'
  | 'labor-dollars'
  | 'physical-count'
  | 'invoices'
  | 'recipes-yields'
  | 'menu-mapping'
  | 'pour-log'
  | 'depletion';

export type PrimeCostKpi = {
  id: string;
  label: string;
  value: number | null;
  format: 'usd' | 'pct' | 'count';
  evidence: EvidenceStatus;
  note: string;
};

export type PrimeCostSubAgent = {
  seatId: string;
  role: string;
  queue: string;
  knowledge: string;
  readsFrom: PrimeCostCategory[];
  writesTo: PrimeCostCategory[];
  stopCondition: string;
  publishAllowed: false;
  mergeAllowed: false;
  productionWriteAllowed: false;
};

export type PrimeCostSkill = {
  skillId: string;
  path: string;
  formulas: readonly string[];
  gates: readonly string[];
};

export type PrimeCostDesk = {
  category: PrimeCostCategory;
  title: string;
  href: string;
  tenantId: SalesLaborTenantId;
  lane: 'C';
  businessDate: string;
  completeness: 'done' | 'open';
  gate: string;
  mvp: string;
  needs: PrimeCostNeed[];
  dependsOn: PrimeCostCategory[];
  feeds: PrimeCostCategory[];
  skill: PrimeCostSkill;
  subAgents: PrimeCostSubAgent[];
  kpis: PrimeCostKpi[];
};

export type PrimeCostBoard = {
  tenantId: SalesLaborTenantId;
  tenantLabel: string;
  lane: 'C';
  isolation: string;
  businessDate: string;
  notANewProduct: true;
  inventThousandAgents: false;
  primeCostPct: { value: number | null; evidence: EvidenceStatus; note: string };
  router: PrimeCostSubAgent;
  desks: PrimeCostDesk[];
};
