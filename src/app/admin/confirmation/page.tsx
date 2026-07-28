import { getVoidHunter } from '@/lib/voidHunter';
import { opsDb, opsDbConfigured } from '@/lib/opsDb';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const usd = (n: number | null) =>
  n == null ? '—' : '$' + Math.round(n).toLocaleString();
const pct = (n: number | null, digits = 2) =>
  n == null ? '—' : (n * 100).toFixed(digits) + '%';

type CtapDay = {
  business_date: string;
  day_of_week: string | null;
  net_sales: number | null;
  food_sales: number | null;
  beer_sales: number | null;
  liquor_sales: number | null;
  labor_cost: number | null;
  labor_pct: number | null;
  food_pct: number | null;
  discounts: number | null;
  payouts: number | null;
  total_orders: number | null;
  avg_check: number | null;
};

async function getCtapDays(): Promise<CtapDay[]> {
  if (!opsDbConfigured()) return [];
  const sql = opsDb();
  try {
    return await sql<CtapDay[]>`
      SELECT
        business_date::text AS business_date,
        day_of_week,
        net_sales::float8 AS net_sales,
        food_sales::float8 AS food_sales,
        beer_sales::float8 AS beer_sales,
        liquor_sales::float8 AS liquor_sales,
        labor_cost::float8 AS labor_cost,
        labor_pct::float8 AS labor_pct,
        food_pct::float8 AS food_pct,
        discounts::float8 AS discounts,
        payouts::float8 AS payouts,
        total_orders,
        avg_check::float8 AS avg_check
      FROM ctap_daily_sales
      ORDER BY business_date DESC
      LIMIT 30
    `;
  } catch {
    return [];
  }
}

export default async function ConfirmationPage() {
  // Run both confirmations in parallel.
  const [bambaResult, ctapDays] = await Promise.all([
    getVoidHunter(3).catch((e) => ({ error: e instanceof Error ? e.message : String(e) })),
    getCtapDays(),
  ]);
  const runAt = new Date().toISOString();

  const bambaOk = bambaResult && !('error' in bambaResult);
  const ctapTotalNet = ctapDays.reduce((s, d) => s + (d.net_sales || 0), 0);
  const ctapTotalOrders = ctapDays.reduce((s, d) => s + (d.total_orders || 0), 0);
  const ctapAvgFoodPct = (() => {
    const xs = ctapDays.map((d) => d.food_pct).filter((x): x is number => x != null);
    return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;
  })();
  const ctapAvgLaborPct = (() => {
    const xs = ctapDays.map((d) => d.labor_pct).filter((x): x is number => x != null);
    return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;
  })();

  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-start gap-4">
            <span className="compass-mark">N</span>
            <span>
              <p className="font-serif text-[24px] leading-none text-white">
                Never 86&apos;d <span className="italic text-white/70">· confirmation runs</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Admin · live agents against design-partner data · ran {runAt}</p>
            </span>
          </div>
          <nav className="flex items-center gap-2 text-[13px]">
            <Link href="/admin/never86" className="compass-pill"><span className="avatar">A</span><span>Admin home</span></Link>
            <Link href="/admin/confirmation" className="btn-primary" style={{ background: '#0066ff' }}>↻ Re-run</Link>
          </nav>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-6 pt-12 pb-8">
        <p className="compass-eyebrow mb-6">— Operator 1 · Network</p>
        <h1 className="compass-display text-4xl md:text-6xl mb-3">
          Bamba · <em>Void Hunter live run</em>
        </h1>
        <p className="compass-body mb-8 text-[15px]">
          Source: <span className="font-mono text-white">toast_employee_performance</span> · latest period_end loaded.
        </p>

        {!bambaOk ? (
          <div className="compass-card" style={{ borderColor: '#ff453a' }}>
            <p className="compass-card-label" style={{ color: '#ff453a' }}>— Could not run</p>
            <p className="font-serif text-xl text-white mt-3">{'error' in (bambaResult as object) ? (bambaResult as { error: string }).error : 'Unknown failure'}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
              <div className="compass-kpi">
                <p className="compass-kpi-label">Last ingest</p>
                <p className="compass-kpi-val">{bambaResult.lastIngest ?? '—'}</p>
              </div>
              <div className="compass-kpi">
                <p className="compass-kpi-label">Stores</p>
                <p className="compass-kpi-val">{bambaResult.stores.length}</p>
              </div>
              <div className="compass-kpi">
                <p className="compass-kpi-label">Network net</p>
                <p className="compass-kpi-val">{usd(bambaResult.networkNet)}</p>
              </div>
              <div className="compass-kpi">
                <p className="compass-kpi-label">Network voids</p>
                <p className="compass-kpi-val">{usd(bambaResult.networkVoids)}</p>
              </div>
              <div className="compass-kpi">
                <p className="compass-kpi-label">Peer-median rate</p>
                <p className="compass-kpi-val">{pct(bambaResult.medianStoreVoidRate)}</p>
              </div>
            </div>
            <p className="compass-eyebrow mb-3">— Stores · sorted by void rate</p>
            <div className="compass-card overflow-x-auto" style={{ padding: 0 }}>
              <table className="data-table w-full">
                <thead><tr>
                  <th className="!text-left">Store</th>
                  <th>Net</th>
                  <th>Voids</th>
                  <th>Rate</th>
                  <th>Excess vs peer / yr</th>
                  <th>Flagged</th>
                </tr></thead>
                <tbody>
                  {bambaResult.stores.map((s) => (
                    <tr key={s.name} style={{ color: '#d2d2d7' }}>
                      <td className="!text-left text-white font-medium">{s.name}</td>
                      <td className="font-mono tabular-nums">{usd(s.net)}</td>
                      <td className="font-mono tabular-nums">{usd(s.voids)}</td>
                      <td className="font-mono tabular-nums">{pct(s.voidRate)}</td>
                      <td className="font-mono tabular-nums">{s.excessYr > 0 ? usd(s.excessYr) : '—'}</td>
                      <td>{s.flagged ? <span className="badge badge-unverified">Above band</span> : <span style={{ color: '#86868b' }}>—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {bambaResult.employees.length > 0 && (
              <>
                <p className="compass-eyebrow mt-10 mb-3">— Top 15 names · sorted by void $</p>
                <div className="compass-card overflow-x-auto" style={{ padding: 0 }}>
                  <table className="data-table w-full">
                    <thead><tr>
                      <th className="!text-left">Name</th>
                      <th className="!text-left">Store</th>
                      <th>Net</th>
                      <th>Void $</th>
                      <th>Items voided</th>
                      <th>Void rate</th>
                    </tr></thead>
                    <tbody>
                      {bambaResult.employees.map((e, i) => (
                        <tr key={`${e.store}-${e.name}-${i}`} style={{ color: '#d2d2d7' }}>
                          <td className="!text-left text-white font-medium">{e.name}{e.flagged ? <span className="badge badge-unverified ml-2">Review</span> : null}</td>
                          <td className="!text-left">{e.store}</td>
                          <td className="font-mono tabular-nums">{usd(e.net)}</td>
                          <td className="font-mono tabular-nums">{usd(e.voidAmount)}</td>
                          <td className="font-mono tabular-nums">{e.voidedItems}</td>
                          <td className="font-mono tabular-nums">{pct(e.voidRate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </section>

      <section className="border-t border-[#1f1f1f] max-w-7xl mx-auto px-6 pt-16 pb-20">
        <p className="compass-eyebrow mb-6">— Operator 2 · Single-unit</p>
        <h1 className="compass-display text-4xl md:text-6xl mb-3">
          CTAP · <em>daily-sales summary</em>
        </h1>
        <p className="compass-body mb-8 text-[15px]">
          Source: <span className="font-mono text-white">ctap_daily_sales</span> · last {ctapDays.length} business days.
        </p>

        {ctapDays.length === 0 ? (
          <div className="compass-card">
            <p className="compass-body">No CTAP daily-sales rows in the ops DB right now. (We have employee-level data only for Operator 1 today.)</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
              <div className="compass-kpi">
                <p className="compass-kpi-label">Days loaded</p>
                <p className="compass-kpi-val">{ctapDays.length}</p>
              </div>
              <div className="compass-kpi">
                <p className="compass-kpi-label">Total net</p>
                <p className="compass-kpi-val">{usd(ctapTotalNet)}</p>
              </div>
              <div className="compass-kpi">
                <p className="compass-kpi-label">Avg food %</p>
                <p className="compass-kpi-val">{pct(ctapAvgFoodPct ? ctapAvgFoodPct / 100 : null)}</p>
              </div>
              <div className="compass-kpi">
                <p className="compass-kpi-label">Avg labor %</p>
                <p className="compass-kpi-val">{pct(ctapAvgLaborPct ? ctapAvgLaborPct / 100 : null)}</p>
              </div>
            </div>
            <p className="compass-eyebrow mb-3">— Daily ladder ({ctapTotalOrders.toLocaleString()} orders)</p>
            <div className="compass-card overflow-x-auto" style={{ padding: 0 }}>
              <table className="data-table w-full">
                <thead><tr>
                  <th className="!text-left">Date</th>
                  <th className="!text-left">DOW</th>
                  <th>Net</th>
                  <th>Food</th>
                  <th>Beer</th>
                  <th>Liquor</th>
                  <th>Labor $</th>
                  <th>Food %</th>
                  <th>Labor %</th>
                  <th>Orders</th>
                  <th>Avg check</th>
                </tr></thead>
                <tbody>
                  {ctapDays.map((d) => (
                    <tr key={d.business_date} style={{ color: '#d2d2d7' }}>
                      <td className="!text-left text-white font-medium">{d.business_date}</td>
                      <td className="!text-left">{d.day_of_week ?? '—'}</td>
                      <td className="font-mono tabular-nums">{usd(d.net_sales)}</td>
                      <td className="font-mono tabular-nums">{usd(d.food_sales)}</td>
                      <td className="font-mono tabular-nums">{usd(d.beer_sales)}</td>
                      <td className="font-mono tabular-nums">{usd(d.liquor_sales)}</td>
                      <td className="font-mono tabular-nums">{usd(d.labor_cost)}</td>
                      <td className="font-mono tabular-nums">{pct(d.food_pct ? d.food_pct / 100 : null)}</td>
                      <td className="font-mono tabular-nums">{pct(d.labor_pct ? d.labor_pct / 100 : null)}</td>
                      <td className="font-mono tabular-nums">{d.total_orders ?? '—'}</td>
                      <td className="font-mono tabular-nums">{usd(d.avg_check)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <footer className="border-t border-[#1f1f1f] py-10 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[#6e6e73] text-[12px]">
          <span>Admin · confirmation runs · never indexed · never linked from public</span>
          <Link href="/admin/never86" className="hover:text-white transition-colors">Back to admin</Link>
        </div>
      </footer>
    </main>
  );
}
