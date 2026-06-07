import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Agents · Never 86'd",
  description: 'Seven agents reading your sales, labor, voids, 3P fees, tips, catering, and shift sentiment. Every figure source-tagged.',
  openGraph: {
    title: "Never 86'd · Seven agents · One operator OS",
    description: 'Find the leak. Name who owns it. Keep the receipt. Seven agents, every figure source-tagged Verified / Estimated / Unverified.',
    url: 'https://never86.ai/agents',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Never 86'd · Seven agents",
    description: 'Seven agents reading the operator stack. Every figure source-tagged.',
  },
  alternates: { canonical: 'https://never86.ai/agents' },
};

const AGENTS = [
  {
    name: 'Void Hunter',
    href: '/demo/void-hunter',
    tag: 'Voids',
    seat: 'COO · Owner',
    headline: 'One name above the peer band.',
    catches: [
      'Voids vs each store\'s own peer median (not industry benchmark)',
      'Per-store + per-name void rate, flagged if > 1.5× peer median',
      'Annualized excess-vs-peer dollar amount',
      'Pattern detection — not verdict',
    ],
    needs: 'Employee performance CSV (Toast / Square / Clover / PDQ) with Location, Employee, Net Sales, Void Amount columns. Or a live POS connection.',
    output: 'KPI strip · per-store table sorted by void rate · top-15 names sorted by void $.',
  },
  {
    name: 'Leak Detector',
    href: '/trial',
    tag: '5 signals',
    seat: 'COO · CFO · Owner',
    headline: 'Five theft signals, ticket-level.',
    catches: [
      'Void after payment — paid then voided. The classic skim.',
      'Cash-only voiders — ≥80% voids on cash tender, ≥5 voids total',
      'Comp abuse — above peer band or > 10% of own revenue comped',
      'Promo stacking — two or more discounts on a single ticket',
      'Discount after close — discount applied after ticket closed',
    ],
    needs: 'Ticket-level CSV (Toast Sales Detail / Square Transactions / Clover Reports) with Location, Employee, Ticket Total, Tender, Void/Comp/Discount columns.',
    output: 'Five color-coded signal cards · top-20 employee table sorted by composite risk score (red ≥ 50, orange ≥ 20).',
  },
  {
    name: '3P Fee Finder',
    href: '/demo/3p-fee-finder',
    tag: 'Delivery',
    seat: 'CFO · CEO',
    headline: 'Contract vs blended-effective, per partner.',
    catches: [
      'Contracted DD / UE / GH take rate vs what they actually keep',
      'DashPass-blended math: dd × (1 − share) + 0.14 × share',
      'Per-partner renegotiation lever, named to the dollar',
      'The $585K UE+GH lever for our design partner — sourced',
    ],
    needs: 'Per-partner 3P payout statements + your contracted rates.',
    output: 'Per-partner table showing contracted % · blended-effective % · annualized recovery surface if renegotiated to floor.',
  },
  {
    name: 'Labor Leak',
    href: '/demo/labor-leak',
    tag: 'Labor',
    seat: 'COO · Manager',
    headline: 'OT drift before payroll closes.',
    catches: [
      'Overtime drift per store, ranked by hours',
      'Ghost shifts — clocked time, zero sales attached',
      'Schedule-vs-clocked gaps, per employee per week',
      'Labor % vs budget, per store, with drift bars',
    ],
    needs: 'Schedule + timesheet data from 7shifts / Toast Payroll / Square Team / similar.',
    output: 'Per-store labor scorecard · top OT offenders · ghost-shift list with the shift IDs.',
  },
  {
    name: 'Tip Variance',
    href: '/demo/tip-variance',
    tag: 'Tips',
    seat: 'CFO · Manager · Crew',
    headline: 'Service slipping shows up here first.',
    catches: [
      'Week-over-week tip movement per store',
      'Per-name tip drift — diagnostic for service quality',
      'Section vs server effects separated',
      'Leading indicator the P&L misses',
    ],
    needs: 'POS tip data — net tips per employee per shift / week.',
    output: 'Week-over-week trend per store · per-name leaderboard sorted by Δ.',
  },
  {
    name: 'Catering Leak',
    href: '/demo/catering-leak',
    tag: 'Catering',
    seat: 'Chef · CFO · Owner',
    headline: 'Where the order ran but the receipt didn\'t.',
    catches: [
      'Per-store catering economics (mix, contribution margin)',
      'Invoice-vs-POS reconciliation gap',
      'Off-prem orders that ran without a ticket',
      'Per-customer concentration risk',
    ],
    needs: 'Catering invoices + POS catering category exports.',
    output: 'Per-store catering scorecard · the reconciliation gap dollar amount · top-customer concentration.',
  },
  {
    name: 'Rate Card Audit',
    href: '/demo/rate-card-audit',
    tag: '3P Rates',
    seat: 'CFO · CEO',
    headline: 'Where your DD/UE/GH rates sit vs peer band.',
    catches: [
      'Operator drops their contracted DD/UE/GH rates',
      'Industry peer band (floor 10%, typical 18-20%, ceiling 30%)',
      'Position bar showing where they sit on the axis',
      'The "contract vs effective" gap typically 1.2-2.8pp at multi-unit scale',
    ],
    needs: 'Just your contracted rates — no POS connection needed.',
    output: 'Verdict card with position bar · the lever amount · industry peer-band context.',
  },
  {
    name: 'Shift Pulse',
    href: '/demo/shift-pulse',
    tag: 'Shift',
    seat: 'Manager · Crew',
    headline: 'Tonight\'s shift in one screen.',
    catches: [
      'Covers vs forecast, live during service',
      'Station median, set as the floor',
      'Tonight\'s goal — the one number that matters',
      'Streak count — zero-comp shifts, voids under the line',
    ],
    needs: 'POS live feed + forecast input (or last 8-week average).',
    output: 'Single-screen crew view · pacing meter · the goal · the streak.',
  },
];

const SOURCE_TAGS = [
  { v: 'Verified',   color: '#34c759', meaning: 'We can re-pull this from a primary source and defend it to the penny.' },
  { v: 'Estimated',  color: '#ff9500', meaning: 'Modeled from a benchmark or assumption. We name the assumption next to the number.' },
  { v: 'Unverified', color: '#ff453a', meaning: 'Source not wired yet. Number is illustrative — operator-only.' },
];

export default function AgentsPage() {
  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <Link href="/" className="flex items-start gap-4 group">
            <span className="compass-mark">N</span>
            <span>
              <p className="font-serif text-[24px] leading-none text-white">
                Never 86&apos;d <span className="italic text-white/70">· agents</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Operator OS · 8 agents wired · every figure source-tagged</p>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px]">
            <Link href="/" className="compass-pill"><span className="avatar">H</span><span>Home</span></Link>
            <Link href="/trial" className="btn-primary" style={{ background: '#0066ff' }}>Try free →</Link>
          </nav>
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-6 pt-12 md:pt-16 pb-12">
        <p className="compass-eyebrow mb-6">— Eight agents · one operator OS</p>
        <h1 className="compass-display text-5xl md:text-7xl mb-6">
          The agents that <em>name the leak.</em>
        </h1>
        <p className="compass-body text-lg md:text-xl max-w-3xl mb-10">
          Each one reads a slice of your operation — sales, labor, voids, 3P fees, tips, catering, shift sentiment — and tells you the one thing to fix. Per store. Per name. Every figure source-tagged.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/trial" className="btn-primary" style={{ background: '#0066ff' }}>60 minutes free · drop a CSV →</Link>
          <Link href="/pricing" className="btn-secondary" style={{ background: 'transparent', borderColor: '#2c2c2e', color: '#ffffff' }}>See pricing</Link>
        </div>
      </section>

      <section className="border-t border-[#1f1f1f] px-6 py-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-3">
            {AGENTS.map((a, i) => (
              <article key={a.name} className="compass-card hover:border-[#0066ff] transition-colors">
                <div className="grid lg:grid-cols-[1fr_2fr] gap-6">
                  <div>
                    <p className="compass-card-label">— {String(i + 1).padStart(2, '0')} · {a.tag}</p>
                    <h3 className="!mt-2 text-2xl md:text-3xl">{a.name}</h3>
                    <p className="text-[12px] mt-2" style={{ color: '#86868b' }}>For the {a.seat}</p>
                    <p className="font-serif italic mt-4 text-lg" style={{ color: '#0066ff' }}>{a.headline}</p>
                    <Link href={a.href} className="text-[13px] mt-5 inline-flex items-center gap-1 hover:gap-2 transition-all" style={{ color: '#0066ff' }}>
                      Try {a.name} <span aria-hidden>→</span>
                    </Link>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <p className="compass-card-label mb-2">— What it catches</p>
                      <ul className="space-y-1.5">
                        {a.catches.map((c) => (
                          <li key={c} className="compass-body text-[13px] flex gap-2">
                            <span style={{ color: '#0066ff' }}>•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="compass-card-label mb-2">— Data it needs</p>
                        <p className="compass-body text-[13px]">{a.needs}</p>
                      </div>
                      <div>
                        <p className="compass-card-label mb-2">— What you&apos;ll see</p>
                        <p className="compass-body text-[13px]">{a.output}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#1f1f1f] px-6 py-16 md:py-20">
        <div className="max-w-5xl mx-auto">
          <p className="compass-eyebrow mb-4">— The rule that runs the agents</p>
          <h2 className="compass-display text-3xl md:text-5xl mb-12">
            Every figure ships <em>source-tagged.</em>
          </h2>
          <div className="grid md:grid-cols-3 gap-3">
            {SOURCE_TAGS.map((t) => (
              <div key={t.v} className="compass-card">
                <p className="compass-card-label" style={{ color: t.color }}>— {t.v}</p>
                <p className="compass-body text-[14.5px] mt-3 leading-relaxed">{t.meaning}</p>
              </div>
            ))}
          </div>
          <p className="compass-body text-[14px] mt-8 max-w-3xl">
            No competitor in this category publicly source-tags figures. None publicly disclose model error. We checked. <Link href="/case/walked-the-number-back" className="underline" style={{ textDecorationColor: '#0066ff' }}>Read the case</Link> where we caught our own $8.3M number, walked it down to $1.81M in writing, and made source-tagging the operational rule that came out of it.
          </p>
        </div>
      </section>

      <section className="border-t border-[#1f1f1f] px-6 py-16 md:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <p className="compass-eyebrow mb-4">— Try one. Right now.</p>
          <h2 className="compass-display text-3xl md:text-5xl mb-8">
            60 minutes. <em>Your real numbers.</em>
          </h2>
          <p className="compass-body text-lg mb-8">
            Drop a Toast / Square / Clover / PDQ export at <span className="font-mono text-white">/trial</span>. Void Hunter and the Leak Detector run on your real data in 30 seconds. No card. No human in the loop.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/trial" className="btn-primary" style={{ background: '#0066ff' }}>Start the trial →</Link>
            <Link href="/pricing" className="btn-secondary" style={{ background: 'transparent', borderColor: '#2c2c2e', color: '#ffffff' }}>See pricing</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#1f1f1f] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[#6e6e73] text-[12px]">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.1rem', height: '1.1rem', fontSize: '0.5rem' }}>N86</span>
            <span>Never 86&apos;d · Built by operators</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/pricing"  className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/trial"    className="hover:text-white transition-colors">Trial</Link>
            <Link href="/for"      className="hover:text-white transition-colors">Seats</Link>
            <Link href="/"         className="hover:text-white transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
