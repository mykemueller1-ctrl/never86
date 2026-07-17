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
    <main className="compass min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <Link href="/" className="flex items-start gap-4 group">
            <span className="compass-mark">N</span>
            <span>
              <p className="font-serif text-[24px] leading-none text-white">
                Never 86&apos;d <span className="italic text-white/70">· answer</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Restaurant margin intelligence · published</p>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px]">
            <Link href="/answers" className="compass-pill"><span className="avatar">A</span><span>All answers</span></Link>
            <Link href="/onboard" className="btn-primary" style={{ background: '#0066ff' }}>Onboard your store</Link>
          </nav>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-6 pt-12 md:pt-16 pb-20">
        <Link href="/answers" className="text-[#6e6e73] hover:text-white text-[12px] font-medium inline-flex items-center gap-1 mb-6 transition-colors">← All answers</Link>
        {a.audience ? <p className="compass-eyebrow mb-4">— For the {a.audience}</p> : null}
        <h1 className="compass-display text-3xl md:text-5xl mb-6">{a.title}</h1>
        {a.question ? (
          <p className="compass-body text-lg italic mb-10 border-l-2 pl-4" style={{ borderColor: '#0066ff' }}>{a.question}</p>
        ) : null}

        <div className="max-w-none">
          {a.answer.split(/\n\n+/).map((para, i) => (
            <p key={i} className="compass-body text-lg leading-relaxed mb-5">{para}</p>
          ))}
        </div>

        {others.length > 0 ? (
          <div className="mt-16 pt-8 border-t border-[#1f1f1f]">
            <p className="compass-eyebrow mb-5">— More answers</p>
            <ul className="space-y-3">
              {others.map((o) => (
                <li key={o.id}>
                  <Link href={`/answers/${o.slug}`} className="text-white font-medium hover:underline" style={{ textDecorationColor: '#0066ff' }}>
                    {o.title} <span style={{ color: '#0066ff' }} className="text-sm">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </article>

      <footer className="border-t border-[#1f1f1f] py-10 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-[#6e6e73] text-[12px]">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.1rem', height: '1.1rem', fontSize: '0.5rem' }}>N86</span>
            <span>Never 86&apos;d · Built by operators</span>
          </div>
          <Link href="/answers" className="hover:text-white transition-colors">All answers</Link>
        </div>
      </footer>
    </main>
  );
}
