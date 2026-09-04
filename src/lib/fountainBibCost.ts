/**
 * Fountain / bag-in-box (BIB) post-mix costing for gun soda.
 * Syrup box ≠ finished beverage. Mix ratio and cup liquid fill are per unit — ask, never invent.
 *
 * Example interview: Pepsi on the gun, 5-gal BIB, 9 oz cup with ice + straw, + Hawkeye vodka.
 */

import { FL_OZ_PER_US_GAL } from './uomConvert';

/** Choice menu only — not silent defaults. */
export const COMMON_FOUNTAIN_MIX_RATIOS = [
  {
    id: '5+1',
    waterParts: 5,
    syrupParts: 1,
    note: 'Common cola post-mix (5 water : 1 syrup). Confirm on THIS gun / BIB.',
  },
  {
    id: '5.5+1',
    waterParts: 5.5,
    syrupParts: 1,
    note: 'Choice only — some fountain sets.',
  },
  {
    id: '4.5+1',
    waterParts: 4.5,
    syrupParts: 1,
    note: 'Choice only — richer mix; confirm.',
  },
  {
    id: '4+1',
    waterParts: 4,
    syrupParts: 1,
    note: 'Choice only — confirm on BIB / valve card.',
  },
] as const;

export const COMMON_CUP_MARKED_FL_OZ = [9, 12, 16, 20, 24, 32] as const;

export type FountainAskItem = {
  id: string;
  question: string;
  why: string;
  choices?: readonly string[];
  allowCustom: true;
};

export type FountainBibInput = {
  /** Syrup volume in the BIB, US gallons (e.g. 5). */
  syrupGal: number;
  /** Invoice / landed cost of that BIB (syrup only). */
  bibCost: number;
  /** Carbonated water (or water) parts per syrup part — e.g. 5 for 5+1. */
  waterParts: number;
  /** Syrup parts in the ratio — usually 1. */
  syrupParts: number;
  productLabel?: string;
};

export type FountainBibOk = {
  ok: true;
  invented: false;
  evidenceState: 'Unverified';
  productLabel?: string;
  syrupGal: number;
  syrupFlOz: number;
  waterParts: number;
  syrupParts: number;
  mixRatioLabel: string;
  finishedGal: number;
  finishedFlOz: number;
  costPerFinishedFlOz: number;
  formula: string;
};

export type FountainBibError = {
  ok: false;
  invented: false;
  evidenceState: 'Missing Evidence';
  error: string;
  ask?: readonly FountainAskItem[];
};

export type CupServiceInput = {
  cupMarkedFlOz: number;
  /**
   * Actual beverage liquid in the cup after ice + straw displacement.
   * Never invent from marked size — ice takes volume.
   */
  liquidFillFlOz: number;
  iceNote?: string;
};

export type CupServiceOk = {
  ok: true;
  invented: false;
  evidenceState: 'Unverified';
  cupMarkedFlOz: number;
  liquidFillFlOz: number;
  iceDisplacementFlOz: number;
  iceNote?: string;
};

export type CupServiceError = {
  ok: false;
  invented: false;
  evidenceState: 'Missing Evidence';
  error: string;
  ask: FountainAskItem;
};

/** Interview pack for fountain BIB + cup service at THIS unit. */
export function askFountainBibStandards(input?: {
  storeId?: string;
  productHint?: string;
}): {
  storeId: string;
  productHint: string | null;
  invented: false;
  evidenceState: 'Missing Evidence';
  ask: readonly FountainAskItem[];
  mixRatioChoiceMenu: typeof COMMON_FOUNTAIN_MIX_RATIOS;
  cupMarkedChoiceMenuFlOz: typeof COMMON_CUP_MARKED_FL_OZ;
  onboardingScript: readonly string[];
} {
  const product = input?.productHint?.trim() || 'fountain soda on the gun';
  return {
    storeId: input?.storeId?.trim() || '',
    productHint: input?.productHint?.trim() || null,
    invented: false,
    evidenceState: 'Missing Evidence',
    mixRatioChoiceMenu: COMMON_FOUNTAIN_MIX_RATIOS,
    cupMarkedChoiceMenuFlOz: COMMON_CUP_MARKED_FL_OZ,
    ask: [
      {
        id: 'gun_product',
        question: 'What product is on the gun for this recipe? (e.g. Pepsi, Diet Pepsi, Mountain Dew)',
        why: 'Each BIB and valve can have a different mix ratio and cost.',
        allowCustom: true,
      },
      {
        id: 'bib_syrup_gal',
        question: `How many US gallons of syrup are in the ${product} bag-in-box?`,
        why: 'Syrup gallons ≠ finished drink gallons. We need the syrup pack size from the box or invoice.',
        choices: ['2.5', '3', '5', 'custom'],
        allowCustom: true,
      },
      {
        id: 'bib_cost',
        question: `What did THIS unit pay for that ${product} BIB (invoice / landed $)?`,
        why: 'Invoice dollars on syrup only. Do not invent distributor price.',
        allowCustom: true,
      },
      {
        id: 'mix_ratio',
        question: 'What mix ratio is this gun / BIB set to? (water parts : syrup parts — often printed 5+1)',
        why: 'Finished yield = syrup × (waterParts/syrupParts + 1). Wrong ratio → wrong cost per pour.',
        choices: COMMON_FOUNTAIN_MIX_RATIOS.map((r) => r.id),
        allowCustom: true,
      },
      {
        id: 'cup_marked',
        question: 'What cup size is marked on the vessel for this drink? (e.g. 9 oz)',
        why: 'Marked cup size is not liquid fill when ice and a straw are in the cup.',
        choices: COMMON_CUP_MARKED_FL_OZ.map(String),
        allowCustom: true,
      },
      {
        id: 'liquid_fill',
        question:
          'After ice and straw, how many fluid ounces of liquid actually go in that cup? Measure or estimate from a fill line — do not use the cup mark alone.',
        why: 'Ice displaces soda. Costing a “9 oz cup” as 9 oz of Pepsi invents liquid volume.',
        allowCustom: true,
      },
    ],
    onboardingScript: [
      '1. Name the gun product (Pepsi).',
      '2. Confirm BIB syrup size (5-gal box) and invoice $ for THIS unit.',
      '3. Confirm pour ratio on the gun / valve card (e.g. 5+1) — choice menu is options only.',
      '4. Convert: finishedGal = syrupGal × (waterParts/syrupParts + 1); finishedFlOz = finishedGal × 128.',
      '5. costPerFinishedFlOz = bibCost / finishedFlOz.',
      '6. Cup: marked size vs liquid after ice + straw — ask both.',
      '7. Spirit line (Hawkeye vodka): ask THIS unit’s mixed-drink liquor pour (1.5 / 1.75 / 2 / custom).',
      '8. Pepsi in the cup = liquidFillFlOz − vodkaFlOz (or operator-stated soda fill).',
      '9. Drink cost = vodkaCost + pepsiCost. Never invent mix ratio, ice fill, or house pour.',
    ],
  };
}

export function costFountainBib(input: FountainBibInput): FountainBibOk | FountainBibError {
  const ask = askFountainBibStandards({ productHint: input.productLabel }).ask;

  if (!Number.isFinite(input.syrupGal) || input.syrupGal <= 0) {
    return {
      ok: false,
      invented: false,
      evidenceState: 'Missing Evidence',
      error: 'syrupGal must be > 0 (e.g. 5 for a five-gallon Pepsi BIB). Ask the operator — do not invent pack size.',
      ask: ask.filter((a) => a.id === 'bib_syrup_gal'),
    };
  }
  if (!Number.isFinite(input.bibCost) || input.bibCost < 0) {
    return {
      ok: false,
      invented: false,
      evidenceState: 'Missing Evidence',
      error: 'bibCost must be a finite, non-negative invoice/landed dollar for THIS BIB.',
      ask: ask.filter((a) => a.id === 'bib_cost'),
    };
  }
  if (
    !Number.isFinite(input.waterParts) ||
    input.waterParts <= 0 ||
    !Number.isFinite(input.syrupParts) ||
    input.syrupParts <= 0
  ) {
    return {
      ok: false,
      invented: false,
      evidenceState: 'Missing Evidence',
      error:
        'Mix ratio needs waterParts > 0 and syrupParts > 0 from THIS gun/BIB (e.g. 5 and 1 for 5+1). Do not assume cola industry defaults.',
      ask: ask.filter((a) => a.id === 'mix_ratio'),
    };
  }

  const syrupFlOz = input.syrupGal * FL_OZ_PER_US_GAL;
  const finishedGal = input.syrupGal * (input.waterParts / input.syrupParts + 1);
  const finishedFlOz = finishedGal * FL_OZ_PER_US_GAL;
  const costPerFinishedFlOz = input.bibCost / finishedFlOz;

  return {
    ok: true,
    invented: false,
    evidenceState: 'Unverified',
    productLabel: input.productLabel,
    syrupGal: input.syrupGal,
    syrupFlOz,
    waterParts: input.waterParts,
    syrupParts: input.syrupParts,
    mixRatioLabel: `${input.waterParts}+${input.syrupParts}`,
    finishedGal,
    finishedFlOz,
    costPerFinishedFlOz,
    formula:
      'finishedGal = syrupGal × (waterParts/syrupParts + 1); costPerFinishedFlOz = bibCost / (finishedGal × 128)',
  };
}

export function declareCupService(input: CupServiceInput): CupServiceOk | CupServiceError {
  const liquidAsk: FountainAskItem = {
    id: 'liquid_fill',
    question:
      'After ice and straw, how many fluid ounces of liquid actually go in that cup? Do not use the cup mark alone.',
    why: 'Ice displaces soda. Marked 9 oz ≠ 9 oz of Pepsi.',
    allowCustom: true,
  };

  if (!Number.isFinite(input.cupMarkedFlOz) || input.cupMarkedFlOz <= 0) {
    return {
      ok: false,
      invented: false,
      evidenceState: 'Missing Evidence',
      error: 'cupMarkedFlOz must be > 0 (the size printed on the cup).',
      ask: {
        id: 'cup_marked',
        question: 'What cup size is marked on the vessel?',
        why: 'Need the vessel mark before measuring liquid fill after ice.',
        choices: COMMON_CUP_MARKED_FL_OZ.map(String),
        allowCustom: true,
      },
    };
  }
  if (!Number.isFinite(input.liquidFillFlOz) || input.liquidFillFlOz <= 0) {
    return {
      ok: false,
      invented: false,
      evidenceState: 'Missing Evidence',
      error:
        'liquidFillFlOz must be > 0. A 9 oz cup with ice and a straw is not automatically 9 oz of beverage — ask the liquid fill.',
      ask: liquidAsk,
    };
  }
  if (input.liquidFillFlOz > input.cupMarkedFlOz + 1e-9) {
    return {
      ok: false,
      invented: false,
      evidenceState: 'Missing Evidence',
      error: `liquidFillFlOz (${input.liquidFillFlOz}) cannot exceed cupMarkedFlOz (${input.cupMarkedFlOz}).`,
      ask: liquidAsk,
    };
  }

  return {
    ok: true,
    invented: false,
    evidenceState: 'Unverified',
    cupMarkedFlOz: input.cupMarkedFlOz,
    liquidFillFlOz: input.liquidFillFlOz,
    iceDisplacementFlOz: input.cupMarkedFlOz - input.liquidFillFlOz,
    iceNote: input.iceNote,
  };
}

export type FountainCupPourOk = {
  ok: true;
  invented: false;
  evidenceState: 'Unverified';
  sodaFlOz: number;
  sodaCost: number;
  bib: FountainBibOk;
  cup: CupServiceOk;
  spiritFlOz?: number;
  note: string;
};

export type FountainCupPourError = {
  ok: false;
  invented: false;
  evidenceState: 'Missing Evidence';
  error: string;
  ask?: readonly FountainAskItem[];
};

/**
 * Cost the fountain portion of a cup. Optional spiritFlOz (Hawkeye) reduces soda fill:
 * sodaFlOz = liquidFillFlOz − spiritFlOz.
 */
export function costFountainCupPour(input: {
  bib: FountainBibInput;
  cup: CupServiceInput;
  spiritFlOz?: number;
}): FountainCupPourOk | FountainCupPourError {
  const bib = costFountainBib(input.bib);
  if (!bib.ok) return bib;

  const cup = declareCupService(input.cup);
  if (!cup.ok) {
    return {
      ok: false,
      invented: false,
      evidenceState: 'Missing Evidence',
      error: cup.error,
      ask: [cup.ask],
    };
  }

  const spiritFlOz = input.spiritFlOz ?? 0;
  if (!Number.isFinite(spiritFlOz) || spiritFlOz < 0) {
    return {
      ok: false,
      invented: false,
      evidenceState: 'Missing Evidence',
      error: 'spiritFlOz must be finite and ≥ 0 when supplied (from THIS unit’s house pour).',
    };
  }
  if (spiritFlOz > cup.liquidFillFlOz) {
    return {
      ok: false,
      invented: false,
      evidenceState: 'Missing Evidence',
      error: `spiritFlOz (${spiritFlOz}) exceeds liquid fill (${cup.liquidFillFlOz}). Re-check house pour and cup fill.`,
    };
  }

  const sodaFlOz = cup.liquidFillFlOz - spiritFlOz;
  return {
    ok: true,
    invented: false,
    evidenceState: 'Unverified',
    sodaFlOz,
    sodaCost: sodaFlOz * bib.costPerFinishedFlOz,
    bib,
    cup,
    spiritFlOz: spiritFlOz > 0 ? spiritFlOz : undefined,
    note:
      spiritFlOz > 0
        ? 'Soda fl oz = liquid fill after ice − spirit pour. Straw/ice already removed via liquidFillFlOz.'
        : 'Soda fl oz = liquid fill after ice. No spirit deducted.',
  };
}

/**
 * Guided recipe walkthrough: Pepsi gun + Hawkeye vodka in a marked cup with ice.
 * Returns questions first; math only when every answer is present.
 */
export function walkFountainSpiritDrink(input: {
  storeId: string;
  sodaLabel?: string;
  spiritLabel?: string;
  syrupGal?: number;
  bibCost?: number;
  waterParts?: number;
  syrupParts?: number;
  cupMarkedFlOz?: number;
  liquidFillFlOz?: number;
  spiritPourFlOz?: number;
  spiritCostPerFlOz?: number;
}): {
  invented: false;
  storeId: string;
  recipeName: string;
  phase: 'ask' | 'costed';
  evidenceState: 'Missing Evidence' | 'Unverified';
  ask: readonly FountainAskItem[];
  onboardingScript: readonly string[];
  missing: readonly string[];
  cost?: {
    spiritFlOz: number;
    spiritCost: number;
    sodaFlOz: number;
    sodaCost: number;
    recipeCost: number;
    bib: FountainBibOk;
    cup: CupServiceOk;
  };
} {
  const sodaLabel = input.sodaLabel?.trim() || 'Pepsi (gun / BIB)';
  const spiritLabel = input.spiritLabel?.trim() || 'Hawkeye vodka';
  const baseAsk = askFountainBibStandards({
    storeId: input.storeId,
    productHint: sodaLabel,
  });

  const spiritAsk: FountainAskItem = {
    id: 'spirit_pour',
    question: `At this unit, how many fl oz of ${spiritLabel} go into this mixed drink? (1.5 / 1.75 / 2 / custom)`,
    why: 'House pour is per unit. Never assume 1.5 oz for Hawkeye or any well vodka.',
    choices: ['1.5', '1.75', '2', 'custom'],
    allowCustom: true,
  };
  const spiritCostAsk: FountainAskItem = {
    id: 'spirit_cost_per_fl_oz',
    question: `What is the cost per fl oz for ${spiritLabel} at this unit (bottle $ ÷ bottle fl oz)?`,
    why: 'Need a verified bottle pack + invoice before spirit line cost.',
    allowCustom: true,
  };

  const missing: string[] = [];
  const ask: FountainAskItem[] = [];

  if (!Number.isFinite(input.syrupGal) || (input.syrupGal as number) <= 0) {
    missing.push('syrupGal');
    ask.push(...baseAsk.ask.filter((a) => a.id === 'bib_syrup_gal'));
  }
  if (!Number.isFinite(input.bibCost) || (input.bibCost as number) < 0) {
    missing.push('bibCost');
    ask.push(...baseAsk.ask.filter((a) => a.id === 'bib_cost'));
  }
  if (!Number.isFinite(input.waterParts) || !Number.isFinite(input.syrupParts)) {
    missing.push('mixRatio');
    ask.push(...baseAsk.ask.filter((a) => a.id === 'mix_ratio'));
  }
  if (!Number.isFinite(input.cupMarkedFlOz) || (input.cupMarkedFlOz as number) <= 0) {
    missing.push('cupMarkedFlOz');
    ask.push(...baseAsk.ask.filter((a) => a.id === 'cup_marked'));
  }
  if (!Number.isFinite(input.liquidFillFlOz) || (input.liquidFillFlOz as number) <= 0) {
    missing.push('liquidFillFlOz');
    ask.push(...baseAsk.ask.filter((a) => a.id === 'liquid_fill'));
  }
  if (!Number.isFinite(input.spiritPourFlOz) || (input.spiritPourFlOz as number) <= 0) {
    missing.push('spiritPourFlOz');
    ask.push(spiritAsk);
  }
  if (!Number.isFinite(input.spiritCostPerFlOz) || (input.spiritCostPerFlOz as number) < 0) {
    missing.push('spiritCostPerFlOz');
    ask.push(spiritCostAsk);
  }

  if (missing.length) {
    return {
      invented: false,
      storeId: input.storeId,
      recipeName: `${spiritLabel} + ${sodaLabel}`,
      phase: 'ask',
      evidenceState: 'Missing Evidence',
      ask: ask.length ? ask : [...baseAsk.ask],
      onboardingScript: baseAsk.onboardingScript,
      missing,
    };
  }

  const pour = costFountainCupPour({
    bib: {
      syrupGal: input.syrupGal as number,
      bibCost: input.bibCost as number,
      waterParts: input.waterParts as number,
      syrupParts: input.syrupParts as number,
      productLabel: sodaLabel,
    },
    cup: {
      cupMarkedFlOz: input.cupMarkedFlOz as number,
      liquidFillFlOz: input.liquidFillFlOz as number,
      iceNote: 'ice + straw',
    },
    spiritFlOz: input.spiritPourFlOz as number,
  });

  if (!pour.ok) {
    return {
      invented: false,
      storeId: input.storeId,
      recipeName: `${spiritLabel} + ${sodaLabel}`,
      phase: 'ask',
      evidenceState: 'Missing Evidence',
      ask: pour.ask ?? [...baseAsk.ask],
      onboardingScript: baseAsk.onboardingScript,
      missing: ['fountain_or_cup'],
    };
  }

  const spiritFlOz = input.spiritPourFlOz as number;
  const spiritCost = spiritFlOz * (input.spiritCostPerFlOz as number);

  return {
    invented: false,
    storeId: input.storeId,
    recipeName: `${spiritLabel} + ${sodaLabel}`,
    phase: 'costed',
    evidenceState: 'Unverified',
    ask: [],
    onboardingScript: baseAsk.onboardingScript,
    missing: [],
    cost: {
      spiritFlOz,
      spiritCost,
      sodaFlOz: pour.sodaFlOz,
      sodaCost: pour.sodaCost,
      recipeCost: spiritCost + pour.sodaCost,
      bib: pour.bib,
      cup: pour.cup,
    },
  };
}

export function fountainBibKnowledgePack() {
  return {
    purpose:
      'Cost fountain gun pours from bag-in-box syrup using operator-declared mix ratio and cup liquid fill — never invent 5+1 or ice displacement.',
    formulas: {
      finishedGal: 'syrupGal × (waterParts / syrupParts + 1)',
      finishedFlOz: 'finishedGal × 128',
      costPerFinishedFlOz: 'bibCost / finishedFlOz',
      sodaFlOzInCup: 'liquidFillFlOz − spiritFlOz',
      sodaCost: 'sodaFlOzInCup × costPerFinishedFlOz',
    },
    exampleWalkthrough: {
      recipe: 'Hawkeye vodka + Pepsi on the gun',
      cup: '9 oz marked, ice + straw → ask liquid fill (not 9 oz of Pepsi)',
      bib: '5-gal syrup BIB → ask invoice $ and mix ratio (often 5+1, but ASK)',
      spirit: 'Ask THIS unit mixed-drink liquor pour (1.5 / 1.75 / 2 / custom)',
    },
    truthGates: [
      'BIB syrup gallons ≠ finished beverage gallons.',
      'Mix ratio is per gun / BIB — choice menu is interview options only.',
      'Cup mark ≠ liquid fill when ice and straw are present.',
      'Missing ratio, BIB $, liquid fill, or house pour → Missing Evidence.',
      'Invoice on syrup is not period soda COGS without counts.',
    ],
    mixRatioChoiceMenu: COMMON_FOUNTAIN_MIX_RATIOS,
    cupMarkedChoiceMenuFlOz: COMMON_CUP_MARKED_FL_OZ,
  };
}
