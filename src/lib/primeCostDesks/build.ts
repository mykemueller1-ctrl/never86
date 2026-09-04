import { buildBambaSalesLaborDesk } from '../bambaSalesLabor/desk';
import { BAMBA_AUG12_SYSTEM_CY_SALES } from '../bambaSalesLabor/fixtureAug12Daily';
import { assertBambaMemory, assertBambaTenant, BAMBA_MEMORY_BOUNDARY, BAMBA_TENANT_LABEL } from '../bambaSalesLabor/tenant';
import { SALES_LABOR_BUSINESS_DATE, SALES_LABOR_TENANT_ID } from '../bambaSalesLabor/types';
import { PRIME_COST_CATEGORIES, PRIME_COST_HUB_PATH, type PrimeCostBoard, type PrimeCostCategory, type PrimeCostDesk } from './types';

const OPEN_COUNT = 'No count → no food cost. Invoice ≠ COGS. Incomplete week stays Open.';
const OPEN_POUR = 'No pour log and no depletion count. Liquor and beer stay Open.';
const OPEN_LABOR = 'No Bamba labor dollars in tenant memory. Labor % stays Open.';

function hrefFor(category: PrimeCostCategory): string {
  return `${PRIME_COST_HUB_PATH}/${category}`;
}

function salesDesk(cySales: number): PrimeCostDesk {
  return {
    category: 'sales',
    title: 'Sales',
    href: '/command-center/sales-labor',
    tenantId: SALES_LABOR_TENANT_ID,
    lane: 'C',
    businessDate: SALES_LABOR_BUSINESS_DATE,
    completeness: 'done',
    gate: 'Aug 12 Daily parse is loaded. CY sales is the locked canary.',
    needs: ['parsed-sales'],
    kpis: [
      {
        id: 'cy-sales',
        label: 'CY sales',
        value: cySales,
        format: 'usd',
        evidence: 'verified',
        note: 'Sales Labor Report (MP) v5 Daily system total.',
      },
    ],
  };
}

function openDesk(
  category: Exclude<PrimeCostCategory, 'sales'>,
  title: string,
  gate: string,
  needs: PrimeCostDesk['needs'],
  kpiLabel: string,
): PrimeCostDesk {
  return {
    category,
    title,
    href: hrefFor(category),
    tenantId: SALES_LABOR_TENANT_ID,
    lane: 'C',
    businessDate: SALES_LABOR_BUSINESS_DATE,
    completeness: 'open',
    gate,
    needs,
    kpis: [
      {
        id: `${category}-missing`,
        label: kpiLabel,
        value: null,
        format: category === 'inventory' ? 'count' : 'pct',
        evidence: 'open',
        note: gate,
      },
    ],
  };
}

export function buildPrimeCostBoard(tenantId: string = SALES_LABOR_TENANT_ID): PrimeCostBoard {
  assertBambaTenant(tenantId);
  const salesLabor = buildBambaSalesLaborDesk(tenantId);
  const cy = salesLabor.periods.daily.system.cySales.value;
  if (cy !== BAMBA_AUG12_SYSTEM_CY_SALES) {
    throw new Error(`Prime-cost sales desk must reuse the Aug 12 canary ${BAMBA_AUG12_SYSTEM_CY_SALES}.`);
  }

  const desks: PrimeCostDesk[] = [
    salesDesk(cy),
    openDesk('labor', 'Labor', OPEN_LABOR, ['labor-dollars', 'parsed-sales'], 'Labor % of sales'),
    openDesk('food', 'Food', OPEN_COUNT, ['physical-count', 'invoices', 'recipes-yields'], 'Food cost %'),
    openDesk('liquor', 'Liquor', OPEN_POUR, ['pour-log', 'depletion', 'physical-count'], 'Liquor shrink %'),
    openDesk('beer', 'Beer', OPEN_POUR, ['pour-log', 'depletion', 'physical-count'], 'Beer shrink %'),
    openDesk('inventory', 'Inventory', OPEN_COUNT, ['physical-count', 'invoices'], 'Count status'),
  ];

  if (desks.map((desk) => desk.category).join(',') !== PRIME_COST_CATEGORIES.join(',')) {
    throw new Error('Prime-cost board must list sales, labor, food, liquor, beer, inventory in that order.');
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
