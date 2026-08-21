import { listPublishedAnswers } from '@/lib/answersDb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function xml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  })[character] ?? character);
}

export async function GET() {
  const answers = await listPublishedAnswers();
  const updated = answers.reduce((latest, answer) => {
    const date = new Date(answer.updatedAt || answer.publishedAt || 0);
    return date > latest ? date : latest;
  }, new Date('2026-08-21T05:30:00Z'));

  const feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Never 86'd operator evidence desk</title>
  <id>https://never86.ai/answers</id>
  <link href="https://never86.ai/answers" />
  <link href="https://never86.ai/answers/feed.xml" rel="self" type="application/atom+xml" />
  <updated>${updated.toISOString()}</updated>
  <author><name>Mychael “Myke” Mueller</name><uri>https://never86.ai/story</uri></author>
  ${answers.map((answer) => `<entry>
    <title>${xml(answer.title)}</title>
    <id>https://never86.ai/answers/${xml(answer.slug)}</id>
    <link href="https://never86.ai/answers/${xml(answer.slug)}" />
    <published>${new Date(answer.publishedAt || answer.updatedAt).toISOString()}</published>
    <updated>${new Date(answer.updatedAt).toISOString()}</updated>
    <summary>${xml(answer.summary ?? answer.answer.slice(0, 240))}</summary>
    <content type="text">${xml(answer.answer)}</content>
  </entry>`).join('\n  ')}
</feed>`;

  return new Response(feed, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
    },
  });
}
