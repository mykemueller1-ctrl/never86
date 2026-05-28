import { SourceTag } from './SourceTag';
import type { VoidFindings } from '@/lib/voidFindings';

const usd = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
const count = (v: number) => new Intl.NumberFormat('en-US').format(v);
const prettyDate = (iso: string | null) =>
  iso ? new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

// Void Hunter findings rendered under the platform's source-tag discipline:
// every figure carries a Verified tag and a queryable provenance row
// (void_hunter_findings.id). Leads with the "flags patterns, not verdicts"
// guardrail. Data-gap row is rendered as the cannot_answer pattern — what we'd
// need to extend the analysis to the full 4-bucket classification.
export function VoidFindingsSection({ data: d }: { data: VoidFindings }) {
  const network = d.network;
  return (
    <div className="mb-8">
      <h3 className="text-gold-500 text-xs uppercase tracking-wider font-semibold mb-3">
        Void Hunter — {d.totalFindings} measured findings
      </h3>

      {network ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div className="bg-dark-700 rounded-xl p-5 border border-dark-600">
            <div className="flex items-center justify-between mb-1">
              <p className="text-dark-300 text-xs uppercase tracking-wide">Network voids</p>
              <SourceTag level="verified" />
            </div>
            <p className="text-2xl font-bold text-white leading-tight">{usd(network.dollarAmount ?? 0)}</p>
            <p className="text-dark-400 text-xs mt-1">{count(network.count ?? 0)} void events</p>
          </div>
          <div className="bg-dark-700 rounded-xl p-5 border border-dark-600">
            <div className="flex items-center justify-between mb-1">
              <p className="text-dark-300 text-xs uppercase tracking-wide">Top network offender</p>
              <SourceTag level="verified" />
            </div>
            <p className="text-lg font-bold text-white leading-tight break-words">{network.topOffender ?? '—'}</p>
            <p className="text-dark-400 text-xs mt-1">across all 16 stores</p>
          </div>
          <div className="bg-dark-700 rounded-xl p-5 border border-dark-600">
            <div className="flex items-center justify-between mb-1">
              <p className="text-dark-300 text-xs uppercase tracking-wide">Top employee flag</p>
              <SourceTag level="verified" />
            </div>
            <p className="text-sm text-white leading-snug break-words">{d.topOffenders?.topOffender ?? '—'}</p>
          </div>
        </div>
      ) : null}

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
        <p className="text-amber-300 text-sm font-semibold mb-1">This flags patterns, not verdicts.</p>
        <p className="text-dark-200 text-sm">
          Top-offender rows are the highest measured void totals — not accusations. Some are channel buckets,
          some are shared tills, some are real. Start at the top, pull the void reasons, then decide.
        </p>
      </div>

      <div className="bg-dark-700 rounded-xl border border-dark-600 overflow-hidden mb-3">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-dark-600 text-dark-300">
              <th className="px-4 py-2 font-medium">Store</th>
              <th className="px-4 py-2 font-medium text-right">Voids</th>
              <th className="px-4 py-2 font-medium text-right">Events</th>
              <th className="px-4 py-2 font-medium">Top offender</th>
            </tr>
          </thead>
          <tbody>
            {d.byLocation.map((row) => (
              <tr key={row.id} className="border-b border-dark-600/60 last:border-0">
                <td className="px-4 py-2 text-white">{row.location ?? '—'}</td>
                <td className="px-4 py-2 text-right text-gold-300 tabular-nums">{usd(row.dollarAmount ?? 0)}</td>
                <td className="px-4 py-2 text-right text-dark-200 tabular-nums">{count(row.count ?? 0)}</td>
                <td className="px-4 py-2 text-dark-200 text-xs break-words">{row.topOffender ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {d.dataGaps.length > 0 ? (
        <div className="bg-dark-700/60 border border-dark-600 rounded-xl p-4 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <SourceTag level="unverified" title="data gap" />
            <p className="text-white text-sm font-semibold">What we&apos;d need to go deeper</p>
          </div>
          <p className="text-dark-300 text-sm">
            {d.dataGaps.length} measured data gap{d.dataGaps.length > 1 ? 's' : ''} — fields the analysis layer flagged as
            missing to complete the full 4-bucket void classification (item-level, hour-of-day, channel-vs-staff
            attribution). We return &ldquo;don&apos;t know yet&rdquo; rather than guess.
          </p>
        </div>
      ) : null}

      <p className="text-dark-400 text-xs">
        From your void data · {d.totalFindings} measured findings · analysis {prettyDate(d.analysisDate)} ·{' '}
        period {prettyDate(d.periodStart)} – {prettyDate(d.periodEnd)} · each figure traceable on request.
      </p>
    </div>
  );
}
