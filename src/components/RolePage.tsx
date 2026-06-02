import Link from 'next/link';
import type { RoleSpec } from '@/lib/roles';

export function RolePage({ spec }: { spec: RoleSpec }) {
  return (
    <main className="min-h-screen text-ink-800">
      <header className="nav-shell sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="brand-monogram" style={{ width: '1.4rem', height: '1.4rem', fontSize: '0.55rem' }}>N86</span>
            <span className="font-semibold tracking-tighter text-ink-800 text-[15px]">Never 86&apos;d</span>
          </Link>
          <nav className="flex items-center gap-1 text-[13px] text-ink-600">
            <Link href="/for" className="px-3 py-1.5 rounded-full hover:text-ink-800 hover:bg-black/[0.04] hidden sm:inline">All roles</Link>
            <Link href="/answers" className="px-3 py-1.5 rounded-full hover:text-ink-800 hover:bg-black/[0.04] hidden md:inline">Answers</Link>
            <Link href="/operators#talk" className="btn-primary py-1.5 px-4 text-[13px]">Talk to us</Link>
          </nav>
        </div>
      </header>

      <section className="pt-20 md:pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-ink-500 text-[12px] font-semibold uppercase tracking-widest mb-5">{spec.audience}</p>
          <h1 className="display text-5xl md:text-7xl mb-6">
            {spec.headline.l1}<br />
            {spec.headline.gradient}<br />
            <span className="text-ink-500">{spec.headline.l3}</span>
          </h1>
          <p className="text-ink-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-8">{spec.intro}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href={spec.freeAgents[0].href} className="btn-primary">⚡ Try {spec.freeAgents[0].name} — free</Link>
            <Link href="/operators#talk" className="btn-secondary">Book 15 minutes</Link>
          </div>
          <p className="text-[12px] text-ink-500 mt-5">No login. No card. 60 seconds.</p>
        </div>
      </section>

      <section className="py-16 md:py-20 px-6 bg-ink-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="card p-7">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500 mb-4">What it feels like today</p>
              <ul className="space-y-3.5">
                {spec.pains.map((p) => (
                  <li key={p} className="text-ink-700 leading-relaxed flex items-start gap-3">
                    <span className="text-danger-500 mt-1 text-sm">●</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-7" style={{ borderColor: '#1d1d1f' }}>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-800 mb-4">What we put in front of you</p>
              <ul className="space-y-3.5">
                {spec.reliefs.map((r) => (
                  <li key={r} className="text-ink-700 leading-relaxed flex items-start gap-3">
                    <span className="text-success-500 mt-1 text-sm">●</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-ink-500 text-[12px] font-semibold uppercase tracking-widest mb-3">Three free agents for you</p>
            <h2 className="display text-4xl md:text-5xl mb-4">Try one. Right now.</h2>
            <p className="text-ink-600 text-lg">No login. No card. Sample data on a real platform.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {spec.freeAgents.map((w) => (
              <Link key={w.name} href={w.href} className="card group p-7 block hover:-translate-y-0.5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-ink-800 font-semibold text-xl tracking-tighter">{w.name}</p>
                  <span className="text-[11px] font-medium text-success-500 inline-flex items-center gap-1.5">
                    <span className="live-dot" style={{ width: '0.4rem', height: '0.4rem', boxShadow: '0 0 0 3px rgba(52,199,89,0.15)' }} />
                    Live
                  </span>
                </div>
                <p className="text-ink-600 leading-relaxed mb-5">{w.line}</p>
                <p className="text-ink-800 font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">⚡ Try it free <span aria-hidden>→</span></p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 px-6 bg-ink-100">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-ink-500 text-[12px] font-semibold uppercase tracking-widest mb-4">What you will never see</p>
          <p className="display text-4xl md:text-6xl mb-6">How we do it.</p>
          <p className="text-ink-600 text-lg md:text-xl leading-relaxed">
            You will never see a table name, a query, a model architecture, or a vendor logo on your screen.
            You&apos;ll see the leak, the name on it, and the next move — sourced to a tag you can question.
            <span className="text-ink-800 font-semibold"> The discipline is the product.</span>
          </p>
        </div>
      </section>

      {spec.answers.length > 0 ? (
        <section className="py-16 md:py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-ink-500 text-[12px] font-semibold uppercase tracking-widest mb-3">Read first</p>
              <h2 className="display text-3xl md:text-4xl">Answers, sourced to the platform.</h2>
            </div>
            <div className="space-y-2.5">
              {spec.answers.map((a) => (
                <Link key={a.slug} href={`/answers/${a.slug}`} className="card block p-5 hover:-translate-y-0.5">
                  <p className="text-ink-800 font-medium">{a.t} <span className="text-ink-500 text-sm">→</span></p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="py-20 md:py-28 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="display text-4xl md:text-6xl mb-5">15 minutes. Receipts.</h2>
          <p className="text-ink-600 text-lg md:text-xl mb-9 leading-relaxed">{spec.bookCtaLine}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href={spec.freeAgents[0].href} className="btn-secondary">⚡ Try {spec.freeAgents[0].name} first</Link>
            <Link href="/operators#talk" className="btn-primary">Book 15 minutes →</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink-200 py-10 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-ink-500 text-[12px]">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.1rem', height: '1.1rem', fontSize: '0.5rem' }}>N86</span>
            <span>Never 86&apos;d · Built by an operator, for operators</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/for" className="hover:text-ink-800 transition-colors">All roles</Link>
            <Link href="/answers" className="hover:text-ink-800 transition-colors">Answers</Link>
            <Link href="/" className="hover:text-ink-800 transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
