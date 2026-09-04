import {
  BAMBA_AUG12_CALENDAR_FLAGS,
  BAMBA_AUG12_DAILY_STORES,
  BAMBA_AUG12_DRILL_SOURCE,
  BAMBA_AUG12_SYSTEM_CY_SALES,
} from './fixtureAug12Daily';
import { cents, flagAgainstPeerMedian, peerMedian, rate, VOID_FLAG_RULE } from './flags';
import { assertBambaMemory, assertBambaTenant, BAMBA_LANE, BAMBA_MEMORY_BOUNDARY, BAMBA_TENANT_LABEL } from './tenant';
import {
  SALES_LABOR_BUSINESS_DATE,
  SALES_LABOR_PERIODS,
  SALES_LABOR_TENANT_ID,
  type DaypartRow,
  type EvidenceStatus,
  type Evidenced,
  type PMixRow,
  type SalesLaborDesk,
  type SalesLaborPeriod,
  type SalesLaborPeriodView,
  type SalesLaborRegionRow,
  type SalesLaborStoreInput,
  type SalesLaborStoreRow,
  type SalesLaborSystemRollup,
} from './types';

function evidenced<T>(value: T, evidence: EvidenceStatus): Evidenced<T> {
  return { value, evidence };
}

function avgCheck(sales: number | null, checks: number | null): number | null {
  if (sales == null || checks == null || checks <= 0) return null;
  return cents(sales / checks);
}

function sum(rows: number[]): number {
  return cents(rows.reduce((total, value) => total + value, 0));
}

function buildStoreRows(
  inputs: readonly SalesLaborStoreInput[],
  evidence: EvidenceStatus,
): SalesLaborStoreRow[] {
  const voidPeer = peerMedian(inputs.map((row) => rate(row.voids, row.cySales) ?? 0));
  const compPeer = peerMedian(inputs.map((row) => rate(row.comps, row.cySales) ?? 0));

  return inputs.map((row) => {
    const voidRate = rate(row.voids, row.cySales);
    const compRate = rate(row.comps, row.cySales);
    const cy = evidence === 'open' ? null : row.cySales;
    const checks = evidence === 'open' ? null : row.checks;
    return {
      store: row.store,
      region: row.region,
      businessDate: SALES_LABOR_BUSINESS_DATE,
      tenantId: SALES_LABOR_TENANT_ID,
      cySales: evidenced(cy, evidence),
      pySales: evidenced(evidence === 'open' ? null : row.pySales, evidence),
      fcstSales: evidenced(evidence === 'open' ? null : row.fcstSales, evidence),
      checks: evidenced(checks, evidence),
      catering: evidenced(evidence === 'open' ? null : row.catering, evidence),
      avgCheck: evidenced(avgCheck(cy, checks), evidence),
      comps: evidenced(evidence === 'open' ? null : row.comps, evidence),
      staffMeals: evidenced(evidence === 'open' ? null : row.staffMeals, evidence),
      voids: evidenced(evidence === 'open' ? null : row.voids, evidence),
      voidRate: evidence === 'open' ? null : voidRate,
      compRate: evidence === 'open' ? null : compRate,
      voidFlagged: evidence === 'open' ? false : flagAgainstPeerMedian(voidRate ?? 0, voidPeer),
      compFlagged: evidence === 'open' ? false : flagAgainstPeerMedian(compRate ?? 0, compPeer),
    };
  });
}

function buildRegions(stores: SalesLaborStoreRow[], evidence: EvidenceStatus): SalesLaborRegionRow[] {
  const groups = new Map<string, SalesLaborStoreRow[]>();
  for (const store of stores) {
    const list = groups.get(store.region) ?? [];
    list.push(store);
    groups.set(store.region, list);
  }

  return [...groups.entries()]
    .map(([region, rows]) => {
      const cy = evidence === 'open' ? null : sum(rows.map((row) => row.cySales.value ?? 0));
      const checks = evidence === 'open' ? null : sum(rows.map((row) => row.checks.value ?? 0));
      const voids = evidence === 'open' ? null : sum(rows.map((row) => row.voids.value ?? 0));
      const voidRate = cy && voids != null ? rate(voids, cy) : null;
      return {
        region,
        storeCount: rows.length,
        cySales: evidenced(cy, evidence),
        checks: evidenced(checks, evidence),
        catering: evidenced(evidence === 'open' ? null : sum(rows.map((row) => row.catering.value ?? 0)), evidence),
        avgCheck: evidenced(avgCheck(cy, checks), evidence),
        comps: evidenced(evidence === 'open' ? null : sum(rows.map((row) => row.comps.value ?? 0)), evidence),
        staffMeals: evidenced(evidence === 'open' ? null : sum(rows.map((row) => row.staffMeals.value ?? 0)), evidence),
        voids: evidenced(voids, evidence),
        voidRate,
        voidFlagged: rows.some((row) => row.voidFlagged),
      };
    })
    .sort((a, b) => a.region.localeCompare(b.region));
}

function buildSystem(
  period: SalesLaborPeriod,
  stores: SalesLaborStoreRow[],
  inputs: readonly SalesLaborStoreInput[],
  evidence: EvidenceStatus,
): SalesLaborSystemRollup {
  const voidPeer = peerMedian(inputs.map((row) => rate(row.voids, row.cySales) ?? 0));
  const compPeer = peerMedian(inputs.map((row) => rate(row.comps, row.cySales) ?? 0));
  const cy = evidence === 'open' ? null : sum(inputs.map((row) => row.cySales));
  const checks = evidence === 'open' ? null : sum(inputs.map((row) => row.checks));
  return {
    tenantId: SALES_LABOR_TENANT_ID,
    businessDate: SALES_LABOR_BUSINESS_DATE,
    period,
    storeCount: stores.length,
    cySales: evidenced(cy, evidence),
    pySales: evidenced(evidence === 'open' ? null : sum(inputs.map((row) => row.pySales)), evidence),
    fcstSales: evidenced(evidence === 'open' ? null : sum(inputs.map((row) => row.fcstSales)), evidence),
    checks: evidenced(checks, evidence),
    catering: evidenced(evidence === 'open' ? null : sum(inputs.map((row) => row.catering)), evidence),
    avgCheck: evidenced(avgCheck(cy, checks), evidence),
    comps: evidenced(evidence === 'open' ? null : sum(inputs.map((row) => row.comps)), evidence),
    staffMeals: evidenced(evidence === 'open' ? null : sum(inputs.map((row) => row.staffMeals)), evidence),
    voids: evidenced(evidence === 'open' ? null : sum(inputs.map((row) => row.voids)), evidence),
    peerMedianVoidRate: voidPeer,
    peerMedianCompRate: compPeer,
    voidFlagRule: VOID_FLAG_RULE,
  };
}

function buildPeriod(period: SalesLaborPeriod, inputs: readonly SalesLaborStoreInput[]): SalesLaborPeriodView {
  const evidence: EvidenceStatus = period === 'daily' ? 'verified' : 'open';
  const stores = buildStoreRows(inputs, evidence);
  const reason =
    period === 'daily'
      ? 'Aug 12 2026 Daily totals parsed from the Bamba Sales Labor Report (MP) v5 demo.'
      : 'Incomplete week stays Open. Only 2026-08-12 is loaded in Bamba tenant memory.';
  return {
    period,
    status: evidence,
    reason,
    loadedBusinessDates: [SALES_LABOR_BUSINESS_DATE],
    system: buildSystem(period, stores, inputs, evidence),
    stores,
    regions: buildRegions(stores, evidence),
  };
}

function buildDrillDowns(inputs: readonly SalesLaborStoreInput[]) {
  const voidPeer = peerMedian(inputs.map((row) => rate(row.voids, row.cySales) ?? 0));
  const voidRanking = [...inputs]
    .map((row) => {
      const voidRate = rate(row.voids, row.cySales) ?? 0;
      return {
        store: row.store,
        region: row.region,
        voids: row.voids,
        voidRate,
        flagged: flagAgainstPeerMedian(voidRate, voidPeer),
      };
    })
    .sort((a, b) => b.voidRate - a.voidRate);

  const daypart: DaypartRow[] = BAMBA_AUG12_DRILL_SOURCE.daypart.map((row) => ({
    ...row,
    avgCheck: avgCheck(row.cySales, row.checks) ?? 0,
    evidence: 'verified',
  }));

  const pMixTotal = sum(BAMBA_AUG12_DRILL_SOURCE.pMix.map((row) => row.cySales));
  const pMix: PMixRow[] = BAMBA_AUG12_DRILL_SOURCE.pMix.map((row) => ({
    ...row,
    mixPct: pMixTotal > 0 ? row.cySales / pMixTotal : 0,
    evidence: 'verified',
  }));

  return {
    compsServers: BAMBA_AUG12_DRILL_SOURCE.compsServers.map((row) => ({ ...row, evidence: 'verified' as const })),
    staffMeals: BAMBA_AUG12_DRILL_SOURCE.staffMeals.map((row) => ({ ...row, evidence: 'verified' as const })),
    trainingMeals: BAMBA_AUG12_DRILL_SOURCE.trainingMeals.map((row) => ({ ...row, evidence: 'verified' as const })),
    voidRanking,
    daypart,
    ticketTimes: BAMBA_AUG12_DRILL_SOURCE.ticketTimes.map((row) => ({ ...row, evidence: 'verified' as const })),
    pMix,
  };
}

export function buildBambaSalesLaborDesk(tenantId: string = SALES_LABOR_TENANT_ID): SalesLaborDesk {
  assertBambaTenant(tenantId);
  const inputs = BAMBA_AUG12_DAILY_STORES;
  assertBambaMemory({ tenantId, inputs, flags: BAMBA_AUG12_CALENDAR_FLAGS, drill: BAMBA_AUG12_DRILL_SOURCE });

  const daily = buildPeriod('daily', inputs);
  if (daily.system.cySales.value !== BAMBA_AUG12_SYSTEM_CY_SALES) {
    throw new Error(
      `Daily system CY sales ${daily.system.cySales.value} does not reproduce the parsed canary ${BAMBA_AUG12_SYSTEM_CY_SALES}.`,
    );
  }

  const desk: SalesLaborDesk = {
    tenantId: SALES_LABOR_TENANT_ID,
    tenantLabel: BAMBA_TENANT_LABEL,
    lane: BAMBA_LANE,
    isolation: BAMBA_MEMORY_BOUNDARY,
    businessDate: SALES_LABOR_BUSINESS_DATE,
    periodOrder: SALES_LABOR_PERIODS,
    periods: {
      daily,
      wtd: buildPeriod('wtd', inputs),
      ptd: buildPeriod('ptd', inputs),
    },
    calendarFlags: [...BAMBA_AUG12_CALENDAR_FLAGS],
    drillDowns: buildDrillDowns(inputs),
  };
  assertBambaMemory(desk);
  return desk;
}

export function listPeriodOrder(desk: SalesLaborDesk): SalesLaborPeriod[] {
  return [...desk.periodOrder];
}
