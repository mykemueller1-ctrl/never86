/**
 * Per-operator / per-unit pour standards for drink recipes.
 * House pour is store policy — never invent 1.5 oz (or any size) as universal.
 * Ask each unit. Human approves into store memory (recipe/pack/yield mapping).
 */

export const POUR_CATEGORIES = [
  'spirit_shot',
  'mixed_drink_liquor',
  'wine_glass',
  'draft_pour',
  'packaged_beer',
  'double_spirit',
] as const;

export type PourCategory = (typeof POUR_CATEGORIES)[number];

/** Choice menu for the ask — not defaults applied silently. */
export const POUR_SIZE_CHOICES_FL_OZ = [1, 1.25, 1.5, 1.75, 2, 4, 5, 6, 12, 16] as const;

export type PourSizeChoiceFlOz = (typeof POUR_SIZE_CHOICES_FL_OZ)[number];

export type HousePourLine = {
  category: PourCategory;
  pourSpecFlOz: number;
  /** Operator wording, e.g. "well shot" / "rocks" / "BTG house". */
  label?: string;
  /** How they measure: jigger, free-pour count, marked glass, POS button. */
  measureMethod?: string;
  /** Human who confirmed this house rule. */
  approvedBy?: string;
  source?: string;
};

export type HousePourStandards = {
  storeId: string;
  /** Optional unit / location within a multi-unit group. */
  locationId: string | null;
  status: 'missing' | 'partial' | 'complete';
  lines: readonly HousePourLine[];
  missingCategories: readonly PourCategory[];
  ask: readonly PourAskItem[];
  evidenceState: 'Missing Evidence' | 'Partial' | 'Unverified';
  invented: false;
};

export type PourAskItem = {
  category: PourCategory;
  question: string;
  why: string;
  choicesFlOz: readonly number[];
  allowCustom: true;
};

export type PourResolveOk = {
  ok: true;
  invented: false;
  category: PourCategory;
  pourSpecFlOz: number;
  label?: string;
  evidenceState: 'Unverified';
};

export type PourResolveError = {
  ok: false;
  invented: false;
  category: PourCategory;
  error: string;
  evidenceState: 'Missing Evidence';
  ask: PourAskItem;
};

const CATEGORY_ASK: Record<
  PourCategory,
  { question: string; why: string; suggestedChoices: readonly number[] }
> = {
  spirit_shot: {
    question: 'At this unit, what is the standard straight shot / well pour in fluid ounces?',
    why: 'Bottle yield and cost-per-pour need YOUR house shot — 1.5, 1.75, 2, or another size. We do not invent it.',
    suggestedChoices: [1, 1.25, 1.5, 1.75, 2],
  },
  mixed_drink_liquor: {
    question: 'At this unit, how many fluid ounces of liquor go into a standard mixed drink?',
    why: 'Many houses pour more liquor in a mixed drink than in a straight shot. Say the mixed-drink liquor ounce separately.',
    suggestedChoices: [1.25, 1.5, 1.75, 2],
  },
  wine_glass: {
    question: 'At this unit, what is the standard wine pour in fluid ounces?',
    why: 'Glasses per 750ml change with 5 oz vs 6 oz (or your house mark).',
    suggestedChoices: [4, 5, 6],
  },
  draft_pour: {
    question: 'At this unit, what is the standard draft pour in fluid ounces?',
    why: 'Keg yield needs the house draft size (12, 16, or your mark) — not an assumed pint.',
    suggestedChoices: [12, 14, 16],
  },
  packaged_beer: {
    question: 'At this unit, what serving size (fl oz) do you ring for a standard packaged beer?',
    why: 'Pack (12/24/30) converts to servings only with your ring size.',
    suggestedChoices: [12, 16],
  },
  double_spirit: {
    question: 'At this unit, what is a double spirit pour in fluid ounces?',
    why: 'Doubles must be their own recipe line. Do not silently 2× the shot without confirmation.',
    suggestedChoices: [2, 2.5, 3, 3.5, 4],
  },
};

export function pourAskItem(category: PourCategory): PourAskItem {
  const row = CATEGORY_ASK[category];
  return {
    category,
    question: row.question,
    why: row.why,
    choicesFlOz: row.suggestedChoices,
    allowCustom: true,
  };
}

export function askPourStandards(input?: {
  storeId?: string;
  locationId?: string | null;
  categories?: readonly PourCategory[];
}): HousePourStandards {
  const categories = input?.categories?.length ? [...input.categories] : [...POUR_CATEGORIES];
  const ask = categories.map(pourAskItem);
  return {
    storeId: input?.storeId?.trim() || '',
    locationId: input?.locationId ?? null,
    status: 'missing',
    lines: [],
    missingCategories: categories,
    ask,
    evidenceState: 'Missing Evidence',
    invented: false,
  };
}

function isFinitePour(value: number): boolean {
  return Number.isFinite(value) && value > 0 && value <= 32;
}

/**
 * Build house pour standards from operator answers.
 * Empty / invalid lines are dropped into missingCategories — never filled with 1.5.
 */
export function declarePourStandards(input: {
  storeId: string;
  locationId?: string | null;
  lines: readonly HousePourLine[];
  requireCategories?: readonly PourCategory[];
}): HousePourStandards | { ok: false; invented: false; error: string } {
  const storeId = input.storeId.trim();
  if (!storeId) {
    return { ok: false, invented: false, error: 'storeId is required. Pour standards are per unit — never global.' };
  }

  const byCategory = new Map<PourCategory, HousePourLine>();
  for (const line of input.lines) {
    if (!(POUR_CATEGORIES as readonly string[]).includes(line.category)) continue;
    if (!isFinitePour(line.pourSpecFlOz)) continue;
    byCategory.set(line.category, {
      category: line.category,
      pourSpecFlOz: line.pourSpecFlOz,
      label: line.label?.trim() || undefined,
      measureMethod: line.measureMethod?.trim() || undefined,
      approvedBy: line.approvedBy?.trim() || undefined,
      source: line.source?.trim() || undefined,
    });
  }

  const required = input.requireCategories?.length
    ? [...input.requireCategories]
    : (['spirit_shot', 'mixed_drink_liquor', 'wine_glass', 'draft_pour'] as PourCategory[]);

  const lines = [...byCategory.values()];
  const missingCategories = required.filter((c) => !byCategory.has(c));
  const status =
    missingCategories.length === 0 ? 'complete' : lines.length === 0 ? 'missing' : 'partial';

  return {
    storeId,
    locationId: input.locationId ?? null,
    status,
    lines,
    missingCategories,
    ask: missingCategories.map(pourAskItem),
    evidenceState: status === 'complete' ? 'Unverified' : status === 'partial' ? 'Partial' : 'Missing Evidence',
    invented: false,
  };
}

export function resolveHousePour(
  standards: HousePourStandards | null | undefined,
  category: PourCategory,
): PourResolveOk | PourResolveError {
  const ask = pourAskItem(category);
  if (!standards || standards.status === 'missing' || !standards.lines.length) {
    return {
      ok: false,
      invented: false,
      category,
      error:
        'No house pour standard for this unit. Ask the operator what they pour — do not assume 1.5 oz, 1.75 oz, or 2 oz.',
      evidenceState: 'Missing Evidence',
      ask,
    };
  }
  const line = standards.lines.find((row) => row.category === category);
  if (!line) {
    return {
      ok: false,
      invented: false,
      category,
      error: `Missing house pour for ${category}. Ask this unit before costing drink recipes.`,
      evidenceState: 'Missing Evidence',
      ask,
    };
  }
  return {
    ok: true,
    invented: false,
    category,
    pourSpecFlOz: line.pourSpecFlOz,
    label: line.label,
    evidenceState: 'Unverified',
  };
}

/**
 * Memory proposal shape for Memory Curator (human must approve).
 * memoryType stays within allowed: recipe/pack/yield mapping.
 */
export function proposePourStandardsMemory(standards: HousePourStandards): {
  ok: true;
  memoryType: 'recipe/pack/yield mapping';
  storeId: string;
  locationId: string | null;
  rawRule: string;
  normalizedInterpretation: string;
  source: string;
  provenance: string;
} | { ok: false; error: string } {
  if (!standards.storeId) {
    return { ok: false, error: 'storeId required' };
  }
  if (standards.status === 'missing' || standards.lines.length === 0) {
    return { ok: false, error: 'Declare at least one house pour line before proposing memory.' };
  }
  const rawRule = standards.lines
    .map((line) => {
      const bits = [`${line.category}=${line.pourSpecFlOz} fl oz`];
      if (line.label) bits.push(`label:${line.label}`);
      if (line.measureMethod) bits.push(`measure:${line.measureMethod}`);
      return bits.join(' · ');
    })
    .join('; ');

  return {
    ok: true,
    memoryType: 'recipe/pack/yield mapping',
    storeId: standards.storeId,
    locationId: standards.locationId,
    rawRule: `House pour standards: ${rawRule}`,
    normalizedInterpretation:
      'Per-unit drink pour specs for recipe and bottle/keg yield. Not a universal Never86 default. Not a theft rule.',
    source: standards.lines.map((l) => l.source).filter(Boolean).join(', ') || 'operator-declared',
    provenance: 'operator_pour_standards_v1',
  };
}

export function pourStandardsKnowledgePack() {
  return {
    purpose:
      'Each restaurant unit declares its own pour sizes for drink recipes. Never86 asks; it does not assume 1.5 / 1.75 / 2 oz.',
    categories: POUR_CATEGORIES,
    choiceMenuFlOz: POUR_SIZE_CHOICES_FL_OZ,
    note: 'Choice menu is interview options only. Applying any size without an operator answer is inventing a pourSpec.',
    formulas: {
      poursPerPackage: '(unitsPerPackage * unitFlOz) / housePourSpecFlOz',
      costPerPour: 'packageCost / poursPerPackage',
    },
    askFirst: POUR_CATEGORIES.map(pourAskItem),
    truthGates: [
      'PourSpec is per unit / per house — never a global default.',
      'Straight shot and mixed-drink liquor ounces are often different — ask both.',
      'Doubles are their own line — do not silent-double.',
      'Missing house pour → Missing Evidence. Do not cost the drink recipe yet.',
      'Human approves pour standards into store memory (recipe/pack/yield mapping).',
      'Fluid oz only for pours. Never conflate with weight oz.',
    ],
    memoryType: 'recipe/pack/yield mapping',
  };
}
