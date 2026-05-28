import { opsDb } from './opsDb';

export type VoidFindingBucket =
  | 'network_rollup'
  | 'location_voids_measured'
  | 'top_employee_offenders'
  | 'data_gap_note';

export type VoidFinding = {
  id: number;
  bucket: VoidFindingBucket;
  location: string | null;
  dollarAmount: number | null;
  count: number | null;
  topOffender: string | null;
  topItem: string | null;
  topHour: string | null;
  periodStart: string;
  periodEnd: string;
  analysisDate: string;
};

export type VoidFindings = {
  network: VoidFinding | null;
  byLocation: VoidFinding[];
  topOffenders: VoidFinding | null;
  dataGaps: VoidFinding[];
  periodStart: string | null;
  periodEnd: string | null;
  analysisDate: string | null;
  totalFindings: number;
};

const n = (v: unknown) => (v == null ? null : Number(v));

// Void Hunter findings — the 19 measured rows from the analysis layer. Every
// figure on the dashboard maps to a row id in void_hunter_findings, so the
// source tag is queryable: any number you see can be traced to the row that
// produced it. Flags patterns, never verdicts.
export async function getVoidFindings(operatorId: number): Promise<VoidFindings> {
  const sql = opsDb();
  const rows = await sql<
    {
      id: number;
      bucket: VoidFindingBucket;
      location: string | null;
      dollar_amount: string | null;
      count: number | null;
      top_offender: string | null;
      top_item: string | null;
      top_hour: string | null;
      period_start: string;
      period_end: string;
      analysis_date: string;
    }[]
  >`
    select f.id, f.bucket,
           l.name as location,
           f.dollar_amount, f.count, f.top_offender, f.top_item, f.top_hour,
           f.period_start::text as period_start,
           f.period_end::text as period_end,
           f.analysis_date::text as analysis_date
    from void_hunter_findings f
    left join operator_locations l on l.id = f.location_id
    where f.operator_id = ${operatorId}
    order by f.bucket, f.dollar_amount desc nulls last`;

  const findings: VoidFinding[] = rows.map((r) => ({
    id: r.id,
    bucket: r.bucket,
    location: r.location,
    dollarAmount: n(r.dollar_amount),
    count: r.count,
    topOffender: r.top_offender,
    topItem: r.top_item,
    topHour: r.top_hour,
    periodStart: r.period_start,
    periodEnd: r.period_end,
    analysisDate: r.analysis_date,
  }));

  return {
    network: findings.find((f) => f.bucket === 'network_rollup') ?? null,
    byLocation: findings
      .filter((f) => f.bucket === 'location_voids_measured')
      .sort((a, b) => (b.dollarAmount ?? 0) - (a.dollarAmount ?? 0)),
    topOffenders: findings.find((f) => f.bucket === 'top_employee_offenders') ?? null,
    dataGaps: findings.filter((f) => f.bucket === 'data_gap_note'),
    periodStart: findings[0]?.periodStart ?? null,
    periodEnd: findings[0]?.periodEnd ?? null,
    analysisDate: findings[0]?.analysisDate ?? null,
    totalFindings: findings.length,
  };
}
