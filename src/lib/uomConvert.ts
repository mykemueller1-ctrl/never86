/**
 * Restaurant UoM conversions for forensic costing.
 * Volume (fl oz) ≠ weight (oz). Never invent pack size or pourSpec.
 * Sources: NIST SP 811 (US fl oz), TTB beer barrel (31 US gal).
 */

export const ML_PER_US_FL_OZ = 29.5735295625;
export const FL_OZ_PER_US_GAL = 128;
export const OZ_PER_LB = 16;
export const G_PER_AV_OZ = 28.349523125;
export const TTB_BARREL_US_GAL = 31;

export type VolumeUnit = 'ml' | 'l' | 'flOz' | 'gal';
export type MassUnit = 'g' | 'kg' | 'ozAv' | 'lb';

export type UomError = { ok: false; error: string; invented: false };
export type UomOk<T> = { ok: true; invented: false; value: T };

const VOLUME_TO_ML: Record<VolumeUnit, number> = {
  ml: 1,
  l: 1000,
  flOz: ML_PER_US_FL_OZ,
  gal: FL_OZ_PER_US_GAL * ML_PER_US_FL_OZ,
};

const MASS_TO_G: Record<MassUnit, number> = {
  g: 1,
  kg: 1000,
  ozAv: G_PER_AV_OZ,
  lb: G_PER_AV_OZ * OZ_PER_LB,
};

export function convertVolume(
  amount: number,
  from: VolumeUnit,
  to: VolumeUnit,
): UomOk<number> | UomError {
  if (!Number.isFinite(amount) || amount < 0) {
    return { ok: false, error: 'Volume amount must be a finite, non-negative number.', invented: false };
  }
  const ml = amount * VOLUME_TO_ML[from];
  return { ok: true, invented: false, value: ml / VOLUME_TO_ML[to] };
}

export function convertMass(amount: number, from: MassUnit, to: MassUnit): UomOk<number> | UomError {
  if (!Number.isFinite(amount) || amount < 0) {
    return { ok: false, error: 'Mass amount must be a finite, non-negative number.', invented: false };
  }
  const g = amount * MASS_TO_G[from];
  return { ok: true, invented: false, value: g / MASS_TO_G[to] };
}

/** Bottle fill volume in US fluid ounces from labeled mL. */
export function bottleFlOzFromMl(packageMl: number): UomOk<number> | UomError {
  return convertVolume(packageMl, 'ml', 'flOz');
}

/**
 * Pours per package when pack size and pourSpec are both verified.
 * Missing either → Missing Evidence (not invented).
 */
export function poursPerPackage(input: {
  unitsPerPackage: number;
  unitFlOz: number;
  pourSpecFlOz: number;
}): UomOk<{ poursPerPackage: number; packageFlOz: number }> | UomError {
  const { unitsPerPackage, unitFlOz, pourSpecFlOz } = input;
  for (const [name, value] of Object.entries(input)) {
    if (!Number.isFinite(value) || (value as number) <= 0) {
      return {
        ok: false,
        error: `${name} must be a finite number > 0. Missing pack size or pourSpec is Missing Evidence — not invented.`,
        invented: false,
      };
    }
  }
  const packageFlOz = unitsPerPackage * unitFlOz;
  return {
    ok: true,
    invented: false,
    value: { packageFlOz, poursPerPackage: packageFlOz / pourSpecFlOz },
  };
}

export function costPerPour(input: {
  packageCost: number;
  poursPerPackage: number;
}): UomOk<number> | UomError {
  if (!Number.isFinite(input.packageCost) || input.packageCost < 0) {
    return { ok: false, error: 'packageCost must be a finite, non-negative number.', invented: false };
  }
  if (!Number.isFinite(input.poursPerPackage) || input.poursPerPackage <= 0) {
    return {
      ok: false,
      error: 'poursPerPackage must be > 0. Confirm pack size and pourSpec first.',
      invented: false,
    };
  }
  return { ok: true, invented: false, value: input.packageCost / input.poursPerPackage };
}

/** Standard US spirit bottle sizes (mL) and exact fl oz. */
export const SPIRIT_BOTTLE_ML = {
  fifth750: 750,
  liter1000: 1000,
  handle1750: 1750,
} as const;

/** TTB-relative keg sizes in US gallons. */
export const KEG_US_GAL = {
  halfBarrel: TTB_BARREL_US_GAL / 2, // 15.5
  quarterBarrel: TTB_BARREL_US_GAL / 4, // 7.75
  sixthBarrel: TTB_BARREL_US_GAL / 6, // ≈ 5.1667
} as const;

export function kegFlOz(kegGal: number): UomOk<number> | UomError {
  return convertVolume(kegGal, 'gal', 'flOz');
}

export type CommonPourSpecFlOz = 1 | 1.25 | 1.5 | 2 | 5 | 6 | 12 | 16;

export const COMMON_POUR_SPECS: readonly {
  id: string;
  pourSpecFlOz: CommonPourSpecFlOz;
  use: string;
}[] = [
  { id: 'spirit-1', pourSpecFlOz: 1, use: 'Compact / measured well pour' },
  { id: 'spirit-1.25', pourSpecFlOz: 1.25, use: 'House compromise pour' },
  { id: 'spirit-1.5', pourSpecFlOz: 1.5, use: 'US standard shot / spirit base' },
  { id: 'spirit-2', pourSpecFlOz: 2, use: 'Double / rocks — separate recipe line' },
  { id: 'wine-5', pourSpecFlOz: 5, use: 'US standard wine glass' },
  { id: 'wine-6', pourSpecFlOz: 6, use: 'Larger wine pour' },
  { id: 'beer-12', pourSpecFlOz: 12, use: 'Common draft pour' },
  { id: 'beer-16', pourSpecFlOz: 16, use: 'US pint' },
];

export const BEER_PACK_SIZES = [12, 24, 30] as const;

export const UOM_TRUTH_GATES = [
  'Fluid ounce (fl oz) is volume. Avoirdupois ounce (oz) is mass. Never conflate.',
  'Never invent case conversion, keg size, bottle mL, or pourSpec. Missing → Missing Evidence.',
  'Invoice package UoM (CASE / BTL / KEG) must match pack size before cost-per-pour.',
  'PourSpec is knowledge, not a verdict. Missing pour log → liquor/beer stay Open.',
] as const;

export function uomKnowledgePack() {
  const bottles = Object.fromEntries(
    Object.entries(SPIRIT_BOTTLE_ML).map(([id, ml]) => {
      const fl = bottleFlOzFromMl(ml);
      return [
        id,
        {
          packageMl: ml,
          bottleFlOz: fl.ok ? Number(fl.value.toFixed(4)) : null,
        },
      ];
    }),
  );

  const kegs = Object.fromEntries(
    Object.entries(KEG_US_GAL).map(([id, gal]) => {
      const fl = kegFlOz(gal);
      return [
        id,
        {
          kegGal: gal,
          kegFlOz: fl.ok ? Number(fl.value.toFixed(4)) : null,
        },
      ];
    }),
  );

  return {
    purpose: 'Convert verified restaurant package sizes into pour and portion units without inventing pack or pourSpec.',
    constants: {
      mlPerUsFlOz: ML_PER_US_FL_OZ,
      flOzPerUsGal: FL_OZ_PER_US_GAL,
      ozPerLb: OZ_PER_LB,
      gPerAvOz: G_PER_AV_OZ,
      ttbBarrelUsGal: TTB_BARREL_US_GAL,
    },
    formulas: {
      bottleFlOz: 'packageMl / 29.5735295625',
      kegFlOz: 'kegGal * 128',
      poursPerPackage: '(unitsPerPackage * unitFlOz) / pourSpecFlOz',
      costPerPour: 'packageCost / poursPerPackage  // only when pack + pourSpec verified',
      epUnitCost: 'apUnitCost / yieldFraction',
    },
    spiritBottles: bottles,
    kegs,
    commonPourSpecs: COMMON_POUR_SPECS,
    beerPackSizes: BEER_PACK_SIZES,
    truthGates: UOM_TRUTH_GATES,
    never: [
      'Never treat scale ounces as fluid ounces without density + tare.',
      'Never assume “a keg” is a half barrel.',
      'Never treat 12-pack, 24-pack, and 30-pack as the same case.',
      'Never invent yield, case pack, or pourSpec.',
    ],
  };
}
