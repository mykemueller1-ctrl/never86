import { NextRequest, NextResponse } from 'next/server';
import { buildActionShift, type ActionShiftInput } from '@/lib/actionShift';
import { runLaborDrift } from '@/lib/laborDriftCsv';
import {
  MCP_PUBLIC_ENDPOINT,
  MCP_PUBLIC_PROTOCOL,
  MCP_PUBLIC_SERVER_INFO,
  MCP_PUBLIC_TOOLS,
  MCP_PUBLIC_TRANSPORT,
} from '@/lib/mcpPublicContract';
import { runVendorDrift } from '@/lib/vendorDriftCsv';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Public, read-only MCP server. It accepts only data the operator deliberately
// sends in a tool call. It never reads tenant records, sends messages, or makes
// financial, employment, or vendor decisions.

type JsonRpcReq = {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
};

const MAX_CSV_CHARS = 750_000;

function ok(id: string | number | null | undefined, result: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id: id ?? null, result });
}

function err(id: string | number | null | undefined, code: number, message: string) {
  return NextResponse.json({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });
}

function textResult(id: JsonRpcReq['id'], value: unknown, isError = false) {
  return ok(id, {
    content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }],
    ...(isError ? { isError: true } : {}),
  });
}

function operatorCsv(args: Record<string, unknown>):
  | { ok: true; csv: string }
  | { ok: false; error: string } {
  if (typeof args.csv !== 'string' || !args.csv.trim()) {
    return { ok: false, error: 'Paste CSV text in the csv field.' };
  }
  if (args.csv.length > MAX_CSV_CHARS) {
    return {
      ok: false,
      error: 'CSV is too large for this public tool. Keep it under 750,000 characters.',
    };
  }
  return { ok: true, csv: args.csv };
}

async function handle(req: JsonRpcReq): Promise<Response> {
  switch (req.method) {
    case 'initialize':
      return ok(req.id, {
        protocolVersion: MCP_PUBLIC_PROTOCOL,
        capabilities: { tools: {} },
        serverInfo: MCP_PUBLIC_SERVER_INFO,
      });
    case 'tools/list':
      return ok(req.id, { tools: MCP_PUBLIC_TOOLS });
    case 'tools/call': {
      const name = (req.params as { name?: string })?.name;
      const args = (req.params as { arguments?: Record<string, unknown> })?.arguments ?? {};

      if (name === 'analyze_labor') {
        const input = operatorCsv(args);
        if (!input.ok) return textResult(req.id, input.error, true);
        const report = runLaborDrift(input.csv);
        if ('ok' in report && report.ok === false) return textResult(req.id, report, true);
        return textResult(req.id, {
          evidenceState: 'Unverified',
          warning: 'Patterns are review leads, not proof of theft, time fraud, or employee misconduct.',
          report,
        });
      }

      if (name === 'analyze_vendor_prices') {
        const input = operatorCsv(args);
        if (!input.ok) return textResult(req.id, input.error, true);
        const report = runVendorDrift(input.csv);
        if ('ok' in report && report.ok === false) return textResult(req.id, report, true);
        return textResult(req.id, {
          evidenceState: 'Unverified',
          warning: 'Confirm pack size, credits, substitutions, and invoice terms before disputing a price.',
          report,
        });
      }

      if (name === 'build_action_shift') {
        const optionalNumber = (key: string) =>
          args[key] === undefined ? undefined : Number(args[key]);
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
        if (!shift.ok) return textResult(req.id, shift.error, true);
        return textResult(req.id, shift.result);
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
    const jsons = await Promise.all(results.map((response) => response.json()));
    return NextResponse.json(jsons);
  }
  return handle(body);
}

export async function GET() {
  return NextResponse.json({
    protocol: 'mcp',
    transport: MCP_PUBLIC_TRANSPORT,
    endpoint: MCP_PUBLIC_ENDPOINT,
    server: MCP_PUBLIC_SERVER_INFO,
    tools: MCP_PUBLIC_TOOLS.map((tool) => ({
      name: tool.name,
      description: tool.description,
    })),
    docs: 'https://www.never86.ai/mcp',
  });
}
