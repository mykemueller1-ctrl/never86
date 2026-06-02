import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Press kit · Never 86'd",
  description:
    'One-page press kit for Never 86\'d — restaurant financial intelligence built by an operator, for operators. Founder bio, positioning, three receipts, and the discipline behind every figure.',
  openGraph: {
    title: "Never 86'd · Press kit",
    description: 'Built by an operator. For operators. $15.72M reconciled to the cent.',
    url: 'https://never86.ai/press',
  },
  alternates: { canonical: 'https://never86.ai/press' },
};

const RECEIPTS = [
  { v: '$1,043,797.69', l: 'The canary', body: 'One store, one quarter, matched to the penny against the POS.' },
  { v: '$15.72M', l: 'The network', body: 'A full 16-unit chef-led group reconciled across 545,677 orders.' },
  { v: '$8.3M → $1.81M', l: 'The correction', body: 'We caught our own inflated recovery number and walked it back. The honest figure is the one we ship.' },
];

const PRODUCTS = [
  { name: 'Financial intelligence', status: 'Live · in production', body: 'For owners and CFOs. Every dollar your restaurants move, read, reconciled, source-tagged.' },
  { name: 'People-native AI · end-to-end', status: 'Coming · in build', body: 'For managers and the crew. Gamified shifts, knowledge brain, daily standup that helps.' },
];

const QUICK_WINS = [
  { name: 'Void Hunter', aud: 'Owners', line: 'Voids vs your own peer median, by store and by name.' },
  { name: '3P Fee Finder', aud: 'Owners', line: 'What the marketplaces actually take. Contract vs effective rate, store by store.' },
  { name: 'Catering Leak', aud: 'Owners', line: 'Per-store catering economics + invoice-vs-POS reconciliation gap.' },
  { name: 'Labor Leak', aud: 'Managers', line: 'Overtime drift, ghost shifts, schedule-vs-clocked gaps.' },
  { name: 'Tip Variance', aud: 'Managers', line: 'Week-over-week tip movement — the leading indicator the POS misses.' },
  { name: 'Shift Pulse', aud: 'Front-line', line: 'Tonight\'s shift in one screen. Station median. Shift goal. Streak.' },
];

const FACTS = [
  ['Company', "Never 86'd · Inc."],
  ['Founder', 'Myke Mueller · operator-turned-founder'],
  ['Site', 'https://never86.ai'],
  ['Press', 'press@never86.ai'],
  ['Sales / operator', 'myke@n86.app'],
  ['Headquarters', 'Storm Lake, Iowa'],
  ['Product live', 'Restaurant financial intelligence · 6 live quick wins · gated Command Center'],
  ['Product coming', 'People-native AI · gamified shift + knowledge platform'],
  ['First design partner', 'Chef-led 16-unit fast-casual group (DC / NoVA / MD / VA / NC / TN)'],
  ['Verified reconciliation', '$15.72M · 545,677 orders'],
];

export default function PressKit() {
  return (
    <main className="min-h-screen text-dark-50">
      <header className="border-b border-white/5 sticky top-0 z-40 nav-shell print:hidden">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="brand-monogram">N86</span>
            <span className="font-display font-semibold tracking-tight text-dark-50 text-lg group-hover:text-gold-300 transition-colors">Never 86&apos;d</span>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-dark-200 hover:text-ink-800 px-3 py-1.5 rounded-lg hover:bg-white/[0.03] hidden sm:inline">Home</Link>
            <a href="javascript:window.print()" className="text-dark-50 border border-white/10 hover:border-gold-500/60 hover:bg-gold-500/5 rounded-lg px-3 py-1.5 transition-colors">Save as PDF</a>
          </div>
        </div>
      </header>

      <article className="max-w-4xl mx-auto px-6 pt-12 pb-20 print:pt-6">
        <div className="flex items-center gap-3 mb-8">
          <span className="brand-monogram" style={{ width: '2.5rem', height: '2.5rem', fontSize: '0.85rem', borderRadius: '0.65rem' }}>N86</span>
          <div>
            <p className="text-3xl font-bold text-ink-800 tracking-tight">Never 86&apos;d</p>
            <p className="text-gold-400 text-sm">Restaurant financial intelligence · built by an operator, for operators</p>
          </div>
        </div>

        <section className="mb-12">
          <p className="text-gold-400 text-[10px] uppercase tracking-[0.25em] font-mono mb-3">Positioning</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.05] text-ink-800 mb-5">
            Find the leak. Name who owns it. Keep the receipt.
          </h1>
          <p className="text-dark-200 text-lg leading-relaxed max-w-3xl">
            Operator-turned-founder native AI for multi-unit restaurants. We read every dollar your restaurants move, find where it&apos;s leaking, and show our work on every number. Every figure ships tagged
            <span className="text-green-300"> Verified</span>,
            <span className="text-gold-300"> Estimated</span>, or
            <span className="text-red-300"> Unverified</span>. We sit outside the stack — next to your POS, not inside it.
          </p>
        </section>

        <section className="mb-12">
          <p className="text-gold-400 text-[10px] uppercase tracking-[0.25em] font-mono mb-3">Three receipts</p>
          <div className="grid md:grid-cols-3 gap-4">
            {RECEIPTS.map((r) => (
              <div key={r.l} className="elevated-card rounded-2xl p-6">
                <p className="font-mono tabular-nums text-2xl font-bold mb-2 text-dark-50">{r.v}</p>
                <p className="text-gold-400 text-[10px] uppercase tracking-[0.22em] font-mono mb-2">{r.l}</p>
                <p className="text-dark-200 text-sm leading-relaxed">{r.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <p className="text-gold-400 text-[10px] uppercase tracking-[0.25em] font-mono mb-3">Two products · one platform</p>
          <div className="grid md:grid-cols-2 gap-4">
            {PRODUCTS.map((p) => (
              <div key={p.name} className="elevated-card rounded-2xl p-6">
                <p className="text-[10px] uppercase tracking-[0.18em] font-mono mb-1.5 text-dark-300">{p.status}</p>
                <p className="text-xl font-semibold text-ink-800 mb-2 tracking-tight">{p.name}</p>
                <p className="text-dark-200 text-sm leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <p className="text-gold-400 text-[10px] uppercase tracking-[0.25em] font-mono mb-3">Six live quick wins · three audiences</p>
          <div className="grid md:grid-cols-2 gap-3">
            {QUICK_WINS.map((q) => (
              <div key={q.name} className="elevated-card rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-ink-800 font-semibold">{q.name}</p>
                  <span className="text-copper-300 text-[10px] uppercase tracking-[0.18em] font-mono">For {q.aud}</span>
                </div>
                <p className="text-dark-200 text-sm leading-relaxed">{q.line}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12 elevated-card rounded-2xl p-8 border-gold-500/40">
          <p className="text-gold-400 text-[10px] uppercase tracking-[0.25em] font-mono mb-3">The discipline is the product</p>
          <p className="text-dark-100 text-base leading-relaxed">
            Most vendors inflate the number to look impressive. We did the opposite. When our model overstated the
            recovery surface, we corrected it down to the figure we can defend to the penny:
            <span className="font-mono tabular-nums text-ink-800"> $8.3M → $1.81M</span>. That walk-back is the product —
            the discipline of correcting your own number is the moat.
          </p>
        </section>

        <section className="mb-12">
          <p className="text-gold-400 text-[10px] uppercase tracking-[0.25em] font-mono mb-3">Founder</p>
          <div className="elevated-card rounded-2xl p-6">
            <p className="text-xl font-semibold text-ink-800 tracking-tight mb-1">Myke Mueller · Founder &amp; CEO</p>
            <p className="text-gold-400 text-sm mb-4">Operator first. Founder second.</p>
            <p className="text-dark-200 leading-relaxed">
              Myke runs Community Tap &amp; Pizza in Storm Lake, Iowa, a 41-staff people-first restaurant — and built never86&apos;d on the back of two decades of operator pain.
              The platform exists because he refused to read another monthly P&amp;L that nobody could defend
              line by line. Operator-turned-founder native AI is the thesis: the product
              doesn&apos;t replace the brain, it scales it.
            </p>
            <p className="text-dark-300 text-sm mt-4">
              Available for: founder interviews · operator podcasts · restaurant-industry trade press · multi-unit operator panels.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <p className="text-gold-400 text-[10px] uppercase tracking-[0.25em] font-mono mb-3">Fast facts</p>
          <div className="elevated-card rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-white/5">
                {FACTS.map(([k, v]) => (
                  <tr key={k}>
                    <td className="px-5 py-3 text-dark-300 font-mono text-[11px] uppercase tracking-wider w-1/3">{k}</td>
                    <td className="px-5 py-3 text-dark-50">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-12">
          <p className="text-gold-400 text-[10px] uppercase tracking-[0.25em] font-mono mb-3">For operators · try a quick win</p>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href="/demo/void-hunter" className="border border-white/10 rounded-lg px-3 py-2 hover:border-gold-400/60 hover:text-gold-300 transition-colors">Void Hunter →</Link>
            <Link href="/demo/3p-fee-finder" className="border border-white/10 rounded-lg px-3 py-2 hover:border-gold-400/60 hover:text-gold-300 transition-colors">3P Fee Finder →</Link>
            <Link href="/demo/catering-leak" className="border border-white/10 rounded-lg px-3 py-2 hover:border-gold-400/60 hover:text-gold-300 transition-colors">Catering Leak →</Link>
            <Link href="/demo/labor-leak" className="border border-white/10 rounded-lg px-3 py-2 hover:border-gold-400/60 hover:text-gold-300 transition-colors">Labor Leak →</Link>
            <Link href="/demo/tip-variance" className="border border-white/10 rounded-lg px-3 py-2 hover:border-gold-400/60 hover:text-gold-300 transition-colors">Tip Variance →</Link>
            <Link href="/demo/shift-pulse" className="border border-white/10 rounded-lg px-3 py-2 hover:border-gold-400/60 hover:text-gold-300 transition-colors">Shift Pulse →</Link>
            <Link href="/answers" className="border border-gold-500/40 rounded-lg px-3 py-2 hover:border-gold-400 hover:text-gold-300 transition-colors">Read the answers →</Link>
          </div>
        </section>
      </article>

      <footer className="border-t border-white/5 print:hidden">
        <div className="max-w-4xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-3 text-dark-300 text-xs">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.25rem', height: '1.25rem', fontSize: '0.55rem' }}>N86</span>
            <span>Never 86&apos;d · Built by an operator, for operators</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="mailto:press@never86.ai" className="hover:text-gold-300 transition-colors">press@never86.ai</a>
            <Link href="/operators#talk" className="hover:text-gold-300 transition-colors">Talk to us</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
