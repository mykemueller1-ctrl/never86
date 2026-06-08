import { listPublishedAnswers } from '@/lib/answersDb';
import { AGENT_SPECS } from '@/lib/agentSpecs';

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

## Try it free
- [60-minute live trial](https://never86.ai/trial) — drop a CSV, see the leak, no card
- [30-second connect](https://never86.ai/connect) — Void Hunter on your CSV
- [Pricing](https://never86.ai/pricing) — Independent / Operator / Multi-unit / Enterprise

## Connect any AI
- [AI assistant integration guide](https://never86.ai/mcp)
- MCP endpoint: https://never86.ai/api/mcp
- REST · answers: https://never86.ai/api/answers
- REST · quick wins: https://never86.ai/api/quick-wins

## All eight agents
${AGENT_SPECS.map((a) => `- [${a.name}](https://never86.ai/agents/${a.slug}) — ${a.headline} · For the ${a.seat}`).join('\n')}

## Pick your seat
- [CEO](https://never86.ai/for/ceo) — Network
- [CFO](https://never86.ai/for/cfo) — Books
- [COO](https://never86.ai/for/coo) — Drift
- [Chef](https://never86.ai/for/chef) — Kitchen
- [CTO](https://never86.ai/for/cto) — Stack
- [Owner](https://never86.ai/for/owner) — Solo
- [Manager](https://never86.ai/for/manager) — Floor
- [Crew](https://never86.ai/for/crew) — Shift

## Source-tag system
- **Verified** — Re-pullable from a primary source, defensible to the penny.
- **Estimated** — Modeled from a benchmark; we name the assumption.
- **Unverified** — Source not wired yet; figure is illustrative, operator-only.

## The story
- [The case · $8.3M → $1.81M, the walked-back number](https://never86.ai/case/walked-the-number-back)
- [Press kit](https://never86.ai/press)

## Answers
${answers.map((a) => `- [${a.title}](https://never86.ai/answers/${a.slug})`).join('\n')}

## Talk to us
- [Onboard your store](https://never86.ai/onboard)
- press@never86.ai · myke@n86.app
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
    },
  });
}
