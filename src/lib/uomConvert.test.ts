import { describe, expect, it } from 'vitest';
import {
  BEER_PACK_SIZES,
  KEG_US_GAL,
  ML_PER_US_FL_OZ,
  SPIRIT_BOTTLE_ML,
  bottleFlOzFromMl,
  convertMass,
  convertVolume,
  costPerPour,
  kegFlOz,
  poursPerPackage,
  uomKnowledgePack,
} from './uomConvert';

describe('uomConvert', () => {
  it('keeps fluid ounces as volume and avoirdupois ounces as mass', () => {
    const fl = convertVolume(1, 'flOz', 'ml');
    expect(fl.ok).toBe(true);
    if (fl.ok) expect(fl.value).toBeCloseTo(ML_PER_US_FL_OZ, 6);

    const mass = convertMass(1, 'ozAv', 'g');
    expect(mass.ok).toBe(true);
    if (mass.ok) expect(mass.value).toBeCloseTo(28.349523125, 6);

    expect(fl.ok && mass.ok && Math.abs(fl.value - mass.value) > 1).toBe(true);
  });

  it('converts standard spirit bottles without inventing pourSpec', () => {
    const fifth = bottleFlOzFromMl(SPIRIT_BOTTLE_ML.fifth750);
    expect(fifth.ok).toBe(true);
    if (fifth.ok) expect(fifth.value).toBeCloseTo(25.3605, 3);

    const pours = poursPerPackage({
      unitsPerPackage: 1,
      unitFlOz: fifth.ok ? fifth.value : 0,
      pourSpecFlOz: 1.5,
    });
    expect(pours.ok).toBe(true);
    if (pours.ok) expect(pours.value.poursPerPackage).toBeCloseTo(16.907, 2);

    expect(poursPerPackage({ unitsPerPackage: 1, unitFlOz: 25.36, pourSpecFlOz: 0 }).ok).toBe(false);
  });

  it('computes cost per pour only when pack math is verified', () => {
    const ok = costPerPour({ packageCost: 33.81, poursPerPackage: 22.54 });
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.value).toBeCloseTo(1.5, 2);

    expect(costPerPour({ packageCost: 10, poursPerPackage: 0 }).ok).toBe(false);
  });

  it('uses TTB keg gallons and refuses invented pack sizes', () => {
    const half = kegFlOz(KEG_US_GAL.halfBarrel);
    expect(half.ok).toBe(true);
    if (half.ok) expect(half.value).toBeCloseTo(1984, 4);

    expect(BEER_PACK_SIZES).toEqual([12, 24, 30]);
    const pack = uomKnowledgePack();
    expect(pack.truthGates.join(' ')).toMatch(/Ask 1\.5 \/ 1\.75 \/ 2/);
    expect(pack.formulas.poursPerPackage).toMatch(/housePourSpecFlOz/);
    expect(pack.pourSizeChoiceMenu.some((row) => row.pourSpecFlOz === 1.75)).toBe(true);
    expect(pack.never.join(' ')).toMatch(/universal pour/);
  });
});
