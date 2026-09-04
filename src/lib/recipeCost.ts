/**
 * Recipe / plate cost and period food COGS formulas.
 * Invoice ≠ COGS. No count → no food cost. Incomplete week stays Open.
 * Drink recipes: liquor fl oz come from THIS unit’s house pour — never assume 1.5 / 1.75 / 2.
 */

import {
  declarePourStandards,
  resolveHousePour,
  type HousePourLine,
  type HousePourStandards,
  type PourAskItem,
  type PourCategory,
} from './operatorPourStandards';

export type RecipeIngredient = {
  id?: string;
  name?: string;
  /** Edible-portion quantity in the recipe's EP unit. */
  epQty: number;
  /** Cost per EP unit after yield. */
  epUnitCost: number;
};

/**
 * One drink-recipe line. Liquor/wine/draft lines must name a pour category so
 * ounces come from the unit’s declared house pour (or an explicit recipe-specific fl oz).
 */
export type DrinkRecipeIngredient = {
  id?: string;
  name?: string;
  /** Cost per fl oz (or other EP unit) after pack conversion. */
  epUnitCost: number;
  /**
   * House pour category. When set and pourSource is house (default),
   * epQty is taken from declare_pour_standards for THIS unit.
   */
  pourCategory?: PourCategory;
  /**
   * house = use unit pourSpec · recipe_specific = operator gave an explicit fl oz for THIS drink · fixed = non-pour line (syrup, juice).
   */
  pourSource?: 'house' | 'recipe_specific' | 'fixed';
  /** Required when pourSource is fixed or recipe_specific. Ignored when pourSource is house. */
  epQty?: number;
};

export type RecipeCostOk = {
  ok: true;
  invented: false;
  recipeCost: number;
  lines: Array<{
    id?: string;
    name?: string;
    epQty: number;
    epUnitCost: number;
    lineCost: number;
  }>;
  evidenceState: 'Unverified';
};

export type RecipeCostError = {
  ok: false;
  invented: false;
  error: string;
  evidenceState: 'Missing Evidence' | 'Unverified';
};

export function epUnitCost(apUnitCost: number, yieldFraction: number): RecipeCostOk['recipeCost'] | null {
  if (!Number.isFinite(apUnitCost) || apUnitCost < 0) return null;
  if (!Number.isFinite(yieldFraction) || yieldFraction <= 0 || yieldFraction > 1.5) return null;
  return apUnitCost / yieldFraction;
}

export function calculateEpUnitCost(
  apUnitCost: number,
  yieldFraction: number,
): { ok: true; epUnitCost: number; invented: false } | RecipeCostError {
  const value = epUnitCost(apUnitCost, yieldFraction);
  if (value == null) {
    return {
      ok: false,
      invented: false,
      error:
        'EP unit cost needs finite AP unit cost ≥ 0 and yieldFraction in (0, 1.5]. Missing yield is Missing Evidence — not invented.',
      evidenceState: 'Missing Evidence',
    };
  }
  return { ok: true, invented: false, epUnitCost: value };
}

export function calculateRecipeCost(ingredients: readonly RecipeIngredient[]): RecipeCostOk | RecipeCostError {
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return {
      ok: false,
      invented: false,
      error: 'Recipe needs at least one ingredient with EP qty and EP unit cost.',
      evidenceState: 'Missing Evidence',
    };
  }

  const lines: RecipeCostOk['lines'] = [];
  let recipeCost = 0;
  for (const row of ingredients) {
    if (!Number.isFinite(row.epQty) || row.epQty < 0 || !Number.isFinite(row.epUnitCost) || row.epUnitCost < 0) {
      return {
        ok: false,
        invented: false,
        error: 'Each ingredient needs finite, non-negative epQty and epUnitCost.',
        evidenceState: 'Missing Evidence',
      };
    }
    const lineCost = row.epQty * row.epUnitCost;
    recipeCost += lineCost;
    lines.push({
      id: row.id,
      name: row.name,
      epQty: row.epQty,
      epUnitCost: row.epUnitCost,
      lineCost,
    });
  }

  return {
    ok: true,
    invented: false,
    recipeCost,
    lines,
    evidenceState: 'Unverified',
  };
}

export type DrinkRecipeCostOk = RecipeCostOk & {
  kind: 'drink_recipe';
  storeId: string;
  locationId: string | null;
  pourStandardsStatus: HousePourStandards['status'];
  housePoursUsed: Array<{ category: PourCategory; pourSpecFlOz: number; label?: string }>;
};

export type DrinkRecipeCostError = RecipeCostError & {
  kind: 'drink_recipe';
  ask?: readonly PourAskItem[];
  missingCategories?: readonly PourCategory[];
};

/**
 * Cost a drink recipe using THIS unit’s house pour sizes.
 * Never invents 1.5 / 1.75 / 2 oz — Missing Evidence + ask until the operator answers.
 */
export function calculateDrinkRecipeCost(input: {
  storeId: string;
  locationId?: string | null;
  /** Operator-declared pour lines for this unit (from declare_pour_standards). */
  housePourLines: readonly HousePourLine[];
  ingredients: readonly DrinkRecipeIngredient[];
}): DrinkRecipeCostOk | DrinkRecipeCostError {
  const storeId = input.storeId.trim();
  if (!storeId) {
    return {
      ok: false,
      kind: 'drink_recipe',
      invented: false,
      error: 'storeId is required. Drink pours are per unit — never a global default.',
      evidenceState: 'Missing Evidence',
    };
  }
  if (!Array.isArray(input.ingredients) || input.ingredients.length === 0) {
    return {
      ok: false,
      kind: 'drink_recipe',
      invented: false,
      error: 'Drink recipe needs at least one ingredient.',
      evidenceState: 'Missing Evidence',
    };
  }

  const neededCategories = [
    ...new Set(
      input.ingredients
        .filter((row) => row.pourCategory && (row.pourSource ?? 'house') === 'house')
        .map((row) => row.pourCategory as PourCategory),
    ),
  ];

  const declared = declarePourStandards({
    storeId,
    locationId: input.locationId ?? null,
    lines: input.housePourLines,
    requireCategories: neededCategories.length ? neededCategories : undefined,
  });
  if ('ok' in declared && declared.ok === false) {
    return {
      ok: false,
      kind: 'drink_recipe',
      invented: false,
      error: declared.error,
      evidenceState: 'Missing Evidence',
    };
  }
  const standards = declared as HousePourStandards;

  const lines: RecipeCostOk['lines'] = [];
  const housePoursUsed: DrinkRecipeCostOk['housePoursUsed'] = [];
  const asks: PourAskItem[] = [];
  const missingCategories: PourCategory[] = [];
  let recipeCost = 0;

  for (const row of input.ingredients) {
    if (!Number.isFinite(row.epUnitCost) || row.epUnitCost < 0) {
      return {
        ok: false,
        kind: 'drink_recipe',
        invented: false,
        error: 'Each drink ingredient needs finite, non-negative epUnitCost (cost per fl oz / EP unit).',
        evidenceState: 'Missing Evidence',
      };
    }

    const pourSource =
      row.pourSource ?? (row.pourCategory ? 'house' : row.epQty != null ? 'fixed' : 'house');

    let epQty: number;
    if (pourSource === 'house') {
      if (!row.pourCategory) {
        return {
          ok: false,
          kind: 'drink_recipe',
          invented: false,
          error:
            'House-pour liquor lines need pourCategory (spirit_shot, mixed_drink_liquor, wine_glass, draft_pour, packaged_beer, or double_spirit).',
          evidenceState: 'Missing Evidence',
        };
      }
      const resolved = resolveHousePour(standards, row.pourCategory);
      if (!resolved.ok) {
        asks.push(resolved.ask);
        missingCategories.push(row.pourCategory);
        continue;
      }
      epQty = resolved.pourSpecFlOz;
      if (!housePoursUsed.some((h) => h.category === resolved.category)) {
        housePoursUsed.push({
          category: resolved.category,
          pourSpecFlOz: resolved.pourSpecFlOz,
          label: resolved.label,
        });
      }
    } else {
      if (!Number.isFinite(row.epQty) || (row.epQty as number) < 0) {
        return {
          ok: false,
          kind: 'drink_recipe',
          invented: false,
          error:
            pourSource === 'recipe_specific'
              ? 'recipe_specific pour needs an explicit epQty in fl oz from the operator for THIS drink — do not assume 1.5 / 1.75 / 2.'
              : 'Fixed (non-pour) lines need finite, non-negative epQty.',
          evidenceState: 'Missing Evidence',
        };
      }
      epQty = row.epQty as number;
    }

    const lineCost = epQty * row.epUnitCost;
    recipeCost += lineCost;
    lines.push({
      id: row.id,
      name: row.name,
      epQty,
      epUnitCost: row.epUnitCost,
      lineCost,
    });
  }

  if (missingCategories.length) {
    return {
      ok: false,
      kind: 'drink_recipe',
      invented: false,
      error: `Missing house pour for this unit (${[...new Set(missingCategories)].join(', ')}). Ask what they standardize — 1.5, 1.75, 2, or custom — before costing the drink.`,
      evidenceState: 'Missing Evidence',
      ask: asks,
      missingCategories: [...new Set(missingCategories)],
    };
  }

  return {
    ok: true,
    kind: 'drink_recipe',
    invented: false,
    recipeCost,
    lines,
    evidenceState: 'Unverified',
    storeId,
    locationId: input.locationId ?? null,
    pourStandardsStatus: standards.status,
    housePoursUsed,
  };
}

export function theoreticalUsageFromPmix(input: {
  unitsSold: number;
  recipeEpQty: number;
  yieldFraction?: number | null;
}): { ok: true; epUsage: number; apUsage: number | null; invented: false } | RecipeCostError {
  if (!Number.isFinite(input.unitsSold) || input.unitsSold < 0) {
    return {
      ok: false,
      invented: false,
      error: 'unitsSold must be a finite, non-negative number.',
      evidenceState: 'Missing Evidence',
    };
  }
  if (!Number.isFinite(input.recipeEpQty) || input.recipeEpQty < 0) {
    return {
      ok: false,
      invented: false,
      error: 'recipeEpQty must be a finite, non-negative number. POS sold qty is not usage without a recipe.',
      evidenceState: 'Missing Evidence',
    };
  }
  const epUsage = input.unitsSold * input.recipeEpQty;
  const y = input.yieldFraction;
  if (y == null) {
    return { ok: true, invented: false, epUsage, apUsage: null };
  }
  if (!Number.isFinite(y) || y <= 0) {
    return {
      ok: false,
      invented: false,
      error: 'yieldFraction must be > 0 when converting EP usage to AP.',
      evidenceState: 'Missing Evidence',
    };
  }
  return { ok: true, invented: false, epUsage, apUsage: epUsage / y };
}

export function foodCogs(input: {
  beginningInventory: number;
  purchases: number;
  endingInventory: number;
  transfersIn?: number;
  transfersOut?: number;
  documentedWaste?: number;
  credits?: number;
}): { ok: true; foodCogs: number; invented: false; evidenceState: 'Unverified' } | RecipeCostError {
  const keys = [
    'beginningInventory',
    'purchases',
    'endingInventory',
    'transfersIn',
    'transfersOut',
    'documentedWaste',
    'credits',
  ] as const;
  for (const key of keys) {
    const value = input[key];
    if (value === undefined) continue;
    if (!Number.isFinite(value) || value < 0) {
      return {
        ok: false,
        invented: false,
        error: `${key} must be a finite, non-negative number when supplied.`,
        evidenceState: 'Missing Evidence',
      };
    }
  }

  const foodCogsValue =
    input.beginningInventory +
    input.purchases +
    (input.transfersIn ?? 0) -
    input.endingInventory -
    (input.transfersOut ?? 0) -
    (input.documentedWaste ?? 0) -
    (input.credits ?? 0);

  return {
    ok: true,
    invented: false,
    foodCogs: foodCogsValue,
    evidenceState: 'Unverified',
  };
}

export function foodCostPct(
  foodCogsValue: number,
  foodSales: number,
): { ok: true; foodCostPct: number; invented: false } | RecipeCostError {
  if (!Number.isFinite(foodCogsValue)) {
    return {
      ok: false,
      invented: false,
      error: 'foodCogs must be finite. No count → no food cost.',
      evidenceState: 'Missing Evidence',
    };
  }
  if (!Number.isFinite(foodSales) || foodSales <= 0) {
    return {
      ok: false,
      invented: false,
      error: 'foodSales must be a finite number > 0 for the same store and period.',
      evidenceState: 'Missing Evidence',
    };
  }
  return { ok: true, invented: false, foodCostPct: (foodCogsValue / foodSales) * 100 };
}

export function contributionMargin(
  menuPrice: number,
  recipeCost: number,
): { ok: true; contributionMargin: number; foodCostPct: number; invented: false } | RecipeCostError {
  if (!Number.isFinite(menuPrice) || menuPrice <= 0 || !Number.isFinite(recipeCost) || recipeCost < 0) {
    return {
      ok: false,
      invented: false,
      error: 'menuPrice > 0 and recipeCost ≥ 0 are required.',
      evidenceState: 'Missing Evidence',
    };
  }
  return {
    ok: true,
    invented: false,
    contributionMargin: menuPrice - recipeCost,
    foodCostPct: (recipeCost / menuPrice) * 100,
  };
}

export function recipeCostKnowledgePack() {
  return {
    purpose: 'Cost a plate from EP quantities and convert purchases into COGS only with counts.',
    formulas: {
      yieldFraction: 'EP_qty / AP_qty',
      epUnitCost: 'AP_unit_cost / yieldFraction',
      recipeCost: 'Σ (EP_qty × EP_unit_cost)',
      drinkRecipeCost:
        'Σ (housePourSpecFlOz_or_recipeSpecificFlOz × costPerFlOz) — ask this unit 1.5 / 1.75 / 2 / custom first',
      theoreticalEpUsage: 'unitsSold × recipeEpQty',
      apUsage: 'EP_usage / yieldFraction',
      foodCogs: 'beginningInventory + purchases − endingInventory (± transfers/credits/waste per policy)',
      foodCostPct: 'foodCogs / foodSales × 100',
      contributionMargin: 'menuPrice − recipeCost',
      primeCostCommon: 'foodAndBevCogs + laborWages  // disclose wages-only vs loaded benefits',
    },
    truthGates: [
      'Invoice ≠ COGS. A purchase or invoice photo is not a period close.',
      'No count → no food cost. Missing count is Open / Missing Evidence — not $0 and not 0%.',
      'Incomplete week stays Open.',
      'POS sold quantity is not theoretical ingredient usage without recipe + yield.',
      'Manager-reported food cost is Estimated only until invoices + counts exist.',
      'Never invent case conversion, yield, or recipe maps.',
      'Drink recipes: ask each unit their house pour (1.5 / 1.75 / 2 / custom). Never assume.',
      'Never name staff as thieves. Variance ranks review work.',
    ],
    drinkRecipeFlow: [
      'ask_pour_standards at this unit',
      'operator answers shot vs mixed vs wine vs draft (often different)',
      'declare_pour_standards → human approves memory',
      'analyze_recipe_cost mode=drink_recipe with house_pour_lines + ingredients',
    ],
    evidenceChecklist: [
      'Beginning physical count (date, location, UoM)',
      'Ending physical count (same basis)',
      'Purchases / credits / short-ships for the period',
      'Transfers in/out documented',
      'Food sales same store, period, cutoff',
      'Recipe + yield maps for theoretical / actual-vs-theoretical',
      'Catch-weight and case conversions verified',
      'Per-unit house pour standards for drink recipes',
    ],
  };
}
