import { NextRequest, NextResponse } from 'next/server';
import { listPublishedAnswers, getPublishedAnswer } from '@/lib/answersDb';
import { AGENT_SPECS, SOURCE_TAGS } from '@/lib/agentSpecs';
import { buildActionShift, type ActionShiftInput } from '@/lib/actionShift';
import { getOperatorSystem } from '@/lib/operatorSystem';
import { getCompanyOrg, getDepartmentPlaybook } from '@/lib/companyOrg';
import { getHunterStandupPack } from '@/lib/hunterMcpPack';
import { MCP_PUBLIC_ENDPOINT, MCP_PUBLIC_SERVER_INFO, MCP_PUBLIC_TOOLS } from '@/lib/mcpPublicContract';
import { buildVendorSilenceTicket, type VendorSilenceInput } from '@/lib/vendorSilence';
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
// Per governance: NEVER expose operator data, credentials, private store memory,
// private prompts, or admin tables. This endpoint exposes only the versioned,
// public operator system, deterministic tools, answer corpus, and agent catalog.

type JsonRpcReq = {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
};

const SERVER_INFO = MCP_PUBLIC_SERVER_INFO;
const TOOLS = MCP_PUBLIC_TOOLS;

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

      if (name === 'build_vendor_silence_ticket') {
        const input: VendorSilenceInput = {
          vendor: String(args.vendor ?? ''),
          store: typeof args.store === 'string' ? args.store : undefined,
          owner: typeof args.owner === 'string' ? args.owner : undefined,
          lastSeenDate: String(args.last_seen_date ?? ''),
          asOfDate: String(args.as_of_date ?? ''),
          expectedCadenceDays: Number(args.expected_cadence_days),
          graceDays: args.grace_days === undefined ? undefined : Number(args.grace_days),
          pauseWeekends: args.pause_weekends === undefined ? undefined : Boolean(args.pause_weekends),
          pausedDates: Array.isArray(args.paused_dates) ? args.paused_dates.map(String) : undefined,
          programStartedDate: typeof args.program_started_date === 'string' ? args.program_started_date : undefined,
          existingOpenTicketId: typeof args.existing_open_ticket_id === 'string' ? args.existing_open_ticket_id : undefined,
          lastSeenEvidence: typeof args.last_seen_evidence === 'string' ? args.last_seen_evidence : undefined,
        };
        const ticket = buildVendorSilenceTicket(input);
        if (!ticket.ok) {
          return ok(req.id, { content: [{ type: 'text', text: ticket.error }], isError: true });
        }
        return ok(req.id, { content: [{ type: 'text', text: JSON.stringify(ticket.result, null, 2) }] });
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

      if (name === 'get_operator_system') {
        return ok(req.id, { content: [{ type: 'text', text: JSON.stringify(getOperatorSystem(), null, 2) }] });
      }

      if (name === 'get_company_org') {
        return ok(req.id, { content: [{ type: 'text', text: JSON.stringify(getCompanyOrg(), null, 2) }] });
      }

      if (name === 'get_department_playbook') {
        const deptId = String(args.dept_id ?? '').trim();
        const playbook = getDepartmentPlaybook(deptId);
        if (!playbook.ok) {
          return ok(req.id, { content: [{ type: 'text', text: playbook.error }], isError: true });
        }
        const payload =
          deptId === 'marketing' ? { ...playbook, hunterStandup: getHunterStandupPack() } : playbook;
        return ok(req.id, { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] });
      }

      if (name === 'get_hunter_standup') {
        return ok(req.id, { content: [{ type: 'text', text: JSON.stringify(getHunterStandupPack(), null, 2) }] });
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
    endpoint: MCP_PUBLIC_ENDPOINT,
    server: SERVER_INFO,
    tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
    docs: 'https://www.never86.ai/mcp',
  });
}
