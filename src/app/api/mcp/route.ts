import { NextRequest, NextResponse } from 'next/server';
import { buildActionShift, type ActionShiftInput } from '@/lib/actionShift';
import {
  MCP_PROMPTS,
  MCP_RESOURCES,
  getMcpPrompt,
  handleGet3pAuditLogic,
  handleGetOperatorLogic,
  handleGetOperatorSystem,
  handleListAgentJobs,
  handleListAnswers,
  handleListFreeAgents,
  handleListSpecialists,
  readMcpResource,
} from '@/lib/agentGovernance/knowledge';
import { runBeverageCostScore } from '@/lib/beverageScoreCsv';
import { runLaborDrift } from '@/lib/laborDriftCsv';
import {
  calculateEpUnitCost,
  calculateRecipeCost,
  contributionMargin,
  foodCogs,
  foodCostPct,
  recipeCostKnowledgePack,
  type RecipeIngredient,
} from '@/lib/recipeCost';
import {
  bottleFlOzFromMl,
  convertMass,
  convertVolume,
  costPerPour,
  kegFlOz,
  poursPerPackage,
  uomKnowledgePack,
  type MassUnit,
  type VolumeUnit,
} from '@/lib/uomConvert';
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

// Public, read-only MCP server. Knowledge + specialist discovery + analysis.
// Never reads tenant records, sends messages, or makes employment/vendor decisions.

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
        capabilities: { tools: {}, resources: {}, prompts: {} },
        serverInfo: MCP_PUBLIC_SERVER_INFO,
      });
    case 'tools/list':
      return ok(req.id, { tools: MCP_PUBLIC_TOOLS });
    case 'resources/list':
      return ok(req.id, { resources: MCP_RESOURCES });
    case 'resources/read': {
      const uri = (req.params as { uri?: string })?.uri;
      if (!uri) return err(req.id, -32602, 'resources/read requires uri');
      const resource = readMcpResource(uri);
      if (!resource.ok) return err(req.id, -32602, resource.error);
      return ok(req.id, {
        contents: [{ uri, mimeType: 'application/json', text: resource.text }],
      });
    }
    case 'prompts/list':
      return ok(req.id, { prompts: MCP_PROMPTS });
    case 'prompts/get': {
      const name = (req.params as { name?: string })?.name;
      const args = ((req.params as { arguments?: Record<string, unknown> })?.arguments ?? {}) as Record<
        string,
        unknown
      >;
      if (!name) return err(req.id, -32602, 'prompts/get requires name');
      const prompt = getMcpPrompt(name, args);
      if (!prompt.ok) return err(req.id, -32602, prompt.error);
      return ok(req.id, {
        description: name,
        messages: [{ role: 'user', content: { type: 'text', text: prompt.text } }],
      });
    }
    case 'tools/call': {
      const name = (req.params as { name?: string })?.name;
      const args = (req.params as { arguments?: Record<string, unknown> })?.arguments ?? {};

      if (name === 'get_operator_system') {
        return textResult(req.id, handleGetOperatorSystem());
      }
      if (name === 'get_operator_logic') {
        const result = handleGetOperatorLogic(args.domain);
        if (!result.ok) return textResult(req.id, result.error, true);
        return textResult(req.id, result);
      }
      if (name === 'get_3p_audit_logic') {
        return textResult(req.id, handleGet3pAuditLogic());
      }
      if (name === 'list_answers') {
        return textResult(req.id, await handleListAnswers(args.limit));
      }
      if (name === 'list_free_agents') {
        return textResult(req.id, handleListFreeAgents());
      }
      if (name === 'list_agent_jobs') {
        return textResult(req.id, handleListAgentJobs(args.team));
      }
      if (name === 'list_specialists') {
        return textResult(req.id, handleListSpecialists());
      }

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

      if (name === 'analyze_beverage') {
        const input = operatorCsv(args);
        if (!input.ok) return textResult(req.id, input.error, true);
        const report = runBeverageCostScore(input.csv);
        if ('ok' in report && report.ok === false) return textResult(req.id, report, true);
        return textResult(req.id, {
          evidenceState: 'Unverified',
          warning:
            'No count → no beverage-cost claim. Patterns are review leads only. Confirm transfers, waste, pack size, comps, and recipe before disputing.',
          report,
        });
      }

      if (name === 'convert_uom') {
        const op = typeof args.op === 'string' ? args.op : '';
        if (op === 'knowledge') {
          return textResult(req.id, { evidenceState: 'Verified', pack: uomKnowledgePack() });
        }
        if (op === 'bottle_fl_oz') {
          const result = bottleFlOzFromMl(Number(args.package_ml));
          if (!result.ok) return textResult(req.id, result, true);
          return textResult(req.id, { evidenceState: 'Unverified', ...result });
        }
        if (op === 'keg_fl_oz') {
          const result = kegFlOz(Number(args.keg_gal));
          if (!result.ok) return textResult(req.id, result, true);
          return textResult(req.id, { evidenceState: 'Unverified', ...result });
        }
        if (op === 'pours_per_package') {
          const result = poursPerPackage({
            unitsPerPackage: Number(args.units_per_package),
            unitFlOz: Number(args.unit_fl_oz),
            pourSpecFlOz: Number(args.pour_spec_fl_oz),
          });
          if (!result.ok) return textResult(req.id, result, true);
          return textResult(req.id, { evidenceState: 'Unverified', ...result });
        }
        if (op === 'cost_per_pour') {
          const result = costPerPour({
            packageCost: Number(args.package_cost),
            poursPerPackage: Number(args.pours_per_package),
          });
          if (!result.ok) return textResult(req.id, result, true);
          return textResult(req.id, { evidenceState: 'Unverified', ...result });
        }
        if (op === 'volume') {
          const from = args.from as VolumeUnit;
          const to = args.to as VolumeUnit;
          const result = convertVolume(Number(args.amount), from, to);
          if (!result.ok) return textResult(req.id, result, true);
          return textResult(req.id, { evidenceState: 'Unverified', from, to, ...result });
        }
        if (op === 'mass') {
          const from = args.from as MassUnit;
          const to = args.to as MassUnit;
          const result = convertMass(Number(args.amount), from, to);
          if (!result.ok) return textResult(req.id, result, true);
          return textResult(req.id, { evidenceState: 'Unverified', from, to, ...result });
        }
        return textResult(
          req.id,
          {
            ok: false,
            error:
              'convert_uom requires op: bottle_fl_oz | keg_fl_oz | pours_per_package | cost_per_pour | volume | mass | knowledge',
          },
          true,
        );
      }

      if (name === 'analyze_recipe_cost') {
        const mode = typeof args.mode === 'string' ? args.mode : '';
        if (mode === 'knowledge') {
          return textResult(req.id, { evidenceState: 'Verified', pack: recipeCostKnowledgePack() });
        }
        if (mode === 'recipe') {
          const ingredients = Array.isArray(args.ingredients)
            ? (args.ingredients as RecipeIngredient[])
            : [];
          const result = calculateRecipeCost(ingredients);
          if (!result.ok) return textResult(req.id, result, true);
          return textResult(req.id, {
            warning: 'Unverified plate cost. Confirm EP units, yield, and recipe map before disputing.',
            ...result,
          });
        }
        if (mode === 'ep_unit_cost') {
          const result = calculateEpUnitCost(Number(args.ap_unit_cost), Number(args.yield_fraction));
          if (!result.ok) return textResult(req.id, result, true);
          return textResult(req.id, { evidenceState: 'Unverified', ...result });
        }
        if (mode === 'food_cogs') {
          const result = foodCogs({
            beginningInventory: Number(args.beginning_inventory),
            purchases: Number(args.purchases),
            endingInventory: Number(args.ending_inventory),
          });
          if (!result.ok) return textResult(req.id, result, true);
          return textResult(req.id, {
            warning: 'Invoice ≠ COGS. This uses operator-supplied inventory dollars only.',
            ...result,
          });
        }
        if (mode === 'food_cost_pct') {
          const result = foodCostPct(Number(args.food_cogs), Number(args.food_sales));
          if (!result.ok) return textResult(req.id, result, true);
          return textResult(req.id, {
            warning: 'No count → no food cost. Same-scope sales required.',
            ...result,
          });
        }
        if (mode === 'contribution') {
          const result = contributionMargin(Number(args.menu_price), Number(args.recipe_cost));
          if (!result.ok) return textResult(req.id, result, true);
          return textResult(req.id, { evidenceState: 'Unverified', ...result });
        }
        return textResult(
          req.id,
          {
            ok: false,
            error:
              'analyze_recipe_cost requires mode: recipe | ep_unit_cost | food_cogs | food_cost_pct | contribution | knowledge',
          },
          true,
        );
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
    name: MCP_PUBLIC_SERVER_INFO.name,
    version: MCP_PUBLIC_SERVER_INFO.version,
    description: MCP_PUBLIC_SERVER_INFO.description,
    endpoint: MCP_PUBLIC_ENDPOINT,
    transport: MCP_PUBLIC_TRANSPORT,
    protocol: MCP_PUBLIC_PROTOCOL,
    tools: MCP_PUBLIC_TOOLS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      readOnly: true,
    })),
    resources: MCP_RESOURCES.map((resource) => resource.uri),
    prompts: MCP_PROMPTS.map((prompt) => prompt.name),
  });
}
