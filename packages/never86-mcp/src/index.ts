#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { calculate3pMarketplaceCost } from "./formulas/marketplace.js";
import { buildActionShift } from "./formulas/action-shift.js";
import { buildVendorSilenceTicket } from "./formulas/vendor-silence.js";
import {
  getPosRouter,
  getVendorSilo,
  listAllBots,
  listPosBots,
  listVendorSilos,
} from "./roster.js";
import { getSystemBot, listSystemBots, SYSTEM_BOTS } from "./system-bots.js";

const SYSTEM_VERSION = "3.0.0";

const tools = [
  { name: "get_operator_system", description: "Never86 operating-system pack v3.", inputSchema: { type: "object", properties: {} } },
  {
    name: "get_operator_logic",
    description: "Public rulebook domain or all.",
    inputSchema: {
      type: "object",
      properties: {
        domain: {
          type: "string",
          enum: ["all", "evidence", "action-shift", "marketplace-3p", "pos-routing", "invoices-daily-prime", "voids-refunds", "labor", "tips", "catering", "vendor-drift", "beverage", "product-mix-pars", "safety"],
        },
      },
      required: ["domain"],
    },
  },
  {
    name: "calculate_3p_marketplace_cost",
    description: "Deterministic 3P Quick Win. Integer cents. Commission is not total marketplace cost.",
    inputSchema: {
      type: "object",
      properties: {
        platform: { type: "string" },
        period: { type: "string" },
        eligible_sales: { type: "number" },
        commission: { type: "number" },
        merchant_fees: { type: "number" },
        restaurant_funded_promotions_ads: { type: "number" },
        refunds_adjustments: { type: "number" },
        other_deductions: { type: "number" },
        credits: { type: "number" },
        reported_payout: { type: "number" },
      },
      required: ["eligible_sales", "commission", "merchant_fees", "restaurant_funded_promotions_ads", "refunds_adjustments", "other_deductions", "credits"],
    },
  },
  {
    name: "build_action_shift",
    description: "Prior-day close → ≤3 morning actions + night proof checklist. Unverified.",
    inputSchema: {
      type: "object",
      properties: {
        store: { type: "string" },
        business_date: { type: "string" },
        gross_sales: { type: "number" },
        order_count: { type: "number" },
        labor_dollars: { type: "number" },
        labor_target_pct: { type: "number" },
        expected_cash: { type: "number" },
        entered_deposit: { type: "number" },
        payouts: { type: "number" },
        discounts: { type: "number" },
        promotions: { type: "number" },
        voids: { type: "number" },
        late_delivery_count: { type: "number" },
        late_delivery_sales: { type: "number" },
        average_delivery_minutes: { type: "number" },
        target_delivery_minutes: { type: "number" },
      },
      required: ["gross_sales"],
    },
  },
  {
    name: "build_vendor_silence_ticket",
    description: "Vendor silence clock. First 14 days advisory. No duplicate tickets.",
    inputSchema: {
      type: "object",
      properties: {
        vendor: { type: "string" },
        store: { type: "string" },
        owner: { type: "string" },
        last_seen_date: { type: "string" },
        as_of_date: { type: "string" },
        expected_cadence_days: { type: "integer" },
        grace_days: { type: "integer" },
        pause_weekends: { type: "boolean" },
        paused_dates: { type: "array", items: { type: "string" } },
        program_started_date: { type: "string" },
        existing_open_ticket_id: { type: "string" },
        last_seen_evidence: { type: "string" },
      },
      required: ["vendor", "last_seen_date", "as_of_date", "expected_cadence_days"],
    },
  },
  { name: "list_bots", description: "All named bots.", inputSchema: { type: "object", properties: {} } },
  { name: "list_pos_bots", description: "Top 10 POS routers.", inputSchema: { type: "object", properties: {} } },
  { name: "get_pos_router", description: "One POS router. slug: toast|pdq|square|aloha|simphony|brink|lightspeed|clover|revel|spoton", inputSchema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] } },
  { name: "list_vendor_silos", description: "Vendor silos.", inputSchema: { type: "object", properties: {} } },
  { name: "get_vendor_silo", description: "One vendor silo. slug: sysco|usfoods|pfg|reinhart|martin-brothers|produce|coke|pepsi|beer|chem-paper", inputSchema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] } },
  { name: "list_system_bots", description: "One bot per back-office system.", inputSchema: { type: "object", properties: {} } },
  { name: "get_system_bot", description: "One system bot. slug: marginedge|restaurant365|marketman|xtrachef|bluecart|ottimate|meez|quickbooks", inputSchema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] } },
];

const SYSTEM_PACK = {
  version: SYSTEM_VERSION,
  promise: "Find the leak. Assign the fix. Keep the receipt.",
  loop: ["capture", "parse", "truth-gate", "normalize", "decide", "assign", "approve", "prove", "learn", "repeat"],
  networkRule: "Every LLM calls the same Never86 MCP. Prompts may differ; formulas do not.",
};

function jsonResult(obj: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(obj, null, 2) }] };
}
function errorResult(message: string) {
  return { content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }], isError: true };
}

const server = new Server(
  { name: "never86-operator-mcp", version: SYSTEM_VERSION },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const name = request.params.name;
  const args = (request.params.arguments ?? {}) as Record<string, unknown>;
  try {
    switch (name) {
      case "get_operator_system":
        return jsonResult(SYSTEM_PACK);
      case "get_operator_logic":
        return jsonResult({ domain: args.domain ?? "all", note: "Full public rulebook also in Never86 Operator System v3 connector." });
      case "calculate_3p_marketplace_cost":
        return jsonResult(
          calculate3pMarketplaceCost({
            platform: String(args.platform ?? "unspecified"),
            period: args.period ? String(args.period) : undefined,
            eligible_sales: Number(args.eligible_sales),
            commission: Number(args.commission),
            merchant_fees: Number(args.merchant_fees),
            restaurant_funded_promotions_ads: Number(args.restaurant_funded_promotions_ads),
            refunds_adjustments: Number(args.refunds_adjustments),
            other_deductions: Number(args.other_deductions),
            credits: Number(args.credits),
            reported_payout: args.reported_payout === undefined ? undefined : Number(args.reported_payout),
          })
        );
      case "build_action_shift":
        return jsonResult(
          buildActionShift({
            store: args.store ? String(args.store) : undefined,
            business_date: args.business_date ? String(args.business_date) : undefined,
            gross_sales: Number(args.gross_sales),
            order_count: args.order_count === undefined ? undefined : Number(args.order_count),
            labor_dollars: args.labor_dollars === undefined ? undefined : Number(args.labor_dollars),
            labor_target_pct: args.labor_target_pct === undefined ? undefined : Number(args.labor_target_pct),
            expected_cash: args.expected_cash === undefined ? undefined : Number(args.expected_cash),
            entered_deposit: args.entered_deposit === undefined ? undefined : Number(args.entered_deposit),
            payouts: args.payouts === undefined ? undefined : Number(args.payouts),
            discounts: args.discounts === undefined ? undefined : Number(args.discounts),
            promotions: args.promotions === undefined ? undefined : Number(args.promotions),
            voids: args.voids === undefined ? undefined : Number(args.voids),
            late_delivery_count: args.late_delivery_count === undefined ? undefined : Number(args.late_delivery_count),
            late_delivery_sales: args.late_delivery_sales === undefined ? undefined : Number(args.late_delivery_sales),
            average_delivery_minutes: args.average_delivery_minutes === undefined ? undefined : Number(args.average_delivery_minutes),
            target_delivery_minutes: args.target_delivery_minutes === undefined ? undefined : Number(args.target_delivery_minutes),
          })
        );
      case "build_vendor_silence_ticket":
        return jsonResult(
          buildVendorSilenceTicket({
            vendor: String(args.vendor),
            store: args.store ? String(args.store) : undefined,
            owner: args.owner ? String(args.owner) : undefined,
            last_seen_date: String(args.last_seen_date),
            as_of_date: String(args.as_of_date),
            expected_cadence_days: Number(args.expected_cadence_days),
            grace_days: args.grace_days === undefined ? undefined : Number(args.grace_days),
            pause_weekends: Boolean(args.pause_weekends),
            paused_dates: Array.isArray(args.paused_dates) ? args.paused_dates.map(String) : undefined,
            program_started_date: args.program_started_date ? String(args.program_started_date) : undefined,
            existing_open_ticket_id: args.existing_open_ticket_id ? String(args.existing_open_ticket_id) : undefined,
            last_seen_evidence: args.last_seen_evidence ? String(args.last_seen_evidence) : undefined,
          })
        );
      case "list_bots":
        return jsonResult({ version: SYSTEM_VERSION, bots: [...listAllBots(), ...SYSTEM_BOTS] });
      case "list_pos_bots":
        return jsonResult({ pos: listPosBots() });
      case "get_pos_router":
        return jsonResult(getPosRouter(String(args.slug ?? "")));
      case "list_vendor_silos":
        return jsonResult({ silos: listVendorSilos() });
      case "get_vendor_silo":
        return jsonResult(getVendorSilo(String(args.slug ?? "")));
      case "list_system_bots":
        return jsonResult({ systems: listSystemBots() });
      case "get_system_bot":
        return jsonResult(getSystemBot(String(args.slug ?? "")));
      default:
        return errorResult(`unknown tool: ${name}`);
    }
  } catch (err) {
    return errorResult(err instanceof Error ? err.message : String(err));
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
