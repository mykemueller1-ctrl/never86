import { opsDb } from './opsDb';
import { analyzeStores, isEmployeeFlagged } from './voidAnalysis';

export type VoidStore = { name: string; net: number; voids: number; voidRate: number; excessYr: number; flagged: boolean };
export type VoidEmployee = { store: string; name: string; net: number; voidAmount: number; voidedItems: number; voidRate: number; flagged: boolean };
export type VoidHunter = {
  lastIngest: string | null;
  networkNet: number;
  networkVoids: number;
  networkVoidRate: number;
  medianStoreVoidRate: number;
  storesFlagged: number;
  stores: VoidStore[];
  employees: VoidEmployee[];
};

const n = (v: unknown) => (v == null ? 0 : Number(v));

// Void Hunter — voids above the network's own peer median, by store and by name.
// All measured from toast_employee_performance (Verified). Flags patterns to
// review, never verdicts — the reason review is a human step.
export async function getVoidHunter(operatorId: number): Promise<VoidHunter> {
  const sql = opsDb();
  const [storeRows, empRows, meta] = await Promise.all([
    sql<{ name: string; net: number; voids: number }[]>`
      select l.name, sum(e.net_sales) as net, sum(e.void_amount) as voids
      from toast_employee_performance e join operator_locations l on l.id = e.location_id
      where e.operator_id = ${operatorId}
        and e.period_end = (select max(period_end) from toast_employee_performance where operator_id = ${operatorId})
      group by l.name`,
    sql<{ store: string; name: string; net: number; void_amount: number; voided: number }[]>`
      select l.name as store, e.employee_name as name, e.net_sales as net,
             e.void_amount, e.voided_item_qty as voided
      from toast_employee_performance e join operator_locations l on l.id = e.location_id
      where e.operator_id = ${operatorId}
        and e.period_end = (select max(period_end) from toast_employee_performance where operator_id = ${operatorId})
        and e.void_amount > 0
      order by e.void_amount desc limit 15`,
    sql<{ last_ingest: string | null }[]>`
      select max(created_at)::date::text as last_ingest from toast_employee_performance where operator_id = ${operatorId}`,
  ]);

  const stores0 = storeRows.map((r) => {
    const net = n(r.net), voids = n(r.voids);
    return { name: r.name, net, voids, voidRate: net > 0 ? voids / net : 0 };
  });
  const { stores, networkNet, networkVoids, medianStoreVoidRate: med, storesFlagged } = analyzeStores(stores0);

  const employees: VoidEmployee[] = empRows.map((r) => {
    const net = n(r.net), va = n(r.void_amount);
    const rate = net > 0 ? va / net : 0;
    return { store: r.store, name: r.name, net, voidAmount: va, voidedItems: n(r.voided), voidRate: rate, flagged: isEmployeeFlagged(rate, va, med) };
  });

  return {
    lastIngest: meta[0]?.last_ingest ?? null,
    networkNet,
    networkVoids,
    networkVoidRate: networkNet > 0 ? networkVoids / networkNet : 0,
    medianStoreVoidRate: med,
    storesFlagged,
    stores,
    employees,
  };
}
