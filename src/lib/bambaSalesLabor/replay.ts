import { buildBambaSalesLaborDesk } from './desk';
import { BAMBA_AUG12_SYSTEM_CY_SALES } from './fixtureAug12Daily';
import { assertBambaMemory } from './tenant';
import { SALES_LABOR_BUSINESS_DATE } from './types';

export const REPLAY_CANARY_CY_SALES = 125273.41;
export const REPLAY_HIGHEST_VOID_STORE = 'Landmark';

export type SalesLaborReplayReceipt = {
  ok: true;
  fixture: 'aug-12-daily';
  businessDate: string;
  systemCySales: number;
  highestVoidRateStore: string;
};

export function replayAug12SalesLabor(): SalesLaborReplayReceipt {
  const desk = buildBambaSalesLaborDesk();
  const daily = desk.periods.daily;
  const cy = daily.system.cySales.value;
  const ranked = [...daily.stores].sort((a, b) => (b.voidRate ?? 0) - (a.voidRate ?? 0));
  const top = ranked[0]?.store;

  if (cy !== REPLAY_CANARY_CY_SALES || cy !== BAMBA_AUG12_SYSTEM_CY_SALES) {
    throw new Error(`REPLAY DRIFT: system CY sales ${cy} !== ${REPLAY_CANARY_CY_SALES}. Fail the build.`);
  }
  if (top !== REPLAY_HIGHEST_VOID_STORE || desk.drillDowns.voidRanking[0]?.store !== REPLAY_HIGHEST_VOID_STORE) {
    throw new Error(`REPLAY DRIFT: highest Daily void rate store is ${top}, expected ${REPLAY_HIGHEST_VOID_STORE}.`);
  }
  if (daily.system.businessDate !== SALES_LABOR_BUSINESS_DATE) {
    throw new Error(`REPLAY DRIFT: business date ${daily.system.businessDate} !== ${SALES_LABOR_BUSINESS_DATE}.`);
  }
  assertBambaMemory(desk);

  return {
    ok: true,
    fixture: 'aug-12-daily',
    businessDate: SALES_LABOR_BUSINESS_DATE,
    systemCySales: cy,
    highestVoidRateStore: top,
  };
}
