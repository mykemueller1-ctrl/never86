import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublishedAnswer, listPublishedAnswers } from '@/lib/answersDb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const a = await getPublishedAnswer(slug);
  if (!a) return { title: "Not found · Never 86'd" };
  const desc = a.summary ?? (a.answer.slice(0, 200) + (a.answer.length > 200 ? '…' : ''));
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
  const { slug } = await params;
  const a = await getPublishedAnswer(slug);
  if (!a) notFound();
  const others = (await listPublishedAnswers()).filter((x) => x.slug !== a.slug).slice(0, 4);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.summary ?? a.answer.slice(0, 200),
    articleBody: a.answer,
    datePublished: a.publishedAt,
    dateModified: a.updatedAt,
    mainEntityOfPage: `https://never86.ai/answers/${a.slug}`,
    author: {
      '@type': 'Person',
      name: 'Mychael Mueller',
      alternateName: 'Myke Mueller',
      url: 'https://never86.ai/story',
    },
    publisher: { '@type': 'Organization', name: "Never86'd", alternateName: "Never 86'd", url: 'https://never86.ai' },
    about: ['restaurant operations', 'restaurant financial intelligence', ...(a.keywords ?? [])],
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: "Never86'd", item: 'https://never86.ai/' },
      { '@type': 'ListItem', position: 2, name: 'Answers', item: 'https://never86.ai/answers' },
      { '@type': 'ListItem', position: 3, name: a.title, item: `https://never86.ai/answers/${a.slug}` },
    ],
  };

  return (
    <main className="compass min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <Link href="/" className="flex items-start gap-4 group min-w-0">
            <span className="compass-mark">N</span>
            <span className="min-w-0">
              <p className="font-serif text-[24px] leading-none text-ink-800">
                Never 86&apos;d <span className="italic text-ink-600">· answer</span>
              </p>
              <p className="compass-eyebrow-dim mt-2 break-words">Restaurant margin intelligence · published</p>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px]">
            <Link href="/answers" className="compass-pill"><span className="avatar">A</span><span>All answers</span></Link>
            <Link href="/onboard" className="btn-primary" style={{ background: '#0066ff' }}>Onboard your store</Link>
          </nav>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-6 pt-12 md:pt-16 pb-20">
        <Link href="/answers" className="text-[#6e6e73] hover:text-ink-800 text-[12px] font-medium inline-flex items-center gap-1 mb-6 transition-colors">← All answers</Link>
        {a.audience ? <p className="compass-eyebrow mb-4">— For the {a.audience}</p> : null}
        <h1 className="compass-display text-3xl md:text-5xl mb-6 break-words">{a.title}</h1>
        {a.question ? (
          <p className="compass-body text-lg italic mb-10 border-l-2 pl-4" style={{ borderColor: '#0066ff' }}>{a.question}</p>
        ) : null}

        <div className="max-w-none">
          {a.answer.split(/\n\n+/).map((para, i) => (
            <p key={i} className="compass-body text-lg leading-relaxed mb-5">{para}</p>
          ))}
        </div>

        {a.sources && a.sources.length > 0 ? (
          <aside className="mt-10 compass-card" aria-label="Sources and supporting pages">
            <p className="compass-eyebrow mb-4">— Sources and supporting pages</p>
            <ul className="space-y-2">
              {a.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} className="text-ink-800 underline" style={{ textDecorationColor: '#0066ff' }}>
                    {source.title} <span aria-hidden>↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}

        {a.tryUrl ? (
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href={a.tryUrl} className="btn-primary" style={{ background: '#0066ff' }}>{a.tryLabel ?? 'Try it with your data'}</a>
            <span className="text-[12px]" style={{ color: '#86868b' }}>Use redacted data. A missing-evidence result is a valid result.</span>
          </div>
        ) : null}

        {others.length > 0 ? (
          <div className="mt-16 pt-8 border-t border-[#e8e8ed]">
            <p className="compass-eyebrow mb-5">— More answers</p>
            <ul className="space-y-3">
              {others.map((o) => (
                <li key={o.id}>
                  <Link href={`/answers/${o.slug}`} className="text-ink-800 font-medium hover:underline" style={{ textDecorationColor: '#0066ff' }}>
                    {o.title} <span style={{ color: '#0066ff' }} className="text-sm">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </article>

      <footer className="border-t border-[#e8e8ed] py-10 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-[#6e6e73] text-[12px]">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.1rem', height: '1.1rem', fontSize: '0.5rem' }}>N86</span>
            <span>Never 86&apos;d · Built by operators</span>
          </div>
          <Link href="/answers" className="hover:text-ink-800 transition-colors">All answers</Link>
        </div>
      </footer>
    </main>
  );
}
