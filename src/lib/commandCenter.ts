import { opsDb } from './opsDb';

export type CCException = {
  store: string;
  rule: string;
  observed: string;
  benchmark: string;
  dollarsYr: number | null;
  tier: string;
  severity: string;
  basis: string;
};
export type CCStore = {
  name: string;
  net: number;
  firstPartyPct: number | null;
  thirdParty: number;
  catering: number;
};
export type CommandCenterData = {
  operatorName: string;
  totalStores: number;
  storesLoaded: number;
  lastIngest: string | null;
  networkNet: number;
  recoverySurfaceYr: number;
  openFindings: number;
  firstPartyPct: number | null;
  threePFeesYr20: number;
  threePFeesYr25: number;
  exceptions: CCException[];
  stores: CCStore[];
};

const n = (v: unknown) => (v == null ? 0 : Number(v));

// Single read of the clean views that back every role view. Verified vs
// Estimated tagging is applied in the UI per the source-tag system.
export async function getCommandCenterData(operatorId: number, displayName?: string): Promise<CommandCenterData> {
  const sql = opsDb();
  const [ov, fp, fees, exc, stores, meta, tot] = await Promise.all([
    sql<{ operator_name: string | null; net_sales_period: number; total_recovery_surface_yr: number; open_findings: number }[]>`
      select operator_name, net_sales_period, total_recovery_surface_yr, open_findings
      from v_network_overview where operator_id = ${operatorId}`,
    sql<{ fp_pct: number | null }[]>`
      select round(100.0 * sum(first_party_net) / nullif(sum(first_party_net) + sum(third_party_net), 0), 1) as fp_pct
      from v_first_party_digital where operator_id = ${operatorId}`,
    sql<{ f20: number | null; f25: number | null }[]>`
      select round(sum(tp_fees_annualized_20pct)) as f20, round(sum(tp_fees_annualized_25pct)) as f25
      from v_operator_3p_economics where operator_id = ${operatorId}`,
    sql<{ store: string; rule: string; observed: number; benchmark: number; dollars_annualized: number | null; escalation_tier: string; severity: string; basis: string }[]>`
      select store, rule, observed, benchmark, dollars_annualized, escalation_tier, severity, basis
      from v_governance_exceptions where operator_id = ${operatorId} order by coalesce(dollars_period, 0) desc`,
    sql<{ name: string; net: number; fp: number | null; tp: number; cat: number }[]>`
      select l.name, round(v.all_channels_net) as net, v.first_party_pct_of_digital as fp,
             round(v.third_party_net) as tp, round(v.catering_net) as cat
      from v_first_party_digital v join operator_locations l on l.id = v.location_id
      where v.operator_id = ${operatorId} order by v.all_channels_net desc`,
    sql<{ last_ingest: string | null; loaded: number }[]>`
      select max(created_at)::date::text as last_ingest, count(distinct location_id) as loaded
      from toast_dining_options where operator_id = ${operatorId}`,
    sql<{ total: number }[]>`select count(*)::int as total from operator_locations where operator_id = ${operatorId}`,
  ]);

  return {
    operatorName: displayName ?? ov[0]?.operator_name ?? `Operator ${operatorId}`,
    totalStores: n(tot[0]?.total),
    storesLoaded: n(meta[0]?.loaded),
    lastIngest: meta[0]?.last_ingest ?? null,
    networkNet: n(ov[0]?.net_sales_period),
    recoverySurfaceYr: n(ov[0]?.total_recovery_surface_yr),
    openFindings: n(ov[0]?.open_findings),
    firstPartyPct: fp[0]?.fp_pct != null ? Number(fp[0].fp_pct) : null,
    threePFeesYr20: n(fees[0]?.f20),
    threePFeesYr25: n(fees[0]?.f25),
    exceptions: exc.map((e) => ({
      store: e.store,
      rule: e.rule,
      observed: String(e.observed),
      benchmark: String(e.benchmark),
      dollarsYr: e.dollars_annualized != null ? Number(e.dollars_annualized) : null,
      tier: e.escalation_tier,
      severity: e.severity,
      basis: e.basis,
    })),
    stores: stores.map((s) => ({
      name: s.name,
      net: n(s.net),
      firstPartyPct: s.fp != null ? Number(s.fp) : null,
      thirdParty: n(s.tp),
      catering: n(s.cat),
    })),
  };
}
