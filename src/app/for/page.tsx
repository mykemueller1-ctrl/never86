import Link from 'next/link';
import type { Metadata } from 'next';
import { ROLES, ROLE_ORDER } from '@/lib/roles';

export const metadata: Metadata = {
  title: "Pick your seat · Never 86'd",
  description: 'Seven roles. Each one sees the screen they need.',
  openGraph: {
    title: "Never 86'd · Pick your seat",
    description: 'Seven roles. Each one sees the screen they need.',
    url: 'https://never86.ai/for',
  },
  alternates: { canonical: 'https://never86.ai/for' },
};

export default function ForIndex() {
  return (
    <main className="min-h-screen text-ink-800">
      <header className="nav-shell sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="brand-monogram" style={{ width: '1.4rem', height: '1.4rem', fontSize: '0.55rem' }}>N86</span>
            <span className="font-semibold tracking-tighter text-ink-800 text-[15px]">Never 86&apos;d</span>
          </Link>
          <nav className="flex items-center gap-1 text-[13px] text-ink-600">
            <Link href="/" className="px-3 py-1.5 rounded-full hover:text-ink-800 hover:bg-black/[0.04] hidden sm:inline">Home</Link>
            <Link href="/operators#talk" className="btn-primary py-1.5 px-4 text-[13px]">Talk to us</Link>
          </nav>
        </div>
      </header>

      <section className="pt-24 md:pt-32 pb-16 md:pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="display text-5xl md:text-7xl lg:text-8xl mb-6">Pick your seat.</h1>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ROLE_ORDER.map((slug) => {
              const r = ROLES[slug];
              return (
                <Link key={r.slug} href={`/for/${r.slug}`} className="card group p-8 block hover:-translate-y-0.5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500 mb-2">For the</p>
                  <p className="display text-3xl text-ink-800 mb-4">{r.badge}</p>
                  <p className="text-ink-800 font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">See it <span aria-hidden>→</span></p>
                </Link>
              );
            })}
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
            <Link href="/answers" className="hover:text-ink-800 transition-colors">Answers</Link>
            <Link href="/press" className="hover:text-ink-800 transition-colors">Press</Link>
            <Link href="/" className="hover:text-ink-800 transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
