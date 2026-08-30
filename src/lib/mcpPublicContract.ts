import { PUBLIC_LOGIC_DOMAINS } from './publicOperatorLogic';
import { OPERATOR_SYSTEM_VERSION } from './operatorSystem';

export const MCP_PUBLIC_ENDPOINT = 'https://www.never86.ai/api/mcp';
export const MCP_PUBLIC_TRANSPORT = 'http+json-rpc-2.0';
export const MCP_PUBLIC_PROTOCOL = '2025-03-26';

export const MCP_READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false,
  idempotentHint: true,
} as const;

export type McpPublicTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: typeof MCP_READ_ONLY_ANNOTATIONS;
};

export const MCP_PUBLIC_SERVER_INFO = {
  name: 'never86',
  version: OPERATOR_SYSTEM_VERSION,
  description: "Never 86'd — one evidence-first restaurant operating system for Grok, ChatGPT, Claude, Gemini, and other MCP clients. Action Shift, deterministic 3P Quick Win, vendor silence, proof/memory, routines, and public operator logic. Read-only.",
} as const;

export const MCP_PUBLIC_TOOLS: readonly McpPublicTool[] = [
  {
    name: 'list_answers',
    description: 'List every published Q&A from never86. Returns slug, title, question, audience, URL.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: MCP_READ_ONLY_ANNOTATIONS,
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
    annotations: MCP_READ_ONLY_ANNOTATIONS,
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
    annotations: MCP_READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'list_free_agents',
    description: 'List the 8 free quick-win agents (no signup) operators can try right now. Returns name, audience, URL, headline, what-it-catches, sample-signal.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: MCP_READ_ONLY_ANNOTATIONS,
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
    annotations: MCP_READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'list_seats',
    description: 'List the 8 role-routed landing pages (CEO, CFO, COO, Chef, CTO, Owner, Manager, Crew). Returns role + URL.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: MCP_READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'list_source_tags',
    description: "List the three source-tag categories Never 86'd applies to every figure: Verified, Estimated, Unverified. Returns name + meaning.",
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: MCP_READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'build_action_shift',
    description: "Turn one store's typed prior-day close into no more than three morning actions plus a night proof checklist. Uses only operator-supplied targets, labels every result Unverified, and never converts a variance into a theft, discipline, contract, bank, or guaranteed-savings claim.",
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
    annotations: MCP_READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'build_vendor_silence_ticket',
    description: 'Evaluate one vendor/location silence clock from operator-approved cadence. Pauses configured dates, keeps the first 14 days advisory, suppresses duplicate tickets, and returns the proof needed to reset last-seen. Typed inputs remain Unverified.',
    inputSchema: {
      type: 'object',
      properties: {
        vendor: { type: 'string' },
        store: { type: 'string' },
        owner: { type: 'string' },
        last_seen_date: { type: 'string', description: 'YYYY-MM-DD date of the last human-supported receipt, invoice, confirmation, or exception.' },
        as_of_date: { type: 'string', description: 'YYYY-MM-DD date to evaluate.' },
        expected_cadence_days: { type: 'integer', minimum: 1, description: "Operator-approved cadence only; never import another store's threshold." },
        grace_days: { type: 'integer', minimum: 0 },
        pause_weekends: { type: 'boolean', description: 'Use only when the store approves weekend pauses.' },
        paused_dates: { type: 'array', items: { type: 'string' }, description: 'Store-approved closure, holiday, or exception dates in YYYY-MM-DD.' },
        program_started_date: { type: 'string', description: 'Optional YYYY-MM-DD baseline start; first 14 calendar days remain advisory.' },
        existing_open_ticket_id: { type: 'string', description: 'Keeps one existing vendor/location ticket open rather than creating a duplicate.' },
        last_seen_evidence: { type: 'string', description: 'Short description of the proof supporting last-seen; never include credentials or PII.' },
      },
      required: ['vendor', 'last_seen_date', 'as_of_date', 'expected_cadence_days'],
      additionalProperties: false,
    },
    annotations: MCP_READ_ONLY_ANNOTATIONS,
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
    annotations: MCP_READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'get_3p_audit_logic',
    description: 'Return the complete public Never86 3P evidence ladder, deterministic formulas, DoorDash statement mappings, cross-marketplace boundaries, claim rules, and reconciliation tolerance. Use before interpreting a marketplace statement or payout variance.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: MCP_READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'get_operator_logic',
    description: 'Fetch one public Never86 rulebook domain or the full set: evidence, Action Shift, load-day, vendor silence, proof/memory, service drafts, agent orchestration, safety, POS, invoices/Daily Prime, marketplace 3P, voids/refunds, ticket leaks, labor, tips, catering, vendor drift, beverage, and product-mix pars.',
    inputSchema: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          enum: [...PUBLIC_LOGIC_DOMAINS],
          description: 'Rulebook domain. Use "all" only when the user explicitly needs the whole public logic bundle.',
        },
      },
      required: ['domain'],
      additionalProperties: false,
    },
    annotations: MCP_READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'get_operator_system',
    description: 'Return the canonical, versioned Never86 operating-system pack consolidated from the four product threads: entry and load-day, capture-to-proof loop, morning/night/weekly routines, specialist agents, versioned store memory, truth gates, prompt-injection defenses, operator UI rules, rollout gates, and the private-store boundary. Use this first when building or coaching a Never86 workflow.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: MCP_READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'get_company_org',
    description: 'Return the Never86 company org chart: departments, department heads, specialists, reporting lines, approval gates, and playbook references. Use after get_operator_system when routing founder, sales, GTM, audit, or product work.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: MCP_READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'get_department_playbook',
    description: 'Return one department playbook pack: head role, specialists, triggers, outputs, prohibited actions, and linked doc paths. dept_id: sales, gtm, marketing, audit, or product. Marketing includes inline hunterStandup.',
    inputSchema: {
      type: 'object',
      properties: {
        dept_id: { type: 'string', enum: ['sales', 'gtm', 'marketing', 'social', 'audit', 'product'], description: 'Department id' },
      },
      required: ['dept_id'],
      additionalProperties: false,
    },
    annotations: MCP_READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'get_hunter_standup',
    description: 'Return the full inline Head of Marketing daily hunt pack for Grok: ICP scoring, search queries (X/Reddit/Facebook/TikTok), voice rules, UTM template, output format, and hard stops. Use this first in Grok — no repo file access required.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: MCP_READ_ONLY_ANNOTATIONS,
  },
];

export const MCP_PUBLIC_TOOL_NAMES = MCP_PUBLIC_TOOLS.map((tool) => tool.name);

export function assertAllPublicToolsReadOnly(tools: readonly McpPublicTool[] = MCP_PUBLIC_TOOLS): string[] {
  return tools.flatMap((tool) => {
    const failures: string[] = [];
    if (tool.annotations.readOnlyHint !== true) failures.push(`${tool.name} is not read-only`);
    if (tool.annotations.destructiveHint !== false) failures.push(`${tool.name} is marked destructive`);
    return failures;
  });
}
