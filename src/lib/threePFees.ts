import { opsDb } from './opsDb';

export type ThreePStore = {
  name: string;
  tpRevenueYr: number;
  fees20: number;
  fees25: number;
  firstPartyPct: number | null;
  flagged: boolean;
};
export type ThreePFees = {
  lastIngest: string | null;
  networkTpRevenueYr: number;
  networkFees20: number;
  networkFees25: number;
  networkFirstPartyPct: number | null;
  storesBelowTarget: number;
  firstPartyTarget: number;
  stores: ThreePStore[];
};

const n = (v: unknown) => (v == null ? 0 : Number(v));
const FIRST_PARTY_TARGET = 50; // network goal: half of digital on owned channels

// 3P Fee Finder — what the marketplaces take off the top, by store.
// 3P revenue is Verified (Toast); the fee is Estimated (revenue × an assumed
// 20–25% take), since the real take rate lives on the DoorDash/UB statements.
// Low first-party % is the lever, not a verdict.
export async function getThreePFees(operatorId: number): Promise<ThreePFees> {
  const sql = opsDb();
  const [rows, meta] = await Promise.all([
    sql<{ name: string; tp_yr: number; f20: number; f25: number; fp: number | null }[]>`
      select l.name,
             e.tp_revenue_annualized as tp_yr,
             e.tp_fees_annualized_20pct as f20,
             e.tp_fees_annualized_25pct as f25,
             e.first_party_pct_of_digital as fp
      from v_operator_3p_economics e join operator_locations l on l.id = e.location_id
      where e.operator_id = ${operatorId}
      order by e.tp_fees_annualized_25pct desc`,
    sql<{ last_ingest: string | null }[]>`
      select max(created_at)::date::text as last_ingest from toast_dining_options where operator_id = ${operatorId}`,
  ]);

  const stores: ThreePStore[] = rows.map((r) => {
    const fp = r.fp != null ? Number(r.fp) : null;
    return {
      name: r.name,
      tpRevenueYr: n(r.tp_yr),
      fees20: n(r.f20),
      fees25: n(r.f25),
      firstPartyPct: fp,
      flagged: fp != null && fp < FIRST_PARTY_TARGET,
    };
  });

  const networkTpRevenueYr = stores.reduce((s, x) => s + x.tpRevenueYr, 0);
  const networkFees20 = stores.reduce((s, x) => s + x.fees20, 0);
  const networkFees25 = stores.reduce((s, x) => s + x.fees25, 0);
  const fpStores = stores.filter((s) => s.firstPartyPct != null);
  const networkFirstPartyPct =
    fpStores.length && networkTpRevenueYr >= 0
      ? Math.round((10 * fpStores.reduce((s, x) => s + (x.firstPartyPct ?? 0), 0)) / fpStores.length) / 10
      : null;

  return {
    lastIngest: meta[0]?.last_ingest ?? null,
    networkTpRevenueYr,
    networkFees20,
    networkFees25,
    networkFirstPartyPct,
    storesBelowTarget: stores.filter((s) => s.flagged).length,
    firstPartyTarget: FIRST_PARTY_TARGET,
    stores,
  };
}
