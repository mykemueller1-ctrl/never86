import Link from 'next/link';
import type { Metadata } from 'next';
import { ROLES, ROLE_ORDER } from '@/lib/roles';

export const metadata: Metadata = {
  title: "Pick your seat · Never 86'd",
  description:
    'Pick your role — CEO, CFO, COO, CTO, independent owner, manager, or crew. We\'ll show you exactly what we put in front of you, and one free agent you can try right now.',
  openGraph: {
    title: 'Never 86\'d · Pick your seat',
    description: 'Role-routed views — each one shows the leak we surface for you, not how we do it.',
    url: 'https://never86.ai/for',
  },
  alternates: { canonical: 'https://never86.ai/for' },
};

export default function ForIndex() {
  return (
    <main className="min-h-screen text-dark-50">
      <header className="border-b border-white/5 sticky top-0 z-40 nav-shell">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="brand-monogram">N86</span>
            <span className="font-display font-semibold tracking-tight text-dark-50 text-lg group-hover:text-gold-300 transition-colors">Never 86&apos;d</span>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/answers" className="text-dark-200 hover:text-ink-800 px-3 py-1.5 rounded-lg hover:bg-white/[0.03] hidden sm:inline">Answers</Link>
            <Link href="/operators#talk" className="text-dark-50 border border-white/10 hover:border-gold-500/60 hover:bg-gold-500/5 rounded-lg px-3 py-1.5 transition-colors">Talk to us</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0 opacity-40 pointer-events-none" />
        <div className="hero-orb pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 mb-6">
            <span className="text-[11px] uppercase tracking-[0.18em] font-mono text-dark-100">Role-routed · pick your seat</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.04] text-ink-800 mb-5">
            Who are you on this network?
          </h1>
          <p className="text-dark-200 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-8">
            Each role gets the screen they actually need — not the screen the back office hands them.
            And every role gets at least three free agents to try right now, no login.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ROLE_ORDER.map((slug) => {
            const r = ROLES[slug];
            const tone =
              r.tone === 'copper' ? 'border-copper-500/30 hover:border-copper-400/60'
              : r.tone === 'mixed' ? 'border-gold-500/30 hover:border-gold-400/60'
              : 'border-gold-500/30 hover:border-gold-400/60';
            return (
              <Link key={r.slug} href={`/for/${r.slug}`} className={`elevated-card rounded-2xl p-6 block transition-all hover:-translate-y-0.5 ${tone}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-block w-1.5 h-6 rounded-full ${r.tone === 'copper' ? 'bg-copper-400' : r.tone === 'mixed' ? 'bg-gradient-to-b from-gold-400 to-copper-400' : 'bg-gold-400'}`} />
                  <span className="text-[10px] uppercase tracking-[0.18em] font-mono text-dark-300">{r.badge}</span>
                </div>
                <p className="text-ink-800 font-semibold text-xl tracking-tight mb-2">{r.audience.replace(/^For /, '')}</p>
                <p className="text-dark-200 text-sm leading-relaxed mb-4 line-clamp-3">{r.intro}</p>
                <div className="flex items-center justify-between">
                  <p className="text-gold-300 text-sm font-semibold inline-flex items-center gap-1">See your view <span aria-hidden>→</span></p>
                  <span className="text-[10px] uppercase tracking-[0.18em] font-mono text-green-300 border border-green-500/30 rounded px-1.5 py-0.5">⚡ {r.freeAgents.length} free agents</span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/[0.06] px-3 py-1.5 mb-4">
            <span className="text-[11px] uppercase tracking-[0.18em] font-mono text-gold-300">⚡ Free agents · no login · no card</span>
          </div>
          <p className="text-dark-200 max-w-xl mx-auto">
            Six live demos at <Link href="/operators" className="text-gold-300 hover:text-gold-200 underline">/operators</Link>. Each runs on clearly-labeled sample data so you can see the shape before bringing your own.
          </p>
        </div>
      </section>

      <footer className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-3 text-dark-300 text-xs">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.25rem', height: '1.25rem', fontSize: '0.55rem' }}>N86</span>
            <span>Never 86&apos;d · Built by an operator, for operators</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/answers" className="hover:text-gold-300 transition-colors">Answers</Link>
            <Link href="/press" className="hover:text-gold-300 transition-colors">Press</Link>
            <Link href="/" className="hover:text-gold-300 transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
