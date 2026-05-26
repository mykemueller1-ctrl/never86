import { opsDb } from './opsDb';

export type LocationSales = {
  name: string;
  city: string;
  state: string;
  netSales: number;
};

export type ToastReport = {
  operatorId: number;
  operatorName: string;
  periodStart: string;
  periodEnd: string;
  lastIngest: string | null;
  locationCount: number;
  totalNetSales: number;
  totalVoids: number | null;
  totalDiscounts: number | null;
  totalGuests: number | null;
  locations: LocationSales[];
  generatedAt: string;
};

export type ReportableOperator = {
  operatorId: number;
  name: string;
  locations: number;
  netSales: number;
};

// Operators that have live Toast data — drives the /reports index. Adding a new
// customer is purely a data operation: load their Toast export and they appear.
export async function listReportableOperators(): Promise<ReportableOperator[]> {
  const sql = opsDb();
  const rows = await sql<
    { operator_id: number; name: string; locations: number; net_sales: number }[]
  >`
    select t.operator_id,
           coalesce(u.restaurant_name, u.name, 'Operator ' || t.operator_id) as name,
           count(distinct t.location_id) as locations,
           round(sum(t.net_sales))::float8 as net_sales
    from toast_location_breakdown t
    left join operator_users u on u.id = t.operator_id
    group by t.operator_id, u.restaurant_name, u.name
    order by net_sales desc`;

  return rows.map((r) => ({
    operatorId: r.operator_id,
    name: r.name,
    locations: Number(r.locations),
    netSales: Number(r.net_sales),
  }));
}

// Every figure below is computed by SQL directly from the live Toast tables,
// scoped to a single operator. Nothing is estimated, inferred, or generated —
// if a number is not in the database, it does not appear here.
export async function getOperatorReport(
  operatorId: number,
  displayNameOverride?: string
): Promise<ToastReport> {
  const sql = opsDb();

  const periodRows = await sql<{ period_end: string }[]>`
    select max(period_end)::text as period_end
    from toast_location_breakdown
    where operator_id = ${operatorId}`;
  const periodEnd = periodRows[0]?.period_end;

  const nameRows = await sql<{ name: string | null }[]>`
    select coalesce(restaurant_name, name) as name
    from operator_users where id = ${operatorId}`;

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
    where t.operator_id = ${operatorId} and t.period_end = ${periodEnd}
    group by l.name, l.city, l.state
    order by net_sales desc`;

  const ingestRows = await sql<{ last_ingest: string | null }[]>`
    select max(created_at)::date::text as last_ingest
    from toast_location_breakdown where operator_id = ${operatorId}`;

  const aggRows = await sql<
    { total_voids: number | null; total_discounts: number | null; total_guests: number | null }[]
  >`
    with ep as (
      select max(period_end) as pe from toast_employee_performance where operator_id = ${operatorId}
    )
    select round(sum(void_amount))::float8 as total_voids,
           round(sum(discount_amount))::float8 as total_discounts,
           sum(guest_count)::float8 as total_guests
    from toast_employee_performance
    where operator_id = ${operatorId} and period_end = (select pe from ep)`;

  const locations: LocationSales[] = locationRows.map((r) => ({
    name: r.name,
    city: r.city,
    state: r.state,
    netSales: Number(r.net_sales),
  }));

  const num = (v: number | null | undefined) => (v != null ? Number(v) : null);

  return {
    operatorId,
    operatorName: displayNameOverride ?? nameRows[0]?.name ?? `Operator ${operatorId}`,
    periodStart: locationRows[0]?.period_start ?? '',
    periodEnd: periodEnd ?? '',
    lastIngest: ingestRows[0]?.last_ingest ?? null,
    locationCount: locations.length,
    totalNetSales: locations.reduce((sum, l) => sum + l.netSales, 0),
    totalVoids: num(aggRows[0]?.total_voids),
    totalDiscounts: num(aggRows[0]?.total_discounts),
    totalGuests: num(aggRows[0]?.total_guests),
    locations,
    generatedAt: new Date().toISOString(),
  };
}
