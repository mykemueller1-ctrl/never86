import Link from 'next/link';
import { listReportableOperators } from '@/lib/toastReports';
import { opsDbConfigured } from '@/lib/opsDb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata = {
  title: "Reports | Never 86'd",
  description: 'Operator reports.',
};

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export default async function ReportsIndex() {
  let operators: Awaited<ReturnType<typeof listReportableOperators>> = [];
  let connected = opsDbConfigured();
  if (connected) {
    try {
      operators = await listReportableOperators();
    } catch {
      connected = false;
    }
  }

  return (
    <main className="min-h-screen bg-dark-800 px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <p className="text-dark-300 text-sm uppercase tracking-wider mb-1">Never 86&apos;d</p>
        <h1 className="text-4xl font-bold text-gold-500 mb-8">Reports</h1>

        {!connected ? (
          <div className="bg-dark-700 border border-dark-600 rounded-xl p-6">
            <p className="text-white font-semibold mb-2">Your live data isn&apos;t connected yet.</p>
            <p className="text-dark-300 text-sm">If you&apos;re seeing this, contact the team and we&apos;ll bring you online.</p>
          </div>
        ) : operators.length === 0 ? (
          <p className="text-dark-300">No operators with data yet.</p>
        ) : (
          <div className="space-y-3">
            {operators.map((op) => (
              <Link
                key={op.operatorId}
                href={`/reports/o/${op.operatorId}`}
                className="block bg-dark-700 hover:border-gold-500 border border-dark-600 rounded-xl p-5 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-white font-semibold text-lg">{op.name}</p>
                    <p className="text-dark-300 text-sm">
                      {op.locations} location{op.locations === 1 ? '' : 's'} · live net sales
                    </p>
                  </div>
                  <p className="text-gold-300 font-semibold tabular-nums">{usd(op.netSales)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
