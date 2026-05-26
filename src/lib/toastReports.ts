import { opsDb } from './opsDb';

export type LocationSales = {
  name: string;
  city: string;
  state: string;
  netSales: number;
};

export type ToastReport = {
  periodStart: string;
  periodEnd: string;
  lastIngest: string | null;
  locationCount: number;
  totalNetSales: number;
  totalVoids: number | null;
  voidsPeriodEnd: string | null;
  locations: LocationSales[];
  generatedAt: string;
};

// Every figure below is computed by SQL directly from the live Toast tables.
// Nothing is estimated, inferred, or generated — if a number is not in the
// database, it does not appear here.
export async function getTacoBambaReport(): Promise<ToastReport> {
  const sql = opsDb();

  const periodRows = await sql<{ period_end: string }[]>`
    select max(period_end)::text as period_end from toast_location_breakdown`;
  const periodEnd = periodRows[0]?.period_end;

  const locationRows = await sql<
    { name: string; city: string; state: string; net_sales: number; period_start: string }[]
  >`
    select l.name,
           l.city,
           l.state,
           round(sum(t.net_sales))::float8 as net_sales,
           min(t.period_start)::text as period_start
    from toast_location_breakdown t
    join operator_locations l on l.id = t.location_id
    where t.period_end = ${periodEnd}
    group by l.name, l.city, l.state
    order by net_sales desc`;

  const ingestRows = await sql<{ last_ingest: string | null }[]>`
    select max(created_at)::date::text as last_ingest from toast_location_breakdown`;

  const voidRows = await sql<{ total_voids: number | null; void_period_end: string | null }[]>`
    with ep as (select max(period_end) as pe from toast_employee_performance)
    select round(sum(e.void_amount))::float8 as total_voids,
           (select pe from ep)::text as void_period_end
    from toast_employee_performance e
    join operator_locations l on l.id = e.location_id
    where e.period_end = (select pe from ep)`;

  const locations: LocationSales[] = locationRows.map((r) => ({
    name: r.name,
    city: r.city,
    state: r.state,
    netSales: Number(r.net_sales),
  }));

  return {
    periodStart: locationRows[0]?.period_start ?? '',
    periodEnd: periodEnd ?? '',
    lastIngest: ingestRows[0]?.last_ingest ?? null,
    locationCount: locations.length,
    totalNetSales: locations.reduce((sum, l) => sum + l.netSales, 0),
    totalVoids: voidRows[0]?.total_voids != null ? Number(voidRows[0].total_voids) : null,
    voidsPeriodEnd: voidRows[0]?.void_period_end ?? null,
    locations,
    generatedAt: new Date().toISOString(),
  };
}
