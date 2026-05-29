import Link from 'next/link';
import { SourceTag } from '@/components/SourceTag';
import type { LaborLeak } from '@/lib/laborLeak';

const usd = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'red' | 'gold' | 'green' }) {
  const v = tone === 'red' ? 'text-red-300' : tone === 'green' ? 'text-green-300' : 'text-white';
  return (
    <div className="bg-dark-700 rounded-xl p-5 border border-dark-600">
      <div className="flex items-center justify-between mb-1">
        <p className="text-dark-300 text-xs uppercase tracking-wide">{label}</p>
        <SourceTag level="verified" />
      </div>
      <p className={`text-2xl font-bold leading-tight ${v}`}>{value}</p>
      {sub ? <p className="text-dark-400 text-xs mt-1">{sub}</p> : null}
    </div>
  );
}

import { DemoChrome } from '@/components/DemoChrome';

export function LaborLeakFrame({ sample, children }: { sample?: boolean; children: React.ReactNode }) {
  return (
    <DemoChrome audience="manager" sample={sample} title="Labor Leak" tagline="Where labor dollars are bleeding — overtime drift, ghost shifts, schedule-vs-clocked gaps. One screen.">
      {children}
    </DemoChrome>
  );
}

function SampleBanner() {
  return (
    <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-4 mb-8 flex items-center justify-between gap-4">
      <div>
        <p className="text-gold-300 text-sm font-semibold mb-1">Sample data — this isn&apos;t a real restaurant.</p>
        <p className="text-dark-200 text-sm">Made-up numbers for a 5-unit demo. Wire your scheduling system (7shifts, HotSchedules, Homebase) to run this on your own shifts.</p>
      </div>
      <Link href="/operators#talk" className="shrink-0 bg-gold-500 hover:bg-gold-600 text-dark-900 font-semibold rounded-lg px-4 py-2 text-sm">
        Connect your data
      </Link>
    </div>
  );
}

export function LaborLeakBody({ data: d, sample }: { data: LaborLeak; sample?: boolean }) {
  const overBudget = d.networkLaborPct - d.budgetedLaborPct;
  const annualMiss = Math.round(d.networkNetSales * overBudget);
  return (
    <>
      {sample ? <SampleBanner /> : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Kpi
          label="Network labor %"
          value={pct(d.networkLaborPct)}
          sub={`${pct(d.budgetedLaborPct)} budgeted · ${pct(overBudget)} drift`}
          tone={overBudget > 0.02 ? 'red' : overBudget > 0 ? 'gold' : 'green'}
        />
        <Kpi label="Annualized miss" value={usd(annualMiss)} sub="if drift holds at current pace" tone={annualMiss > 0 ? 'red' : 'green'} />
        <Kpi label="Overtime $ (YTD)" value={usd(d.overtimeDollarsYr)} sub="all stores · unbudgeted" tone="gold" />
        <Kpi label="Ghost shift $ (YTD)" value={usd(d.ghostShiftDollarsYr)} sub="clocked-in, no sales recorded" tone="gold" />
      </div>

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-8">
        <p className="text-amber-300 text-sm font-semibold mb-1">This flags patterns, not verdicts.</p>
        <p className="text-dark-200 text-sm">
          A "ghost shift" is a clocked-in window with zero sales attached — sometimes it&apos;s legit (prep, dish, ops). Drift is the
          gap between scheduled and clocked hours. Read the pattern. Pull the timesheet. Then decide.
        </p>
      </div>

      <div className="mb-8">
        <h3 className="text-gold-500 text-xs uppercase tracking-wider font-semibold mb-3">Stores above budget</h3>
        <div className="bg-dark-700 rounded-xl border border-dark-600 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-dark-600 text-dark-300">
                <th className="px-4 py-2 font-medium">Store</th>
                <th className="px-4 py-2 font-medium text-right">Net sales</th>
                <th className="px-4 py-2 font-medium text-right">Labor %</th>
                <th className="px-4 py-2 font-medium text-right">OT hrs</th>
                <th className="px-4 py-2 font-medium text-right">OT $</th>
                <th className="px-4 py-2 font-medium text-right">Ghost shifts</th>
              </tr>
            </thead>
            <tbody>
              {d.stores.map((s) => {
                const drift = s.laborPct - s.budgetedPct;
                const pctBarPos = Math.min(100, Math.max(0, (s.laborPct / 0.45) * 100));
                const pctColor = drift > 0.02 ? 'bg-gradient-to-r from-red-700 to-red-400' : drift > 0 ? 'bg-gradient-to-r from-amber-700 to-amber-400' : 'bg-gradient-to-r from-green-700 to-green-400';
                return (
                  <tr key={s.name} className="border-b border-dark-600/60 last:border-0">
                    <td className="px-4 py-2 text-white">{s.name}</td>
                    <td className="px-4 py-2 text-right text-dark-200 tabular-nums">{usd(s.netSales)}</td>
                    <td className="px-4 py-2 text-right">
                      <span className="flex items-center justify-end gap-3">
                        <span className="relative inline-block h-1.5 w-20 rounded bg-white/5 overflow-hidden align-middle">
                          <span className={`absolute left-0 top-0 h-full ${pctColor}`} style={{ width: `${pctBarPos}%` }} />
                        </span>
                        <span className="tabular-nums text-white">{pct(s.laborPct)}</span>
                        {drift > 0 ? <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-700/40">+{(drift * 100).toFixed(1)}</span> : null}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-dark-200 tabular-nums">{s.overtimeHours}</td>
                    <td className="px-4 py-2 text-right text-dark-200 tabular-nums">{usd(s.overtimeDollars)}</td>
                    <td className="px-4 py-2 text-right">
                      <span className="tabular-nums text-white">{s.ghostShiftCount}</span>
                      <span className="text-dark-400 text-xs ml-1">/ {usd(s.ghostShiftDollars)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-gold-500 text-xs uppercase tracking-wider font-semibold mb-3">Top schedule-vs-clocked drift</h3>
        <div className="bg-dark-700 rounded-xl border border-dark-600 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-dark-600 text-dark-300">
                <th className="px-4 py-2 font-medium">Store</th>
                <th className="px-4 py-2 font-medium">Employee</th>
                <th className="px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2 font-medium text-right">Scheduled</th>
                <th className="px-4 py-2 font-medium text-right">Clocked</th>
                <th className="px-4 py-2 font-medium text-right">Overtime</th>
                <th className="px-4 py-2 font-medium text-right">Drift</th>
              </tr>
            </thead>
            <tbody>
              {d.offenders.map((o, i) => (
                <tr key={`${o.store}-${o.name}-${i}`} className="border-b border-dark-600/60 last:border-0">
                  <td className="px-4 py-2 text-white">{o.store}</td>
                  <td className="px-4 py-2 text-white">{o.name}</td>
                  <td className="px-4 py-2 text-dark-300 capitalize">{o.role}</td>
                  <td className="px-4 py-2 text-right text-dark-200 tabular-nums">{o.scheduled}h</td>
                  <td className="px-4 py-2 text-right text-dark-200 tabular-nums">{o.clocked}h</td>
                  <td className="px-4 py-2 text-right text-dark-200 tabular-nums">{o.overtime}h</td>
                  <td className="px-4 py-2 text-right">
                    <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-700/40 tabular-nums">+{o.drift}h</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-dark-700 border border-dark-600 rounded-xl p-5">
        <p className="text-gold-500 text-xs uppercase tracking-widest mb-2">What to do tonight</p>
        <ul className="text-dark-200 text-sm space-y-1.5 list-disc list-inside">
          <li>Pull the timesheet for the top-drift employee and ask: was the clock-in window real work?</li>
          <li>For ghost shifts: cross-check against sales by station. A station with hours but zero rings is a question, not an answer.</li>
          <li>Cap overtime hours per role per store before the week closes — the cap is the lever, not the punishment.</li>
        </ul>
      </div>
    </>
  );
}
