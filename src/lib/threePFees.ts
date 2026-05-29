import { opsDb } from './opsDb';

export type ThreePStore = {
  name: string;
  tpRevenueYr: number;
  fees20: number;
  fees25: number;
  firstPartyPct: number | null;
  flagged: boolean;
};

// Per-partner contract rate card. Optional on the type — only populated when
// the operator has shared their actual contract (via Merchant Portal or
// email confirmation, as Rik did on May 8, 2026). Otherwise we fall back to
// the generic 20-25% blended estimate.
export type PartnerRateCard = {
  partner: 'DoorDash' | 'Uber Eats' | 'GrubHub';
  contractDelivery: number; // e.g. 0.10 = 10% delivery
  contractPickup?: number; // e.g. 0.06 = 6% pickup
  premiumLabel?: string; // e.g. "DashPass" or "Uber Eats Pass"
  premiumRate?: number; // e.g. 0.14 = 14% on premium-tier orders
  premiumShareEstimate?: number; // e.g. 0.30 = 30% of partner volume on premium tier
  fourWeekRevenue?: number; // operator-side 4-week revenue through this partner (for the "lever" math)
  source: 'verified' | 'estimated'; // verified if we've seen the rate card in writing
};

export type RenegotiationLever = {
  // If UE+GH were renegotiated down to the DD-precedent rate, what's the annualized save?
  precedentLabel: string; // e.g. "DoorDash 10% precedent"
  precedentRate: number; // e.g. 0.10
  annualSavingsEstimate: number;
  fourWeekSavingsEstimate: number;
  basis: string; // human-readable explanation
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
  // Optional: per-partner rate card when the operator has shared it
  partnerRates?: PartnerRateCard[];
  renegotiationLever?: RenegotiationLever;
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
