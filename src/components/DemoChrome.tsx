import Link from 'next/link';

const ALL_AGENTS = [
  { name: 'Void Hunter', href: '/demo/void-hunter', aud: 'Owner' },
  { name: '3P Fee Finder', href: '/demo/3p-fee-finder', aud: 'CFO' },
  { name: 'Labor Leak', href: '/demo/labor-leak', aud: 'COO' },
  { name: 'Tip Variance', href: '/demo/tip-variance', aud: 'Manager' },
  { name: 'Catering Leak', href: '/demo/catering-leak', aud: 'Owner' },
  { name: 'Shift Pulse', href: '/demo/shift-pulse', aud: 'Crew' },
];

export function DemoChrome({
  audience,
  sample,
  title,
  tagline,
  children,
}: {
  audience: 'owner' | 'manager' | 'frontline';
  sample?: boolean;
  title: string;
  tagline: string;
  children: React.ReactNode;
}) {
  const audLabel = audience === 'owner' ? 'For Owners' : audience === 'manager' ? 'For Managers' : 'For the Crew';
  const others = ALL_AGENTS.filter((a) => a.name !== title);

  return (
    <main className="min-h-screen text-ink-800">
      {/* Top shell */}
      <header className="nav-shell sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="brand-monogram" style={{ width: '1.4rem', height: '1.4rem', fontSize: '0.55rem' }}>N86</span>
            <span className="font-semibold tracking-tighter text-ink-800 text-[15px]">Never 86&apos;d</span>
          </Link>
          <nav className="flex items-center gap-1 text-[13px] text-ink-600">
            <Link href="/" className="px-3 py-1.5 rounded-full hover:text-ink-800 hover:bg-black/[0.04] hidden sm:inline">All free agents</Link>
            <Link href="/for" className="px-3 py-1.5 rounded-full hover:text-ink-800 hover:bg-black/[0.04] hidden md:inline">Pick your seat</Link>
            <Link href="/operators#talk" className="btn-primary py-1.5 px-4 text-[13px]">Connect your data →</Link>
          </nav>
        </div>
      </header>

      {/* Demo title */}
      <section className="pt-16 md:pt-20 pb-8 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">{audLabel}</span>
            <span className="text-ink-300">·</span>
            <span className="text-[11px] font-medium text-success-500 inline-flex items-center gap-1.5">
              <span className="live-dot" style={{ width: '0.4rem', height: '0.4rem', boxShadow: '0 0 0 3px rgba(52,199,89,0.15)' }} />
              {sample ? 'Live demo · sample data' : 'Live · your data'}
            </span>
          </div>
          <h1 className="display text-4xl md:text-6xl mb-4 tracking-tighter">{title}</h1>
          <p className="text-ink-600 text-lg md:text-xl leading-relaxed max-w-2xl">{tagline}</p>
        </div>
      </section>

      {/* Demo body */}
      <div className="max-w-5xl mx-auto px-6 pb-12">{children}</div>

      {/* Footer — hop between agents */}
      <section className="border-t border-ink-200 bg-ink-100 px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-ink-500 mb-4 text-center">Try another free agent</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {others.map((a) => (
              <Link key={a.name} href={a.href} className="card group p-4 block text-center hover:-translate-y-0.5">
                <p className="text-ink-800 font-semibold text-[15px] tracking-tighter mb-1">{a.name}</p>
                <p className="text-ink-500 text-[11px] uppercase tracking-widest">For {a.aud}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* End-of-page CTA */}
      <section className="py-16 px-6 text-center">
        <h2 className="display text-3xl md:text-5xl mb-4">Like what you see?</h2>
        <p className="text-ink-600 text-lg mb-7 max-w-xl mx-auto">15 minutes. Bring one store&apos;s last month. We&apos;ll run our reconciliation live and show you what your real screen looks like.</p>
        <Link href="/operators#talk" className="btn-primary">Book 15 minutes →</Link>
      </section>

      <footer className="border-t border-ink-200 py-10 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-ink-500 text-[12px]">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.1rem', height: '1.1rem', fontSize: '0.5rem' }}>N86</span>
            <span>Never 86&apos;d · Built by an operator, for operators</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/for" className="hover:text-ink-800 transition-colors">Pick your seat</Link>
            <Link href="/answers" className="hover:text-ink-800 transition-colors">Answers</Link>
            <Link href="/" className="hover:text-ink-800 transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
