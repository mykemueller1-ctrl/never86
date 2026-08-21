import Link from 'next/link';
import type { ShiftPulse } from '@/lib/shiftPulse';
import { TrackedLink } from '@/components/TrackedLink';

const usd = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
const pct = (v: number) => `${(v * 100).toFixed(2)}%`;

function Kpi({ label, value, sub, tone, bar }: { label: string; value: string; sub?: string; tone?: 'red' | 'gold' | 'green'; bar?: number }) {
  const v = tone === 'red' ? 'text-red-300' : tone === 'green' ? 'text-green-300' : tone === 'gold' ? 'text-warning-500' : 'text-ink-800';
  return (
    <div className="card rounded-xl p-5">
      <p className="text-ink-500 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold leading-tight ${v}`}>{value}</p>
      {bar != null ? (
        <div className="mt-2 h-1.5 w-full rounded bg-ink-200 overflow-hidden">
          <span className={`block h-full ${tone === 'red' ? 'bg-gradient-to-r from-red-700 to-red-400' : tone === 'gold' ? 'bg-gradient-to-r from-amber-700 to-amber-400' : 'bg-gradient-to-r from-green-700 to-green-400'}`} style={{ width: `${Math.min(100, Math.max(0, bar))}%` }} />
        </div>
      ) : null}
      {sub ? <p className="text-ink-500 text-xs mt-1.5">{sub}</p> : null}
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
    <div className="bg-ink-100 border border-ink-200 rounded-xl p-4 mb-8 flex items-center justify-between gap-4">
      <div>
        <p className="text-ink-800 text-sm font-semibold mb-1">Sample shift — this isn&apos;t a real restaurant.</p>
        <p className="text-ink-600 text-sm">Made-up Friday-night numbers for a 5-unit demo. Wire your POS + scheduling to run this live, station-by-station.</p>
      </div>
      <TrackedLink href="/operators#talk" event="demo_connect_data_click" meta={{ agent: 'Shift Pulse', target: '/operators#talk' }} className="shrink-0 bg-ink-800 hover:bg-ink-900 text-ink-800 font-semibold rounded-full px-4 py-2 text-sm">
        Connect your data
      </TrackedLink>
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
          <p className="text-2xl font-bold text-ink-800">{d.store} · {d.shift}</p>
          <p className="text-ink-600 text-sm">Started {d.startedAt}</p>
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
        <h3 className="text-ink-800 text-xs uppercase tracking-wider font-semibold mb-3">Stations · void rate vs your station median</h3>
        <div className="card rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-ink-500">
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
                  <tr key={s.name} className="border-b border-ink-200/60 last:border-0">
                    <td className="px-4 py-2 text-ink-800">{s.name}</td>
                    <td className="px-4 py-2 text-right text-ink-700 tabular-nums">{usd(s.net)}</td>
                    <td className="px-4 py-2 text-right text-ink-700 tabular-nums">{s.voids}</td>
                    <td className="px-4 py-2 text-right">
                      <span className={`tabular-nums ${above ? 'text-warning-500' : 'text-green-300'}`}>{pct(s.voidRate)}</span>
                      {above ? <span className="ml-2 text-[10px] font-semibold rounded-full px-2 py-0.5 bg-amber-500/10 text-warning-500 border border-amber-700/40">above</span> : null}
                    </td>
                    <td className="px-4 py-2 text-right text-ink-500 tabular-nums">{pct(s.stationMedianVoidRate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-ink-800 text-xs uppercase tracking-wider font-semibold mb-3">Crew on the floor</h3>
        <div className="card rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-ink-500">
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
                <tr key={c.name} className="border-b border-ink-200/60 last:border-0">
                  <td className="px-4 py-2 text-ink-800">
                    {c.name} <span className="text-ink-500 text-xs capitalize">· {c.role}</span>
                  </td>
                  <td className="px-4 py-2 text-ink-500">{c.station}</td>
                  <td className="px-4 py-2 text-right text-ink-700 tabular-nums">{c.covers || '—'}</td>
                  <td className="px-4 py-2 text-right text-ink-700 tabular-nums">{c.net ? usd(c.net) : '—'}</td>
                  <td className="px-4 py-2 text-right text-ink-700 tabular-nums">{c.voidRate ? pct(c.voidRate) : '—'}</td>
                  <td className="px-4 py-2 text-right">
                    {c.streakDays > 1 ? (
                      <span className="text-ink-800 tabular-nums font-semibold">{c.streakDays}d</span>
                    ) : (
                      <span className="text-ink-500 tabular-nums">{c.streakDays}d</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-ink-800 text-xs uppercase tracking-wider font-semibold mb-3">Achievements this shift</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {d.topAchievements.map((a) => (
            <div key={a.name} className="bg-dark-700 border border-gold-700/40 rounded-xl p-4">
              <p className="text-gold-400 text-[10px] uppercase tracking-wider mb-1">Achievement</p>
              <p className="text-ink-800 font-semibold text-sm mb-0.5">{a.name}</p>
              <p className="text-ink-500 text-xs mb-2">{a.crew}</p>
              <p className="text-dark-200 text-xs leading-relaxed">{a.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card rounded-xl p-5">
        <p className="text-ink-800 text-xs uppercase tracking-widest mb-2">Why this matters</p>
        <p className="text-ink-600 text-sm leading-relaxed">
          The crew that runs the floor never sees the back-office screen — and the back-office screen never sees the
          shift. Shift Pulse closes that loop. One screen, one shift, the crew&apos;s own median as the floor.
          It&apos;s the people-native AI half of the platform: the back office and the floor working from the same numbers.
        </p>
      </div>
    </>
  );
}
