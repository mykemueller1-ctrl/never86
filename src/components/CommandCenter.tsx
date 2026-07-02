import { getOperatorCommandCenter, type CommandCenter as CC } from '@/lib/toastReports';
import { opsDbConfigured } from '@/lib/opsDb';

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const prettyDate = (iso: string | null) =>
  iso
    ? new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

function Shell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-dark-800 px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <p className="text-dark-300 text-sm uppercase tracking-wider mb-1">Never 86&apos;d · Command Center</p>
        <h1 className="text-4xl font-bold text-gold-500 mb-1">{title}</h1>
        {subtitle ? <p className="text-dark-200 mb-8">{subtitle}</p> : <div className="mb-8" />}
        {children}
      </div>
    </main>
  );
}

function Notice({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <div className="bg-dark-700 border border-dark-600 rounded-xl p-6">
      <p className="text-white font-semibold mb-2">{title}</p>
      <p className="text-dark-300 text-sm">{body}</p>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-dark-700 rounded-xl p-5 border border-dark-600">
      <p className="text-dark-300 text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold text-white leading-tight">{value}</p>
      {sub ? <p className="text-dark-400 text-xs mt-1">{sub}</p> : null}
    </div>
  );
}

export default async function CommandCenter({
  operatorId,
  displayName,
}: {
  operatorId: number;
  displayName?: string;
}) {
  if (!opsDbConfigured()) {
    return (
      <Shell title="Command Center">
        <Notice
          title="Your live data isn’t connected yet."
          body={<>If you’re seeing this, contact the team and we’ll bring you online.</>}
        />
      </Shell>
    );
  }

  let cc: CC;
  try {
    cc = await getOperatorCommandCenter(operatorId, displayName);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return (
      <Shell title="Command Center">
        <Notice title="Couldn’t reach your live data." body={<span className="font-mono text-xs break-all">{msg}</span>} />
      </Shell>
    );
  }

  if (cc.storesLoaded === 0) {
    return (
      <Shell title={cc.operatorName} subtitle="Command Center">
        <Notice
          title="Awaiting clean ingest."
          body="No de-duplicated dining-option data has landed for this operator yet. The moment the weekly backfill arrives, this screen fills in automatically — store by store."
        />
      </Shell>
    );
  }

  const partial = !cc.fullyLoaded;
  const subtitle = `${cc.storesLoaded} of ${cc.totalLocations} stores · ${cc.weeksLoaded} weeks · ${prettyDate(
    cc.periodStart
  )} – ${prettyDate(cc.periodEnd)}`;

  return (
    <Shell title={cc.operatorName} subtitle={subtitle}>
      {partial ? (
        <div className="bg-dark-700 border border-gold-500 rounded-xl px-5 py-3 mb-6 text-gold-300 text-sm">
          Backfill in progress — {cc.storesLoaded}/{cc.totalLocations} stores loaded. The network totals below are{' '}
          <strong>loaded-so-far</strong>, not the full network yet.
        </div>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Kpi label={partial ? 'Net sales (loaded so far)' : 'Network net sales'} value={usd(cc.networkNet)} />
        <Kpi
          label="First-party % of digital"
          value={cc.networkFirstPartyPct != null ? `${cc.networkFirstPartyPct}%` : '—'}
          sub="target 50%"
        />
        <Kpi label="3P marketplace" value={usd(cc.networkThirdParty)} />
        <Kpi label="Catering" value={usd(cc.networkCatering)} />
      </div>

      <div className="bg-dark-700 rounded-xl border border-dark-600 overflow-hidden mb-6">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-dark-600 text-dark-300">
              <th className="px-5 py-3 font-medium">#</th>
              <th className="px-5 py-3 font-medium">Store</th>
              <th className="px-5 py-3 font-medium text-right">Net sales</th>
              <th className="px-5 py-3 font-medium text-right">First-party %</th>
              <th className="px-5 py-3 font-medium text-right">3P</th>
              <th className="px-5 py-3 font-medium text-right">Catering</th>
            </tr>
          </thead>
          <tbody>
            {cc.stores.map((s, i) => (
              <tr key={s.locationId} className="border-b border-dark-600/60 last:border-0">
                <td className="px-5 py-3 text-dark-400">{i + 1}</td>
                <td className="px-5 py-3 text-white">{s.name}</td>
                <td className="px-5 py-3 text-right text-gold-300 font-semibold tabular-nums">{usd(s.net)}</td>
                <td className="px-5 py-3 text-right tabular-nums text-white">
                  {s.firstPartyPct != null ? `${s.firstPartyPct}%` : '—'}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-dark-200">{usd(s.thirdParty)}</td>
                <td className="px-5 py-3 text-right tabular-nums text-dark-200">{usd(s.catering)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-dark-400 text-xs">
        From your POS data, de-duplicated to the leaf channel (each order counted once). Every figure is computed
        from real rows; nothing estimated. Last data refresh {prettyDate(cc.lastIngest)} · rendered{' '}
        {new Date(cc.generatedAt).toLocaleString('en-US')}.
      </p>
    </Shell>
  );
}
