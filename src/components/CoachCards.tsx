import { SourceTag } from './SourceTag';
import { buildCoachCards } from '@/lib/coachCards';
import type { CCException } from '@/lib/commandCenter';

const usd = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

// "Do this today" — the north-star layer. Each card wraps a finding in its
// next step: who owns it, the one action, the $ at stake. Shows the top few so
// the screen stays simple to enter; the full list lives below.
export function CoachCards({ exceptions, limit = 3 }: { exceptions: CCException[]; limit?: number }) {
  const cards = buildCoachCards(exceptions);
  if (cards.length === 0) {
    return (
      <div className="card p-6">
        <p className="text-ink-800 font-semibold">Nothing above the line right now.</p>
        <p className="text-ink-500 text-sm mt-1">No store is off its benchmark this period. We&apos;ll flag the first one that drifts.</p>
      </div>
    );
  }
  const top = cards.slice(0, limit);
  const rest = cards.length - top.length;

  return (
    <div className="space-y-3">
      {top.map((c, i) => (
        <div key={`${c.store}-${c.rule}`} className="card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-ink-800 text-white text-[12px] font-bold tabular-nums">{i + 1}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/[0.05] text-ink-600">
                {c.owner} owns this
              </span>
              <SourceTag level={c.level} />
            </div>
            <p className="text-ink-800 font-bold tabular-nums whitespace-nowrap">
              {c.dollarsYr != null ? `${usd(c.dollarsYr)}/yr` : 'opportunity'}
            </p>
          </div>

          <h4 className="text-ink-800 text-lg font-semibold mt-3 tracking-tight">{c.title}</h4>
          <p className="text-ink-600 text-sm mt-1 leading-relaxed">{c.why}</p>

          <div className="mt-3 flex items-start gap-2 rounded-lg bg-black/[0.03] px-3 py-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500 mt-0.5 whitespace-nowrap">Do this</span>
            <p className="text-ink-800 text-sm font-medium leading-relaxed">{c.action}</p>
          </div>
        </div>
      ))}
      {rest > 0 ? (
        <p className="text-ink-500 text-xs">
          + {rest} more open finding{rest === 1 ? '' : 's'} below.
        </p>
      ) : null}
    </div>
  );
}
