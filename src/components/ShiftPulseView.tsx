import Link from 'next/link';
import type { ShiftPulse } from '@/lib/shiftPulse';

const usd = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
const pct = (v: number) => `${(v * 100).toFixed(2)}%`;

function Kpi({ label, value, sub, tone, bar }: { label: string; value: string; sub?: string; tone?: 'red' | 'gold' | 'green'; bar?: number }) {
  const v = tone === 'red' ? 'text-red-300' : tone === 'green' ? 'text-green-300' : tone === 'gold' ? 'text-gold-300' : 'text-white';
  return (
    <div className="bg-dark-700 rounded-xl p-5 border border-dark-600">
      <p className="text-dark-300 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold leading-tight ${v}`}>{value}</p>
      {bar != null ? (
        <div className="mt-2 h-1.5 w-full rounded bg-white/5 overflow-hidden">
          <span className={`block h-full ${tone === 'red' ? 'bg-gradient-to-r from-red-700 to-red-400' : tone === 'gold' ? 'bg-gradient-to-r from-amber-700 to-amber-400' : 'bg-gradient-to-r from-green-700 to-green-400'}`} style={{ width: `${Math.min(100, Math.max(0, bar))}%` }} />
        </div>
      ) : null}
      {sub ? <p className="text-dark-400 text-xs mt-1.5">{sub}</p> : null}
    </div>
  );
}

import { DemoChrome } from '@/components/DemoChrome';

export function ShiftPulseFrame({ sample, children }: { sample?: boolean; children: React.ReactNode }) {
  return (
    <DemoChrome audience="frontline" sample={sample} title="Shift Pulse" tagline="Tonight's shift in one screen — your covers, your goal, your streak. The standup that helps.">
      {children}
    </DemoChrome>
  );
}

function SampleBanner() {
  return (
    <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-4 mb-8 flex items-center justify-between gap-4">
      <div>
        <p className="text-gold-300 text-sm font-semibold mb-1">Sample shift — this isn&apos;t a real restaurant.</p>
        <p className="text-dark-200 text-sm">Made-up Friday-night numbers for a 5-unit demo. Wire your POS + scheduling to run this live, station-by-station.</p>
      </div>
      <Link href="/operators#talk" className="shrink-0 bg-gold-500 hover:bg-gold-600 text-dark-900 font-semibold rounded-lg px-4 py-2 text-sm">
        Connect your data
      </Link>
    </div>
  );
}

export function ShiftPulseBody({ data: d, sample }: { data: ShiftPulse; sample?: boolean }) {
  const coverPct = d.actualCovers / d.forecastCovers;
  const netPct = d.actualNet / d.forecastNet;
  const goalPct = d.shiftGoalActual / d.shiftGoalTarget;
  return (
    <>
      {sample ? <SampleBanner /> : null}

      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-gold-400 text-[10px] uppercase tracking-widest">Tonight</p>
          <p className="text-2xl font-bold text-white">{d.store} · {d.shift}</p>
          <p className="text-dark-300 text-sm">Started {d.startedAt}</p>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-semibold rounded-full px-2.5 py-1 bg-green-500/10 text-green-300 border border-green-700/40">LIVE</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Kpi
          label="Covers vs forecast"
          value={`${d.actualCovers} / ${d.forecastCovers}`}
          sub={coverPct >= 0.95 ? 'on pace' : coverPct >= 0.8 ? 'soft — push apps & shareable plates' : 'low — drive the next 30'}
          tone={coverPct >= 0.95 ? 'green' : coverPct >= 0.8 ? 'gold' : 'red'}
          bar={coverPct * 100}
        />
        <Kpi
          label="Net vs forecast"
          value={`${usd(d.actualNet)} / ${usd(d.forecastNet)}`}
          sub={netPct >= 0.95 ? 'on pace' : netPct >= 0.8 ? 'soft — push high-ticket' : 'behind — recover with the next wave'}
          tone={netPct >= 0.95 ? 'green' : netPct >= 0.8 ? 'gold' : 'red'}
          bar={netPct * 100}
        />
        <Kpi
          label={d.shiftGoalLabel}
          value={`${usd(d.shiftGoalActual)} / ${usd(d.shiftGoalTarget)}`}
          sub={goalPct >= 1 ? 'goal hit — keep stacking' : `${pct(goalPct)} to the goal`}
          tone={goalPct >= 1 ? 'green' : goalPct >= 0.7 ? 'gold' : 'red'}
          bar={goalPct * 100}
        />
      </div>

      <div className="mb-8">
        <h3 className="text-gold-500 text-xs uppercase tracking-wider font-semibold mb-3">Stations · void rate vs your station median</h3>
        <div className="bg-dark-700 rounded-xl border border-dark-600 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-dark-600 text-dark-300">
                <th className="px-4 py-2 font-medium">Station</th>
                <th className="px-4 py-2 font-medium text-right">Net so far</th>
                <th className="px-4 py-2 font-medium text-right">Voids</th>
                <th className="px-4 py-2 font-medium text-right">Rate</th>
                <th className="px-4 py-2 font-medium text-right">Station median</th>
              </tr>
            </thead>
            <tbody>
              {d.stations.map((s) => {
                const above = s.voidRate > s.stationMedianVoidRate;
                return (
                  <tr key={s.name} className="border-b border-dark-600/60 last:border-0">
                    <td className="px-4 py-2 text-white">{s.name}</td>
                    <td className="px-4 py-2 text-right text-dark-200 tabular-nums">{usd(s.net)}</td>
                    <td className="px-4 py-2 text-right text-dark-200 tabular-nums">{s.voids}</td>
                    <td className="px-4 py-2 text-right">
                      <span className={`tabular-nums ${above ? 'text-amber-300' : 'text-green-300'}`}>{pct(s.voidRate)}</span>
                      {above ? <span className="ml-2 text-[10px] font-semibold rounded-full px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-700/40">above</span> : null}
                    </td>
                    <td className="px-4 py-2 text-right text-dark-400 tabular-nums">{pct(s.stationMedianVoidRate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-gold-500 text-xs uppercase tracking-wider font-semibold mb-3">Crew on the floor</h3>
        <div className="bg-dark-700 rounded-xl border border-dark-600 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-dark-600 text-dark-300">
                <th className="px-4 py-2 font-medium">Crew</th>
                <th className="px-4 py-2 font-medium">Station</th>
                <th className="px-4 py-2 font-medium text-right">Covers</th>
                <th className="px-4 py-2 font-medium text-right">Net</th>
                <th className="px-4 py-2 font-medium text-right">Void %</th>
                <th className="px-4 py-2 font-medium text-right">Streak</th>
              </tr>
            </thead>
            <tbody>
              {d.crew.map((c) => (
                <tr key={c.name} className="border-b border-dark-600/60 last:border-0">
                  <td className="px-4 py-2 text-white">
                    {c.name} <span className="text-dark-400 text-xs capitalize">· {c.role}</span>
                  </td>
                  <td className="px-4 py-2 text-dark-300">{c.station}</td>
                  <td className="px-4 py-2 text-right text-dark-200 tabular-nums">{c.covers || '—'}</td>
                  <td className="px-4 py-2 text-right text-dark-200 tabular-nums">{c.net ? usd(c.net) : '—'}</td>
                  <td className="px-4 py-2 text-right text-dark-200 tabular-nums">{c.voidRate ? pct(c.voidRate) : '—'}</td>
                  <td className="px-4 py-2 text-right">
                    {c.streakDays > 1 ? (
                      <span className="text-gold-300 tabular-nums">{c.streakDays} 🔥</span>
                    ) : (
                      <span className="text-dark-400 tabular-nums">{c.streakDays}d</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-gold-500 text-xs uppercase tracking-wider font-semibold mb-3">Achievements this shift</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {d.topAchievements.map((a) => (
            <div key={a.name} className="bg-dark-700 border border-gold-700/40 rounded-xl p-4">
              <p className="text-gold-400 text-[10px] uppercase tracking-wider mb-1">Achievement</p>
              <p className="text-white font-semibold text-sm mb-0.5">{a.name}</p>
              <p className="text-dark-300 text-xs mb-2">{a.crew}</p>
              <p className="text-dark-200 text-xs leading-relaxed">{a.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-dark-700 border border-dark-600 rounded-xl p-5">
        <p className="text-gold-500 text-xs uppercase tracking-widest mb-2">Why this matters</p>
        <p className="text-dark-200 text-sm leading-relaxed">
          The crew that runs the floor never sees the back-office screen — and the back-office screen never sees the
          shift. Shift Pulse closes that loop. One screen, one shift, the crew&apos;s own median as the floor.
          It&apos;s the people-native AI half of the platform: the back office and the floor working from the same numbers.
        </p>
      </div>
    </>
  );
}
