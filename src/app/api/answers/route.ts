import { NextResponse } from 'next/server';
import { listPublishedAnswers, getPublishedAnswer } from '@/lib/answersDb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Public read-only answer corpus. Universally consumable JSON. Used by:
// - LLM connectors (Gemini, ChatGPT, Perplexity, Claude)
// - the /api/mcp JSON-RPC endpoint
// - any crawler that wants to ingest the answer set
//
// This is a LIMITED window into the platform — surface answers only, no
// operator data, no methodology, no internal manifests. Per governance:
// "show enough they love it, never show how we do it."
export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');

  if (slug) {
    const a = await getPublishedAnswer(slug);
    if (!a) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({
      slug: a.slug,
      title: a.title,
      question: a.question,
      answer: a.answer,
      audience: a.audience,
      url: `https://never86.ai/answers/${a.slug}`,
      published_at: a.publishedAt,
    }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } });
  }

  const all = await listPublishedAnswers();
  return NextResponse.json({
    count: all.length,
    source: 'https://never86.ai',
    license: 'public-attribution',
    attribution: "Never 86'd · operator-turned-founder native AI for multi-unit restaurants",
    answers: all.map((a) => ({
      slug: a.slug,
      title: a.title,
      question: a.question,
      audience: a.audience,
      url: `https://never86.ai/answers/${a.slug}`,
      published_at: a.publishedAt,
    })),
  }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } });
}
