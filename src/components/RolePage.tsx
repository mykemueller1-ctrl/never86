import Link from 'next/link';
import type { RoleSpec } from '@/lib/roles';

export function RolePage({ spec }: { spec: RoleSpec }) {
  const toneAccentBg =
    spec.tone === 'copper' ? 'bg-copper-500/[0.06] border-copper-500/30'
    : spec.tone === 'mixed' ? 'bg-gradient-to-r from-gold-500/[0.06] to-copper-500/[0.06] border-gold-500/30'
    : 'bg-gold-500/[0.06] border-gold-500/30';
  const toneText = spec.tone === 'copper' ? 'text-copper-300' : 'text-gold-300';

  return (
    <main className="min-h-screen text-dark-50">
      <header className="border-b border-white/5 sticky top-0 z-40 bg-dark-900/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="brand-monogram">N86</span>
            <span className="font-display font-semibold tracking-tight text-dark-50 text-lg group-hover:text-gold-300 transition-colors">Never 86&apos;d</span>
          </Link>
          <div className="flex items-center gap-1.5 text-sm">
            <Link href="/for" className="text-dark-200 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/[0.03] hidden sm:inline">All roles</Link>
            <Link href="/answers" className="text-dark-200 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/[0.03] hidden md:inline">Answers</Link>
            <Link href="/operators#talk" className="text-dark-50 border border-white/10 hover:border-gold-500/60 hover:bg-gold-500/5 rounded-lg px-3 py-1.5 transition-colors">Talk to us</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0 opacity-40 pointer-events-none" />
        <div className="hero-orb pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-12">
          <div className={`inline-flex items-center gap-2 rounded-full border ${toneAccentBg} px-3 py-1.5 mb-6`}>
            <span className={`text-[11px] uppercase tracking-[0.18em] font-mono ${toneText}`}>{spec.audience}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.04] text-white mb-6">
            {spec.headline.l1}<br className="hidden sm:block" />{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gold-300 via-gold-400 to-copper-400">{spec.headline.gradient}</span><br className="hidden sm:block" />
            {spec.headline.l3}
          </h1>
          <p className="text-dark-200 text-lg md:text-xl max-w-2xl leading-relaxed mb-8">{spec.intro}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href={spec.freeAgents[0].href} className="bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-300 hover:to-gold-400 text-dark-900 font-semibold rounded-lg px-7 py-3.5 shadow-gold-glow transition-all hover:scale-[1.02]">
              ⚡ Try {spec.freeAgents[0].name} free → no login
            </Link>
            <Link href="/operators#talk" className="border border-white/12 hover:border-gold-400/60 text-dark-50 hover:text-white rounded-lg px-7 py-3.5 bg-white/[0.02] hover:bg-white/[0.05] transition-all">
              Book 15 minutes
            </Link>
          </div>
        </div>
      </section>

      {/* Pain vs Relief */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-5">
          <div className="elevated-card rounded-2xl p-7">
            <p className="text-copper-300 text-[10px] uppercase tracking-[0.22em] font-mono mb-3">What it feels like today</p>
            <ul className="space-y-3">
              {spec.pains.map((p) => (
                <li key={p} className="text-dark-100 leading-relaxed flex items-start gap-3">
                  <span className="text-copper-400 mt-1.5 text-xs">●</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={`elevated-card rounded-2xl p-7 ${spec.tone === 'copper' ? 'border-copper-500/30' : 'border-gold-500/30'}`}>
            <p className="text-gold-300 text-[10px] uppercase tracking-[0.22em] font-mono mb-3">What we put in front of you</p>
            <ul className="space-y-3">
              {spec.reliefs.map((r) => (
                <li key={r} className="text-dark-100 leading-relaxed flex items-start gap-3">
                  <span className="text-gold-400 mt-1.5 text-xs">●</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Free agents — try now */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/[0.08] px-3 py-1.5 mb-4">
            <span className="text-[11px] uppercase tracking-[0.18em] font-mono text-gold-300">⚡ Free agents · no login · no card</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Three agents built for you. Try one now.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {spec.freeAgents.map((w) => (
            <Link key={w.name} href={w.href} className="elevated-card rounded-2xl p-6 block transition-all hover:-translate-y-0.5 hover:border-gold-400/60">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white font-semibold text-lg">{w.name}</p>
                <span className="text-[9px] uppercase tracking-[0.18em] font-mono text-green-300 border border-green-500/30 rounded px-1.5 py-0.5">live</span>
              </div>
              <p className="text-dark-200 text-sm leading-relaxed mb-4">{w.line}</p>
              <p className="text-gold-300 text-sm font-semibold inline-flex items-center gap-1">⚡ Try it free <span aria-hidden>→</span></p>
            </Link>
          ))}
        </div>
      </section>

      {/* What we won't show */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="relative overflow-hidden rounded-3xl border border-gold-700/40 bg-gradient-to-br from-dark-800 via-dark-800 to-dark-900 p-10 md:p-12">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(212,154,14,0.15), transparent 60%)' }} />
          <p className="relative text-gold-400 text-[10px] uppercase tracking-[0.25em] font-mono mb-4 text-center">What you will never see</p>
          <p className="relative text-2xl md:text-3xl font-bold text-center max-w-3xl mx-auto leading-tight mb-5 tracking-tight text-white">
            How we do it.
          </p>
          <p className="relative text-dark-200 max-w-2xl mx-auto leading-relaxed text-center">
            You will never see a table name, a query, a model architecture, or a vendor logo on your screen. You&apos;ll see the leak, the name on it, and the next move — sourced to a tag you can question. <span className="text-gold-300">The discipline is the product.</span>
          </p>
        </div>
      </section>

      {/* Answers */}
      {spec.answers.length > 0 ? (
        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="mb-6">
            <p className="text-gold-400 text-[10px] uppercase tracking-[0.25em] font-mono mb-3">Read first</p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Answers sourced to the platform.</h2>
          </div>
          <div className="space-y-2">
            {spec.answers.map((a) => (
              <Link key={a.slug} href={`/answers/${a.slug}`} className="elevated-card block rounded-xl p-4 transition-colors">
                <p className="text-dark-50 hover:text-gold-300 transition-colors">{a.t} <span className="text-dark-400 text-sm">→</span></p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Book CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 text-white">15 minutes. Receipts.</h2>
        <p className="text-dark-200 text-lg leading-relaxed mb-8">{spec.bookCtaLine}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href={spec.freeAgents[0].href} className="bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-300 hover:to-gold-400 text-dark-900 font-semibold rounded-lg px-7 py-3.5 shadow-gold-glow transition-all hover:scale-[1.02]">
            ⚡ Or try {spec.freeAgents[0].name} free first
          </Link>
          <Link href="/operators#talk" className="border border-white/12 hover:border-gold-400/60 text-dark-50 hover:text-white rounded-lg px-7 py-3.5 bg-white/[0.02] hover:bg-white/[0.05] transition-all">
            Book 15 minutes →
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-3 text-dark-300 text-xs">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.25rem', height: '1.25rem', fontSize: '0.55rem' }}>N86</span>
            <span>Never 86&apos;d · Built by an operator, for operators</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/for" className="hover:text-gold-300 transition-colors">All roles</Link>
            <Link href="/answers" className="hover:text-gold-300 transition-colors">Answers</Link>
            <Link href="/" className="hover:text-gold-300 transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
