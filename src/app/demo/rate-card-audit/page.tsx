'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Track } from '@/components/Track';
import { AgentUnlock } from '@/components/AgentUnlock';

// Peer ranges are intentionally industry-wide bands, NOT the design partner's
// specific numbers. Per governance: we tell the operator where the floor is
// without burning anyone else's negotiation.
const PEER_BANDS = {
  doordash: { floor: 0.10, typical: 0.18, ceiling: 0.30 },
  uberEats: { floor: 0.10, typical: 0.20, ceiling: 0.30 },
  grubhub:  { floor: 0.10, typical: 0.18, ceiling: 0.30 },
};

const DASHPASS_PREMIUM = 0.14;
const DASHPASS_SHARE_ASSUMPTION = 0.30;

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function classify(rate: number | null, band: { floor: number; typical: number; ceiling: number }) {
  if (rate == null || isNaN(rate)) return null;
  if (rate <= band.floor + 0.01) return { label: 'At the floor', tone: 'green' as const, body: "You're paying close to the lowest rate we've seen at multi-unit scale. The renegotiation lever isn't here — it's in volume mix (more first-party)." };
  if (rate <= band.typical) return { label: 'Below median', tone: 'green' as const, body: "Better than typical for your unit count. Worth confirming the contracted rate vs the actual blended effective once promotions and platform fees are stripped in." };
  if (rate <= band.ceiling - 0.05) return { label: 'In the band', tone: 'gold' as const, body: 'Typical for your unit count. Most operators sit here. The lever is renegotiation using volume + a peer benchmark.' };
  return { label: 'Above the band', tone: 'red' as const, body: 'Above what we see at your unit count. Real money on the table — this is where the renegotiation conversation starts.' };
}

export default function RateCardAuditDemo() {
  const [ddDelivery, setDdDelivery] = useState('');
  const [ddPickup, setDdPickup] = useState('');
  const [uePct, setUePct] = useState('');
  const [ghPct, setGhPct] = useState('');
  const [dashShare, setDashShare] = useState('');

  const dd = useMemo(() => {
    const r = Number(ddDelivery) / 100;
    return isFinite(r) && r > 0 ? r : null;
  }, [ddDelivery]);
  const ue = useMemo(() => {
    const r = Number(uePct) / 100;
    return isFinite(r) && r > 0 ? r : null;
  }, [uePct]);
  const gh = useMemo(() => {
    const r = Number(ghPct) / 100;
    return isFinite(r) && r > 0 ? r : null;
  }, [ghPct]);
  const share = useMemo(() => {
    if (!dashShare) return DASHPASS_SHARE_ASSUMPTION;
    const s = Number(dashShare) / 100;
    return isFinite(s) && s >= 0 && s <= 1 ? s : DASHPASS_SHARE_ASSUMPTION;
  }, [dashShare]);

  const ddBlended = useMemo(() => {
    if (dd == null) return null;
    return dd * (1 - share) + DASHPASS_PREMIUM * share;
  }, [dd, share]);

  const ddVerdict = dd != null ? classify(dd, PEER_BANDS.doordash) : null;
  const ueVerdict = ue != null ? classify(ue, PEER_BANDS.uberEats) : null;
  const ghVerdict = gh != null ? classify(gh, PEER_BANDS.grubhub) : null;

  const anyEntered = dd != null || ue != null || gh != null;

  return (
    <main className="min-h-screen text-ink-800">
      <Track eventType="agent_view" agentName="Rate Card Audit" audience="cfo" />
      <header className="nav-shell sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="brand-monogram" style={{ width: '1.4rem', height: '1.4rem', fontSize: '0.55rem' }}>N86</span>
            <span className="font-semibold tracking-tighter text-ink-800 text-[15px]">Never 86&apos;d</span>
          </Link>
          <nav className="flex items-center gap-1 text-[13px] text-ink-600">
            <Link href="/" className="px-3 py-1.5 rounded-full hover:text-ink-800 hover:bg-black/[0.04] hidden sm:inline">All agents</Link>
            <Link href="/operators#talk" className="btn-primary py-1.5 px-4 text-[13px]">Talk to us</Link>
          </nav>
        </div>
      </header>

      <section className="pt-16 md:pt-20 pb-6 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="display text-4xl md:text-6xl tracking-tighter mb-3">Rate Card Audit</h1>
          <p className="text-ink-600 text-lg md:text-xl leading-relaxed">
            Drop your contracted 3P rates. See where you sit vs the peer band at multi-unit scale.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-8">
        <div className="card p-7 space-y-5">
          {/* DoorDash */}
          <div>
            <p className="text-ink-800 font-semibold mb-2">DoorDash</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-ink-500 text-[11px] uppercase tracking-widest font-medium block mb-1">Delivery commission %</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  placeholder="e.g. 18"
                  value={ddDelivery}
                  onChange={(e) => setDdDelivery(e.target.value)}
                  className="w-full bg-white border border-ink-300 rounded-xl px-4 py-3 text-ink-800 placeholder-ink-500 focus:outline-none focus:border-ink-800"
                />
              </label>
              <label className="block">
                <span className="text-ink-500 text-[11px] uppercase tracking-widest font-medium block mb-1">Pickup commission % (optional)</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  placeholder="e.g. 6"
                  value={ddPickup}
                  onChange={(e) => setDdPickup(e.target.value)}
                  className="w-full bg-white border border-ink-300 rounded-xl px-4 py-3 text-ink-800 placeholder-ink-500 focus:outline-none focus:border-ink-800"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-ink-500 text-[11px] uppercase tracking-widest font-medium block mb-1">DashPass share of orders % (default 30%)</span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  placeholder="30"
                  value={dashShare}
                  onChange={(e) => setDashShare(e.target.value)}
                  className="w-full bg-white border border-ink-300 rounded-xl px-4 py-3 text-ink-800 placeholder-ink-500 focus:outline-none focus:border-ink-800"
                />
              </label>
            </div>
          </div>

          {/* Uber Eats */}
          <div>
            <p className="text-ink-800 font-semibold mb-2">Uber Eats</p>
            <label className="block">
              <span className="text-ink-500 text-[11px] uppercase tracking-widest font-medium block mb-1">Delivery commission %</span>
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                placeholder="e.g. 22"
                value={uePct}
                onChange={(e) => setUePct(e.target.value)}
                className="w-full bg-white border border-ink-300 rounded-xl px-4 py-3 text-ink-800 placeholder-ink-500 focus:outline-none focus:border-ink-800"
              />
            </label>
          </div>

          {/* GrubHub */}
          <div>
            <p className="text-ink-800 font-semibold mb-2">GrubHub</p>
            <label className="block">
              <span className="text-ink-500 text-[11px] uppercase tracking-widest font-medium block mb-1">Commission %</span>
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                placeholder="e.g. 22"
                value={ghPct}
                onChange={(e) => setGhPct(e.target.value)}
                className="w-full bg-white border border-ink-300 rounded-xl px-4 py-3 text-ink-800 placeholder-ink-500 focus:outline-none focus:border-ink-800"
              />
            </label>
          </div>
        </div>
      </section>

      {/* Results */}
      {anyEntered ? (
        <section className="max-w-3xl mx-auto px-6 py-8">
          <h2 className="display text-2xl md:text-3xl mb-5">Your read.</h2>
          <div className="space-y-3">
            {ddVerdict ? (
              <VerdictCard
                partner="DoorDash"
                rate={dd!}
                blended={ddBlended ?? undefined}
                verdict={ddVerdict}
                band={PEER_BANDS.doordash}
              />
            ) : null}
            {ueVerdict ? (
              <VerdictCard partner="Uber Eats" rate={ue!} verdict={ueVerdict} band={PEER_BANDS.uberEats} />
            ) : null}
            {ghVerdict ? (
              <VerdictCard partner="GrubHub" rate={gh!} verdict={ghVerdict} band={PEER_BANDS.grubhub} />
            ) : null}
          </div>

          <div className="card p-6 mt-6">
            <p className="text-ink-500 text-[11px] uppercase tracking-widest font-medium mb-2">The lever</p>
            <p className="text-ink-700 leading-relaxed">
              The contracted rate is almost never the actual blended-effective rate.
              Promotions, DashPass / Uber One premium tiers, and platform marketing fees stack on top of contract.
              When you reconcile a full quarter against the bank-deposit ledger, the gap between contracted and effective is typically <span className="text-ink-800 font-semibold">1.2 to 2.8 percentage points</span> per partner.
              Multiply by your annualized 3P revenue. That&apos;s the lever.
            </p>
          </div>

          <div className="mt-8 text-center">
            <Link href="/operators#talk" className="btn-primary">15 minutes on your real settlement data</Link>
            <p className="text-ink-500 text-[12px] mt-3">Bring last month&apos;s DD/UE/GH payout statements. We&apos;ll run the reconciliation live.</p>
          </div>
        </section>
      ) : (
        <section className="max-w-3xl mx-auto px-6 py-12 text-center">
          <p className="text-ink-500">Enter a rate above to see your read.</p>
        </section>
      )}

      <AgentUnlock agentName="Rate Card Audit" />

      <footer className="border-t border-ink-200 py-10 px-6 bg-white mt-12">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-ink-500 text-[12px]">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.1rem', height: '1.1rem', fontSize: '0.5rem' }}>N86</span>
            <span>Never 86&apos;d</span>
          </div>
          <Link href="/" className="hover:text-ink-800 transition-colors">Home</Link>
        </div>
      </footer>
    </main>
  );
}

function VerdictCard({
  partner,
  rate,
  blended,
  verdict,
  band,
}: {
  partner: string;
  rate: number;
  blended?: number;
  verdict: { label: string; tone: 'green' | 'gold' | 'red'; body: string };
  band: { floor: number; typical: number; ceiling: number };
}) {
  const toneClass =
    verdict.tone === 'red' ? 'text-danger-500' :
    verdict.tone === 'gold' ? 'text-warning-500' :
    'text-success-500';

  // Visual band: position rate on the floor→ceiling axis
  const range = band.ceiling - band.floor;
  const pos = Math.min(100, Math.max(0, ((rate - band.floor) / range) * 100));

  return (
    <div className="card p-6">
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-ink-800 font-semibold text-lg tracking-tighter">{partner}</p>
        <p className={`text-[11px] uppercase tracking-widest font-medium ${toneClass}`}>{verdict.label}</p>
      </div>
      <div className="flex items-baseline gap-3 mb-3">
        <p className="font-mono tabular-nums text-2xl font-bold text-ink-800">{pct(rate)}</p>
        {blended != null && Math.abs(blended - rate) > 0.001 ? (
          <p className="text-ink-500 text-sm">
            blended ~<span className="font-mono tabular-nums text-ink-700 font-semibold">{pct(blended)}</span> with DashPass mix
          </p>
        ) : null}
      </div>
      <div className="relative h-1.5 w-full bg-ink-200 rounded-full mb-2">
        <span className="absolute top-0 h-full w-1 bg-ink-800 rounded-full" style={{ left: `${pos}%` }} />
      </div>
      <div className="flex justify-between text-[10px] uppercase tracking-widest text-ink-500 font-mono mb-3">
        <span>floor {pct(band.floor)}</span>
        <span>typical {pct(band.typical)}</span>
        <span>{pct(band.ceiling)}</span>
      </div>
      <p className="text-ink-700 text-sm leading-relaxed">{verdict.body}</p>
    </div>
  );
}
