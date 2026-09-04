import { buildBambaSalesLaborDesk } from '../bambaSalesLabor/desk';
import { BAMBA_AUG12_SYSTEM_CY_SALES } from '../bambaSalesLabor/fixtureAug12Daily';
import { assertBambaMemory, assertBambaTenant, BAMBA_MEMORY_BOUNDARY, BAMBA_TENANT_LABEL } from '../bambaSalesLabor/tenant';
import { SALES_LABOR_BUSINESS_DATE, SALES_LABOR_TENANT_ID } from '../bambaSalesLabor/types';
import { assertTerminalGraph, PRIME_COST_ROUTER, PRIME_COST_TERMINALS, tenantScopedTerminal } from './terminals';
import { PRIME_COST_CATEGORIES, type PrimeCostBoard, type PrimeCostCategory, type PrimeCostDesk, type PrimeCostKpi } from './types';

function kpiFor(category: PrimeCostCategory, cySales: number): PrimeCostKpi[] {
  if (category === 'sales') {
    return [
      {
        id: 'cy-sales',
        label: 'CY sales',
        value: cySales,
        format: 'usd',
        evidence: 'verified',
        note: 'Sales Labor Report (MP) v5 Daily system total.',
      },
    ];
  }
  const labels: Record<Exclude<PrimeCostCategory, 'sales'>, { label: string; format: PrimeCostKpi['format'] }> = {
    labor: { label: 'Labor % of sales', format: 'pct' },
    food: { label: 'Food cost %', format: 'pct' },
    menu: { label: 'Mapped recipe coverage', format: 'pct' },
    liquor: { label: 'Liquor shrink %', format: 'pct' },
    beer: { label: 'Beer shrink %', format: 'pct' },
    inventory: { label: 'Count status', format: 'count' },
  };
  const spec = labels[category];
  return [
    {
      id: `${category}-missing`,
      label: spec.label,
      value: null,
      format: spec.format,
      evidence: 'open',
      note: 'Missing Evidence is not $0.',
    },
  ];
}

export function buildPrimeCostBoard(tenantId: string = SALES_LABOR_TENANT_ID): PrimeCostBoard {
  assertBambaTenant(tenantId);
  assertTerminalGraph();
  const salesLabor = buildBambaSalesLaborDesk(tenantId);
  const cy = salesLabor.periods.daily.system.cySales.value;
  if (cy !== BAMBA_AUG12_SYSTEM_CY_SALES) {
    throw new Error(`Prime-cost sales desk must reuse the Aug 12 canary ${BAMBA_AUG12_SYSTEM_CY_SALES}.`);
  }

  const desks: PrimeCostDesk[] = PRIME_COST_TERMINALS.map((spec) => ({
    ...tenantScopedTerminal(spec, spec.category === 'sales' ? 'done' : 'open', SALES_LABOR_BUSINESS_DATE),
    kpis: kpiFor(spec.category, cy),
  }));

  if (desks.map((desk) => desk.category).join(',') !== PRIME_COST_CATEGORIES.join(',')) {
    throw new Error('Prime-cost board must list sales, labor, food, menu, liquor, beer, inventory.');
  }

  const board: PrimeCostBoard = {
    tenantId: SALES_LABOR_TENANT_ID,
    tenantLabel: BAMBA_TENANT_LABEL,
    lane: 'C',
    isolation: BAMBA_MEMORY_BOUNDARY,
    businessDate: SALES_LABOR_BUSINESS_DATE,
    notANewProduct: true,
    inventThousandAgents: false,
    primeCostPct: {
      value: null,
      evidence: 'open',
      note: 'Prime cost needs verified food cost and labor. Both are Open.',
    },
    router: PRIME_COST_ROUTER,
    desks,
  };
  assertBambaMemory(board);
  return board;
}

export function getPrimeCostDesk(category: PrimeCostCategory, tenantId: string = SALES_LABOR_TENANT_ID): PrimeCostDesk {
  const desk = buildPrimeCostBoard(tenantId).desks.find((row) => row.category === category);
  if (!desk) throw new Error(`Unknown prime-cost desk: ${category}`);
  return desk;
}

export function isPrimeCostCategory(value: string): value is PrimeCostCategory {
  return (PRIME_COST_CATEGORIES as readonly string[]).includes(value);
}

export function listPrimeCostSubAgents(board: PrimeCostBoard = buildPrimeCostBoard()) {
  return [board.router, ...board.desks.flatMap((desk) => desk.subAgents)];
}
