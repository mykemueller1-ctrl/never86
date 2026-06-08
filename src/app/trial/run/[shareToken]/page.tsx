import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTrialRunByShareToken } from '@/lib/trialRunsDb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Params = { shareToken: string };

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Saved trial run · Never 86'd",
    description: 'Your earlier Void Hunter / Leak Detector read on your CSV. Saved for review.',
    robots: { index: false, follow: false },
  };
}

const usd = (n: number) => '$' + Math.round(n).toLocaleString();
const pct = (n: number) => (n * 100).toFixed(2) + '%';

// Reusable result renderers · server components.
function VoidHunterView({ r, filename }: { r: any; filename: string | null }) {
  const networkLeakYr = Math.max(0, r.networkVoids - r.medianStoreVoidRate * r.networkNet) * 3;
  return (
    <div className="max-w-5xl mx-auto">
      <p className="compass-eyebrow mb-4">— Void Hunter · {filename ?? 'your CSV'}</p>
      <h2 className="compass-display text-3xl md:text-5xl mb-10">
        {r.storesFlagged > 0
          ? <>Found <em>{r.storesFlagged} store{r.storesFlagged === 1 ? '' : 's'}</em> above the peer band.</>
          : <>No stores <em>above the peer band.</em></>}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div className="compass-kpi"><p className="compass-kpi-label">Network net</p><p className="compass-kpi-val">{usd(r.networkNet)}</p></div>
        <div className="compass-kpi"><p className="compass-kpi-label">Network voids</p><p className="compass-kpi-val">{usd(r.networkVoids)}</p></div>
        <div className="compass-kpi"><p className="compass-kpi-label">Network void rate</p><p className="compass-kpi-val">{pct(r.networkVoidRate)}</p></div>
        <div className="compass-kpi"><p className="compass-kpi-label">Peer-median rate</p><p className="compass-kpi-val">{pct(r.medianStoreVoidRate)}</p></div>
      </div>
      {networkLeakYr > 0 && (
        <div className="compass-card mb-10" style={{ borderColor: '#0066ff' }}>
          <p className="compass-card-label" style={{ color: '#0066ff' }}>— The lever</p>
          <h3>Excess voids above peer band, annualized: <em style={{ color: '#0066ff' }}>{usd(networkLeakYr)}</em></h3>
        </div>
      )}
      {r.stores?.length > 0 && (
        <div className="compass-card overflow-x-auto" style={{ padding: 0 }}>
          <table className="data-table w-full">
            <thead><tr><th className="!text-left">Store</th><th>Net</th><th>Voids</th><th>Rate</th><th>Excess / yr</th></tr></thead>
            <tbody>
              {r.stores.map((s: any) => (
                <tr key={s.name} style={{ color: '#d2d2d7' }}>
                  <td className="!text-left text-white font-medium">{s.name}{s.flagged ? <span className="badge badge-unverified ml-2">Above band</span> : null}</td>
                  <td className="font-mono tabular-nums">{usd(s.net)}</td>
                  <td className="font-mono tabular-nums">{usd(s.voids)}</td>
                  <td className="font-mono tabular-nums">{pct(s.voidRate)}</td>
                  <td className="font-mono tabular-nums">{s.excessYr > 0 ? usd(s.excessYr) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LeakDetectorView({ r, filename }: { r: any; filename: string | null }) {
  return (
    <div className="max-w-6xl mx-auto">
      <p className="compass-eyebrow mb-4">— Leak Detector · {filename ?? 'your CSV'}</p>
      <h2 className="compass-display text-3xl md:text-5xl mb-8">
        {r.ticketsAnalyzed?.toLocaleString()} tickets. <em>{r.stores?.length} store{r.stores?.length === 1 ? '' : 's'}.</em>
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div className="compass-kpi"><p className="compass-kpi-label">Network net</p><p className="compass-kpi-val">{usd(r.networkNet)}</p></div>
        <div className="compass-kpi"><p className="compass-kpi-label">Voids</p><p className="compass-kpi-val">{usd(r.networkVoids)}</p></div>
        <div className="compass-kpi"><p className="compass-kpi-label">Comps</p><p className="compass-kpi-val">{usd(r.networkComps)}</p></div>
        <div className="compass-kpi"><p className="compass-kpi-label">Discounts</p><p className="compass-kpi-val">{usd(r.networkDiscounts)}</p></div>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
        {r.signals?.voidAfterPayment?.totalCount > 0 && (
          <div className="compass-card" style={{ borderColor: '#ff453a' }}>
            <p className="compass-card-label" style={{ color: '#ff453a' }}>— Void after payment</p>
            <h3>{r.signals.voidAfterPayment.totalCount} tickets · <em>{usd(r.signals.voidAfterPayment.totalDollars)}</em></h3>
          </div>
        )}
        {r.signals?.cashOnlyVoiders?.length > 0 && (
          <div className="compass-card" style={{ borderColor: '#ff453a' }}>
            <p className="compass-card-label" style={{ color: '#ff453a' }}>— Cash-only voiders</p>
            <h3>{r.signals.cashOnlyVoiders.length} name{r.signals.cashOnlyVoiders.length === 1 ? '' : 's'} flagged</h3>
          </div>
        )}
        {r.signals?.compAbuse?.length > 0 && (
          <div className="compass-card" style={{ borderColor: '#ff9500' }}>
            <p className="compass-card-label" style={{ color: '#ff9500' }}>— Comp abuse</p>
            <h3>{r.signals.compAbuse.length} name{r.signals.compAbuse.length === 1 ? '' : 's'} flagged</h3>
          </div>
        )}
      </div>
      {r.employees?.length > 0 && (
        <div className="compass-card overflow-x-auto" style={{ padding: 0 }}>
          <table className="data-table w-full">
            <thead><tr><th className="!text-left">Name</th><th className="!text-left">Store</th><th>Net</th><th>Voids</th><th>Comps</th><th>Risk</th></tr></thead>
            <tbody>
              {r.employees.slice(0, 20).map((e: any) => (
                <tr key={`${e.store}-${e.name}`} style={{ color: '#d2d2d7' }}>
                  <td className="!text-left text-white font-medium">{e.name}</td>
                  <td className="!text-left">{e.store}</td>
                  <td className="font-mono tabular-nums">{usd(e.netSales)}</td>
                  <td className="font-mono tabular-nums">{usd(e.voidsDollars)}</td>
                  <td className="font-mono tabular-nums">{usd(e.compsDollars)}</td>
                  <td className="font-mono tabular-nums font-semibold" style={{ color: e.riskScore >= 50 ? '#ff453a' : e.riskScore >= 20 ? '#ff9500' : '#86868b' }}>{e.riskScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default async function SavedRunPage({ params }: { params: Params }) {
  const run = await getTrialRunByShareToken(params.shareToken);
  if (!run) notFound();
  const r = run.result as any;

  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <Link href="/" className="flex items-start gap-4 group">
            <span className="compass-mark">N</span>
            <span>
              <p className="font-serif text-[24px] leading-none text-white">
                Never 86&apos;d <span className="italic text-white/70">· saved run</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Operator OS · {run.agent === 'void-hunter' ? 'Void Hunter' : 'Leak Detector'} · {new Date(run.createdAt).toLocaleString()}</p>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px]">
            <Link href="/trial" className="compass-pill"><span className="avatar">T</span><span>New run</span></Link>
            <Link href="/onboard" className="btn-primary" style={{ background: '#0066ff' }}>Wire it live →</Link>
          </nav>
        </div>
      </div>

      <section className="pt-12 pb-16 px-6">
        {run.agent === 'void-hunter' && <VoidHunterView r={r} filename={run.filename} />}
        {run.agent === 'leak-detector' && <LeakDetectorView r={r} filename={run.filename} />}
      </section>

      <section className="border-t border-[#1f1f1f] py-16 md:py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="compass-eyebrow mb-4">— What this read costs you to live with</p>
          <h2 className="compass-display text-3xl md:text-5xl mb-8">
            One leak a week. <em>For 52 weeks.</em>
          </h2>
          <p className="compass-body text-lg mb-8">
            This is one snapshot from one CSV. Wire your live POS to never86&apos;d and the same agents run every shift, alert when a name spikes, and feed your CFO&apos;s board doc with figures that hold up to the penny.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/onboard" className="btn-primary" style={{ background: '#0066ff' }}>Onboard your store →</Link>
            <Link href="/pricing" className="btn-secondary" style={{ background: 'transparent', borderColor: '#2c2c2e', color: '#ffffff' }}>See pricing</Link>
            <Link href="/trial" className="btn-secondary" style={{ background: 'transparent', borderColor: '#2c2c2e', color: '#ffffff' }}>Run another CSV</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#1f1f1f] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[#6e6e73] text-[12px]">
          <span>This link is private. Share with your team — they can read but not edit.</span>
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
        </div>
      </footer>
    </main>
  );
}
