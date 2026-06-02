import Link from 'next/link';
import type { Metadata } from 'next';
import { listPublishedAnswers } from '@/lib/answersDb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: "Answers · Never 86'd",
  description:
    'Operator-to-operator answers on restaurant financial intelligence, 3P delivery economics, void hunting, labor leak, and people-native AI — sourced from the never86 build.',
  openGraph: {
    title: "Answers · Never 86'd",
    description: 'Restaurant operator answers, sourced to the platform.',
    url: 'https://never86.ai/answers',
  },
};

export default async function AnswersIndex() {
  const answers = await listPublishedAnswers();

  return (
    <main className="min-h-screen text-dark-50">
      <header className="border-b border-white/5 sticky top-0 z-40 nav-shell">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="brand-monogram">N86</span>
            <span className="font-display font-semibold tracking-tight text-dark-50 text-lg group-hover:text-gold-300 transition-colors">Never 86&apos;d</span>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-dark-200 hover:text-ink-800 px-3 py-1.5 rounded-lg hover:bg-white/[0.03] hidden sm:inline">Home</Link>
            <Link href="/operators" className="text-dark-200 hover:text-ink-800 px-3 py-1.5 rounded-lg hover:bg-white/[0.03]">For operators</Link>
            <Link href="/reports/login" className="text-dark-50 border border-white/10 hover:border-gold-500/60 hover:bg-gold-500/5 rounded-lg px-3 py-1.5 transition-colors">Sign in</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0 opacity-40 pointer-events-none" />
        <div className="hero-orb pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 mb-6">
            <span className="text-[11px] uppercase tracking-[0.18em] font-mono text-dark-100">Operator answers · source-tagged</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.04] mb-5 text-ink-800">
            Answers, not <span className="bg-clip-text text-transparent bg-gradient-to-r from-gold-300 to-copper-400">opinions</span>.
          </h1>
          <p className="text-dark-200 text-lg max-w-2xl leading-relaxed">
            One question, one defensible answer. Written by an operator-turned-founder, sourced to the same
            data the platform ships every figure with — Verified, Estimated, or Unverified.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pt-6 pb-20">
        {answers.length === 0 ? (
          <p className="text-dark-300 text-sm">No answers published yet. Check back soon.</p>
        ) : (
          <div className="space-y-3">
            {answers.map((a) => (
              <Link
                key={a.id}
                href={`/answers/${a.slug}`}
                className="elevated-card block rounded-2xl p-6 transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  {a.audience ? (
                    <span className="text-copper-300 text-[10px] uppercase tracking-[0.18em] font-mono">For {a.audience}</span>
                  ) : <span />}
                  <span className="text-dark-400 text-[10px] uppercase tracking-[0.18em] font-mono">{a.publishedAt?.slice(0, 10) ?? ''}</span>
                </div>
                <h2 className="text-xl md:text-2xl font-semibold text-ink-800 tracking-tight mb-2">{a.title}</h2>
                {a.question ? <p className="text-dark-300 text-sm italic mb-2">Q: {a.question}</p> : null}
                <p className="text-dark-200 text-sm leading-relaxed line-clamp-3">{a.answer}</p>
                <p className="text-gold-300 hover:text-gold-200 text-sm font-semibold mt-3 inline-flex items-center gap-1">
                  Read the answer <span aria-hidden>→</span>
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-3 text-dark-300 text-xs">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.25rem', height: '1.25rem', fontSize: '0.55rem' }}>N86</span>
            <span>Never 86&apos;d · Built by an operator, for operators</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/operators" className="hover:text-gold-300 transition-colors">For operators</Link>
            <Link href="/reports/login" className="hover:text-gold-300 transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
