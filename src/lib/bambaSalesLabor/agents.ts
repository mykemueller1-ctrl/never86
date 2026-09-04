import { listBambaStoreNames } from './roster';
import { BAMBA_SWARM_JOB_IDS, SALES_LABOR_PERIODS, type BambaSwarmJobSpec, type SalesLaborAgentContract } from './types';

export const SALES_LABOR_TASK_ID = 'bamba-sales-labor-enterprise-v1' as const;
export const BAMBA_POLISH_TASK_ID = 'bamba-ui-polish-swarm-v1' as const;
export const SALES_LABOR_AGENTS_PATH = 'config/bamba-sales-labor-agents.json';

const JOB_LABEL: Record<(typeof BAMBA_SWARM_JOB_IDS)[number], string> = {
  ingest: 'Ingest the Aug 12 Daily parse into Lane C memory.',
  hygiene: 'Hygiene pass — refuse foreign-tenant tokens before rollup.',
  'sales-vs-py-fcst': 'Sales versus prior year and forecast.',
  'traffic-avg-check': 'Traffic, checks, and average check.',
  'catering-leak': 'Catering leak with owner and due date.',
  'void-hunter': 'Void hunter against this pull peer median.',
  'comp-staff-meal': 'Comp and staff-meal stations.',
  'ticket-time': 'Ticket times by daypart.',
  pmix: 'Product mix from Sheet1.',
  labor: 'Labor slot for the same 16 stores.',
  'coach-card': 'Coach card — one action. Human sends.',
  'qa-retest': 'QA retest of the Aug 12 canary.',
};

export const BAMBA_SWARM_JOBS: BambaSwarmJobSpec[] = BAMBA_SWARM_JOB_IDS.map((jobId) => ({
  jobId,
  label: JOB_LABEL[jobId],
  fansTo: '16-stores',
  stopCondition: 'Killed or failed jobs leave the desk incomplete, never done.',
}));

export const BAMBA_SALES_LABOR_AGENTS: SalesLaborAgentContract = {
  taskId: SALES_LABOR_TASK_ID,
  polishTaskId: BAMBA_POLISH_TASK_ID,
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
  jobs: BAMBA_SWARM_JOBS,
  stores: listBambaStoreNames(),
  fanOut: { jobs: 12, stores: 16 },
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
