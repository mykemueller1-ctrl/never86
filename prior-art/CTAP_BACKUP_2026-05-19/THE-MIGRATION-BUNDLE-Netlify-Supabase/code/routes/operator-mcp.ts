import { Router, type IRouter, type Request, type Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { eq, desc, and, count, gte, sql, inArray } from "drizzle-orm";
import {
  db,
  operatorUsers,
  operatorInvoices,
  operatorZReports,
  operatorInventory,
  operatorRecipes,
  operatorEmployees,
  operatorLaborSchedules,
  mcpUsageEvents,
  invoiceIntelligenceReports,
} from "@workspace/db";
import { logger } from "../lib/logger";
import { operatorAuthMiddleware, type AuthRequest } from "../lib/operator-auth";
import { requireAdmin } from "../lib/admin-auth";
import {
  presentReportSummary,
  presentReportDetail,
  presentRollup,
} from "../lib/invoice-intelligence-presenter";

const router: IRouter = Router();

type OperatorRow = typeof operatorUsers.$inferSelect;

function track(operatorId: number, tool: string, client: McpClient, extra: Record<string, unknown> = {}) {
  logger.info({ event: "mcp_request", operatorId, tool, client, ...extra }, "mcp_request");
  // Persist to DB for usage analytics. Fire-and-forget so a slow insert never
  // blocks the MCP tool response. Errors are logged but swallowed.
  db.insert(mcpUsageEvents)
    .values({ operatorId, client, tool, metadata: extra as Record<string, unknown> })
    .then(() => {})
    .catch((err) => logger.warn({ err: String(err) }, "mcp_usage insert failed"));
}

export type McpClient = "claude" | "chatgpt" | "unknown";

/**
 * Infer the calling MCP client from request headers. ChatGPT workspace Custom
 * Connectors and Claude Desktop both speak Streamable HTTP, but they identify
 * themselves differently in the User-Agent / MCP-Client headers.
 */
export function detectMcpClient(req: Request): McpClient {
  const explicit = String(req.headers["mcp-client"] ?? "").toLowerCase();
  const ua = String(req.headers["user-agent"] ?? "").toLowerCase();
  const haystack = `${explicit} ${ua}`;
  if (haystack.includes("chatgpt") || haystack.includes("openai")) return "chatgpt";
  if (haystack.includes("claude") || haystack.includes("anthropic")) return "claude";
  return "unknown";
}

function num(value: unknown): number {
  const n = parseFloat(String(value ?? 0));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Parse a strict YYYY-MM-DD calendar date. Rejects invalid months/days
 * (e.g. `2026-99-99`, `2026-02-30`, `2025-02-29`) by round-tripping through
 * `Date.toISOString()` and comparing to the original string — JS's Date
 * silently rolls over `2026-02-30` to March 2, which is exactly the kind of
 * silent corruption that would confuse Claude / ChatGPT and the operator.
 *
 * Returns the original string when valid, `null` when not. Never throws.
 */
export function parseIsoDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10) === value ? value : null;
}

type LineItem = {
  description?: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  total?: number;
};

/**
 * Compute per-line-item benchmark deltas for one invoice by comparing each
 * line's unit price against the operator's own historical average for that
 * description. Pure read-only — no writes, no notifications.
 */
export async function computeInvoiceBenchmarkDeltas(
  operatorId: number,
  lineItems: LineItem[],
): Promise<Array<LineItem & { avgUnitPrice?: number; pctChange?: number; samples?: number }>> {
  if (!Array.isArray(lineItems) || lineItems.length === 0) return [];

  const historical = await db
    .select()
    .from(operatorInvoices)
    .where(eq(operatorInvoices.operatorId, operatorId))
    .orderBy(desc(operatorInvoices.createdAt))
    .limit(50);

  const priceHistory = new Map<string, number[]>();
  for (const inv of historical) {
    if (!inv.lineItems) continue;
    try {
      const parsed = typeof inv.lineItems === "string" ? JSON.parse(inv.lineItems) : inv.lineItems;
      if (!Array.isArray(parsed)) continue;
      for (const item of parsed as LineItem[]) {
        if (!item.description || !item.unitPrice) continue;
        const key = item.description.toLowerCase().trim();
        const arr = priceHistory.get(key) ?? [];
        arr.push(item.unitPrice);
        priceHistory.set(key, arr);
      }
    } catch {
      /* skip malformed */
    }
  }

  return lineItems.map((item) => {
    if (!item.description || !item.unitPrice) return { ...item };
    const key = item.description.toLowerCase().trim();
    const history = priceHistory.get(key);
    if (!history || history.length < 2) return { ...item, samples: history?.length ?? 0 };
    const avg = history.reduce((s, p) => s + p, 0) / history.length;
    const pct = ((item.unitPrice - avg) / avg) * 100;
    return {
      ...item,
      avgUnitPrice: Math.round(avg * 100) / 100,
      pctChange: Math.round(pct * 10) / 10,
      samples: history.length,
    };
  });
}

// Exported so the integration test in __tests__/operator-mcp-tools.test.ts can
// stand up the MCP server with a mocked db and exercise each tool's JSON
// payload end-to-end. Production code paths still go through the
// router.post("/mcp/operator") handler below.
export function buildServer(operator: OperatorRow, client: McpClient): McpServer {
  const server = new McpServer({
    name: "never86-operator",
    version: "1.0.0",
  });
  const opId = operator.id;

  server.tool(
    "list_invoices",
    "List recent vendor invoices for the authenticated Never 86'd operator with totals and categories.",
    {
      limit: z.number().int().min(1).max(100).optional().describe("Max invoices to return (default 25)."),
    },
    async ({ limit }) => {
      const max = limit ?? 25;
      const rows = await db
        .select()
        .from(operatorInvoices)
        .where(eq(operatorInvoices.operatorId, opId))
        .orderBy(desc(operatorInvoices.invoiceDate))
        .limit(max);
      track(opId, "list_invoices", client, { count: rows.length });
      const payload = {
        operator: operator.restaurantName,
        count: rows.length,
        totalAmount: Math.round(rows.reduce((s, r) => s + num(r.amount), 0) * 100) / 100,
        invoices: rows.map((r) => ({
          id: r.id,
          vendor: r.vendor,
          amount: num(r.amount),
          category: r.category,
          invoiceDate: r.invoiceDate,
          status: r.status,
        })),
      };
      return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
    },
  );

  server.tool(
    "read_invoice",
    "Read a single vendor invoice with its line items and a per-line benchmark delta vs the operator's own 50-invoice price history.",
    { invoiceId: z.number().int().describe("Invoice id from list_invoices.") },
    async ({ invoiceId }) => {
      const [row] = await db
        .select()
        .from(operatorInvoices)
        .where(and(eq(operatorInvoices.id, invoiceId), eq(operatorInvoices.operatorId, opId)))
        .limit(1);
      track(opId, "read_invoice", client, { invoiceId, found: !!row });
      if (!row) {
        return { content: [{ type: "text" as const, text: `No invoice with id ${invoiceId} for this operator.` }] };
      }
      let parsedLines: LineItem[] = [];
      const raw = row.lineItems;
      if (typeof raw === "string") {
        try {
          const j = JSON.parse(raw);
          parsedLines = Array.isArray(j) ? j : [];
        } catch {
          parsedLines = [];
        }
      } else if (Array.isArray(raw)) {
        parsedLines = raw as LineItem[];
      }
      const enriched = await computeInvoiceBenchmarkDeltas(opId, parsedLines);
      const flagged = enriched.filter((i) => typeof i.pctChange === "number" && i.pctChange > 10);
      const payload = {
        id: row.id,
        vendor: row.vendor,
        amount: num(row.amount),
        category: row.category,
        invoiceDate: row.invoiceDate,
        status: row.status,
        source: row.source,
        notes: row.notes ?? null,
        lineItems: enriched,
        flaggedItems: flagged.map((i) => ({
          item: i.description,
          currentUnitPrice: i.unitPrice,
          averageUnitPrice: i.avgUnitPrice,
          pctChange: i.pctChange,
          samples: i.samples,
        })),
        rawLineItems: typeof raw === "string" && parsedLines.length === 0 ? raw : undefined,
        benchmarkNote:
          parsedLines.length === 0
            ? "No structured line items on this invoice — only the total amount is available."
            : `Computed line-level deltas vs this operator's last 50 invoices. ${flagged.length} item(s) priced >10% above their historical average.`,
      };
      return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
    },
  );

  server.tool(
    "list_z_reports",
    "List recent end-of-day Z reports with sales, prime cost, and labor cost summaries.",
    {
      limit: z.number().int().min(1).max(60).optional().describe("Max Z-reports to return (default 14)."),
    },
    async ({ limit }) => {
      const max = limit ?? 14;
      const rows = await db
        .select()
        .from(operatorZReports)
        .where(eq(operatorZReports.operatorId, opId))
        .orderBy(desc(operatorZReports.reportDate))
        .limit(max);
      track(opId, "list_z_reports", client, { count: rows.length });
      const reports = rows.map((r) => ({
        id: r.id,
        reportDate: r.reportDate,
        sales: num(r.sales),
        foodCogs: num(r.foodCogs),
        laborCost: num(r.laborCost),
        primeCost: num(r.primeCost),
        foodCostPct: num(r.foodCostPct),
        laborCostPct: num(r.laborCostPct),
        primeCostPct: num(r.primeCostPct),
        covers: r.covers ?? null,
      }));
      const totalSales = reports.reduce((s, r) => s + r.sales, 0);
      const avgPrime = reports.length ? reports.reduce((s, r) => s + r.primeCostPct, 0) / reports.length : 0;
      const payload = {
        count: reports.length,
        totalSales: Math.round(totalSales * 100) / 100,
        averagePrimeCostPct: Math.round(avgPrime * 10) / 10,
        reports,
      };
      return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
    },
  );

  server.tool(
    "read_z_report",
    "Read a single Z report with its full sales / cost breakdown.",
    { reportId: z.number().int().describe("Z report id from list_z_reports.") },
    async ({ reportId }) => {
      const [row] = await db
        .select()
        .from(operatorZReports)
        .where(and(eq(operatorZReports.id, reportId), eq(operatorZReports.operatorId, opId)))
        .limit(1);
      track(opId, "read_z_report", client, { reportId, found: !!row });
      if (!row) {
        return { content: [{ type: "text" as const, text: `No Z report with id ${reportId} for this operator.` }] };
      }
      const payload = {
        id: row.id,
        reportDate: row.reportDate,
        sales: num(row.sales),
        foodCogs: num(row.foodCogs),
        laborCost: num(row.laborCost),
        primeCost: num(row.primeCost),
        foodCostPct: num(row.foodCostPct),
        laborCostPct: num(row.laborCostPct),
        primeCostPct: num(row.primeCostPct),
        covers: row.covers ?? null,
        notes: row.notes ?? null,
      };
      return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
    },
  );

  server.tool(
    "list_inventory_items",
    "List the operator's current inventory snapshot with on-hand quantities, par levels, and unit costs.",
    {
      lowStockOnly: z.boolean().optional().describe("If true, only return items currently below par."),
    },
    async ({ lowStockOnly }) => {
      const rows = await db
        .select()
        .from(operatorInventory)
        .where(eq(operatorInventory.operatorId, opId));
      const items = rows.map((r) => {
        const qty = num(r.quantity);
        const par = num(r.parLevel);
        const cost = num(r.costPerUnit);
        return {
          id: r.id,
          name: r.name,
          category: r.category,
          quantity: qty,
          unit: r.unit,
          parLevel: par,
          costPerUnit: cost,
          vendor: r.vendor ?? null,
          isLowStock: qty < par,
          extendedValue: Math.round(qty * cost * 100) / 100,
        };
      });
      const filtered = lowStockOnly ? items.filter((i) => i.isLowStock) : items;
      track(opId, "list_inventory_items", client, { count: filtered.length, lowStockOnly: !!lowStockOnly });
      const payload = {
        count: filtered.length,
        totalValue: Math.round(filtered.reduce((s, i) => s + i.extendedValue, 0) * 100) / 100,
        items: filtered,
      };
      return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
    },
  );

  server.tool(
    "read_recipe",
    "Read a single recipe with its ingredients and theoretical food cost.",
    { recipeId: z.number().int().describe("Recipe id from the operator's recipe library.") },
    async ({ recipeId }) => {
      const [row] = await db
        .select()
        .from(operatorRecipes)
        .where(and(eq(operatorRecipes.id, recipeId), eq(operatorRecipes.operatorId, opId)))
        .limit(1);
      track(opId, "read_recipe", client, { recipeId, found: !!row });
      if (!row) {
        return { content: [{ type: "text" as const, text: `No recipe with id ${recipeId} for this operator.` }] };
      }
      let ingredients: unknown = null;
      try { ingredients = JSON.parse(row.ingredients); } catch { ingredients = row.ingredients; }
      const payload = {
        id: row.id,
        name: row.name,
        category: row.category,
        sellingPrice: num(row.sellingPrice),
        theoreticalFoodCost: num(row.totalCost),
        costPct: num(row.costPct),
        margin: num(row.margin),
        ingredients,
        notes: row.notes ?? null,
      };
      return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
    },
  );

  server.tool(
    "get_operator_briefing",
    "Get today's plain-English operator briefing — top callouts, alerts, and recommendations across the operator's invoices, Z-reports, inventory, and recent Invoice Intelligence reports.",
    {},
    async () => {
      // Last-7-day window for invoice intelligence: matches the briefing's
      // "this week" framing. Anchored on createdAt (when the report was
      // produced) so a back-dated invoice still surfaces the day after the
      // operator runs the report on it — same convention as
      // summarize_invoice_intelligence (Task #186).
      const intelSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const [invoices, zReports, inventory, intelRows] = await Promise.all([
        db.select().from(operatorInvoices).where(eq(operatorInvoices.operatorId, opId)).orderBy(desc(operatorInvoices.invoiceDate)).limit(20),
        db.select().from(operatorZReports).where(eq(operatorZReports.operatorId, opId)).orderBy(desc(operatorZReports.reportDate)).limit(14),
        db.select().from(operatorInventory).where(eq(operatorInventory.operatorId, opId)),
        db.select().from(invoiceIntelligenceReports)
          .where(and(
            eq(invoiceIntelligenceReports.operatorId, opId),
            gte(invoiceIntelligenceReports.createdAt, intelSince),
          ))
          .orderBy(desc(invoiceIntelligenceReports.createdAt)),
      ]);

      const last14Sales = zReports.reduce((s, r) => s + num(r.sales), 0);
      const avgPrime = zReports.length ? zReports.reduce((s, r) => s + num(r.primeCostPct), 0) / zReports.length : 0;
      const avgFood = zReports.length ? zReports.reduce((s, r) => s + num(r.foodCostPct), 0) / zReports.length : 0;
      const avgLabor = zReports.length ? zReports.reduce((s, r) => s + num(r.laborCostPct), 0) / zReports.length : 0;
      const invoiceTotal = invoices.reduce((s, r) => s + num(r.amount), 0);
      const lowStock = inventory.filter((i) => num(i.quantity) < num(i.parLevel));

      // Route the raw intel rows through the presenter so any internal
      // fields (benchmark source, model notes, license-rule codes, etc.)
      // are stripped before we even compose the briefing strings. This is
      // the same chokepoint summarize_invoice_intelligence uses (Task #186).
      const intelRollup = presentRollup(intelRows, 7);

      const alerts: string[] = [];
      if (avgPrime > 65) alerts.push(`Prime cost averaging ${avgPrime.toFixed(1)}% over last ${zReports.length} days — above the 60% healthy ceiling.`);
      if (avgFood > 33) alerts.push(`Food cost averaging ${avgFood.toFixed(1)}% — above the 30% target.`);
      if (avgLabor > 34) alerts.push(`Labor cost averaging ${avgLabor.toFixed(1)}% — above the 32% target.`);
      if (lowStock.length) alerts.push(`${lowStock.length} inventory item(s) below par.`);

      // Invoice Intelligence callouts: the most actionable line in the
      // briefing because it's a dollar amount the operator can actually
      // recover by calling a vendor. Skip if no completed reports were
      // benchmarked this week. Cap at 2 lines to keep the alerts list
      // scannable.
      if (intelRollup.reportsAnalyzed > 0) {
        const top = intelRollup.topVendorsByGap[0];
        if (top && top.gapDollars > 0) {
          const reportWord = intelRollup.reportsAnalyzed === 1 ? "invoice report" : "invoice reports";
          const flagWord = intelRollup.redLineCount === 1 ? "red-flag line" : "red-flag lines";
          const flagSuffix = intelRollup.redLineCount > 0
            ? `, with ${intelRollup.redLineCount} ${flagWord}`
            : "";
          alerts.push(
            `${intelRollup.reportsAnalyzed} ${reportWord} benchmarked this week — ${top.vendor} is $${top.gapDollars.toFixed(2)} above benchmark${flagSuffix}.`,
          );
        }
        const drift = intelRollup.recentVendorDrifts[0];
        if (drift) {
          const vendorPrefix = drift.vendor ? `${drift.vendor}: ` : "";
          alerts.push(`Vendor drift — ${vendorPrefix}${drift.message}`);
        }
      }

      if (!alerts.length) alerts.push("No critical alerts — operations look on-track.");

      const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
      track(opId, "get_operator_briefing", client, { invoices: invoices.length, zReports: zReports.length, intelReports: intelRollup.reportsAnalyzed });
      const payload = {
        date: today,
        operator: operator.restaurantName,
        summary: zReports.length
          ? `Last ${zReports.length} days: $${last14Sales.toFixed(2)} in sales, prime cost ${avgPrime.toFixed(1)}% (food ${avgFood.toFixed(1)}% / labor ${avgLabor.toFixed(1)}%). ${invoices.length} invoices on file totalling $${invoiceTotal.toFixed(2)}.`
          : "Not enough Z-report history yet to compute a trend. Add a few days of end-of-day reports to unlock the full briefing.",
        keyMetrics: [
          { label: "Sales (last 14d)", value: `$${last14Sales.toFixed(2)}` },
          { label: "Prime Cost", value: `${avgPrime.toFixed(1)}%`, status: avgPrime > 65 ? "warning" : "good" },
          { label: "Food Cost", value: `${avgFood.toFixed(1)}%`, status: avgFood > 33 ? "warning" : "good" },
          { label: "Labor Cost", value: `${avgLabor.toFixed(1)}%`, status: avgLabor > 34 ? "warning" : "good" },
          { label: "Invoices on file", value: `${invoices.length} ($${invoiceTotal.toFixed(2)})` },
          { label: "Low-stock items", value: String(lowStock.length) },
        ],
        alerts,
        lowStockItems: lowStock.slice(0, 10).map((i) => ({ name: i.name, quantity: num(i.quantity), parLevel: num(i.parLevel), unit: i.unit })),
      };
      return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
    },
  );

  // ─── New ops-focused tools (Task #168) ────────────────────────────────────
  // All five accept an optional locationId; when omitted the result rolls up
  // across every location for the operator. Targets follow the same constants
  // used by the existing briefing tool: prime cost <= 60% (warn at 65%),
  // food cost <= 30% (warn at 33%), labor cost <= 32% (warn at 34%).

  // Date math runs in the operator's local timezone (operator_users.timezone)
  // so windows like today / this_week align with the business day on Z-reports
  // rather than UTC midnight. Falls back to America/Chicago.
  const opTz = operator.timezone || "America/Chicago";
  function isoInTz(d: Date, tz: string): string {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    });
    const parts = fmt.formatToParts(d);
    const y = parts.find((p) => p.type === "year")?.value ?? "1970";
    const m = parts.find((p) => p.type === "month")?.value ?? "01";
    const da = parts.find((p) => p.type === "day")?.value ?? "01";
    return `${y}-${m}-${da}`;
  }
  function shiftIsoDays(iso: string, days: number): string {
    // Anchor at noon UTC of the given calendar day to avoid DST cliffs.
    const d = new Date(`${iso}T12:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }
  function todayIso(): string {
    return isoInTz(new Date(), opTz);
  }
  function toIsoDate(d: Date): string {
    return isoInTz(d, opTz);
  }
  function daysAgo(n: number): string {
    return shiftIsoDays(todayIso(), -n);
  }

  // Pull voids / comps / cash-over-short / missing-clock-out counts from a
  // raw POS payload using the same key heuristics as the dashboard formatter
  // (see operator-dashboard.ts → formatZReport). Returns undefined for any
  // field the POS didn't include.
  function extractRawMetric(raw: unknown, ...keys: string[]): number | undefined {
    if (!raw || typeof raw !== "object") return undefined;
    const obj = raw as Record<string, unknown>;
    for (const k of keys) {
      const v = obj[k];
      if (v == null) continue;
      const n = typeof v === "number" ? v : parseFloat(String(v));
      if (!Number.isNaN(n)) return n;
    }
    return undefined;
  }
  function rawVoids(raw: unknown): number | undefined {
    return extractRawMetric(raw, "voids", "voidAmount", "void_total", "voidsTotal");
  }
  function rawComps(raw: unknown): number | undefined {
    return extractRawMetric(raw, "comps", "compAmount", "comp_total", "compsTotal");
  }
  function rawMissingClockOuts(raw: unknown): number | undefined {
    return extractRawMetric(raw, "missingClockOuts", "missing_clock_outs", "openShifts", "open_shifts", "shiftsWithoutEnd", "shifts_without_end");
  }

  server.tool(
    "get_prime_cost_digest",
    "Latest prime cost % with food cost % and labor cost % broken out, vs healthy targets (food 30%, labor 32%, prime 60%). Aggregates Z-reports for the last N days for a single location, or rolled up across all of the operator's locations when location_id is omitted. Use when the operator asks 'how is my prime cost doing' or 'am I on target this week'.",
    {
      days: z.number().int().min(1).max(60).optional().describe("How many days back to aggregate (default 7)."),
      location_id: z.number().int().optional().describe("If omitted, rolls up across all of the operator's locations."),
    },
    async ({ days, location_id }) => {
      const window = days ?? 7;
      const since = daysAgo(window - 1);
      const conds = [eq(operatorZReports.operatorId, opId), gte(operatorZReports.reportDate, since)];
      if (typeof location_id === "number") conds.push(eq(operatorZReports.locationId, location_id));
      const rows = await db
        .select()
        .from(operatorZReports)
        .where(and(...conds))
        .orderBy(desc(operatorZReports.reportDate));

      const totalSales = rows.reduce((s, r) => s + num(r.sales), 0);
      const totalFood = rows.reduce((s, r) => s + num(r.foodCogs), 0);
      const totalLabor = rows.reduce((s, r) => s + num(r.laborCost), 0);
      const foodPct = totalSales > 0 ? (totalFood / totalSales) * 100 : 0;
      const laborPct = totalSales > 0 ? (totalLabor / totalSales) * 100 : 0;
      const primePct = foodPct + laborPct;

      track(opId, "get_prime_cost_digest", client, { days: window, locationId: location_id ?? null, reports: rows.length });

      const status = (pct: number, target: number, ceiling: number) =>
        pct === 0 ? "no_data" : pct >= ceiling ? "warning" : pct > target ? "watch" : "good";

      const payload = {
        operator: operator.restaurantName,
        windowDays: window,
        startDate: since,
        endDate: toIsoDate(new Date()),
        locationId: location_id ?? null,
        reportsAggregated: rows.length,
        totals: {
          sales: Math.round(totalSales * 100) / 100,
          foodCogs: Math.round(totalFood * 100) / 100,
          laborCost: Math.round(totalLabor * 100) / 100,
          primeCost: Math.round((totalFood + totalLabor) * 100) / 100,
        },
        percentages: {
          foodCostPct: Math.round(foodPct * 10) / 10,
          laborCostPct: Math.round(laborPct * 10) / 10,
          primeCostPct: Math.round(primePct * 10) / 10,
        },
        targets: { foodCostPct: 30, laborCostPct: 32, primeCostPct: 60 },
        status: {
          food: status(foodPct, 30, 33),
          labor: status(laborPct, 32, 34),
          prime: status(primePct, 60, 65),
        },
        perDay: rows.map((r) => ({
          reportDate: r.reportDate,
          sales: num(r.sales),
          foodCogs: num(r.foodCogs),
          laborCost: num(r.laborCost),
          primeCostPct: num(r.primeCostPct),
        })),
        note:
          rows.length === 0
            ? `No Z-reports found in the last ${window} days${location_id ? ` for location ${location_id}` : ""}.`
            : `Aggregated ${rows.length} Z-report(s). Status thresholds: warning when food >33%, labor >34%, prime >65%.`,
      };
      return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
    },
  );

  server.tool(
    "get_labor_percentage",
    "Labor cost as a % of net sales for today, this week (last 7 days), or last week (the 7 days before that). Returns the dollar totals plus a breakdown of scheduled hours by role from the labor schedule. Both the actuals and the per-role schedule breakdown are filtered to a single location when location_id is passed, or rolled up across all of the operator's locations when omitted. Defaults to this_week. Use when the operator asks 'what's my labor running' or 'how's labor by role this week at the downtown store'.",
    {
      scope: z.enum(["today", "this_week", "last_week"]).optional().describe("Date window. Default this_week."),
      location_id: z.number().int().optional().describe("If omitted, rolls up across all of the operator's locations."),
    },
    async ({ scope, location_id }) => {
      const which = scope ?? "this_week";
      let startDate: string;
      let endDate: string;
      if (which === "today") {
        startDate = toIsoDate(new Date());
        endDate = startDate;
      } else if (which === "last_week") {
        startDate = daysAgo(13);
        endDate = daysAgo(7);
      } else {
        startDate = daysAgo(6);
        endDate = toIsoDate(new Date());
      }

      const zConds = [
        eq(operatorZReports.operatorId, opId),
        gte(operatorZReports.reportDate, startDate),
      ];
      if (typeof location_id === "number") zConds.push(eq(operatorZReports.locationId, location_id));
      const reports = (
        await db.select().from(operatorZReports).where(and(...zConds))
      ).filter((r) => r.reportDate <= endDate);

      const totalSales = reports.reduce((s, r) => s + num(r.sales), 0);
      const totalLabor = reports.reduce((s, r) => s + num(r.laborCost), 0);
      const laborPct = totalSales > 0 ? (totalLabor / totalSales) * 100 : 0;

      // Role breakdown comes from operator_labor_schedules joined to employees.
      // Schedules use weekStartDate (Mon-anchored varchar). We pull every
      // schedule overlapping the window and roll up scheduled labor cost by
      // role. Pure read-only.
      const schedConds = [eq(operatorLaborSchedules.operatorId, opId)];
      if (typeof location_id === "number") schedConds.push(eq(operatorLaborSchedules.locationId, location_id));
      const schedules = await db
        .select({
          role: operatorLaborSchedules.role,
          scheduledHours: operatorLaborSchedules.scheduledHours,
          weekStartDate: operatorLaborSchedules.weekStartDate,
          dayOfWeek: operatorLaborSchedules.dayOfWeek,
          hourlyRate: operatorEmployees.hourlyRate,
        })
        .from(operatorLaborSchedules)
        .leftJoin(operatorEmployees, eq(operatorLaborSchedules.employeeId, operatorEmployees.id))
        .where(and(...schedConds));

      const dowToOffset: Record<string, number> = {
        monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6,
      };
      type Roll = { hours: number; cost: number };
      const byRole = new Map<string, Roll>();
      // Track schedule rows whose week_start_date doesn't parse as a real
      // calendar date — silently skipping them keeps the API response clean
      // for the operator, but ops needs visibility so we emit one aggregated
      // warn at the end of the loop (see logger.warn below) instead of one
      // log line per bad row, which would spam the logs.
      let invalidWeekStartCount = 0;
      const invalidWeekStartSamples: string[] = [];
      for (const s of schedules) {
        const wk = s.weekStartDate;
        const dow = (s.dayOfWeek ?? "").toLowerCase();
        const offset = dowToOffset[dow];
        if (!wk || offset === undefined) continue;
        // Schedule rows are stored as YYYY-MM-DD date strings, so we stay in
        // date-string space here. Going through new Date(`${wk}T00:00Z`) and
        // back through a TZ formatter drifts by ±1 day in negative-offset
        // zones (e.g., America/Chicago). shiftIsoDays anchors at noon UTC
        // and slices the resulting ISO date — DST safe and zone agnostic.
        const validatedWk = parseIsoDate(wk);
        if (!validatedWk) {
          invalidWeekStartCount += 1;
          if (invalidWeekStartSamples.length < 3) invalidWeekStartSamples.push(String(wk));
          continue;
        }
        const iso = shiftIsoDays(validatedWk, offset);
        if (iso < startDate || iso > endDate) continue;
        const hours = num(s.scheduledHours);
        const rate = num(s.hourlyRate);
        const role = (s.role ?? "Unassigned").trim() || "Unassigned";
        const cur = byRole.get(role) ?? { hours: 0, cost: 0 };
        cur.hours += hours;
        cur.cost += hours * rate;
        byRole.set(role, cur);
      }
      if (invalidWeekStartCount > 0) {
        logger.warn(
          {
            event: "mcp_schedule_bad_week_start",
            operatorId: opId,
            count: invalidWeekStartCount,
            samples: invalidWeekStartSamples,
          },
          `Skipped ${invalidWeekStartCount} labor schedule row(s) with invalid week_start_date`,
        );
      }
      const roleBreakdown = Array.from(byRole.entries())
        .map(([role, v]) => ({
          role,
          scheduledHours: Math.round(v.hours * 10) / 10,
          scheduledLaborCost: Math.round(v.cost * 100) / 100,
        }))
        .sort((a, b) => b.scheduledLaborCost - a.scheduledLaborCost);
      const totalScheduledHours = roleBreakdown.reduce((s, r) => s + r.scheduledHours, 0);
      const totalScheduledCost = roleBreakdown.reduce((s, r) => s + r.scheduledLaborCost, 0);

      track(opId, "get_labor_percentage", client, { scope: which, locationId: location_id ?? null, reports: reports.length });

      // Both the actual labor % and the per-role schedule breakdown are
      // scoped by location_id when one is provided, since schedules now
      // carry a location_id column too. Without location_id we roll up
      // across the entire operator.
      const breakdownScope = typeof location_id === "number" ? "location" : "operator-wide";
      const payload = {
        operator: operator.restaurantName,
        scope: which,
        startDate,
        endDate,
        locationId: location_id ?? null,
        actuals: {
          totalSales: Math.round(totalSales * 100) / 100,
          totalLaborCost: Math.round(totalLabor * 100) / 100,
          laborCostPct: Math.round(laborPct * 10) / 10,
          targetPct: 32,
          status: laborPct === 0 ? "no_data" : laborPct > 34 ? "warning" : laborPct > 32 ? "watch" : "good",
          reports: reports.length,
        },
        scheduledByRole: {
          scope: breakdownScope,
          totalHours: Math.round(totalScheduledHours * 10) / 10,
          totalLaborCost: Math.round(totalScheduledCost * 100) / 100,
          roles: roleBreakdown,
        },
        note:
          reports.length === 0
            ? `No Z-reports in the ${which.replace("_", " ")} window${location_id ? ` for location ${location_id}` : ""}, so the actual labor % cannot be computed.`
            : roleBreakdown.length === 0
              ? `No scheduled shifts found for this window${location_id ? ` for location ${location_id}` : ""} — only the actual labor % from Z-reports is shown.`
              : `Actuals are from Z-reports; per-role figures are scheduled hours × employee hourly rate from the ${breakdownScope} labor schedule.`,
      };
      return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
    },
  );

  server.tool(
    "get_food_cost_variance",
    "Week-over-week food cost % comparison (last 7 days vs the 7 days before). Returns each week's sales / food COGS / food cost %, the % point swing, and the top vendor categories driving the change in food invoice spend. Use when the operator asks 'is my food cost going up' or 'why did food cost change this week'.",
    {
      location_id: z.number().int().optional().describe("If omitted, rolls up across all of the operator's locations."),
    },
    async ({ location_id }) => {
      const thisStart = daysAgo(6);
      const thisEnd = toIsoDate(new Date());
      const lastStart = daysAgo(13);
      const lastEnd = daysAgo(7);

      const zConds = [eq(operatorZReports.operatorId, opId), gte(operatorZReports.reportDate, lastStart)];
      if (typeof location_id === "number") zConds.push(eq(operatorZReports.locationId, location_id));
      const allReports = (
        await db.select().from(operatorZReports).where(and(...zConds))
      ).filter((r) => r.reportDate <= thisEnd);

      function aggregate(rows: typeof allReports) {
        const sales = rows.reduce((s, r) => s + num(r.sales), 0);
        const food = rows.reduce((s, r) => s + num(r.foodCogs), 0);
        return {
          sales: Math.round(sales * 100) / 100,
          foodCogs: Math.round(food * 100) / 100,
          foodCostPct: Math.round((sales > 0 ? (food / sales) * 100 : 0) * 10) / 10,
          reports: rows.length,
        };
      }
      const thisWeek = aggregate(allReports.filter((r) => r.reportDate >= thisStart && r.reportDate <= thisEnd));
      const lastWeek = aggregate(allReports.filter((r) => r.reportDate >= lastStart && r.reportDate <= lastEnd));

      // Top category drivers from invoices in each window.
      const invConds = [eq(operatorInvoices.operatorId, opId), gte(operatorInvoices.invoiceDate, lastStart)];
      if (typeof location_id === "number") invConds.push(eq(operatorInvoices.locationId, location_id));
      const invoices = (
        await db.select().from(operatorInvoices).where(and(...invConds))
      ).filter((i) => i.invoiceDate <= thisEnd);

      function topCategories(rows: typeof invoices) {
        const map = new Map<string, number>();
        for (const inv of rows) {
          const cat = (inv.category ?? "uncategorized").trim() || "uncategorized";
          map.set(cat, (map.get(cat) ?? 0) + num(inv.amount));
        }
        return Array.from(map.entries())
          .map(([category, amount]) => ({ category, amount: Math.round(amount * 100) / 100 }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);
      }
      const thisCats = topCategories(invoices.filter((i) => i.invoiceDate >= thisStart && i.invoiceDate <= thisEnd));
      const lastCats = topCategories(invoices.filter((i) => i.invoiceDate >= lastStart && i.invoiceDate <= lastEnd));

      const driverMap = new Map<string, { thisWeek: number; lastWeek: number }>();
      for (const c of thisCats) driverMap.set(c.category, { thisWeek: c.amount, lastWeek: 0 });
      for (const c of lastCats) {
        const cur = driverMap.get(c.category) ?? { thisWeek: 0, lastWeek: 0 };
        cur.lastWeek = c.amount;
        driverMap.set(c.category, cur);
      }
      const drivers = Array.from(driverMap.entries())
        .map(([category, v]) => ({
          category,
          thisWeekSpend: v.thisWeek,
          lastWeekSpend: v.lastWeek,
          deltaSpend: Math.round((v.thisWeek - v.lastWeek) * 100) / 100,
        }))
        .sort((a, b) => Math.abs(b.deltaSpend) - Math.abs(a.deltaSpend))
        .slice(0, 5);

      const deltaPctPoints = Math.round((thisWeek.foodCostPct - lastWeek.foodCostPct) * 10) / 10;

      track(opId, "get_food_cost_variance", client, { locationId: location_id ?? null, thisReports: thisWeek.reports, lastReports: lastWeek.reports });

      const payload = {
        operator: operator.restaurantName,
        locationId: location_id ?? null,
        thisWeek: { startDate: thisStart, endDate: thisEnd, ...thisWeek },
        lastWeek: { startDate: lastStart, endDate: lastEnd, ...lastWeek },
        deltaFoodCostPctPoints: deltaPctPoints,
        direction: deltaPctPoints > 0 ? "rising" : deltaPctPoints < 0 ? "falling" : "flat",
        targetFoodCostPct: 30,
        topCategoryDrivers: drivers,
        note:
          thisWeek.reports === 0 || lastWeek.reports === 0
            ? "Not enough Z-report history in one of the windows to compute a clean variance. Drivers below come from invoice spend only."
            : `Food cost moved ${deltaPctPoints >= 0 ? "+" : ""}${deltaPctPoints} pts (${lastWeek.foodCostPct}% → ${thisWeek.foodCostPct}%). Drivers ranked by absolute change in invoice spend.`,
      };
      return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
    },
  );

  server.tool(
    "get_daily_sales_summary",
    "Daily POS sales summary: net sales, gross sales, covers, average ticket, and discount totals. Defaults to today; pass start_date and end_date (both YYYY-MM-DD) to get a multi-day rollup or a single past day. Single location or rolled up when location_id is omitted. Use when the operator asks 'how did we do today' or 'what were sales last weekend'.",
    {
      start_date: z.string().optional().describe("Inclusive start date YYYY-MM-DD. Defaults to today."),
      end_date: z.string().optional().describe("Inclusive end date YYYY-MM-DD. Defaults to start_date."),
      location_id: z.number().int().optional().describe("If omitted, rolls up across all of the operator's locations."),
    },
    async ({ start_date, end_date, location_id }) => {
      // Reject malformed date inputs upfront so Claude / ChatGPT get a clean
      // structured error instead of an `Invalid Date` runtime crash. zod's
      // z.string() only checks the JS type — it doesn't know that
      // "2026-99-99" or "2026-02-30" aren't real days.
      // isError: true tells the MCP client (Claude/ChatGPT) to treat the
      // response as a tool failure rather than a successful payload that
      // happens to contain an "error" string — required by the MCP spec.
      if (start_date !== undefined && !parseIsoDate(start_date)) {
        track(opId, "get_daily_sales_summary", client, { invalid: "start_date", value: start_date });
        return { isError: true, content: [{ type: "text" as const, text: JSON.stringify({
          error: "invalid_date",
          field: "start_date",
          value: start_date,
          message: "start_date must be a real calendar date in YYYY-MM-DD format (e.g. 2026-04-15).",
        }, null, 2) }] };
      }
      if (end_date !== undefined && !parseIsoDate(end_date)) {
        track(opId, "get_daily_sales_summary", client, { invalid: "end_date", value: end_date });
        return { isError: true, content: [{ type: "text" as const, text: JSON.stringify({
          error: "invalid_date",
          field: "end_date",
          value: end_date,
          message: "end_date must be a real calendar date in YYYY-MM-DD format (e.g. 2026-04-15).",
        }, null, 2) }] };
      }
      const start = start_date ?? toIsoDate(new Date());
      const end = end_date ?? start;
      // YYYY-MM-DD strings are lexically comparable, so a backwards range
      // (e.g. start=2026-12-31 end=2026-01-01) trips the same string compare
      // as a chronological one. Without this check the downstream filter
      // returns an empty list and Claude would invent an explanation for
      // "you had zero sales" — better to fail loudly with isError: true.
      if (start > end) {
        track(opId, "get_daily_sales_summary", client, { invalid: "range", start, end });
        return { isError: true, content: [{ type: "text" as const, text: JSON.stringify({
          error: "invalid_range",
          startDate: start,
          endDate: end,
          message: "start_date must be on or before end_date.",
        }, null, 2) }] };
      }
      const conds = [
        eq(operatorZReports.operatorId, opId),
        gte(operatorZReports.reportDate, start),
      ];
      if (typeof location_id === "number") conds.push(eq(operatorZReports.locationId, location_id));
      const reports = (
        await db.select().from(operatorZReports).where(and(...conds))
      ).filter((r) => r.reportDate <= end)
        .sort((a, b) => a.reportDate.localeCompare(b.reportDate));

      const totalNet = reports.reduce((s, r) => s + num(r.sales), 0);
      const totalGross = reports.reduce((s, r) => s + num(r.grossSales), 0);
      const totalCovers = reports.reduce((s, r) => s + (r.covers ?? 0), 0);
      const totalDiscounts = reports.reduce((s, r) => s + num(r.discounts), 0);
      const avgTicket = totalCovers > 0 ? totalNet / totalCovers : 0;

      // Voids and comps live in the raw POS payload (no dedicated columns).
      // Sum across days when present; if every day is missing, return null
      // and explain in the note rather than silently reporting 0.
      let voidsSum = 0; let voidsHit = 0;
      let compsSum = 0; let compsHit = 0;
      for (const r of reports) {
        const v = rawVoids(r.posRawPayload);
        if (typeof v === "number") { voidsSum += v; voidsHit += 1; }
        const c = rawComps(r.posRawPayload);
        if (typeof c === "number") { compsSum += c; compsHit += 1; }
      }
      const totalVoids = voidsHit > 0 ? Math.round(voidsSum * 100) / 100 : null;
      const totalComps = compsHit > 0 ? Math.round(compsSum * 100) / 100 : null;

      track(opId, "get_daily_sales_summary", client, { start, end, locationId: location_id ?? null, days: reports.length });

      const payload = {
        operator: operator.restaurantName,
        startDate: start,
        endDate: end,
        locationId: location_id ?? null,
        days: reports.length,
        totals: {
          netSales: Math.round(totalNet * 100) / 100,
          grossSales: Math.round(totalGross * 100) / 100,
          discounts: Math.round(totalDiscounts * 100) / 100,
          comps: totalComps,
          voids: totalVoids,
          covers: totalCovers,
          averageTicket: Math.round(avgTicket * 100) / 100,
        },
        perDay: reports.map((r) => {
          const v = rawVoids(r.posRawPayload);
          const c = rawComps(r.posRawPayload);
          return {
            reportDate: r.reportDate,
            locationId: r.locationId ?? null,
            netSales: num(r.sales),
            grossSales: num(r.grossSales),
            discounts: num(r.discounts),
            comps: typeof c === "number" ? Math.round(c * 100) / 100 : null,
            voids: typeof v === "number" ? Math.round(v * 100) / 100 : null,
            covers: r.covers ?? null,
            averageTicket: r.covers && r.covers > 0 ? Math.round((num(r.sales) / r.covers) * 100) / 100 : null,
          };
        }),
        compsCoverage: { daysWithComps: compsHit, daysTotal: reports.length },
        voidsCoverage: { daysWithVoids: voidsHit, daysTotal: reports.length },
        note:
          reports.length === 0
            ? `No Z-reports between ${start} and ${end}${location_id ? ` for location ${location_id}` : ""}.`
            : "Net sales = post-discount, pre-tax. Comps and voids are pulled from the raw POS payload — they appear as null when the POS connector did not report them for that day.",
      };
      return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
    },
  );

  server.tool(
    "get_operational_alerts",
    "Current operational anomalies for the operator with severity and the underlying numbers: prime/food/labor cost over ceiling, discount rate spike, high void rate, comp spike, missing clock-outs (open shifts), stale Z-reports, and inventory items below par. Use when the operator asks 'what should I be worried about right now' or 'any red flags today'.",
    {
      location_id: z.number().int().optional().describe("If omitted, evaluates across all of the operator's locations."),
    },
    async ({ location_id }) => {
      type Alert = {
        severity: "info" | "warning" | "critical";
        kind: string;
        message: string;
        metric?: number;
        threshold?: number;
        items?: unknown[];
      };
      const alerts: Alert[] = [];

      const since = daysAgo(6);
      const zConds = [eq(operatorZReports.operatorId, opId), gte(operatorZReports.reportDate, since)];
      if (typeof location_id === "number") zConds.push(eq(operatorZReports.locationId, location_id));
      const zRows = await db.select().from(operatorZReports).where(and(...zConds));
      const sales = zRows.reduce((s, r) => s + num(r.sales), 0);
      const food = zRows.reduce((s, r) => s + num(r.foodCogs), 0);
      const labor = zRows.reduce((s, r) => s + num(r.laborCost), 0);
      const gross = zRows.reduce((s, r) => s + num(r.grossSales), 0);
      const discounts = zRows.reduce((s, r) => s + num(r.discounts), 0);
      const foodPct = sales > 0 ? (food / sales) * 100 : 0;
      const laborPct = sales > 0 ? (labor / sales) * 100 : 0;
      const primePct = foodPct + laborPct;
      const discountPct = gross > 0 ? (discounts / gross) * 100 : 0;

      if (sales > 0 && primePct > 65) {
        alerts.push({ severity: "critical", kind: "prime_cost_over_ceiling", message: `7-day prime cost ${primePct.toFixed(1)}% is above the 65% red-line.`, metric: Math.round(primePct * 10) / 10, threshold: 65 });
      } else if (sales > 0 && primePct > 60) {
        alerts.push({ severity: "warning", kind: "prime_cost_over_target", message: `7-day prime cost ${primePct.toFixed(1)}% is over the 60% healthy target.`, metric: Math.round(primePct * 10) / 10, threshold: 60 });
      }
      if (sales > 0 && foodPct > 33) {
        alerts.push({ severity: "warning", kind: "food_cost_high", message: `7-day food cost ${foodPct.toFixed(1)}% is above the 30% target.`, metric: Math.round(foodPct * 10) / 10, threshold: 30 });
      }
      if (sales > 0 && laborPct > 34) {
        alerts.push({ severity: "warning", kind: "labor_cost_high", message: `7-day labor cost ${laborPct.toFixed(1)}% is above the 32% target.`, metric: Math.round(laborPct * 10) / 10, threshold: 32 });
      }
      if (gross > 0 && discountPct > 5) {
        alerts.push({ severity: "warning", kind: "discount_rate_spike", message: `7-day discounts are ${discountPct.toFixed(1)}% of gross sales — typical healthy range is under 5%.`, metric: Math.round(discountPct * 10) / 10, threshold: 5 });
      }

      // Voids, comps, and missing clock-outs come from the raw POS payload —
      // sum across the same 7-day window. If the POS connector never reports
      // any of these fields, stay silent rather than alerting on phantom 0s.
      let voidsTotal = 0; let voidsHit = 0;
      let compsTotal = 0; let compsHit = 0;
      let openShiftsTotal = 0; let openShiftsHit = 0;
      for (const r of zRows) {
        const v = rawVoids(r.posRawPayload);
        if (typeof v === "number") { voidsTotal += v; voidsHit += 1; }
        const c = rawComps(r.posRawPayload);
        if (typeof c === "number") { compsTotal += c; compsHit += 1; }
        const oc = rawMissingClockOuts(r.posRawPayload);
        if (typeof oc === "number") { openShiftsTotal += oc; openShiftsHit += 1; }
      }
      const voidPctOfNet = voidsHit > 0 && sales > 0 ? (voidsTotal / sales) * 100 : 0;
      const compPctOfNet = compsHit > 0 && sales > 0 ? (compsTotal / sales) * 100 : 0;
      if (voidsHit > 0 && voidPctOfNet > 2) {
        alerts.push({
          severity: voidPctOfNet > 4 ? "critical" : "warning",
          kind: "high_void_rate",
          message: `7-day voids are ${voidPctOfNet.toFixed(1)}% of net sales — typical healthy range is under 2%.`,
          metric: Math.round(voidPctOfNet * 10) / 10,
          threshold: 2,
        });
      }
      if (compsHit > 0 && compPctOfNet > 3) {
        alerts.push({
          severity: compPctOfNet > 6 ? "critical" : "warning",
          kind: "comp_spike",
          message: `7-day comps are ${compPctOfNet.toFixed(1)}% of net sales — typical healthy range is under 3%.`,
          metric: Math.round(compPctOfNet * 10) / 10,
          threshold: 3,
        });
      }
      if (openShiftsHit > 0 && openShiftsTotal > 0) {
        alerts.push({
          severity: openShiftsTotal >= 3 ? "warning" : "info",
          kind: "missing_clock_outs",
          message: `${openShiftsTotal} shift(s) in the last 7 days are missing a clock-out and may be inflating labor cost.`,
          metric: openShiftsTotal,
          threshold: 0,
        });
      }

      const lastReport = zRows.map((r) => r.reportDate).sort().pop() ?? null;
      const today = toIsoDate(new Date());
      if (lastReport) {
        const daysStale = Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${lastReport}T00:00:00Z`)) / 86400000);
        if (daysStale > 2) {
          alerts.push({ severity: "warning", kind: "stale_z_reports", message: `No Z-report has been recorded for ${daysStale} day(s) — last one was ${lastReport}.`, metric: daysStale, threshold: 2 });
        }
      } else {
        alerts.push({ severity: "info", kind: "no_z_reports", message: "No Z-reports in the last 7 days." });
      }

      const invConds = [eq(operatorInventory.operatorId, opId)];
      if (typeof location_id === "number") invConds.push(eq(operatorInventory.locationId, location_id));
      const inv = await db.select().from(operatorInventory).where(and(...invConds));
      const lowStock = inv
        .filter((i) => num(i.quantity) < num(i.parLevel))
        .map((i) => ({ name: i.name, quantity: num(i.quantity), parLevel: num(i.parLevel), unit: i.unit }));
      if (lowStock.length > 0) {
        alerts.push({
          severity: lowStock.length >= 5 ? "warning" : "info",
          kind: "low_stock",
          message: `${lowStock.length} inventory item(s) below par.`,
          metric: lowStock.length,
          items: lowStock.slice(0, 10),
        });
      }

      track(opId, "get_operational_alerts", client, { locationId: location_id ?? null, alertCount: alerts.length });

      const payload = {
        operator: operator.restaurantName,
        evaluatedAt: new Date().toISOString(),
        locationId: location_id ?? null,
        windowDays: 7,
        alertCount: alerts.length,
        worstSeverity:
          alerts.find((a) => a.severity === "critical") ? "critical" :
          alerts.find((a) => a.severity === "warning") ? "warning" :
          alerts.length > 0 ? "info" : "none",
        alerts,
        sourceMetrics: {
          sales: Math.round(sales * 100) / 100,
          foodCostPct: Math.round(foodPct * 10) / 10,
          laborCostPct: Math.round(laborPct * 10) / 10,
          primeCostPct: Math.round(primePct * 10) / 10,
          discountPctOfGross: Math.round(discountPct * 10) / 10,
          voidPctOfNet: voidsHit > 0 ? Math.round(voidPctOfNet * 10) / 10 : null,
          compPctOfNet: compsHit > 0 ? Math.round(compPctOfNet * 10) / 10 : null,
          openShifts: openShiftsHit > 0 ? openShiftsTotal : null,
          lastZReportDate: lastReport,
        },
        coverage: {
          daysWithVoids: voidsHit,
          daysWithComps: compsHit,
          daysWithShiftData: openShiftsHit,
          daysTotal: zRows.length,
        },
        thresholds: { foodCostPct: 33, laborCostPct: 34, primeCostPctWarn: 60, primeCostPctCritical: 65, discountPctOfGross: 5, voidPctOfNet: 2, compPctOfNet: 3, missingClockOuts: 1, staleZReportDays: 2 },
        note: alerts.length === 0 ? "No anomalies detected in the last 7 days." : "Severity ladder: critical > warning > info.",
      };
      return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
    },
  );

  // ─── Invoice Intelligence MCP tools (Task #186) ───────────────────────
  // Three read-only tools that surface saved Invoice Intelligence reports
  // (vendor benchmark gap analyses) to Claude / ChatGPT. Every response
  // is filtered through `lib/invoice-intelligence-presenter` so internal
  // benchmark identifiers, scoring details, model notes, license-rule
  // codes and confidence weights stay on the server. Errors are opaque
  // — never reveal whether a report id exists for another operator.

  server.tool(
    "list_invoice_intelligence_reports",
    "List the operator's recent Invoice Intelligence reports (vendor invoices that have been benchmarked against wholesale and peer pricing). Each entry has the vendor, totals, gap-vs-benchmark dollars, and a one-line headline you can read aloud.",
    {
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .describe("Maximum number of reports to return (default 20)."),
    },
    async ({ limit }) => {
      const max = limit ?? 20;
      try {
        const rows = await db
          .select()
          .from(invoiceIntelligenceReports)
          .where(eq(invoiceIntelligenceReports.operatorId, opId))
          .orderBy(desc(invoiceIntelligenceReports.createdAt))
          .limit(max);
        track(opId, "list_invoice_intelligence_reports", client, { count: rows.length });
        const payload = {
          operator: operator.restaurantName,
          count: rows.length,
          reports: rows.map(presentReportSummary),
        };
        return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
      } catch (err) {
        logger.error({ err: String(err), operatorId: opId }, "list_invoice_intelligence_reports failed");
        return {
          isError: true,
          content: [{ type: "text" as const, text: "Couldn't load Invoice Intelligence reports right now." }],
        };
      }
    },
  );

  // The reportId is a UUID, but we DON'T enforce z.string().uuid() in the
  // schema because zod's auto-generated parse error ("Invalid uuid") would
  // be surfaced to Claude as the JSON-RPC error message — that's a format-
  // disclosure side-channel we explicitly don't want. Instead the schema
  // accepts any non-empty string and the handler does its own UUID v4
  // regex check, returning the same opaque "Report not found." message
  // for malformed ids, missing ids, AND another operator's ids.
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  server.tool(
    "read_invoice_intelligence_report",
    "Read one Invoice Intelligence report in full — vendor, line items with gap vs benchmark, vendor pricing-discipline notes, and the legal alternate-supplier list for the operator's state.",
    {
      reportId: z
        .string()
        .min(1)
        .describe("Report id from list_invoice_intelligence_reports (a UUID string)."),
    },
    async ({ reportId }) => {
      const id = String(reportId).trim();
      // Reject anything that isn't a UUID without paying for the DB
      // round-trip. Same opaque message either way — never disclose
      // whether the id is malformed vs missing vs owned by another tenant.
      if (!UUID_RE.test(id)) {
        track(opId, "read_invoice_intelligence_report", client, { reportId: id, found: false });
        return { content: [{ type: "text" as const, text: "Report not found." }] };
      }
      try {
        const [row] = await db
          .select()
          .from(invoiceIntelligenceReports)
          .where(
            and(
              eq(invoiceIntelligenceReports.id, id),
              eq(invoiceIntelligenceReports.operatorId, opId),
            ),
          )
          .limit(1);
        track(opId, "read_invoice_intelligence_report", client, { reportId: id, found: !!row });
        if (!row) {
          return { content: [{ type: "text" as const, text: "Report not found." }] };
        }
        const payload = presentReportDetail(row);
        return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
      } catch (err) {
        logger.error({ err: String(err), operatorId: opId, reportId: id }, "read_invoice_intelligence_report failed");
        return {
          isError: true,
          content: [{ type: "text" as const, text: "Couldn't load that Invoice Intelligence report right now." }],
        };
      }
    },
  );

  server.tool(
    "summarize_invoice_intelligence",
    "Roll up the operator's Invoice Intelligence reports across a time window (windowed by when each report was generated, not the invoice's printed date). Returns top vendors by cumulative gap-vs-benchmark, the biggest individual line-item overpays, recent vendor pricing drifts, and suggested renegotiation targets. Use this to answer 'where am I bleeding money on invoices right now?'",
    {
      days: z
        .number()
        .int()
        .min(1)
        .max(365)
        .optional()
        .describe("Number of days back to include, anchored on report-generated time (default 30)."),
    },
    async ({ days }) => {
      const windowDays = days ?? 30;
      const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
      try {
        // Windowed on `createdAt` (when the report was produced) rather
        // than `invoiceDate`. This matches operator intent of "what have
        // I been looking at recently?" and stays robust when an operator
        // back-dates an invoice or uploads an old one — the report still
        // shows up in the rollup right after they ran it.
        const rows = await db
          .select()
          .from(invoiceIntelligenceReports)
          .where(
            and(
              eq(invoiceIntelligenceReports.operatorId, opId),
              gte(invoiceIntelligenceReports.createdAt, since),
            ),
          )
          .orderBy(desc(invoiceIntelligenceReports.createdAt));
        const rollup = presentRollup(rows, windowDays);
        track(opId, "summarize_invoice_intelligence", client, {
          windowDays,
          reportsAnalyzed: rollup.reportsAnalyzed,
        });
        const payload = {
          operator: operator.restaurantName,
          generatedAt: new Date().toISOString(),
          ...rollup,
        };
        return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
      } catch (err) {
        logger.error({ err: String(err), operatorId: opId }, "summarize_invoice_intelligence failed");
        return {
          isError: true,
          content: [{ type: "text" as const, text: "Couldn't summarize Invoice Intelligence right now." }],
        };
      }
    },
  );

  return server;
}

// MCP Streamable HTTP transport endpoint — Claude Desktop posts JSON-RPC here.
// Auth reuses the existing operatorAuthMiddleware so this endpoint accepts any
// of the standard operator auth modes (x-api-key, x-operator-token, Clerk
// session) — no new auth surface is introduced.
router.post("/mcp/operator", operatorAuthMiddleware, async (req: Request, res: Response) => {
  const operator = (req as AuthRequest).operator;
  const client = detectMcpClient(req);
  try {
    const server = buildServer(operator, client);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    res.on("finish", () => {
      transport.close();
      server.close();
    });
  } catch (err) {
    logger.error({ err: String(err), operatorId: operator.id }, "operator MCP error");
    if (!res.headersSent) res.status(500).json({ error: "MCP error", detail: String(err) });
  }
});

router.get("/mcp/operator", (_req: Request, res: Response) => {
  res.status(200).json({
    ok: true,
    name: "Never 86'd Operator MCP",
    transport: "streamable-http",
    clients: ["claude-desktop", "chatgpt-workspace-custom-connector"],
    auth: "Send your operator API key as `x-api-key: <key>`.",
    tools: [
      "list_invoices",
      "read_invoice",
      "list_z_reports",
      "read_z_report",
      "list_inventory_items",
      "read_recipe",
      "get_operator_briefing",
      "get_prime_cost_digest",
      "get_labor_percentage",
      "get_food_cost_variance",
      "get_daily_sales_summary",
      "get_operational_alerts",
      "list_invoice_intelligence_reports",
      "read_invoice_intelligence_report",
      "summarize_invoice_intelligence",
    ],
    docs: "https://never86.ai/mcp",
  });
});

router.delete("/mcp/operator", (_req: Request, res: Response) => {
  res.status(200).json({ ok: true });
});

/**
 * Public, anonymized MCP usage stats — distinct operators, total tool calls,
 * and top tool per client (claude / chatgpt / unknown) over the last 30 days.
 * Used by the public `/mcp` page so anyone can see real adoption numbers
 * without needing an operator API key. No per-operator data is exposed.
 */
router.get("/public/mcp/usage", async (_req: Request, res: Response) => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  try {
    const totals = await db
      .select({
        client: mcpUsageEvents.client,
        operators: sql<number>`count(distinct ${mcpUsageEvents.operatorId})`,
        calls: count(),
      })
      .from(mcpUsageEvents)
      .where(gte(mcpUsageEvents.createdAt, since))
      .groupBy(mcpUsageEvents.client);

    const byTool = await db
      .select({
        client: mcpUsageEvents.client,
        tool: mcpUsageEvents.tool,
        calls: count(),
      })
      .from(mcpUsageEvents)
      .where(gte(mcpUsageEvents.createdAt, since))
      .groupBy(mcpUsageEvents.client, mcpUsageEvents.tool);

    const topToolByClient: Record<string, { tool: string; calls: number } | null> = {
      claude: null,
      chatgpt: null,
      unknown: null,
    };
    for (const r of byTool) {
      const calls = Number(r.calls);
      const cur = topToolByClient[r.client];
      if (!cur || calls > cur.calls) topToolByClient[r.client] = { tool: r.tool, calls };
    }

    const empty = { operators: 0, toolCalls: 0, topTool: null as null | string };
    const out: Record<"claude" | "chatgpt" | "unknown", typeof empty> = {
      claude: { ...empty },
      chatgpt: { ...empty },
      unknown: { ...empty },
    };
    for (const r of totals) {
      const k = (r.client as "claude" | "chatgpt" | "unknown");
      if (!out[k]) continue;
      out[k] = {
        operators: Number(r.operators),
        toolCalls: Number(r.calls),
        topTool: topToolByClient[k]?.tool ?? null,
      };
    }

    const [globalDistinct] = await db
      .select({ operators: sql<number>`count(distinct ${mcpUsageEvents.operatorId})` })
      .from(mcpUsageEvents)
      .where(gte(mcpUsageEvents.createdAt, since));

    res.set("Cache-Control", "public, max-age=300");
    res.json({
      windowDays: 30,
      generatedAt: new Date().toISOString(),
      byClient: out,
      totals: {
        operators: Number(globalDistinct?.operators ?? 0),
        toolCalls: out.claude.toolCalls + out.chatgpt.toolCalls + out.unknown.toolCalls,
      },
    });
  } catch (err) {
    logger.error({ err: String(err) }, "public mcp usage failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Per-operator MCP usage analytics. Returns counts by client (claude/chatgpt/
 * unknown) over the last 30 days plus a per-tool breakdown so the operator can
 * see how their AI assistants are actually using N86.
 */
router.get("/operator/mcp/usage", operatorAuthMiddleware, async (req: Request, res: Response) => {
  const operatorId = (req as AuthRequest).operator.id;
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  try {
    const totals30 = await db
      .select({ client: mcpUsageEvents.client, value: count() })
      .from(mcpUsageEvents)
      .where(and(eq(mcpUsageEvents.operatorId, operatorId), gte(mcpUsageEvents.createdAt, since30)))
      .groupBy(mcpUsageEvents.client);

    const totals7 = await db
      .select({ client: mcpUsageEvents.client, value: count() })
      .from(mcpUsageEvents)
      .where(and(eq(mcpUsageEvents.operatorId, operatorId), gte(mcpUsageEvents.createdAt, since7)))
      .groupBy(mcpUsageEvents.client);

    const byTool = await db
      .select({
        client: mcpUsageEvents.client,
        tool: mcpUsageEvents.tool,
        value: count(),
      })
      .from(mcpUsageEvents)
      .where(and(eq(mcpUsageEvents.operatorId, operatorId), gte(mcpUsageEvents.createdAt, since30)))
      .groupBy(mcpUsageEvents.client, mcpUsageEvents.tool)
      .orderBy(desc(sql`count(*)`));

    const lastUse = await db
      .select({
        client: mcpUsageEvents.client,
        createdAt: sql<Date>`max(${mcpUsageEvents.createdAt})`.as("last_used_at"),
      })
      .from(mcpUsageEvents)
      .where(eq(mcpUsageEvents.operatorId, operatorId))
      .groupBy(mcpUsageEvents.client);

    const empty = { claude: 0, chatgpt: 0, unknown: 0 };
    const counts30: Record<string, number> = { ...empty };
    for (const r of totals30) counts30[r.client] = Number(r.value);
    const counts7: Record<string, number> = { ...empty };
    for (const r of totals7) counts7[r.client] = Number(r.value);

    res.json({
      last30Days: {
        claude: counts30.claude,
        chatgpt: counts30.chatgpt,
        unknown: counts30.unknown,
        total: counts30.claude + counts30.chatgpt + counts30.unknown,
      },
      last7Days: {
        claude: counts7.claude,
        chatgpt: counts7.chatgpt,
        unknown: counts7.unknown,
        total: counts7.claude + counts7.chatgpt + counts7.unknown,
      },
      byTool: byTool.map((r) => ({ client: r.client, tool: r.tool, count: Number(r.value) })),
      lastUsedAt: lastUse.map((r) => ({ client: r.client, at: r.createdAt })),
    });
  } catch (err) {
    logger.error({ err: String(err), operatorId }, "operator mcp usage failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Admin-only per-operator MCP usage. Lists every operator that has invoked an
 * MCP tool in the last 30 days with their preferred client, total tool calls,
 * top tool, and last-used timestamp. Used by the founder admin dashboard to
 * see which operators have actually wired up Claude/ChatGPT.
 */
router.get("/admin/mcp/usage", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  try {
    const totals = await db
      .select({
        operatorId: mcpUsageEvents.operatorId,
        client: mcpUsageEvents.client,
        calls: count(),
        lastUsedAt: sql<Date>`max(${mcpUsageEvents.createdAt})`.as("last_used_at"),
      })
      .from(mcpUsageEvents)
      .where(gte(mcpUsageEvents.createdAt, since))
      .groupBy(mcpUsageEvents.operatorId, mcpUsageEvents.client);

    const byTool = await db
      .select({
        operatorId: mcpUsageEvents.operatorId,
        client: mcpUsageEvents.client,
        tool: mcpUsageEvents.tool,
        calls: count(),
      })
      .from(mcpUsageEvents)
      .where(gte(mcpUsageEvents.createdAt, since))
      .groupBy(mcpUsageEvents.operatorId, mcpUsageEvents.client, mcpUsageEvents.tool);

    const operatorIds = Array.from(new Set(totals.map((r) => r.operatorId)));
    const operators = operatorIds.length
      ? await db
          .select({
            id: operatorUsers.id,
            email: operatorUsers.email,
            restaurantName: operatorUsers.restaurantName,
          })
          .from(operatorUsers)
          .where(inArray(operatorUsers.id, operatorIds))
      : [];
    const opById = new Map(operators.map((o) => [o.id, o]));

    type Row = {
      operatorId: number;
      restaurantName: string | null;
      email: string | null;
      client: string;
      toolCalls: number;
      topTool: string | null;
      lastUsedAt: string | null;
    };

    const topToolKey = new Map<string, { tool: string; calls: number }>();
    for (const r of byTool) {
      const k = `${r.operatorId}:${r.client}`;
      const calls = Number(r.calls);
      const cur = topToolKey.get(k);
      if (!cur || calls > cur.calls) topToolKey.set(k, { tool: r.tool, calls });
    }

    const items: Row[] = totals
      .map((r) => {
        const op = opById.get(r.operatorId);
        const top = topToolKey.get(`${r.operatorId}:${r.client}`);
        return {
          operatorId: r.operatorId,
          restaurantName: op?.restaurantName ?? null,
          email: op?.email ?? null,
          client: r.client,
          toolCalls: Number(r.calls),
          topTool: top?.tool ?? null,
          lastUsedAt: r.lastUsedAt ? new Date(r.lastUsedAt as unknown as string).toISOString() : null,
        };
      })
      .sort((a, b) => {
        const at = a.lastUsedAt ? Date.parse(a.lastUsedAt) : 0;
        const bt = b.lastUsedAt ? Date.parse(b.lastUsedAt) : 0;
        return bt - at;
      });

    const distinctOperators = new Set(items.map((i) => i.operatorId)).size;
    const totalCalls = items.reduce((s, i) => s + i.toolCalls, 0);

    res.json({
      windowDays: 30,
      generatedAt: new Date().toISOString(),
      distinctOperators,
      totalCalls,
      items,
    });
  } catch (err) {
    logger.error({ err: String(err) }, "admin mcp usage failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
