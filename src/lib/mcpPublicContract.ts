import { PUBLIC_LOGIC_DOMAINS } from './publicOperatorLogic';
import { OPERATOR_SYSTEM_VERSION } from './operatorSystem';
import { KNOWLEDGE_TOOL_NAMES } from './agentGovernance/knowledge';

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
  description:
    "Never 86'd finds restaurant leaks in Payroll, Prices, and Process. Knowledge tools return the public operator system; analysis tools label operator-provided data Unverified and stay read-only.",
} as const;

const emptyObjectSchema = {
  type: 'object',
  properties: {},
  additionalProperties: false,
} as const;

/** Knowledge first (call get_operator_system), then Payroll / Prices / Process analysis. */
export const MCP_PUBLIC_TOOLS: readonly McpPublicTool[] = [
  {
    name: 'get_operator_system',
    description:
      'Return the versioned public Never86 operator OS pack (loop, routines, agents, truth gates, safety, private-store boundary). Call first.',
    inputSchema: emptyObjectSchema,
    annotations: MCP_READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'get_operator_logic',
    description:
      'Fetch one public Never86 rulebook domain, or the full public logic bundle when domain is omitted or "all".',
    inputSchema: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          enum: [...PUBLIC_LOGIC_DOMAINS],
          description: 'Optional. Defaults to "all". Prefer a single domain unless the whole public bundle is needed.',
        },
      },
      additionalProperties: false,
    },
    annotations: MCP_READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'get_3p_audit_logic',
    description:
      'Return public marketplace 3P audit rules: evidence ladder, formulas, DoorDash mappings, claim boundaries, and payout tolerance.',
    inputSchema: emptyObjectSchema,
    annotations: MCP_READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'list_answers',
    description:
      'List published public AEO answers (slug, title, question, audience, URL). No private store data.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          description: 'Optional max rows. Omit to return the full published catalog.',
        },
      },
      additionalProperties: false,
    },
    annotations: MCP_READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'list_free_agents',
    description:
      'List CSV-runnable free agents (slug, name, seat, headline, catches, sample signal, public URLs). Catalog only.',
    inputSchema: emptyObjectSchema,
    annotations: MCP_READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'list_agent_jobs',
    description:
      'List the public one-agent-one-job governance registry: store team, company roles, and free agents — each with a single job string.',
    inputSchema: {
      type: 'object',
      properties: {
        team: {
          type: 'string',
          enum: ['all', 'store', 'company', 'free-agent'],
          description: 'Optional filter. Defaults to "all".',
        },
      },
      additionalProperties: false,
    },
    annotations: MCP_READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'list_specialists',
    description:
      'List domain specialists (labor, beverage, food-invoice, human-coach, design-qa, truth-qa) with one job each, allowed tools, and MCP resource URIs.',
    inputSchema: emptyObjectSchema,
    annotations: MCP_READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'analyze_labor',
    description:
      'Analyze an operator-provided labor or time-clock CSV for schedule-versus-actual drift, early clock-ins, late clock-outs, overtime concentration, and possible shifts with no attached sales. Returns Unverified observations only; it never alleges theft or misconduct.',
    inputSchema: {
      type: 'object',
      properties: {
        csv: {
          type: 'string',
          minLength: 1,
          maxLength: 750000,
          description:
            'CSV text with Location, Employee, Scheduled Start/End, and Clock In/Out. Optional Net Sales and Wage Rate improve the report.',
        },
      },
      required: ['csv'],
      additionalProperties: false,
    },
    annotations: MCP_READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'analyze_beverage',
    description:
      'Analyze an operator-provided beverage / bar CSV for pour-vs-inventory or package cost patterns. Returns Unverified review leads only; no count means no beverage-cost claim; never invents pour cost or names theft.',
    inputSchema: {
      type: 'object',
      properties: {
        csv: {
          type: 'string',
          minLength: 1,
          maxLength: 750000,
          description:
            'CSV text for beverage cost scoring (item, pours/sales, inventory or package fields per the beverage score adapter).',
        },
      },
      required: ['csv'],
      additionalProperties: false,
    },
    annotations: MCP_READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'analyze_vendor_prices',
    description:
      'Read an operator-provided vendor invoice or purchasing CSV SKU by SKU and surface price increases greater than 5% between the two latest periods. Returns Unverified evidence for operator review; it never contacts a vendor or claims guaranteed savings.',
    inputSchema: {
      type: 'object',
      properties: {
        csv: {
          type: 'string',
          minLength: 1,
          maxLength: 750000,
          description:
            'CSV text with Vendor, SKU or Description, Period or Invoice Date, and Unit Price. Category is optional.',
        },
      },
      required: ['csv'],
      additionalProperties: false,
    },
    annotations: MCP_READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'build_action_shift',
    description:
      "Turn one restaurant's prior-day close into no more than three prioritized actions plus a night proof checklist. Uses only operator-supplied data and targets, labels results Unverified, and never converts a variance into a theft, discipline, contract, or guaranteed-savings claim.",
    inputSchema: {
      type: 'object',
      properties: {
        store: { type: 'string' },
        business_date: {
          type: 'string',
          description: 'Prior complete restaurant business date, preferably YYYY-MM-DD.',
        },
        gross_sales: { type: 'number', exclusiveMinimum: 0 },
        order_count: { type: 'number', minimum: 0 },
        labor_dollars: { type: 'number', minimum: 0 },
        labor_target_pct: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          description: 'Operator-approved target only; omit when unknown.',
        },
        expected_cash: { type: 'number', minimum: 0 },
        entered_deposit: { type: 'number', minimum: 0 },
        payouts: { type: 'number', minimum: 0 },
        discounts: { type: 'number', minimum: 0 },
        promotions: { type: 'number', minimum: 0 },
        voids: { type: 'number', minimum: 0 },
        late_delivery_count: { type: 'number', minimum: 0 },
        late_delivery_sales: { type: 'number', minimum: 0 },
        average_delivery_minutes: { type: 'number', minimum: 0 },
        target_delivery_minutes: {
          type: 'number',
          minimum: 0,
          description: 'Operator-approved target only; omit when unknown.',
        },
      },
      required: ['gross_sales'],
      additionalProperties: false,
    },
    annotations: MCP_READ_ONLY_ANNOTATIONS,
  },
];

export const MCP_PUBLIC_TOOL_NAMES = MCP_PUBLIC_TOOLS.map((tool) => tool.name);

export const MCP_KNOWLEDGE_TOOL_NAMES = [...KNOWLEDGE_TOOL_NAMES];

export const MCP_ANALYSIS_TOOL_NAMES = [
  'analyze_labor',
  'analyze_beverage',
  'analyze_vendor_prices',
  'build_action_shift',
] as const;

export function assertAllPublicToolsReadOnly(
  tools: readonly McpPublicTool[] = MCP_PUBLIC_TOOLS,
): string[] {
  return tools.flatMap((tool) => {
    const failures: string[] = [];
    if (tool.annotations.readOnlyHint !== true) failures.push(`${tool.name} is not read-only`);
    if (tool.annotations.destructiveHint !== false) failures.push(`${tool.name} is marked destructive`);
    return failures;
  });
}
