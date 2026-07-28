import { NextRequest, NextResponse } from 'next/server';
import { listPublishedAnswers, getPublishedAnswer } from '@/lib/answersDb';
import { AGENT_SPECS, SOURCE_TAGS } from '@/lib/agentSpecs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Public MCP-protocol server endpoint. JSON-RPC 2.0 over HTTP.
// Exposes the SAME limited public surface as /api/answers and /api/quick-wins.
// Connect from Claude Desktop / Gemini / ChatGPT via their respective MCP
// connector configurations using https://never86.ai/api/mcp as the URL.
//
// Per governance: NEVER expose operator data, methodology, agent manifests,
// or admin tables. This is the answer corpus and the public catalog only.

type JsonRpcReq = {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
};

const SERVER_INFO = {
  name: 'never86',
  version: '1.0.0',
  description: "Never 86'd — operator-turned-founder native AI for multi-unit restaurants. Answer corpus + free-agent catalog. Read-only.",
};

const TOOLS = [
  {
    name: 'list_answers',
    description: 'List every published Q&A from never86. Returns slug, title, question, audience, URL.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'get_answer',
    description: 'Fetch the full body of a single published answer by slug.',
    inputSchema: {
      type: 'object',
      properties: { slug: { type: 'string', description: 'The answer slug — e.g. "doordash-blended-rate-dashpass"' } },
      required: ['slug'],
      additionalProperties: false,
    },
  },
  {
    name: 'search_answers',
    description: 'Search the answer corpus by free-text query against title, question, and body. Returns top 10 matches.',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Free-text search query' } },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_free_agents',
    description: 'List the 8 free quick-win agents (no signup) operators can try right now. Returns name, audience, URL, headline, what-it-catches, sample-signal.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'get_agent',
    description: 'Fetch the full spec for a single agent by slug — catches, data needs, output shape, sample signal, POS support.',
    inputSchema: {
      type: 'object',
      properties: { slug: { type: 'string', description: 'Agent slug — e.g. "void-hunter", "leak-detector", "3p-fee-finder"' } },
      required: ['slug'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_seats',
    description: 'List the 8 role-routed landing pages (CEO, CFO, COO, Chef, CTO, Owner, Manager, Crew). Returns role + URL.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'list_source_tags',
    description: 'List the three source-tag categories Never 86\'d applies to every figure: Verified, Estimated, Unverified. Returns name + meaning.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
];

const FREE_AGENTS = AGENT_SPECS.map((a) => ({
  slug: a.slug,
  name: a.name,
  audience: a.seat,
  landingUrl: `https://never86.ai/agents/${a.slug}`,
  demoUrl: `https://never86.ai${a.href}`,
  headline: a.headline,
  catches: a.catches,
  sampleSignal: a.sampleSignal,
  posSupport: a.posSupport,
}));

const SEATS = [
  { role: 'CEO',     url: 'https://never86.ai/for/ceo' },
  { role: 'CFO',     url: 'https://never86.ai/for/cfo' },
  { role: 'COO',     url: 'https://never86.ai/for/coo' },
  { role: 'Chef',    url: 'https://never86.ai/for/chef' },
  { role: 'CTO',     url: 'https://never86.ai/for/cto' },
  { role: 'Owner',   url: 'https://never86.ai/for/owner' },
  { role: 'Manager', url: 'https://never86.ai/for/manager' },
  { role: 'Crew',    url: 'https://never86.ai/for/crew' },
];

function ok(id: string | number | null | undefined, result: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id: id ?? null, result });
}

function err(id: string | number | null | undefined, code: number, message: string) {
  return NextResponse.json({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });
}

async function handle(req: JsonRpcReq): Promise<Response> {
  switch (req.method) {
    case 'initialize':
      return ok(req.id, {
        protocolVersion: '2025-03-26',
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });
    case 'tools/list':
      return ok(req.id, { tools: TOOLS });
    case 'tools/call': {
      const name = (req.params as { name?: string })?.name;
      const args = (req.params as { arguments?: Record<string, unknown> })?.arguments ?? {};

      if (name === 'list_answers') {
        const rows = await listPublishedAnswers();
        const out = rows.map((a) => ({
          slug: a.slug,
          title: a.title,
          question: a.question,
          audience: a.audience,
          url: `https://never86.ai/answers/${a.slug}`,
        }));
        return ok(req.id, { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] });
      }

      if (name === 'get_answer') {
        const slug = String(args.slug ?? '');
        const a = await getPublishedAnswer(slug);
        if (!a) return ok(req.id, { content: [{ type: 'text', text: 'Not found.' }] });
        return ok(req.id, { content: [{ type: 'text', text: `${a.title}\n\nQ: ${a.question ?? '—'}\n\n${a.answer}\n\nSource: https://never86.ai/answers/${a.slug}` }] });
      }

      if (name === 'search_answers') {
        const q = String(args.query ?? '').toLowerCase();
        if (!q) return ok(req.id, { content: [{ type: 'text', text: 'Empty query.' }] });
        const rows = await listPublishedAnswers();
        const matches = rows
          .map((a) => {
            const haystack = `${a.title} ${a.question ?? ''} ${a.answer}`.toLowerCase();
            const score = haystack.includes(q) ? 1 : 0;
            return { a, score };
          })
          .filter((m) => m.score > 0)
          .slice(0, 10)
          .map(({ a }) => ({
            slug: a.slug,
            title: a.title,
            question: a.question,
            url: `https://never86.ai/answers/${a.slug}`,
          }));
        return ok(req.id, { content: [{ type: 'text', text: JSON.stringify(matches, null, 2) }] });
      }

      if (name === 'list_free_agents') {
        return ok(req.id, { content: [{ type: 'text', text: JSON.stringify(FREE_AGENTS, null, 2) }] });
      }

      if (name === 'get_agent') {
        const slug = String(args.slug ?? '');
        const a = AGENT_SPECS.find((x) => x.slug === slug);
        if (!a) return ok(req.id, { content: [{ type: 'text', text: `No agent with slug "${slug}". Available: ${AGENT_SPECS.map((x) => x.slug).join(', ')}` }] });
        const out = {
          slug: a.slug,
          name: a.name,
          tag: a.tag,
          seat: a.seat,
          headline: a.headline,
          intro: a.intro,
          catches: a.catches,
          dataNeeds: a.needs,
          output: a.output,
          sampleSignal: a.sampleSignal,
          posSupport: a.posSupport,
          landingUrl: `https://never86.ai/agents/${a.slug}`,
          demoUrl: `https://never86.ai${a.href}`,
        };
        return ok(req.id, { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] });
      }

      if (name === 'list_seats') {
        return ok(req.id, { content: [{ type: 'text', text: JSON.stringify(SEATS, null, 2) }] });
      }

      if (name === 'list_source_tags') {
        return ok(req.id, { content: [{ type: 'text', text: JSON.stringify(SOURCE_TAGS, null, 2) }] });
      }

      return err(req.id, -32601, `Unknown tool: ${name}`);
    }
    case 'resources/list':
      return ok(req.id, { resources: [] });
    case 'prompts/list':
      return ok(req.id, { prompts: [] });
    case 'notifications/initialized':
      return ok(req.id, {});
    default:
      return err(req.id, -32601, `Method not found: ${req.method}`);
  }
}

export async function POST(req: NextRequest) {
  let body: JsonRpcReq | JsonRpcReq[];
  try {
    body = await req.json();
  } catch {
    return err(null, -32700, 'Parse error');
  }
  if (Array.isArray(body)) {
    const results = await Promise.all(body.map(handle));
    const jsons = await Promise.all(results.map((r) => r.json()));
    return NextResponse.json(jsons);
  }
  return handle(body);
}

export async function GET() {
  // Discovery endpoint — return server metadata so clients can verify before connecting.
  return NextResponse.json({
    protocol: 'mcp',
    transport: 'http+json-rpc-2.0',
    endpoint: 'https://never86.ai/api/mcp',
    server: SERVER_INFO,
    tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
    docs: 'https://never86.ai/mcp',
  });
}
