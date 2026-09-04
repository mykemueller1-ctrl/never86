// Typed Command Center sales-labor contract.
// One desk, one tenant. Not a new product and not a 1,000-agent swarm.

export const SALES_LABOR_PERIODS = ['daily', 'wtd', 'ptd'] as const;
export type SalesLaborPeriod = (typeof SALES_LABOR_PERIODS)[number];

export const SALES_LABOR_TENANT_ID = 'bamba' as const;
export type SalesLaborTenantId = typeof SALES_LABOR_TENANT_ID;

export const SALES_LABOR_BUSINESS_DATE = '2026-08-12';

/** Incomplete week stays Open. Never promote a partial week to Verified. */
export type EvidenceStatus = 'verified' | 'estimated' | 'unverified' | 'open';

export type Evidenced<T> = {
  value: T;
  evidence: EvidenceStatus;
};

export type SalesDriverCause = 'school' | 'holiday' | 'concert';
export type SalesFlagKind = 'driver' | 'prohibitor';

export type SalesLaborStoreInput = {
  store: string;
  region: string;
  cySales: number;
  pySales: number;
  fcstSales: number;
  checks: number;
  catering: number;
  comps: number;
  staffMeals: number;
  trainingMeals: number;
  voids: number;
};

export type SalesLaborStoreRow = {
  store: string;
  region: string;
  businessDate: string;
  tenantId: SalesLaborTenantId;
  cySales: Evidenced<number | null>;
  pySales: Evidenced<number | null>;
  fcstSales: Evidenced<number | null>;
  checks: Evidenced<number | null>;
  catering: Evidenced<number | null>;
  avgCheck: Evidenced<number | null>;
  comps: Evidenced<number | null>;
  staffMeals: Evidenced<number | null>;
  voids: Evidenced<number | null>;
  voidRate: number | null;
  compRate: number | null;
  voidFlagged: boolean;
  compFlagged: boolean;
};

export type SalesLaborRegionRow = {
  region: string;
  storeCount: number;
  cySales: Evidenced<number | null>;
  checks: Evidenced<number | null>;
  catering: Evidenced<number | null>;
  avgCheck: Evidenced<number | null>;
  comps: Evidenced<number | null>;
  staffMeals: Evidenced<number | null>;
  voids: Evidenced<number | null>;
  voidRate: number | null;
  voidFlagged: boolean;
};

export type SalesLaborSystemRollup = {
  tenantId: SalesLaborTenantId;
  businessDate: string;
  period: SalesLaborPeriod;
  storeCount: number;
  cySales: Evidenced<number | null>;
  pySales: Evidenced<number | null>;
  fcstSales: Evidenced<number | null>;
  checks: Evidenced<number | null>;
  catering: Evidenced<number | null>;
  avgCheck: Evidenced<number | null>;
  comps: Evidenced<number | null>;
  staffMeals: Evidenced<number | null>;
  voids: Evidenced<number | null>;
  peerMedianVoidRate: number;
  peerMedianCompRate: number;
  voidFlagRule: 'peer-median-1.5x';
};

export type SalesLaborPeriodView = {
  period: SalesLaborPeriod;
  status: EvidenceStatus;
  reason: string;
  loadedBusinessDates: string[];
  system: SalesLaborSystemRollup;
  stores: SalesLaborStoreRow[];
  regions: SalesLaborRegionRow[];
};

export type SalesCalendarFlag = {
  store: string;
  region: string;
  kind: SalesFlagKind;
  cause: SalesDriverCause;
  thisYear: boolean;
  lastYear: boolean;
  note: string;
};

export type CompServerRow = {
  station: string;
  store: string;
  comps: number;
  evidence: EvidenceStatus;
};

export type MealRow = {
  station: string;
  store: string;
  kind: 'staff' | 'training';
  amount: number;
  evidence: EvidenceStatus;
};

export type VoidRankRow = {
  store: string;
  region: string;
  voids: number;
  voidRate: number;
  flagged: boolean;
};

export type DaypartRow = {
  daypart: 'lunch' | 'afternoon' | 'dinner' | 'late';
  cySales: number;
  checks: number;
  avgCheck: number;
  evidence: EvidenceStatus;
};

export type TicketTimeRow = {
  daypart: DaypartRow['daypart'];
  medianMinutes: number;
  evidence: EvidenceStatus;
};

export type PMixRow = {
  category: string;
  cySales: number;
  mixPct: number;
  evidence: EvidenceStatus;
};

export type SalesLaborDrillDowns = {
  compsServers: CompServerRow[];
  staffMeals: MealRow[];
  trainingMeals: MealRow[];
  voidRanking: VoidRankRow[];
  daypart: DaypartRow[];
  ticketTimes: TicketTimeRow[];
  pMix: PMixRow[];
};

export type SalesLaborDesk = {
  tenantId: SalesLaborTenantId;
  tenantLabel: string;
  lane: 'C';
  isolation: string;
  businessDate: string;
  periodOrder: readonly SalesLaborPeriod[];
  periods: Record<SalesLaborPeriod, SalesLaborPeriodView>;
  calendarFlags: SalesCalendarFlag[];
  drillDowns: SalesLaborDrillDowns;
};

export type SalesLaborAgentSeat = {
  seatId: 'builder-1' | 'qa-1';
  role: 'builder' | 'qa';
  queue: string;
  stopCondition: string;
  publishAllowed: false;
  mergeAllowed: false;
  productionWriteAllowed: false;
};

export type SalesLaborAgentContract = {
  taskId: 'bamba-sales-labor-enterprise-v1';
  product: 'command-center-desk';
  notANewProduct: true;
  inventThousandAgents: false;
  seats: [SalesLaborAgentSeat, SalesLaborAgentSeat];
  acceptance: {
    dailySystemCySales: 125273.41;
    highestDailyVoidRateStore: 'Landmark';
    voidFlagRule: 'peer-median-1.5x';
    periodOrder: typeof SALES_LABOR_PERIODS;
    foreignTenantsForbidden: readonly string[];
  };
};
