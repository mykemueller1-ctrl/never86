import Link from 'next/link';
import type { Metadata } from 'next';
import { listPublishedAnswers } from '@/lib/answersDb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: "Restaurant operator answers · Never86'd",
  description: "Practical, source-aware answers on delivery-marketplace fees, payout reconciliation, restaurant AI, margin leaks, and multi-unit execution from Never86'd.",
  alternates: { canonical: 'https://never86.ai/answers' },
  openGraph: {
    title: "Restaurant operator answers · Never86'd",
    description: 'Evidence-first answers for restaurant owners, finance teams, and multi-unit operators.',
    url: 'https://never86.ai/answers',
  },
};

export default async function AnswersIndex() {
  const answers = await listPublishedAnswers();

  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <Link href="/" className="flex items-start gap-4 group min-w-0">
            <span className="compass-mark">N</span>
            <span className="min-w-0">
              <p className="font-serif text-[24px] leading-none text-ink-800">
                Never 86&apos;d <span className="italic text-ink-600">· answers</span>
              </p>
              <p className="compass-eyebrow-dim mt-2 break-words">Restaurant margin intelligence · published answers</p>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px]">
            <Link href="/" className="compass-pill"><span className="avatar">H</span><span>Home</span></Link>
            <Link href="/onboard" className="btn-primary" style={{ background: '#0066ff' }}>Onboard your store</Link>
          </nav>
        </div>
      </div>

      <section className="max-w-3xl mx-auto px-6 pt-16 md:pt-24 pb-12">
        <p className="compass-eyebrow mb-6">— Operator-to-operator</p>
        <h1 className="compass-display text-5xl md:text-7xl mb-6">
          Answers, <em>not opinions.</em>
        </h1>
        <p className="compass-body text-lg md:text-xl max-w-2xl">
          Practical answers for restaurant owners and multi-unit teams. We show the evidence boundary, name what is unknown, and put the restaurant&apos;s problem first.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-20">
        {answers.length === 0 ? (
          <p className="text-[#6e6e73] text-sm text-center compass-card">Answers are temporarily unavailable. Try the free marketplace statement audit while we reconnect them.</p>
        ) : (
          <div className="space-y-3">
            {answers.map((a) => (
              <Link key={a.id} href={`/answers/${a.slug}`} className="compass-card hover:border-[#0066ff] transition-colors block group">
                {a.audience ? (
                  <p className="compass-card-label">For the {a.audience}</p>
                ) : null}
                <h3 className="!mt-2">{a.title}</h3>
                {a.question ? <p className="compass-body text-sm italic mt-2 mb-2" style={{ color: '#86868b' }}>{a.question}</p> : null}
                <p className="compass-body text-sm mt-2 leading-relaxed line-clamp-3">{a.summary ?? a.answer}</p>
                <p className="text-[14px] mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color: '#0066ff' }}>Read it <span aria-hidden>→</span></p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-[#e8e8ed] py-10 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-[#6e6e73] text-[12px]">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.1rem', height: '1.1rem', fontSize: '0.5rem' }}>N86</span>
            <span>Never 86&apos;d · Built by operators</span>
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
