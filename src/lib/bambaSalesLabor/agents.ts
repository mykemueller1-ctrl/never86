import { SALES_LABOR_PERIODS, type SalesLaborAgentContract } from './types';

export const SALES_LABOR_TASK_ID = 'bamba-sales-labor-enterprise-v1' as const;
export const SALES_LABOR_AGENTS_PATH = 'config/bamba-sales-labor-agents.json';

export const BAMBA_SALES_LABOR_AGENTS: SalesLaborAgentContract = {
  taskId: SALES_LABOR_TASK_ID,
  product: 'command-center-desk',
  notANewProduct: true,
  inventThousandAgents: false,
  seats: [
    {
      seatId: 'builder-1',
      role: 'builder',
      queue: 'Typed contract, one React Command Center desk, Aug 12 Daily fixture, peer-median flags.',
      stopCondition: 'Green isolated PR with Daily/WTD/PTD desk and acceptance fixtures. No merge, deploy, or live write.',
      publishAllowed: false,
      mergeAllowed: false,
      productionWriteAllowed: false,
    },
    {
      seatId: 'qa-1',
      role: 'qa',
      queue: 'Prove canary 125273.41, Landmark highest Daily void rate, 1.5× peer-median flags, Lane C isolation.',
      stopCondition: 'Acceptance tests fail or a foreign-tenant token appears. QA cannot approve production release.',
      publishAllowed: false,
      mergeAllowed: false,
      productionWriteAllowed: false,
    },
  ],
  acceptance: {
    dailySystemCySales: 125273.41,
    highestDailyVoidRateStore: 'Landmark',
    voidFlagRule: 'peer-median-1.5x',
    periodOrder: SALES_LABOR_PERIODS,
    foreignTenantsForbidden: ['CTap', 'Community Tap', 'New American Grill', 'Grill cash'],
  },
};

export function getBambaSalesLaborAgents(): SalesLaborAgentContract {
  return BAMBA_SALES_LABOR_AGENTS;
}
