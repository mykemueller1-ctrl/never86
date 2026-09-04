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
  askPourStandards,
  declarePourStandards,
  proposePourStandardsMemory,
  type HousePourLine,
  type PourCategory,
} from '@/lib/operatorPourStandards';
import {
  calculateDrinkRecipeCost,
  calculateEpUnitCost,
  calculateRecipeCost,
  contributionMargin,
  foodCogs,
  foodCostPct,
  recipeCostKnowledgePack,
  type DrinkRecipeIngredient,
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
  askFountainBibStandards,
  costFountainBib,
  costFountainCupPour,
  declareCupService,
  fountainBibKnowledgePack,
  walkFountainSpiritDrink,
} from '@/lib/fountainBibCost';
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
          return textResult(req.id, {
            evidenceState: 'Verified',
            pack: uomKnowledgePack(),
            fountain: fountainBibKnowledgePack(),
          });
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
          if (args.pour_spec_fl_oz === undefined) {
            return textResult(
              req.id,
              {
                ok: false,
                invented: false,
                evidenceState: 'Missing Evidence',
                error:
                  'pours_per_package needs pour_spec_fl_oz from THIS unit. Call ask_pour_standards first — do not assume 1.5, 1.75, or 2 oz.',
              },
              true,
            );
          }
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
        if (op === 'fountain_bib') {
          const result = costFountainBib({
            syrupGal: Number(args.syrup_gal),
            bibCost: Number(args.bib_cost),
            waterParts: Number(args.water_parts),
            syrupParts: Number(args.syrup_parts),
            productLabel: typeof args.product_label === 'string' ? args.product_label : undefined,
          });
          if (!result.ok) return textResult(req.id, result, true);
          return textResult(req.id, {
            warning: 'Unverified. Mix ratio and BIB $ must come from THIS unit — never invent 5+1.',
            ...result,
          });
        }
        if (op === 'cup_service') {
          const result = declareCupService({
            cupMarkedFlOz: Number(args.cup_marked_fl_oz),
            liquidFillFlOz: Number(args.liquid_fill_fl_oz),
            iceNote: typeof args.ice_note === 'string' ? args.ice_note : undefined,
          });
          if (!result.ok) return textResult(req.id, result, true);
          return textResult(req.id, {
            warning: 'Unverified. Cup mark ≠ liquid fill when ice and straw are present.',
            ...result,
          });
        }
        if (op === 'fountain_cup_pour') {
          const result = costFountainCupPour({
            bib: {
              syrupGal: Number(args.syrup_gal),
              bibCost: Number(args.bib_cost),
              waterParts: Number(args.water_parts),
              syrupParts: Number(args.syrup_parts),
              productLabel: typeof args.product_label === 'string' ? args.product_label : undefined,
            },
            cup: {
              cupMarkedFlOz: Number(args.cup_marked_fl_oz),
              liquidFillFlOz: Number(args.liquid_fill_fl_oz),
              iceNote: typeof args.ice_note === 'string' ? args.ice_note : undefined,
            },
            spiritFlOz: args.spirit_fl_oz === undefined ? undefined : Number(args.spirit_fl_oz),
          });
          if (!result.ok) return textResult(req.id, result, true);
          return textResult(req.id, {
            warning: 'Unverified fountain cup pour. Ask mix ratio + liquid fill before trusting the $.',
            ...result,
          });
        }
        return textResult(
          req.id,
          {
            ok: false,
            error:
              'convert_uom requires op: bottle_fl_oz | keg_fl_oz | pours_per_package | cost_per_pour | volume | mass | fountain_bib | cup_service | fountain_cup_pour | knowledge',
          },
          true,
        );
      }

      if (name === 'ask_pour_standards') {
        const categories = Array.isArray(args.categories)
          ? (args.categories as PourCategory[])
          : undefined;
        return textResult(req.id, {
          warning:
            'Ask THESE questions at this unit. Choice menus are options — not defaults. Do not invent 1.5 / 1.75 / 2 oz.',
          ...askPourStandards({
            storeId: typeof args.store_id === 'string' ? args.store_id : '',
            locationId: typeof args.location_id === 'string' ? args.location_id : null,
            categories,
          }),
        });
      }

      if (name === 'declare_pour_standards') {
        const rawLines = Array.isArray(args.lines) ? args.lines : [];
        const lines: HousePourLine[] = rawLines.map((row) => {
          const r = row as Record<string, unknown>;
          return {
            category: r.category as PourCategory,
            pourSpecFlOz: Number(r.pour_spec_fl_oz),
            label: typeof r.label === 'string' ? r.label : undefined,
            measureMethod: typeof r.measure_method === 'string' ? r.measure_method : undefined,
            approvedBy: typeof r.approved_by === 'string' ? r.approved_by : undefined,
            source: typeof r.source === 'string' ? r.source : undefined,
          };
        });
        const declared = declarePourStandards({
          storeId: typeof args.store_id === 'string' ? args.store_id : '',
          locationId: typeof args.location_id === 'string' ? args.location_id : null,
          lines,
        });
        if ('ok' in declared && declared.ok === false) {
          return textResult(req.id, declared, true);
        }
        if (!('status' in declared)) {
          return textResult(req.id, { ok: false, error: 'declare_pour_standards failed' }, true);
        }
        const memoryProposal = proposePourStandardsMemory(declared);
        return textResult(req.id, {
          warning:
            'House pours stay Unverified until a human approves the Memory Curator proposal. LLM ranks; human sends/approves.',
          standards: declared,
          memoryProposal,
        });
      }

      if (name === 'ask_fountain_standards') {
        return textResult(req.id, {
          warning:
            'Ask THESE fountain questions at this unit. Mix-ratio choice menus are options — not defaults. Do not invent 5+1 or cup liquid fill.',
          ...askFountainBibStandards({
            storeId: typeof args.store_id === 'string' ? args.store_id : '',
            productHint: typeof args.product_hint === 'string' ? args.product_hint : undefined,
          }),
        });
      }

      if (name === 'analyze_recipe_cost') {
        const mode = typeof args.mode === 'string' ? args.mode : '';
        if (mode === 'knowledge') {
          return textResult(req.id, {
            evidenceState: 'Verified',
            pack: recipeCostKnowledgePack(),
            fountain: fountainBibKnowledgePack(),
          });
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
        if (mode === 'drink_recipe') {
          const rawHouse = Array.isArray(args.house_pour_lines) ? args.house_pour_lines : [];
          const housePourLines: HousePourLine[] = rawHouse.map((row) => {
            const r = row as Record<string, unknown>;
            return {
              category: r.category as PourCategory,
              pourSpecFlOz: Number(r.pour_spec_fl_oz),
              label: typeof r.label === 'string' ? r.label : undefined,
              measureMethod: typeof r.measure_method === 'string' ? r.measure_method : undefined,
              approvedBy: typeof r.approved_by === 'string' ? r.approved_by : undefined,
              source: typeof r.source === 'string' ? r.source : undefined,
            };
          });
          const ingredients = Array.isArray(args.ingredients)
            ? (args.ingredients as DrinkRecipeIngredient[]).map((row) => {
                const r = row as DrinkRecipeIngredient & {
                  pour_category?: PourCategory;
                  pour_source?: DrinkRecipeIngredient['pourSource'];
                  ep_qty?: number;
                  ep_unit_cost?: number;
                };
                return {
                  id: r.id,
                  name: r.name,
                  pourCategory: r.pourCategory ?? r.pour_category,
                  pourSource: r.pourSource ?? r.pour_source,
                  epQty: r.epQty ?? r.ep_qty,
                  epUnitCost: Number(r.epUnitCost ?? r.ep_unit_cost),
                };
              })
            : [];
          const result = calculateDrinkRecipeCost({
            storeId: typeof args.store_id === 'string' ? args.store_id : '',
            locationId: typeof args.location_id === 'string' ? args.location_id : null,
            housePourLines,
            ingredients,
          });
          if (!result.ok) return textResult(req.id, result, true);
          return textResult(req.id, {
            warning:
              'Unverified drink cost. Liquor ounces came from THIS unit’s house pour (or an explicit recipe-specific fl oz) — never a Never86 default.',
            ...result,
          });
        }
        if (mode === 'fountain_spirit_drink') {
          const walked = walkFountainSpiritDrink({
            storeId: typeof args.store_id === 'string' ? args.store_id : '',
            sodaLabel: typeof args.soda_label === 'string' ? args.soda_label : undefined,
            spiritLabel: typeof args.spirit_label === 'string' ? args.spirit_label : undefined,
            syrupGal: args.syrup_gal === undefined ? undefined : Number(args.syrup_gal),
            bibCost: args.bib_cost === undefined ? undefined : Number(args.bib_cost),
            waterParts: args.water_parts === undefined ? undefined : Number(args.water_parts),
            syrupParts: args.syrup_parts === undefined ? undefined : Number(args.syrup_parts),
            cupMarkedFlOz: args.cup_marked_fl_oz === undefined ? undefined : Number(args.cup_marked_fl_oz),
            liquidFillFlOz: args.liquid_fill_fl_oz === undefined ? undefined : Number(args.liquid_fill_fl_oz),
            spiritPourFlOz: args.spirit_pour_fl_oz === undefined ? undefined : Number(args.spirit_pour_fl_oz),
            spiritCostPerFlOz:
              args.spirit_cost_per_fl_oz === undefined ? undefined : Number(args.spirit_cost_per_fl_oz),
          });
          if (walked.phase === 'ask') {
            return textResult(req.id, {
              warning:
                'Missing Evidence. Walk the operator: Pepsi BIB size + $, gun mix ratio, cup liquid after ice, Hawkeye house pour — then re-call.',
              ...walked,
            });
          }
          return textResult(req.id, {
            warning:
              'Unverified fountain+spirit drink cost. Mix ratio, ice fill, and house pour came from THIS unit’s answers — never Never86 defaults.',
            ...walked,
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
              'analyze_recipe_cost requires mode: recipe | drink_recipe | fountain_spirit_drink | ep_unit_cost | food_cogs | food_cost_pct | contribution | knowledge',
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
