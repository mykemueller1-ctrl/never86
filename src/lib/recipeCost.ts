/**
 * Recipe / plate cost and period food COGS formulas.
 * Invoice ≠ COGS. No count → no food cost. Incomplete week stays Open.
 */

export type RecipeIngredient = {
  id?: string;
  name?: string;
  /** Edible-portion quantity in the recipe's EP unit. */
  epQty: number;
  /** Cost per EP unit after yield. */
  epUnitCost: number;
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
      'Never name staff as thieves. Variance ranks review work.',
    ],
    evidenceChecklist: [
      'Beginning physical count (date, location, UoM)',
      'Ending physical count (same basis)',
      'Purchases / credits / short-ships for the period',
      'Transfers in/out documented',
      'Food sales same store, period, cutoff',
      'Recipe + yield maps for theoretical / actual-vs-theoretical',
      'Catch-weight and case conversions verified',
    ],
  };
}
