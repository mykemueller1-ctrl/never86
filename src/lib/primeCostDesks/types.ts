import type { EvidenceStatus, SalesLaborTenantId } from '../bambaSalesLabor/types';

export const PRIME_COST_CATEGORIES = ['sales', 'labor', 'food', 'liquor', 'beer', 'inventory'] as const;
export type PrimeCostCategory = (typeof PRIME_COST_CATEGORIES)[number];

export const PRIME_COST_HUB_PATH = '/command-center/prime-cost';

export type PrimeCostNeed =
  | 'parsed-sales'
  | 'labor-dollars'
  | 'physical-count'
  | 'invoices'
  | 'recipes-yields'
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

export type PrimeCostDesk = {
  category: PrimeCostCategory;
  title: string;
  href: string;
  tenantId: SalesLaborTenantId;
  lane: 'C';
  businessDate: string;
  completeness: 'done' | 'open';
  gate: string;
  needs: PrimeCostNeed[];
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
  desks: PrimeCostDesk[];
};
