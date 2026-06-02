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
    <main className="min-h-screen text-ink-800">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="nav-shell sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="brand-monogram" style={{ width: '1.4rem', height: '1.4rem', fontSize: '0.55rem' }}>N86</span>
            <span className="font-semibold tracking-tighter text-ink-800 text-[15px]">Never 86&apos;d</span>
          </Link>
          <nav className="flex items-center gap-1 text-[13px] text-ink-600">
            <Link href="/answers" className="px-3 py-1.5 rounded-full hover:text-ink-800 hover:bg-black/[0.04] hidden sm:inline">All answers</Link>
            <Link href="/operators#talk" className="btn-primary py-1.5 px-4 text-[13px]">Talk to us</Link>
          </nav>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 pt-16 pb-20">
        <Link href="/answers" className="text-ink-500 hover:text-ink-800 text-[12px] font-medium inline-flex items-center gap-1 mb-6">← All answers</Link>
        {a.audience ? <p className="text-ink-500 text-[11px] uppercase tracking-widest font-medium mb-4">For {a.audience}</p> : null}
        <h1 className="display text-3xl md:text-5xl mb-5">{a.title}</h1>
        {a.question ? (
          <p className="text-ink-600 text-lg italic mb-8 border-l-2 border-ink-300 pl-4">{a.question}</p>
        ) : null}

        <div className="max-w-none">
          {a.answer.split(/\n\n+/).map((para, i) => (
            <p key={i} className="text-ink-700 text-lg leading-relaxed mb-5">{para}</p>
          ))}
        </div>

        {others.length > 0 ? (
          <div className="mt-16 pt-8 border-t border-ink-200">
            <p className="text-ink-500 text-[11px] uppercase tracking-widest font-medium mb-4">More answers</p>
            <ul className="space-y-2.5">
              {others.map((o) => (
                <li key={o.id}>
                  <Link href={`/answers/${o.slug}`} className="text-ink-800 font-medium hover:underline">
                    {o.title} <span className="text-ink-500 text-sm">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </article>

      <footer className="border-t border-ink-200 py-10 px-6 bg-white">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-ink-500 text-[12px]">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.1rem', height: '1.1rem', fontSize: '0.5rem' }}>N86</span>
            <span>Never 86&apos;d</span>
          </div>
          <Link href="/answers" className="hover:text-ink-800 transition-colors">All answers</Link>
        </div>
      </footer>
    </main>
  );
}
