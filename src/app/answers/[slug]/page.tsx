import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublishedAnswer, listPublishedAnswers } from '@/lib/answersDb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const a = await getPublishedAnswer(params.slug);
  if (!a) return { title: "Not found · Never 86'd" };
  const desc = a.answer.slice(0, 200) + (a.answer.length > 200 ? '…' : '');
  return {
    title: `${a.title} · Never 86'd`,
    description: desc,
    openGraph: {
      title: a.title,
      description: desc,
      url: `https://never86.ai/answers/${a.slug}`,
      type: 'article',
    },
    twitter: { card: 'summary_large_image', title: a.title, description: desc },
    alternates: { canonical: `https://never86.ai/answers/${a.slug}` },
  };
}

export default async function AnswerPage({ params }: { params: Params }) {
  const a = await getPublishedAnswer(params.slug);
  if (!a) notFound();
  const others = (await listPublishedAnswers()).filter((x) => x.slug !== a.slug).slice(0, 4);

  // JSON-LD QAPage schema — what ChatGPT / Gemini / Perplexity / Google AI
  // Overviews use to cite a page as an authoritative answer.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: a.question || a.title,
      text: a.question || a.title,
      answerCount: 1,
      acceptedAnswer: {
        '@type': 'Answer',
        text: a.answer,
        author: { '@type': 'Organization', name: "Never 86'd", url: 'https://never86.ai' },
        url: `https://never86.ai/answers/${a.slug}`,
        upvoteCount: 1,
      },
    },
    headline: a.title,
    datePublished: a.publishedAt,
    dateModified: a.updatedAt,
    publisher: { '@type': 'Organization', name: "Never 86'd", url: 'https://never86.ai' },
  };

  return (
    <main className="min-h-screen text-dark-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="border-b border-white/5 sticky top-0 z-40 nav-shell">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="brand-monogram">N86</span>
            <span className="font-display font-semibold tracking-tight text-dark-50 text-lg group-hover:text-gold-300 transition-colors">Never 86&apos;d</span>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/answers" className="text-dark-200 hover:text-ink-800 px-3 py-1.5 rounded-lg hover:bg-white/[0.03] hidden sm:inline">All answers</Link>
            <Link href="/operators#talk" className="text-dark-50 border border-white/10 hover:border-gold-500/60 hover:bg-gold-500/5 rounded-lg px-3 py-1.5 transition-colors">Talk to us</Link>
          </div>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 pt-12 pb-20">
        <div className="flex items-center gap-2 mb-5">
          <Link href="/answers" className="text-gold-300 hover:text-gold-200 text-[10px] uppercase tracking-[0.22em] font-mono">← Answers</Link>
          {a.audience ? <span className="text-copper-300 text-[10px] uppercase tracking-[0.18em] font-mono">For {a.audience}</span> : null}
        </div>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1] text-ink-800 mb-4">{a.title}</h1>
        {a.question ? (
          <p className="text-dark-200 text-lg italic mb-8 border-l-2 border-gold-500/60 pl-4">Q: {a.question}</p>
        ) : null}

        <div className="prose prose-invert max-w-none">
          {a.answer.split(/\n\n+/).map((para, i) => (
            <p key={i} className="text-dark-100 text-lg leading-relaxed mb-5">{para}</p>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-gold-700/40 bg-gradient-to-br from-gold-500/[0.08] via-transparent to-copper-500/[0.08] p-6">
          <p className="text-gold-300 text-[10px] uppercase tracking-[0.22em] font-mono mb-2">The discipline behind this answer</p>
          <p className="text-dark-200 text-sm leading-relaxed">
            Every figure never86 ships is tagged <span className="text-green-300">Verified</span>,
            <span className="text-gold-300"> Estimated</span>, or <span className="text-red-300">Unverified</span>.
            We show our work, and when we&apos;re wrong we walk the number back — like we did when we caught our own
            $8.3M recovery overstatement and corrected it down to $1.81M. <Link href="/operators#talk" className="text-gold-300 hover:text-gold-200 underline">Talk to the founder →</Link>
          </p>
        </div>

        {others.length > 0 ? (
          <div className="mt-12">
            <p className="text-gold-400 text-[10px] uppercase tracking-[0.22em] font-mono mb-4">More answers</p>
            <ul className="space-y-2">
              {others.map((o) => (
                <li key={o.id}>
                  <Link href={`/answers/${o.slug}`} className="text-dark-50 hover:text-gold-300 transition-colors">
                    {o.title} <span className="text-dark-400 text-sm">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </article>

      <footer className="border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-3 text-dark-300 text-xs">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.25rem', height: '1.25rem', fontSize: '0.55rem' }}>N86</span>
            <span>Never 86&apos;d · Built by an operator, for operators</span>
          </div>
          <Link href="/answers" className="hover:text-gold-300 transition-colors">All answers</Link>
        </div>
      </footer>
    </main>
  );
}
