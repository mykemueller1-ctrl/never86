import Link from 'next/link';

const weeks = [
  { week: 'Aug 24–30', sales: 36827, laborPct: 31.2, foodPct: 30.5, prime: 61.7, voids: 0.6, cash: -2262 },
  { week: 'Aug 17–23', sales: 34110, laborPct: 32.8, foodPct: 31.1, prime: 63.9, voids: 0.8, cash: -410 },
  { week: 'Aug 10–16', sales: 35540, laborPct: 30.9, foodPct: 29.8, prime: 60.7, voids: 0.5, cash: 120 },
];

function money(n: number) {
  const sign = n < 0 ? '-' : '';
  return sign + Math.abs(n).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export default function PrimeCost() {
  const latest = weeks[0];
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/nag" className="text-sm text-white/50 hover:text-white">← New American Grill</Link>
          <span className="rounded-full bg-[#0066ff]/15 px-3 py-1 text-sm text-[#7db4ff]">Prime Cost Coach</span>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7db4ff]">Weekly prime cost</p>
        <h1 className="mt-3 text-4xl font-bold">This week: {latest.prime}% prime cost</h1>
        <p className="mt-3 max-w-2xl text-white/60">Target band 55–60%. You are two points hot — labor and food both drifted up.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Big label="Labor %" value={`${latest.laborPct}%`} sub="Target ≤ 30%" warn={latest.laborPct > 30} />
          <Big label="Food %" value={`${latest.foodPct}%`} sub="Target ≤ 30%" warn={latest.foodPct > 30} />
          <Big label="Cash variance" value={money(latest.cash)} sub="Expected vs actual" warn={latest.cash < 0} />
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-white/50">
              <tr>
                <th className="px-4 py-3 font-medium">Week</th>
                <th className="px-4 py-3 font-medium">Sales</th>
                <th className="px-4 py-3 font-medium">Labor</th>
                <th className="px-4 py-3 font-medium">Food</th>
                <th className="px-4 py-3 font-medium">Prime</th>
                <th className="px-4 py-3 font-medium">Voids</th>
                <th className="px-4 py-3 font-medium">Cash</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((w) => (
                <tr key={w.week} className="border-t border-white/5">
                  <td className="px-4 py-3">{w.week}</td>
                  <td className="px-4 py-3">{money(w.sales)}</td>
                  <td className={`px-4 py-3 ${w.laborPct > 30 ? 'text-red-400' : ''}`}>{w.laborPct}%</td>
                  <td className={`px-4 py-3 ${w.foodPct > 30 ? 'text-red-400' : ''}`}>{w.foodPct}%</td>
                  <td className="px-4 py-3 font-semibold">{w.prime}%</td>
                  <td className="px-4 py-3">{w.voids}%</td>
                  <td className={`px-4 py-3 ${w.cash < 0 ? 'text-red-400' : 'text-green-400'}`}>{money(w.cash)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 rounded-2xl border border-[#0066ff]/30 bg-[#0066ff]/5 p-6">
          <p className="font-semibold">Next action</p>
          <p className="mt-2 text-sm text-white/70">Audit the two longest kitchen shifts (17h and 11h) and the cash drawer variance before next Tuesday service. Both are fixable this week.</p>
        </div>
      </section>
    </main>
  );
}

function Big({ label, value, sub, warn }: { label: string; value: string; sub: string; warn?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-white/40">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${warn ? 'text-red-400' : 'text-white'}`}>{value}</p>
      <p className="mt-1 text-xs text-white/40">{sub}</p>
    </div>
  );
}
