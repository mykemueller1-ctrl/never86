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
  description:
    "Never 86'd finds restaurant leaks in Payroll, Prices, and Process. It analyzes operator-provided data, labels it Unverified, and returns read-only evidence and next actions.",
} as const;

export const MCP_PUBLIC_TOOLS: readonly McpPublicTool[] = [
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
