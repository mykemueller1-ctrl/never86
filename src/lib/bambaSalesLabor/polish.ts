import { BAMBA_STORE_ROSTER } from './roster';
import { assertBambaMemory } from './tenant';
import {
  SALES_LABOR_BUSINESS_DATE,
  type SalesLaborDesk,
  type SalesLaborDrillPath,
  type SalesLaborLineKind,
  type SalesLaborOwnerRole,
  type SalesLaborStoreRow,
  type SalesLaborSystemMiss,
} from './types';

const OWNER_FOR: Record<SalesLaborLineKind, SalesLaborOwnerRole> = {
  void: 'FOH lead',
  catering: 'Catering lead',
  comp: 'Store GM',
  'sales-vs-fcst': 'Store GM',
  'sales-vs-py': 'Area director',
};

function nextBusinessDate(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function variance(actual: number | null, baseline: number | null): number | null {
  if (actual == null || baseline == null || baseline === 0) return null;
  return (actual - baseline) / baseline;
}

function lineLabel(kind: SalesLaborLineKind, store: string): string {
  if (kind === 'void') return `${store} void line`;
  if (kind === 'catering') return `${store} catering line`;
  if (kind === 'comp') return `${store} comp line`;
  if (kind === 'sales-vs-fcst') return `${store} sales vs forecast`;
  return `${store} sales vs prior year`;
}

function toPath(miss: SalesLaborSystemMiss): SalesLaborDrillPath {
  return {
    missId: miss.id,
    crumbs: ['system', miss.store, lineLabel(miss.kind, miss.store), `${miss.owner} · due ${miss.dueDate}`],
    store: miss.store,
    lineKind: miss.kind,
    lineLabel: lineLabel(miss.kind, miss.store),
    owner: miss.owner,
    dueDate: miss.dueDate,
  };
}

function pushMiss(
  misses: SalesLaborSystemMiss[],
  row: SalesLaborStoreRow,
  kind: SalesLaborLineKind,
  headline: string,
  metricLabel: string,
  metricValue: number | null,
  dueInDays: number,
): void {
  misses.push({
    id: `${kind}-${row.store.toLowerCase().replace(/\s+/g, '-')}`,
    period: 'daily',
    kind,
    store: row.store,
    region: row.region,
    headline,
    metricLabel,
    metricValue,
    owner: OWNER_FOR[kind],
    dueDate: nextBusinessDate(SALES_LABOR_BUSINESS_DATE, dueInDays),
    evidence: row.cySales.evidence,
  });
}

export function buildSystemMisses(stores: SalesLaborStoreRow[]): SalesLaborSystemMiss[] {
  const misses: SalesLaborSystemMiss[] = [];
  for (const row of stores) {
    if (row.voidFlagged) {
      pushMiss(misses, row, 'void', `${row.store} void rate is above 1.5× this pull's peer median`, 'void rate', row.voidRate, 1);
    }
    if (row.compFlagged) {
      pushMiss(misses, row, 'comp', `${row.store} comps are above 1.5× this pull's peer median`, 'comp rate', row.compRate, 1);
    }
    const vsFcst = variance(row.cySales.value, row.fcstSales.value);
    if (vsFcst != null && vsFcst <= -0.015) {
      pushMiss(misses, row, 'sales-vs-fcst', `${row.store} CY sales missed forecast`, 'CY vs FCST', vsFcst, 2);
    }
    const vsPy = variance(row.cySales.value, row.pySales.value);
    if (vsPy != null && vsPy <= -0.03) {
      pushMiss(misses, row, 'sales-vs-py', `${row.store} CY sales missed prior year`, 'CY vs PY', vsPy, 2);
    }
    const cateringShare =
      row.cySales.value && row.cySales.value > 0 && row.catering.value != null ? row.catering.value / row.cySales.value : null;
    if (cateringShare != null && cateringShare >= 0.08 && (row.catering.value ?? 0) >= 1500) {
      pushMiss(misses, row, 'catering', `${row.store} catering share is the leak to work first`, 'catering share', cateringShare, 1);
    }
  }
  return misses.sort((a, b) => (b.metricValue ?? 0) - (a.metricValue ?? 0));
}

export function buildDrillPaths(misses: SalesLaborSystemMiss[]): SalesLaborDrillPath[] {
  return misses.map(toPath);
}

export function attachPolishViews(desk: SalesLaborDesk): SalesLaborDesk {
  const misses = buildSystemMisses(desk.periods.daily.stores);
  const polished: SalesLaborDesk = {
    ...desk,
    roster: BAMBA_STORE_ROSTER,
    misses,
    drillPaths: buildDrillPaths(misses),
  };
  assertBambaMemory(polished);
  return polished;
}

export function findDrillPath(desk: SalesLaborDesk, missId: string): SalesLaborDrillPath | undefined {
  return desk.drillPaths.find((path) => path.missId === missId);
}
