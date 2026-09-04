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
      'List domain specialists (labor, beverage, food-invoice, recipe-cost, human-coach, design-qa, truth-qa) with one job each, allowed tools, and MCP resource URIs.',
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
    name: 'convert_uom',
    description:
      'Convert verified restaurant package sizes into pour/portion units (bottle mL → fl oz, keg gal → fl oz, pours per package, cost per pour). Refuses invented pack size or pourSpec. Fluid ounce ≠ weight ounce. House pour ounces come from ask_pour_standards / declare_pour_standards — never assume 1.5.',
    inputSchema: {
      type: 'object',
      properties: {
        op: {
          type: 'string',
          enum: [
            'bottle_fl_oz',
            'keg_fl_oz',
            'pours_per_package',
            'cost_per_pour',
            'volume',
            'mass',
            'fountain_bib',
            'cup_service',
            'fountain_cup_pour',
            'knowledge',
          ],
          description:
            'Conversion operation. Use knowledge for the full UoM pack. Fountain BIB ops need operator-declared mix ratio + cup liquid fill — never invent 5+1 or ice fill.',
        },
        package_ml: { type: 'number', exclusiveMinimum: 0 },
        keg_gal: { type: 'number', exclusiveMinimum: 0 },
        units_per_package: { type: 'number', exclusiveMinimum: 0 },
        unit_fl_oz: { type: 'number', exclusiveMinimum: 0 },
        pour_spec_fl_oz: {
          type: 'number',
          exclusiveMinimum: 0,
          description: 'House pour in fl oz from THIS unit (1.5, 1.75, 2, or custom). Required for pours_per_package — never invent.',
        },
        package_cost: { type: 'number', minimum: 0 },
        pours_per_package: { type: 'number', exclusiveMinimum: 0 },
        amount: { type: 'number', minimum: 0 },
        from: { type: 'string', description: 'Volume: ml|l|flOz|gal. Mass: g|kg|ozAv|lb.' },
        to: { type: 'string' },
        syrup_gal: {
          type: 'number',
          exclusiveMinimum: 0,
          description: 'Fountain BIB syrup gallons (e.g. 5). Not finished beverage gallons.',
        },
        bib_cost: { type: 'number', minimum: 0, description: 'Invoice/landed $ for THIS BIB (syrup only).' },
        water_parts: {
          type: 'number',
          exclusiveMinimum: 0,
          description: 'Operator-declared water parts in mix ratio (e.g. 5 for 5+1). Never invent.',
        },
        syrup_parts: {
          type: 'number',
          exclusiveMinimum: 0,
          description: 'Operator-declared syrup parts in mix ratio (usually 1).',
        },
        product_label: { type: 'string' },
        cup_marked_fl_oz: { type: 'number', exclusiveMinimum: 0 },
        liquid_fill_fl_oz: {
          type: 'number',
          exclusiveMinimum: 0,
          description: 'Liquid fl oz after ice + straw. Cup mark alone is not enough.',
        },
        ice_note: { type: 'string' },
        spirit_fl_oz: {
          type: 'number',
          minimum: 0,
          description: 'House spirit pour already in the cup — reduces soda fill.',
        },
      },
      required: ['op'],
      additionalProperties: false,
    },
    annotations: MCP_READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'ask_pour_standards',
    description:
      'Interview pack for THIS restaurant unit’s drink pour sizes. Returns questions and choice menus (1.5 / 1.75 / 2 oz, etc.). Does not invent a house pour. Call before costing drink recipes.',
    inputSchema: {
      type: 'object',
      properties: {
        store_id: { type: 'string', description: 'Store / unit id. Pour standards are per unit.' },
        location_id: { type: 'string', description: 'Optional bar / location within the store.' },
        categories: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['spirit_shot', 'mixed_drink_liquor', 'wine_glass', 'draft_pour', 'packaged_beer', 'double_spirit'],
          },
        },
      },
      additionalProperties: false,
    },
    annotations: MCP_READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'declare_pour_standards',
    description:
      'Validate operator-answered house pour lines for one unit (e.g. shot 1.5, mixed 1.75, wine 5). Returns Missing Evidence for unanswered categories. Does not write memory — returns a Memory Curator proposal for human approve.',
    inputSchema: {
      type: 'object',
      properties: {
        store_id: { type: 'string' },
        location_id: { type: 'string' },
        lines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                enum: ['spirit_shot', 'mixed_drink_liquor', 'wine_glass', 'draft_pour', 'packaged_beer', 'double_spirit'],
              },
              pour_spec_fl_oz: { type: 'number', exclusiveMinimum: 0, maximum: 32 },
              label: { type: 'string' },
              measure_method: { type: 'string' },
              approved_by: { type: 'string' },
              source: { type: 'string' },
            },
            required: ['category', 'pour_spec_fl_oz'],
            additionalProperties: false,
          },
        },
      },
      required: ['store_id', 'lines'],
      additionalProperties: false,
    },
    annotations: MCP_READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'ask_fountain_standards',
    description:
      'Interview pack for fountain / bag-in-box gun soda at THIS unit: BIB syrup gallons, invoice $, mix ratio (e.g. 5+1 — ask, never invent), cup mark, and liquid fill after ice + straw. Call before costing Pepsi-gun recipes.',
    inputSchema: {
      type: 'object',
      properties: {
        store_id: { type: 'string', description: 'Store / unit id. Fountain standards are per unit.' },
        product_hint: {
          type: 'string',
          description: 'Gun product label if known (e.g. Pepsi).',
        },
      },
      additionalProperties: false,
    },
    annotations: MCP_READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'analyze_recipe_cost',
    description:
      'Cost a plate (mode=recipe), a liquor drink (mode=drink_recipe), or a fountain+spirit drink (mode=fountain_spirit_drink). Drink recipes pull liquor fl oz from THIS unit’s house pour; fountain soda needs BIB mix ratio + cup liquid fill after ice — never assume 1.5 / 1.75 / 2 or 5+1. Also EP unit cost / food COGS / food-cost % when counts and sales share scope. Unverified math; never invents yield or treats an invoice as COGS.',
    inputSchema: {
      type: 'object',
      properties: {
        mode: {
          type: 'string',
          enum: [
            'recipe',
            'drink_recipe',
            'fountain_spirit_drink',
            'ep_unit_cost',
            'food_cogs',
            'food_cost_pct',
            'contribution',
            'knowledge',
          ],
        },
        store_id: {
          type: 'string',
          description: 'Required for drink_recipe. Pour standards are per unit.',
        },
        location_id: { type: 'string' },
        house_pour_lines: {
          type: 'array',
          description:
            'For drink_recipe: operator-declared pour lines for THIS unit (from declare_pour_standards). Empty → Missing Evidence + ask.',
          items: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                enum: ['spirit_shot', 'mixed_drink_liquor', 'wine_glass', 'draft_pour', 'packaged_beer', 'double_spirit'],
              },
              pour_spec_fl_oz: { type: 'number', exclusiveMinimum: 0, maximum: 32 },
              label: { type: 'string' },
              measure_method: { type: 'string' },
              approved_by: { type: 'string' },
              source: { type: 'string' },
            },
            required: ['category', 'pour_spec_fl_oz'],
            additionalProperties: false,
          },
        },
        ingredients: {
          type: 'array',
          description:
            'recipe: [{name?, epQty, epUnitCost}]. drink_recipe: liquor lines use pourCategory + house pour; fixed/recipe_specific need epQty.',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              epQty: { type: 'number', minimum: 0 },
              epUnitCost: { type: 'number', minimum: 0 },
              pourCategory: {
                type: 'string',
                enum: ['spirit_shot', 'mixed_drink_liquor', 'wine_glass', 'draft_pour', 'packaged_beer', 'double_spirit'],
              },
              pourSource: {
                type: 'string',
                enum: ['house', 'recipe_specific', 'fixed'],
                description: 'house (default with pourCategory) uses unit pourSpec; recipe_specific needs explicit epQty; fixed = syrup/juice.',
              },
            },
            additionalProperties: false,
          },
        },
        ap_unit_cost: { type: 'number', minimum: 0 },
        yield_fraction: { type: 'number', exclusiveMinimum: 0 },
        beginning_inventory: { type: 'number', minimum: 0 },
        purchases: { type: 'number', minimum: 0 },
        ending_inventory: { type: 'number', minimum: 0 },
        food_cogs: { type: 'number' },
        food_sales: { type: 'number', exclusiveMinimum: 0 },
        menu_price: { type: 'number', exclusiveMinimum: 0 },
        recipe_cost: { type: 'number', minimum: 0 },
        soda_label: { type: 'string', description: 'For fountain_spirit_drink (e.g. Pepsi).' },
        spirit_label: { type: 'string', description: 'For fountain_spirit_drink (e.g. Hawkeye vodka).' },
        syrup_gal: { type: 'number', exclusiveMinimum: 0, description: 'BIB syrup gallons (e.g. 5).' },
        bib_cost: { type: 'number', minimum: 0, description: 'Invoice/landed $ for THIS BIB.' },
        water_parts: { type: 'number', exclusiveMinimum: 0, description: 'Declared water parts (e.g. 5 for 5+1).' },
        syrup_parts: { type: 'number', exclusiveMinimum: 0, description: 'Declared syrup parts (usually 1).' },
        cup_marked_fl_oz: { type: 'number', exclusiveMinimum: 0 },
        liquid_fill_fl_oz: {
          type: 'number',
          exclusiveMinimum: 0,
          description: 'Liquid fl oz after ice + straw — not the cup mark alone.',
        },
        spirit_pour_fl_oz: {
          type: 'number',
          exclusiveMinimum: 0,
          description: 'THIS unit’s mixed-drink liquor pour for the spirit line.',
        },
        spirit_cost_per_fl_oz: {
          type: 'number',
          minimum: 0,
          description: 'Spirit cost per fl oz after bottle pack conversion.',
        },
      },
      required: ['mode'],
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
  'convert_uom',
  'ask_pour_standards',
  'declare_pour_standards',
  'ask_fountain_standards',
  'analyze_recipe_cost',
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
