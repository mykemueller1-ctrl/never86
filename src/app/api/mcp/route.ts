import { NextRequest, NextResponse } from 'next/server';
import { listPublishedAnswers, getPublishedAnswer } from '@/lib/answersDb';
import { AGENT_SPECS, SOURCE_TAGS } from '@/lib/agentSpecs';
import { buildActionShift, type ActionShiftInput } from '@/lib/actionShift';
import {
  PUBLIC_LOGIC_DOMAINS,
  calculateMarketplaceQuickWin,
  getPublicOperatorLogic,
  type MarketplaceQuickWinInput,
  type PublicLogicDomain,
} from '@/lib/publicOperatorLogic';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Public MCP-protocol server endpoint. JSON-RPC 2.0 over HTTP.
// Exposes the SAME limited public surface as /api/answers and /api/quick-wins.
// Connect from Grok / Claude / Gemini / ChatGPT via their respective MCP
// connector configurations using https://www.never86.ai/api/mcp as the URL.
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
  version: '2.1.0',
  description: "Never 86'd — evidence-first restaurant operator intelligence. Action Shift + deterministic 3P Quick Win + public POS, invoice, and leak-agent logic. Read-only.",
};

const TOOLS = [
  {
    name: 'list_answers',
    description: 'List every published Q&A from never86. Returns slug, title, question, audience, URL.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
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
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
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
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
  },
  {
    name: 'list_free_agents',
    description: 'List the 8 free quick-win agents (no signup) operators can try right now. Returns name, audience, URL, headline, what-it-catches, sample-signal.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
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
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
  },
  {
    name: 'list_seats',
    description: 'List the 8 role-routed landing pages (CEO, CFO, COO, Chef, CTO, Owner, Manager, Crew). Returns role + URL.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
  },
  {
    name: 'list_source_tags',
    description: 'List the three source-tag categories Never 86\'d applies to every figure: Verified, Estimated, Unverified. Returns name + meaning.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
  },
  {
    name: 'build_action_shift',
    description: 'Turn one store\'s typed prior-day close into no more than three morning actions plus a night proof checklist. Uses only operator-supplied targets, labels every result Unverified, and never converts a variance into a theft, discipline, contract, bank, or guaranteed-savings claim.',
    inputSchema: {
      type: 'object',
      properties: {
        store: { type: 'string' },
        business_date: { type: 'string', description: 'Prior complete restaurant business date, preferably YYYY-MM-DD.' },
        gross_sales: { type: 'number', exclusiveMinimum: 0 },
        order_count: { type: 'number', minimum: 0 },
        labor_dollars: { type: 'number', minimum: 0 },
        labor_target_pct: { type: 'number', minimum: 0, maximum: 100, description: 'Operator-approved target only; omit when unknown.' },
        expected_cash: { type: 'number', minimum: 0 },
        entered_deposit: { type: 'number', minimum: 0 },
        payouts: { type: 'number', minimum: 0 },
        discounts: { type: 'number', minimum: 0 },
        promotions: { type: 'number', minimum: 0 },
        voids: { type: 'number', minimum: 0 },
        late_delivery_count: { type: 'number', minimum: 0 },
        late_delivery_sales: { type: 'number', minimum: 0 },
        average_delivery_minutes: { type: 'number', minimum: 0 },
        target_delivery_minutes: { type: 'number', minimum: 0, description: 'Operator-approved target only; omit when unknown.' },
      },
      required: ['gross_sales'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
  },
  {
    name: 'calculate_3p_marketplace_cost',
    description: 'Run the deterministic Never86 3P Quick Win. Separates commission, fees, restaurant-funded promos/ads, refunds/adjustments, other deductions, and credits; returns observed marketplace cost, expected payout, optional payout variance, formula, evidence limits, and next records needed. Use only clearly supplied non-negative dollar inputs.',
    inputSchema: {
      type: 'object',
      properties: {
        platform: { type: 'string', description: 'Marketplace name, e.g. DoorDash, Uber Eats, Grubhub, or ezCater.' },
        period: { type: 'string', description: 'Optional statement period label.' },
        eligible_sales: { type: 'number', exclusiveMinimum: 0, description: 'Eligible food sales or the disclosed fee base. Exclude tips, taxes, and customer pass-through fees unless governing evidence says otherwise.' },
        commission: { type: 'number', minimum: 0 },
        merchant_fees: { type: 'number', minimum: 0, description: 'Restaurant-borne processing, delivery, service, or other merchant fees.' },
        restaurant_funded_promotions_ads: { type: 'number', minimum: 0, description: 'Only the restaurant-funded portion of promotions and advertising.' },
        refunds_adjustments: { type: 'number', minimum: 0, description: 'Refunds, error charges, chargebacks, and other adjustments shown as deductions.' },
        other_deductions: { type: 'number', minimum: 0 },
        credits: { type: 'number', minimum: 0, description: 'Supported credits that increase what the restaurant keeps.' },
        reported_payout: { type: 'number', minimum: 0, description: 'Optional marketplace-reported payout for variance comparison.' },
      },
      required: ['eligible_sales', 'commission', 'merchant_fees', 'restaurant_funded_promotions_ads', 'refunds_adjustments', 'other_deductions', 'credits'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
  },
  {
    name: 'get_3p_audit_logic',
    description: 'Return the complete public Never86 3P evidence ladder, deterministic formulas, DoorDash statement mappings, cross-marketplace boundaries, claim rules, and reconciliation tolerance. Use before interpreting a marketplace statement or payout variance.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
  },
  {
    name: 'get_operator_logic',
    description: 'Fetch the public Never86 rulebook for evidence, Action Shift, POS routing, invoices/Daily Prime, marketplace 3P, void/refund peer bands, ticket leak signals, labor drift, tips, catering reconciliation, vendor drift, beverage shrink, product-mix pars, or all domains.',
    inputSchema: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          enum: PUBLIC_LOGIC_DOMAINS,
          description: 'Rulebook domain. Use "all" only when the user explicitly needs the whole public logic bundle.',
        },
      },
      required: ['domain'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
  },
];

const STOP_WORDS = new Set(['a', 'an', 'and', 'are', 'for', 'from', 'how', 'i', 'in', 'is', 'it', 'my', 'of', 'on', 'or', 'the', 'to', 'what', 'with']);

function searchTerms(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9']+/g, ' ')
    .split(/\s+/)
    .filter((term) => term.length > 1 && !STOP_WORDS.has(term));
}

function answerScore(query: string, answer: Awaited<ReturnType<typeof listPublishedAnswers>>[number]): number {
  const normalizedQuery = query.trim().toLowerCase();
  const title = answer.title.toLowerCase();
  const question = (answer.question ?? '').toLowerCase();
  const summary = (answer.summary ?? '').toLowerCase();
  const keywords = (answer.keywords ?? []).join(' ').toLowerCase();
  const body = answer.answer.toLowerCase();
  let score = 0;
  if (title.includes(normalizedQuery)) score += 20;
  if (question.includes(normalizedQuery)) score += 15;
  if (keywords.includes(normalizedQuery)) score += 12;
  if (body.includes(normalizedQuery)) score += 5;
  for (const term of searchTerms(normalizedQuery)) {
    if (title.includes(term)) score += 5;
    if (question.includes(term)) score += 4;
    if (keywords.includes(term)) score += 4;
    if (summary.includes(term)) score += 3;
    if (body.includes(term)) score += 1;
  }
  return score;
}

const FREE_AGENTS = AGENT_SPECS.map((a) => ({
  slug: a.slug,
  name: a.name,
  audience: a.seat,
  landingUrl: `https://www.never86.ai/agents/${a.slug}`,
  demoUrl: `https://www.never86.ai${a.href}`,
  headline: a.headline,
  catches: a.catches,
  sampleSignal: a.sampleSignal,
  posSupport: a.posSupport,
}));

const SEATS = [
  { role: 'CEO',     url: 'https://www.never86.ai/for/ceo' },
  { role: 'CFO',     url: 'https://www.never86.ai/for/cfo' },
  { role: 'COO',     url: 'https://www.never86.ai/for/coo' },
  { role: 'Chef',    url: 'https://www.never86.ai/for/chef' },
  { role: 'CTO',     url: 'https://www.never86.ai/for/cto' },
  { role: 'Owner',   url: 'https://www.never86.ai/for/owner' },
  { role: 'Manager', url: 'https://www.never86.ai/for/manager' },
  { role: 'Crew',    url: 'https://www.never86.ai/for/crew' },
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
          url: `https://www.never86.ai/answers/${a.slug}`,
        }));
        return ok(req.id, { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] });
      }

      if (name === 'get_answer') {
        const slug = String(args.slug ?? '').trim();
        if (!slug || slug.length > 160) return ok(req.id, { content: [{ type: 'text', text: 'A valid answer slug is required.' }], isError: true });
        const a = await getPublishedAnswer(slug);
        if (!a) return ok(req.id, { content: [{ type: 'text', text: 'Not found.' }] });
        const sources = (a.sources ?? []).map((source) => `- ${source.title}: ${source.url}`).join('\n');
        return ok(req.id, { content: [{ type: 'text', text: `${a.title}\n\nQ: ${a.question ?? '—'}\n\n${a.answer}\n\nCanonical: https://www.never86.ai/answers/${a.slug}${sources ? `\n\nSources:\n${sources}` : ''}` }] });
      }

      if (name === 'search_answers') {
        const q = String(args.query ?? '').trim();
        if (!q || q.length > 300) return ok(req.id, { content: [{ type: 'text', text: 'Enter a search query between 1 and 300 characters.' }], isError: true });
        const rows = await listPublishedAnswers();
        const matches = rows
          .map((a) => {
            const score = answerScore(q, a);
            return { a, score };
          })
          .filter((m) => m.score > 0)
          .sort((left, right) => right.score - left.score)
          .slice(0, 10)
          .map(({ a, score }) => ({
            slug: a.slug,
            title: a.title,
            question: a.question,
            summary: a.summary,
            relevance: score,
            url: `https://www.never86.ai/answers/${a.slug}`,
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
          landingUrl: `https://www.never86.ai/agents/${a.slug}`,
          demoUrl: `https://www.never86.ai${a.href}`,
        };
        return ok(req.id, { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] });
      }

      if (name === 'list_seats') {
        return ok(req.id, { content: [{ type: 'text', text: JSON.stringify(SEATS, null, 2) }] });
      }

      if (name === 'list_source_tags') {
        return ok(req.id, { content: [{ type: 'text', text: JSON.stringify(SOURCE_TAGS, null, 2) }] });
      }

      if (name === 'build_action_shift') {
        const optionalNumber = (key: string) => args[key] === undefined ? undefined : Number(args[key]);
        const input: ActionShiftInput = {
          store: typeof args.store === 'string' ? args.store : undefined,
          businessDate: typeof args.business_date === 'string' ? args.business_date : undefined,
          grossSales: Number(args.gross_sales),
          orderCount: optionalNumber('order_count'),
          laborDollars: optionalNumber('labor_dollars'),
          laborTargetPct: optionalNumber('labor_target_pct'),
          expectedCash: optionalNumber('expected_cash'),
          enteredDeposit: optionalNumber('entered_deposit'),
          payouts: optionalNumber('payouts'),
          discounts: optionalNumber('discounts'),
          promotions: optionalNumber('promotions'),
          voids: optionalNumber('voids'),
          lateDeliveryCount: optionalNumber('late_delivery_count'),
          lateDeliverySales: optionalNumber('late_delivery_sales'),
          averageDeliveryMinutes: optionalNumber('average_delivery_minutes'),
          targetDeliveryMinutes: optionalNumber('target_delivery_minutes'),
        };
        const shift = buildActionShift(input);
        if (!shift.ok) {
          return ok(req.id, { content: [{ type: 'text', text: shift.error }], isError: true });
        }
        return ok(req.id, { content: [{ type: 'text', text: JSON.stringify(shift.result, null, 2) }] });
      }

      if (name === 'calculate_3p_marketplace_cost') {
        const input: MarketplaceQuickWinInput = {
          platform: typeof args.platform === 'string' ? args.platform.trim() : undefined,
          period: typeof args.period === 'string' ? args.period.trim() : undefined,
          eligibleSales: Number(args.eligible_sales),
          commission: Number(args.commission),
          merchantFees: Number(args.merchant_fees),
          promotions: Number(args.restaurant_funded_promotions_ads),
          refundsAdjustments: Number(args.refunds_adjustments),
          otherFees: Number(args.other_deductions),
          credits: Number(args.credits),
          reportedPayout: args.reported_payout === undefined ? undefined : Number(args.reported_payout),
        };
        const receipt = calculateMarketplaceQuickWin(input);
        if (!receipt.ok) {
          return ok(req.id, { content: [{ type: 'text', text: receipt.error }], isError: true });
        }
        return ok(req.id, { content: [{ type: 'text', text: JSON.stringify(receipt.result, null, 2) }] });
      }

      if (name === 'get_3p_audit_logic') {
        return ok(req.id, { content: [{ type: 'text', text: JSON.stringify(getPublicOperatorLogic('marketplace-3p'), null, 2) }] });
      }

      if (name === 'get_operator_logic') {
        const domain = String(args.domain ?? '') as PublicLogicDomain;
        if (!PUBLIC_LOGIC_DOMAINS.includes(domain)) {
          return ok(req.id, {
            content: [{ type: 'text', text: `Unknown domain "${domain}". Available: ${PUBLIC_LOGIC_DOMAINS.join(', ')}` }],
            isError: true,
          });
        }
        return ok(req.id, { content: [{ type: 'text', text: JSON.stringify(getPublicOperatorLogic(domain), null, 2) }] });
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
    endpoint: 'https://www.never86.ai/api/mcp',
    server: SERVER_INFO,
    tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
    docs: 'https://www.never86.ai/mcp',
  });
}
