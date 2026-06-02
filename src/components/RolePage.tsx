import Link from 'next/link';
import type { RoleSpec } from '@/lib/roles';
import { Track } from '@/components/Track';

export function RolePage({ spec }: { spec: RoleSpec }) {
  return (
    <main className="min-h-screen text-ink-800">
      <Track eventType="role_view" audience={spec.badge} />
      <header className="nav-shell sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="brand-monogram" style={{ width: '1.4rem', height: '1.4rem', fontSize: '0.55rem' }}>N86</span>
            <span className="font-semibold tracking-tighter text-ink-800 text-[15px]">Never 86&apos;d</span>
          </Link>
          <nav className="flex items-center gap-1 text-[13px] text-ink-600">
            <Link href="/for" className="px-3 py-1.5 rounded-full hover:text-ink-800 hover:bg-black/[0.04] hidden sm:inline">All seats</Link>
            <Link href="/operators#talk" className="btn-primary py-1.5 px-4 text-[13px]">Talk to us</Link>
          </nav>
        </div>
      </header>

      {/* Hero — nothing else */}
      <section className="pt-28 md:pt-40 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-ink-500 text-[12px] font-semibold uppercase tracking-widest mb-6">For the {spec.badge}</p>
          <h1 className="display text-5xl md:text-7xl lg:text-8xl mb-10">
            {spec.headline.l1}<br />
            {spec.headline.gradient}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href={spec.freeAgents[0].href} className="btn-primary">Try {spec.freeAgents[0].name}</Link>
            <Link href="/operators#talk" className="btn-secondary">Talk to us</Link>
          </div>
        </div>
      </section>

      {/* Three free agents */}
      <section className="py-16 md:py-24 px-6 bg-ink-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-4">
            {spec.freeAgents.map((w) => (
              <Link key={w.name} href={w.href} className="card group p-10 block hover:-translate-y-0.5 text-center">
                <p className="display text-2xl text-ink-800 mb-3">{w.name}</p>
                <p className="text-ink-800 font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">Try it free <span aria-hidden>→</span></p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-ink-200 py-10 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-ink-500 text-[12px]">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.1rem', height: '1.1rem', fontSize: '0.5rem' }}>N86</span>
            <span>Never 86&apos;d</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/for" className="hover:text-ink-800 transition-colors">All seats</Link>
            <Link href="/" className="hover:text-ink-800 transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
