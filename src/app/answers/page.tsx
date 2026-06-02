import Link from 'next/link';
import type { Metadata } from 'next';
import { listPublishedAnswers } from '@/lib/answersDb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: "Answers · Never 86'd",
  description: 'Operator-to-operator answers, sourced to the platform.',
  openGraph: {
    title: "Answers · Never 86'd",
    description: 'Operator-to-operator answers, sourced to the platform.',
    url: 'https://never86.ai/answers',
  },
};

export default async function AnswersIndex() {
  const answers = await listPublishedAnswers();

  return (
    <main className="min-h-screen text-ink-800">
      <header className="nav-shell sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="brand-monogram" style={{ width: '1.4rem', height: '1.4rem', fontSize: '0.55rem' }}>N86</span>
            <span className="font-semibold tracking-tighter text-ink-800 text-[15px]">Never 86&apos;d</span>
          </Link>
          <nav className="flex items-center gap-1 text-[13px] text-ink-600">
            <Link href="/" className="px-3 py-1.5 rounded-full hover:text-ink-800 hover:bg-black/[0.04] hidden sm:inline">Home</Link>
            <Link href="/reports/login" className="px-3 py-1.5 rounded-full text-ink-800 hover:bg-black/[0.04] font-medium">Sign in</Link>
          </nav>
        </div>
      </header>

      <section className="pt-24 md:pt-32 pb-12 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="display text-5xl md:text-7xl mb-4">Answers, not opinions.</h1>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-20">
        {answers.length === 0 ? (
          <p className="text-ink-500 text-sm text-center">No answers published yet.</p>
        ) : (
          <div className="space-y-3">
            {answers.map((a) => (
              <Link key={a.id} href={`/answers/${a.slug}`} className="card block p-6 hover:-translate-y-0.5 transition-all">
                {a.audience ? (
                  <p className="text-ink-500 text-[11px] uppercase tracking-widest font-medium mb-2">For {a.audience}</p>
                ) : null}
                <h2 className="text-xl md:text-2xl font-semibold text-ink-800 tracking-tighter mb-2">{a.title}</h2>
                {a.question ? <p className="text-ink-500 text-sm italic mb-2">{a.question}</p> : null}
                <p className="text-ink-600 text-sm leading-relaxed line-clamp-3">{a.answer}</p>
                <p className="text-ink-800 font-medium mt-3 inline-flex items-center gap-1">Read it <span aria-hidden>→</span></p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-ink-200 py-10 px-6 bg-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-ink-500 text-[12px]">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.1rem', height: '1.1rem', fontSize: '0.5rem' }}>N86</span>
            <span>Never 86&apos;d</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/for" className="hover:text-ink-800 transition-colors">Seats</Link>
            <Link href="/reports/login" className="hover:text-ink-800 transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
