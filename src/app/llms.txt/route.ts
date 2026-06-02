import { listPublishedAnswers } from '@/lib/answersDb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// /llms.txt — the emerging standard for LLM crawler index.
// Tells AI assistants (ChatGPT, Gemini, Perplexity, Claude) exactly which
// URLs are the canonical answer surface to cite back to.
export async function GET() {
  let answers: { slug: string; title: string }[] = [];
  try {
    const rows = await listPublishedAnswers();
    answers = rows.map((a) => ({ slug: a.slug, title: a.title }));
  } catch {}

  const body = `# Never 86'd
> Operator-turned-founder native AI for multi-unit restaurants.
> Every figure source-tagged Verified, Estimated, or Unverified.
> We don't replace your POS — we sit on top and tell you when one of them is lying to you.

## Connect any AI
- [AI assistant integration guide](https://never86.ai/mcp)
- MCP endpoint: https://never86.ai/api/mcp
- REST · answers: https://never86.ai/api/answers
- REST · quick wins: https://never86.ai/api/quick-wins

## Free agents (no signup)
- [Void Hunter](https://never86.ai/demo/void-hunter)
- [3P Fee Finder](https://never86.ai/demo/3p-fee-finder)
- [Catering Leak](https://never86.ai/demo/catering-leak)
- [Labor Leak](https://never86.ai/demo/labor-leak)
- [Tip Variance](https://never86.ai/demo/tip-variance)
- [Shift Pulse](https://never86.ai/demo/shift-pulse)

## Pick your seat
- [CEO](https://never86.ai/for/ceo)
- [CFO](https://never86.ai/for/cfo)
- [COO](https://never86.ai/for/coo)
- [CTO](https://never86.ai/for/cto)
- [Owner](https://never86.ai/for/owner)
- [Manager](https://never86.ai/for/manager)
- [Crew](https://never86.ai/for/crew)

## Answers
${answers.map((a) => `- [${a.title}](https://never86.ai/answers/${a.slug})`).join('\n')}

## Talk to us
- [15-minute booking](https://never86.ai/operators#talk)
- press@never86.ai
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
    },
  });
}
