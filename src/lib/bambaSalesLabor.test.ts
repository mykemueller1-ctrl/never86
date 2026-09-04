import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import sitemap from '../app/sitemap';
import { metadata as salesLaborMetadata } from '../app/command-center/sales-labor/page';
import { getBambaSalesLaborAgents, SALES_LABOR_AGENTS_PATH, SALES_LABOR_TASK_ID } from './bambaSalesLabor/agents';
import { buildBambaSalesLaborDesk, listPeriodOrder } from './bambaSalesLabor/desk';
import { BAMBA_AUG12_SYSTEM_CY_SALES } from './bambaSalesLabor/fixtureAug12Daily';
import { flagAgainstPeerMedian, PEER_MEDIAN_MULTIPLIER, peerMedian } from './bambaSalesLabor/flags';
import { assertBambaTenant, findForeignTenantLeak, FOREIGN_TENANT_PATTERN } from './bambaSalesLabor/tenant';
import { SALES_LABOR_BUSINESS_DATE, SALES_LABOR_PERIODS, SALES_LABOR_TENANT_ID } from './bambaSalesLabor/types';

const ROOT = path.resolve(__dirname, '../..');

describe('bamba sales-labor contract', () => {
  const desk = buildBambaSalesLaborDesk();
  const daily = desk.periods.daily;

  it('names the required Daily fields with evidence status', () => {
    const row = daily.stores[0];
    expect(row.store).toBeTruthy();
    expect(row.region).toBeTruthy();
    expect(row.businessDate).toBe(SALES_LABOR_BUSINESS_DATE);
    expect(row.cySales.evidence).toBe('verified');
    expect(row.pySales.evidence).toBe('verified');
    expect(row.fcstSales.evidence).toBe('verified');
    expect(row.checks.evidence).toBe('verified');
    expect(row.catering.evidence).toBe('verified');
    expect(row.avgCheck.evidence).toBe('verified');
    expect(row.comps.evidence).toBe('verified');
    expect(row.staffMeals.evidence).toBe('verified');
    expect(row.voids.evidence).toBe('verified');
    expect(daily.system.cySales.evidence).toBe('verified');
    expect(daily.system.voids.evidence).toBe('verified');
  });

  it('reproduces system CY sales 125273.41 on Aug 12 Daily', () => {
    expect(BAMBA_AUG12_SYSTEM_CY_SALES).toBe(125273.41);
    expect(daily.system.cySales.value).toBe(125273.41);
    expect(daily.system.businessDate).toBe('2026-08-12');
    expect(daily.system.period).toBe('daily');
    const storeSum = daily.stores.reduce((total, row) => total + (row.cySales.value ?? 0), 0);
    expect(Number(storeSum.toFixed(2))).toBe(125273.41);
  });

  it('ranks Landmark void rate highest on Aug 12 Daily', () => {
    const ranked = [...daily.stores].sort((a, b) => (b.voidRate ?? 0) - (a.voidRate ?? 0));
    expect(ranked[0]?.store).toBe('Landmark');
    expect(desk.drillDowns.voidRanking[0]?.store).toBe('Landmark');
    expect(ranked[0]?.voidRate).toBeGreaterThan(ranked[1]?.voidRate ?? 0);
  });

  it('shows Daily then WTD then PTD without mixing tenants', () => {
    expect(listPeriodOrder(desk)).toEqual(['daily', 'wtd', 'ptd']);
    expect(desk.periodOrder).toEqual(SALES_LABOR_PERIODS);
    expect(desk.periods.wtd.status).toBe('open');
    expect(desk.periods.ptd.status).toBe('open');
    expect(desk.periods.wtd.system.cySales.value).toBeNull();
    expect(desk.periods.ptd.system.cySales.value).toBeNull();
    for (const period of SALES_LABOR_PERIODS) {
      const view = desk.periods[period];
      expect(view.system.tenantId).toBe(SALES_LABOR_TENANT_ID);
      expect(view.stores.every((row) => row.tenantId === SALES_LABOR_TENANT_ID)).toBe(true);
      expect(view.stores.map((row) => row.store)).toEqual(daily.stores.map((row) => row.store));
    }
  });

  it('keeps CTap and New American Grill numbers out of Bamba fixtures', () => {
    const serialized = JSON.stringify(desk);
    expect(serialized).not.toMatch(FOREIGN_TENANT_PATTERN);
    expect(findForeignTenantLeak(serialized)).toBeNull();
    expect(serialized.toLowerCase()).not.toContain('ctap');
    expect(serialized.toLowerCase()).not.toContain('community tap');
    expect(serialized.toLowerCase()).not.toContain('new american grill');
    expect(serialized.toLowerCase()).not.toContain('grill cash');
  });

  it('refuses a foreign tenant at the Lane C gate', () => {
    expect(() => buildBambaSalesLaborDesk('ctap')).toThrow(/Lane C isolation/);
    expect(() => assertBambaTenant('grill')).toThrow(/Bamba memory only/);
  });

  it('opens a one-click drill from system miss to store to line to owner and due date', () => {
    const landmarkVoid = desk.misses.find((miss) => miss.store === 'Landmark' && miss.kind === 'void');
    const path = desk.drillPaths.find((row) => row.missId === landmarkVoid?.id);
    expect(desk.roster).toHaveLength(16);
    expect(desk.misses.length).toBeGreaterThan(0);
    expect(landmarkVoid?.owner).toBe('FOH lead');
    expect(landmarkVoid?.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(path?.crumbs).toEqual([
      'system',
      'Landmark',
      'Landmark void line',
      `${landmarkVoid?.owner} · due ${landmarkVoid?.dueDate}`,
    ]);
    expect(desk.misses[0]?.store).toBe('Landmark');
    expect(desk.misses[0]?.kind).toBe('void');
    expect(desk.memory.provider).toBe('zep-graphiti');
    expect(desk.memory.mcp).toBe('agentmemory');
    expect(desk.completeness).toBe('done');
  });
});

describe('peer-median void and comp flags', () => {
  it('uses 1.5× the peer median, not an industry 1.5% benchmark', () => {
    const rates = [0.01, 0.012, 0.016];
    const med = peerMedian(rates);
    expect(med).toBe(0.012);
    expect(PEER_MEDIAN_MULTIPLIER).toBe(1.5);
    expect(flagAgainstPeerMedian(0.016, med)).toBe(false);
    expect(flagAgainstPeerMedian(0.019, med)).toBe(true);
    expect(buildBambaSalesLaborDesk().periods.daily.system.voidFlagRule).toBe('peer-median-1.5x');
  });

  it('flags Landmark voids against this pull\'s own median', () => {
    const daily = buildBambaSalesLaborDesk().periods.daily;
    const landmark = daily.stores.find((row) => row.store === 'Landmark');
    expect(landmark?.voidFlagged).toBe(true);
    expect(landmark?.voidRate).toBeGreaterThan(1.5 * daily.system.peerMedianVoidRate);
    const unflagged = daily.stores.filter((row) => !row.voidFlagged);
    expect(unflagged.length).toBeGreaterThan(0);
    for (const row of unflagged) {
      expect(row.voidRate ?? 0).toBeLessThanOrEqual(1.5 * daily.system.peerMedianVoidRate);
    }
  });
});

describe('builder and QA agent contract', () => {
  it('allows exactly one builder seat and one QA seat', () => {
    const pack = getBambaSalesLaborAgents();
    expect(pack.taskId).toBe(SALES_LABOR_TASK_ID);
    expect(pack.notANewProduct).toBe(true);
    expect(pack.inventThousandAgents).toBe(false);
    expect(pack.seats).toHaveLength(2);
    expect(pack.seats.map((seat) => seat.seatId)).toEqual(['builder-1', 'qa-1']);
    expect(pack.seats.every((seat) => seat.publishAllowed === false)).toBe(true);
    expect(pack.seats.every((seat) => seat.mergeAllowed === false)).toBe(true);
    expect(pack.acceptance.dailySystemCySales).toBe(125273.41);
    expect(pack.acceptance.highestDailyVoidRateStore).toBe('Landmark');
    expect(pack.acceptance.voidFlagRule).toBe('peer-median-1.5x');

    const written = JSON.parse(readFileSync(path.join(ROOT, SALES_LABOR_AGENTS_PATH), 'utf8')) as typeof pack;
    expect(written.taskId).toBe(SALES_LABOR_TASK_ID);
    expect(written.seats).toHaveLength(2);
    expect(pack.polishTaskId).toBe('bamba-ui-polish-swarm-v1');
    expect(pack.jobs).toHaveLength(12);
    expect(pack.stores).toHaveLength(16);
    expect(pack.fanOut).toEqual({ jobs: 12, stores: 16 });
    expect(written.jobs).toHaveLength(12);
    expect(written.stores).toHaveLength(16);
  });

  it('keeps the Command Center desk noindex and out of the sitemap', async () => {
    expect(salesLaborMetadata.robots).toMatchObject({ index: false, follow: false });
    const entries = await sitemap();
    expect(entries.some((entry) => String(entry.url).includes('/command-center/sales-labor'))).toBe(false);
  });
});
