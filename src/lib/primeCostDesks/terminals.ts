import { SALES_LABOR_TENANT_ID } from '../bambaSalesLabor/types';
import type { PrimeCostCategory, PrimeCostDesk, PrimeCostSubAgent } from './types';

function seat(
  seatId: string,
  role: string,
  queue: string,
  knowledge: string,
  readsFrom: PrimeCostCategory[],
  writesTo: PrimeCostCategory[],
  stopCondition: string,
): PrimeCostSubAgent {
  return {
    seatId,
    role,
    queue,
    knowledge,
    readsFrom,
    writesTo,
    stopCondition,
    publishAllowed: false,
    mergeAllowed: false,
    productionWriteAllowed: false,
  };
}

export const PRIME_COST_ROUTER: PrimeCostSubAgent = seat(
  'prime-cost-router-1',
  'router',
  'Route one fact to the owning terminal. Never fork formulas.',
  'POS ≠ payout. Invoice ≠ COGS. No count → no food cost. Incomplete week stays Open.',
  ['sales', 'labor', 'food', 'menu', 'liquor', 'beer', 'inventory'],
  ['sales', 'labor', 'food', 'menu', 'liquor', 'beer', 'inventory'],
  'Stops if a terminal is asked to invent a dollar or copy another tenant.',
);

type TerminalSpec = Omit<PrimeCostDesk, 'kpis' | 'tenantId' | 'lane' | 'businessDate' | 'completeness'>;

export const PRIME_COST_TERMINALS: readonly TerminalSpec[] = [
  {
    category: 'sales',
    title: 'Sales',
    href: '/command-center/sales-labor',
    gate: 'Aug 12 Daily parse is loaded. CY sales is the locked canary.',
    mvp: 'Daily / WTD / PTD sales desk with comps, voids, catering, and peer-median flags.',
    needs: ['parsed-sales'],
    dependsOn: [],
    feeds: ['labor', 'food', 'menu', 'liquor', 'beer'],
    skill: {
      skillId: 'prime-cost-sales',
      path: 'skills/prime-cost/sales.md',
      formulas: ['avgCheck = cySales / checks', 'voidRate = voids / cySales', 'flag if rate > 1.5 × peer median'],
      gates: ['Use this pull\'s peer median, never an industry %.', 'WTD/PTD stay Open until the week is complete.'],
    },
    subAgents: [
      seat('sales-builder-1', 'builder', 'Keep the typed sales contract and canary.', 'Sales Labor Report (MP) v5 Daily.', [], ['sales'], 'Stop when Daily CY sales is not 125273.41.'),
      seat('sales-qa-1', 'qa', 'Replay Aug 12 and Landmark void rank.', 'Lane C isolation. No foreign-tenant tokens.', ['sales'], ['sales'], 'Fail the build on canary drift.'),
      seat('sales-denom-1', 'feeder', 'Publish CY sales as the shared denominator.', 'Other terminals may read sales. They may not rewrite it.', ['sales'], ['labor', 'food'], 'Stop if a downstream desk writes sales.'),
    ],
  },
  {
    category: 'labor',
    title: 'Labor',
    href: '/command-center/prime-cost/labor',
    gate: 'No Bamba labor dollars in tenant memory. Labor % stays Open.',
    mvp: 'Labor $ over the sales terminal. No schedule login. CSV-first.',
    needs: ['labor-dollars', 'parsed-sales'],
    dependsOn: ['sales'],
    feeds: ['food'],
    skill: {
      skillId: 'prime-cost-labor',
      path: 'skills/prime-cost/labor.md',
      formulas: ['laborPct = laborDollars / cySales'],
      gates: ['Missing labor dollars is Open, not 0%.', 'Do not use an industry labor target as a flag.'],
    },
    subAgents: [
      seat('labor-clock-1', 'parser', 'Parse operator-supplied time-clock CSV.', 'Clock vs schedule is Unverified until matched.', ['sales'], ['labor'], 'Stop without a labor file. Do not invent hours.'),
      seat('labor-rate-1', 'calculator', 'Compute labor % from sales terminal dollars.', 'Reads sales. Never copies a foreign-tenant wage file.', ['sales', 'labor'], ['labor'], 'Stop if sales canary is missing.'),
    ],
  },
  {
    category: 'food',
    title: 'Food',
    href: '/command-center/prime-cost/food',
    gate: 'No count → no food cost. Invoice ≠ COGS. Incomplete week stays Open.',
    mvp: 'Food-cost terminal that refuses a % until count + invoice + recipe exist.',
    needs: ['physical-count', 'invoices', 'recipes-yields', 'menu-mapping'],
    dependsOn: ['sales', 'menu', 'inventory'],
    feeds: [],
    skill: {
      skillId: 'prime-cost-food',
      path: 'skills/prime-cost/food.md',
      formulas: ['foodCostPct = foodCogs / cySales', 'foodCogs needs beginning + purchases − ending, or recipe theoretical + count variance'],
      gates: ['Invoice is not COGS.', 'No count → no food cost.', 'Manager-reported food cost is Estimated only.'],
    },
    subAgents: [
      seat('food-invoice-1', 'parser', 'Read vendor invoices into the Food bucket.', 'Daily Prime invoice buckets. Other/uncategorized stays visible.', ['inventory'], ['food'], 'Stop on an unbridged invoice total.'),
      seat('food-count-1', 'gate', 'Require a physical count before any food-cost %.', 'Missing Evidence is not $0.', ['inventory'], ['food'], 'Refuse the % when the count is missing.'),
      seat('food-recipe-1', 'mapper', 'Map menu items to recipes and yields.', 'Reads menu. Never invents yield.', ['menu'], ['food'], 'Stop on an unapproved mapping.'),
    ],
  },
  {
    category: 'menu',
    title: 'Menu',
    href: '/command-center/prime-cost/menu',
    gate: 'P-mix from Aug 12 Daily is category-only. Item-to-recipe mapping is Open.',
    mvp: 'Menu / p-mix terminal that feeds theoretical food and beverage usage.',
    needs: ['parsed-sales', 'menu-mapping', 'recipes-yields'],
    dependsOn: ['sales'],
    feeds: ['food', 'liquor', 'beer'],
    skill: {
      skillId: 'prime-cost-menu',
      path: 'skills/prime-cost/menu.md',
      formulas: ['mixPct = itemSales / cySales', 'theoreticalUsage = unitsSold × recipe × yield'],
      gates: ['Preserve raw POS labels.', 'Do not copy one store\'s mapping to another.', 'UNKNOWN/UKNOWN rolls to Food for mix, not a person.'],
    },
    subAgents: [
      seat('menu-pmix-1', 'parser', 'Read Sheet1 p-mix categories.', 'Aug 12 Daily has category mix only.', ['sales'], ['menu'], 'Stop if mix is treated as recipe usage.'),
      seat('menu-map-1', 'mapper', 'Map POS item → recipe / inventory SKU.', 'Human approves ambiguous maps.', ['menu', 'inventory'], ['menu', 'food'], 'Stop without an approved map.'),
    ],
  },
  {
    category: 'liquor',
    title: 'Liquor',
    href: '/command-center/prime-cost/liquor',
    gate: 'No pour log and no depletion count. Liquor stays Open.',
    mvp: 'Liquor terminal: pour spec vs bottle depletion. Heuristic, not theft.',
    needs: ['pour-log', 'depletion', 'physical-count', 'menu-mapping'],
    dependsOn: ['sales', 'menu', 'inventory'],
    feeds: [],
    skill: {
      skillId: 'prime-cost-liquor',
      path: 'skills/prime-cost/liquor.md',
      formulas: ['shrinkUnits = max(0, inventoryConsumed − posPoured)', 'shrinkPct = shrinkUnits / inventoryConsumed'],
      gates: ['Transfers, waste, and unit mismatch can explain shrink.', 'Never call shrink theft.'],
    },
    subAgents: [
      seat('liquor-pour-1', 'parser', 'Read POS pour / shot counts.', 'Pour spec is knowledge, not a verdict.', ['menu'], ['liquor'], 'Stop without a pour log.'),
      seat('liquor-deplete-1', 'calculator', 'Compare bottle depletion to pours.', 'Reads inventory. Missing count stays Open.', ['inventory', 'liquor'], ['liquor'], 'Stop if depletion is inferred from sales only.'),
    ],
  },
  {
    category: 'beer',
    title: 'Beer',
    href: '/command-center/prime-cost/beer',
    gate: 'No pour log and no depletion count. Beer stays Open.',
    mvp: 'Beer terminal: draft/keg depletion vs POS pours. Separate from liquor.',
    needs: ['pour-log', 'depletion', 'physical-count', 'menu-mapping'],
    dependsOn: ['sales', 'menu', 'inventory'],
    feeds: [],
    skill: {
      skillId: 'prime-cost-beer',
      path: 'skills/prime-cost/beer.md',
      formulas: ['shrinkUnits = max(0, inventoryConsumed − posPoured)', 'kegs ≠ bottles'],
      gates: ['Beer is its own terminal. Do not blend into liquor.', 'Pack/keg conversion must be verified.'],
    },
    subAgents: [
      seat('beer-pour-1', 'parser', 'Read draft and bottle POS pours.', 'Keep draft and packaged beer separate.', ['menu'], ['beer'], 'Stop without a beer pour log.'),
      seat('beer-keg-1', 'calculator', 'Compare keg depletion to pours.', 'Reads inventory. Do not invent case conversion.', ['inventory', 'beer'], ['beer'], 'Stop if keg size is missing.'),
    ],
  },
  {
    category: 'inventory',
    title: 'Inventory',
    href: '/command-center/prime-cost/inventory',
    gate: 'No count → no food cost and no beverage shrink. Count status is Open.',
    mvp: 'Count terminal that feeds food, liquor, and beer. No count, no %.',
    needs: ['physical-count', 'invoices'],
    dependsOn: [],
    feeds: ['food', 'liquor', 'beer'],
    skill: {
      skillId: 'prime-cost-inventory',
      path: 'skills/prime-cost/inventory.md',
      formulas: ['variance = counted − theoretical', 'effectiveOnHand = onHand + onOrder + transfersIn − reserved − transfersOut'],
      gates: ['A missing count is Open, not zero on-hand.', 'Never copy one store\'s par to another.'],
    },
    subAgents: [
      seat('inventory-count-1', 'parser', 'Intake a physical count.', 'Count is the receipt. POS sold is not on-hand.', [], ['inventory'], 'Stop without a dated count.'),
      seat('inventory-var-1', 'calculator', 'Variance vs menu theoretical.', 'Reads menu theoretical only after a mapping exists.', ['menu', 'inventory'], ['inventory', 'food'], 'Stop if theoretical is invented.'),
    ],
  },
];

export function assertTerminalGraph(): void {
  const ids = new Set<string>([PRIME_COST_ROUTER.seatId]);
  for (const terminal of PRIME_COST_TERMINALS) {
    if (terminal.subAgents.length === 0 || terminal.subAgents.length > 3) {
      throw new Error(`${terminal.category} must have 1–3 sector seats, not a swarm.`);
    }
    for (const agent of terminal.subAgents) {
      if (ids.has(agent.seatId)) throw new Error(`Duplicate seat ${agent.seatId}`);
      ids.add(agent.seatId);
      if (agent.publishAllowed || agent.mergeAllowed || agent.productionWriteAllowed) {
        throw new Error(`${agent.seatId} must stay draft-only.`);
      }
    }
  }
  if (ids.size - 1 > 21) throw new Error('Too many prime-cost seats.');
}

export function tenantScopedTerminal(spec: TerminalSpec, completeness: PrimeCostDesk['completeness'], businessDate: string): Omit<PrimeCostDesk, 'kpis'> {
  return {
    ...spec,
    tenantId: SALES_LABOR_TENANT_ID,
    lane: 'C',
    businessDate,
    completeness,
  };
}
