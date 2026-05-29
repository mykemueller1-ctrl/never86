import Link from 'next/link';

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
  const audLabel = audience === 'owner' ? 'For owners' : audience === 'manager' ? 'For managers' : 'For the crew';
  return (
    <main className="min-h-screen text-dark-50">
      <header className="border-b border-white/5 sticky top-0 z-40 bg-dark-900/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="brand-monogram">N86</span>
            <span className="font-display font-semibold tracking-tight text-dark-50 text-lg group-hover:text-gold-300 transition-colors">Never 86&apos;d</span>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-dark-200 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/[0.03] hidden sm:inline">All quick wins</Link>
            <Link href="/operators#talk" className="text-dark-50 border border-white/10 hover:border-gold-500/60 hover:bg-gold-500/5 rounded-lg px-3 py-1.5 transition-colors">Talk to us</Link>
          </div>
        </div>
      </header>

      <div className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0 opacity-40 pointer-events-none" />
        <div className="hero-orb pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-6 pt-10 pb-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 mb-4">
            <span className="live-dot" />
            <span className="text-[10px] uppercase tracking-[0.18em] font-mono text-dark-100">
              {sample ? 'Demo · sample data' : 'Live · your data'} · {audLabel}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-2">{title}</h1>
          <p className="text-dark-200 text-lg leading-relaxed max-w-2xl">{tagline}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-8 pb-16">{children}</div>
    </main>
  );
}
