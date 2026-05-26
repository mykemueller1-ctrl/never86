import { getTacoBambaReport, type ToastReport } from '@/lib/toastReports';
import { opsDbConfigured } from '@/lib/opsDb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata = {
  title: "Taco Bamba — Live Toast Report | Never 86'd",
  description: 'Live net sales by location, pulled straight from Toast. No estimates.',
};

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);

const prettyDate = (iso: string) =>
  iso
    ? new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

function NotConnected({ error }: { error?: string }) {
  return (
    <main className="min-h-screen bg-dark-800 px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gold-500 mb-3">Taco Bamba — Live Toast Report</h1>
        <div className="bg-dark-700 border border-dark-600 rounded-xl p-6">
          <p className="text-white font-semibold mb-2">Not connected to the ops database yet.</p>
          <p className="text-dark-300 text-sm mb-4">
            This page reads live from the Supabase <code className="text-gold-300">never86</code>{' '}
            database. To switch it on, set the <code className="text-gold-300">OPS_DATABASE_URL</code>{' '}
            environment variable in Vercel to the Supabase connection string (Project Settings →
            Database → Connection string → <em>Transaction</em> pooler), then redeploy.
          </p>
          {error ? (
            <p className="text-dark-400 text-xs font-mono break-all">{error}</p>
          ) : null}
        </div>
      </div>
    </main>
  );
}

export default async function TacoBambaReportPage() {
  if (!opsDbConfigured()) {
    return <NotConnected />;
  }

  let report: ToastReport;
  try {
    report = await getTacoBambaReport();
  } catch (err: any) {
    return <NotConnected error={err?.message ?? String(err)} />;
  }

  return (
    <main className="min-h-screen bg-dark-800 px-6 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-dark-300 text-sm uppercase tracking-wider mb-1">Never 86&apos;d · Live Toast Report</p>
          <h1 className="text-4xl font-bold text-gold-500 mb-2">Taco Bamba</h1>
          <p className="text-dark-200">
            Net sales by location · {prettyDate(report.periodStart)} – {prettyDate(report.periodEnd)}
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-dark-700 rounded-xl p-5 border border-dark-600">
            <p className="text-dark-300 text-sm mb-1">Total net sales</p>
            <p className="text-2xl font-bold text-white">{usd(report.totalNetSales)}</p>
          </div>
          <div className="bg-dark-700 rounded-xl p-5 border border-dark-600">
            <p className="text-dark-300 text-sm mb-1">Locations</p>
            <p className="text-2xl font-bold text-white">{report.locationCount}</p>
          </div>
          <div className="bg-dark-700 rounded-xl p-5 border border-dark-600">
            <p className="text-dark-300 text-sm mb-1">Voids (period)</p>
            <p className="text-2xl font-bold text-white">
              {report.totalVoids != null ? usd(report.totalVoids) : '—'}
            </p>
          </div>
        </div>

        {/* Locations table */}
        <div className="bg-dark-700 rounded-xl border border-dark-600 overflow-hidden mb-8">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-dark-600 text-dark-300 text-sm">
                <th className="px-5 py-3 font-medium">#</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">Market</th>
                <th className="px-5 py-3 font-medium text-right">Net sales</th>
              </tr>
            </thead>
            <tbody>
              {report.locations.map((loc, i) => (
                <tr key={loc.name} className="border-b border-dark-600/60 last:border-0">
                  <td className="px-5 py-3 text-dark-400">{i + 1}</td>
                  <td className="px-5 py-3 text-white">{loc.name}</td>
                  <td className="px-5 py-3 text-dark-200">
                    {loc.city}, {loc.state}
                  </td>
                  <td className="px-5 py-3 text-right text-gold-300 font-semibold tabular-nums">
                    {usd(loc.netSales)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Honesty / source note */}
        <div className="bg-dark-700/50 rounded-xl border border-dark-600 p-5 mb-6">
          <p className="text-white font-semibold mb-2 text-sm">What this is — and isn&apos;t</p>
          <ul className="text-dark-300 text-sm space-y-1 list-disc list-inside">
            <li>Every number is queried live from your Toast data at the moment this page loads.</li>
            <li>Nothing here is estimated, projected, or generated by AI.</li>
            <li>
              Food / labor / prime cost % are <span className="text-dark-100">not connected yet</span> for
              these locations, so they are intentionally left out rather than guessed.
            </li>
          </ul>
        </div>

        {/* Source stamp */}
        <p className="text-dark-400 text-xs">
          Source: <code className="text-dark-300">toast_location_breakdown</code> +{' '}
          <code className="text-dark-300">toast_employee_performance</code> (never86 ops database) ·
          Last Toast data loaded {report.lastIngest ? prettyDate(report.lastIngest) : '—'} · Rendered{' '}
          {new Date(report.generatedAt).toLocaleString('en-US')}
        </p>
      </div>
    </main>
  );
}
