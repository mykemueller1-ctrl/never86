import Link from 'next/link';

const ALL_AGENTS = [
  { name: 'Void Hunter', href: '/demo/void-hunter' },
  { name: '3P Fee Finder', href: '/demo/3p-fee-finder' },
  { name: 'Labor Leak', href: '/demo/labor-leak' },
  { name: 'Tip Variance', href: '/demo/tip-variance' },
  { name: 'Catering Leak', href: '/demo/catering-leak' },
  { name: 'Shift Pulse', href: '/demo/shift-pulse' },
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
  const others = ALL_AGENTS.filter((a) => a.name !== title);

  return (
    <main className="min-h-screen text-ink-800">
      <header className="nav-shell sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="brand-monogram" style={{ width: '1.4rem', height: '1.4rem', fontSize: '0.55rem' }}>N86</span>
            <span className="font-semibold tracking-tighter text-ink-800 text-[15px]">Never 86&apos;d</span>
          </Link>
          <nav className="flex items-center gap-1 text-[13px] text-ink-600">
            <Link href="/" className="px-3 py-1.5 rounded-full hover:text-ink-800 hover:bg-black/[0.04] hidden sm:inline">All agents</Link>
            <Link href="/operators#talk" className="btn-primary py-1.5 px-4 text-[13px]">Connect your data →</Link>
          </nav>
        </div>
      </header>

      {/* Demo title — minimal */}
      <section className="pt-16 md:pt-20 pb-6 px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="display text-4xl md:text-6xl tracking-tighter">{title}</h1>
          {sample ? <p className="text-ink-500 text-[12px] font-semibold uppercase tracking-widest mt-3">Sample data · live demo</p> : null}
        </div>
      </section>

      {/* Demo body */}
      <div className="max-w-5xl mx-auto px-6 pb-12">{children}</div>

      {/* Hop between agents */}
      <section className="border-t border-ink-200 bg-ink-100 px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {others.map((a) => (
              <Link key={a.name} href={a.href} className="card group p-4 block text-center hover:-translate-y-0.5">
                <p className="text-ink-800 font-semibold text-[14px] tracking-tighter">{a.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-ink-200 py-8 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-ink-500 text-[12px]">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.1rem', height: '1.1rem', fontSize: '0.5rem' }}>N86</span>
            <span>Never 86&apos;d</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/for" className="hover:text-ink-800 transition-colors">Seats</Link>
            <Link href="/" className="hover:text-ink-800 transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
