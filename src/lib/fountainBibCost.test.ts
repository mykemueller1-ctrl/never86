import { describe, expect, it } from 'vitest';
import {
  askFountainBibStandards,
  costFountainBib,
  costFountainCupPour,
  declareCupService,
  fountainBibKnowledgePack,
  walkFountainSpiritDrink,
} from './fountainBibCost';

describe('fountainBibCost', () => {
  it('asks for mix ratio and cup liquid fill — never invents 5+1 or 9 oz of Pepsi', () => {
    const ask = askFountainBibStandards({ storeId: 'unit-a', productHint: 'Pepsi' });
    expect(ask.invented).toBe(false);
    expect(ask.evidenceState).toBe('Missing Evidence');
    expect(ask.ask.some((q) => q.id === 'mix_ratio')).toBe(true);
    expect(ask.ask.some((q) => q.id === 'liquid_fill')).toBe(true);
    expect(ask.mixRatioChoiceMenu.some((r) => r.id === '5+1')).toBe(true);
    expect(ask.onboardingScript.join(' ')).toMatch(/Hawkeye|Pepsi|5\+1/i);
  });

  it('turns a 5-gal Pepsi BIB at operator-declared 5+1 into finished fl oz + cost/oz', () => {
    const bib = costFountainBib({
      syrupGal: 5,
      bibCost: 60,
      waterParts: 5,
      syrupParts: 1,
      productLabel: 'Pepsi',
    });
    expect(bib.ok).toBe(true);
    if (!bib.ok) return;
    // 5 gal syrup × (5/1 + 1) = 30 gal finished × 128 = 3840 fl oz
    expect(bib.finishedGal).toBe(30);
    expect(bib.finishedFlOz).toBe(3840);
    expect(bib.costPerFinishedFlOz).toBeCloseTo(60 / 3840, 10);
    expect(bib.mixRatioLabel).toBe('5+1');
  });

  it('refuses BIB cost without mix ratio', () => {
    const missing = costFountainBib({
      syrupGal: 5,
      bibCost: 60,
      waterParts: 0,
      syrupParts: 1,
    });
    expect(missing.ok).toBe(false);
    if (missing.ok) return;
    expect(missing.evidenceState).toBe('Missing Evidence');
    expect(missing.error).toMatch(/Mix ratio|waterParts/i);
  });

  it('refuses to treat a 9 oz cup with ice as 9 oz of liquid', () => {
    const bad = declareCupService({ cupMarkedFlOz: 9, liquidFillFlOz: 0 });
    expect(bad.ok).toBe(false);
    if (bad.ok) return;
    expect(bad.error).toMatch(/liquidFillFlOz|ice/i);

    const ok = declareCupService({
      cupMarkedFlOz: 9,
      liquidFillFlOz: 5.5,
      iceNote: 'ice + straw',
    });
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    expect(ok.iceDisplacementFlOz).toBeCloseTo(3.5, 6);
  });

  it('costs Pepsi in a vodka-Pepsi after house pour and liquid fill are declared', () => {
    const pour = costFountainCupPour({
      bib: {
        syrupGal: 5,
        bibCost: 60,
        waterParts: 5,
        syrupParts: 1,
        productLabel: 'Pepsi',
      },
      cup: { cupMarkedFlOz: 9, liquidFillFlOz: 6, iceNote: 'ice + straw' },
      spiritFlOz: 1.5,
    });
    expect(pour.ok).toBe(true);
    if (!pour.ok) return;
    expect(pour.sodaFlOz).toBeCloseTo(4.5, 6);
    expect(pour.sodaCost).toBeCloseTo(4.5 * (60 / 3840), 10);
  });

  it('walks Hawkeye + Pepsi as ask-first, then costs when answers exist', () => {
    const asking = walkFountainSpiritDrink({ storeId: 'unit-a' });
    expect(asking.phase).toBe('ask');
    expect(asking.evidenceState).toBe('Missing Evidence');
    expect(asking.missing.length).toBeGreaterThan(0);
    expect(asking.ask.some((q) => q.id === 'mix_ratio' || q.id === 'spirit_pour')).toBe(true);

    const costed = walkFountainSpiritDrink({
      storeId: 'unit-a',
      sodaLabel: 'Pepsi',
      spiritLabel: 'Hawkeye vodka',
      syrupGal: 5,
      bibCost: 60,
      waterParts: 5,
      syrupParts: 1,
      cupMarkedFlOz: 9,
      liquidFillFlOz: 6,
      spiritPourFlOz: 1.5,
      spiritCostPerFlOz: 0.2,
    });
    expect(costed.phase).toBe('costed');
    if (!costed.cost) throw new Error('expected cost');
    expect(costed.cost.spiritFlOz).toBe(1.5);
    expect(costed.cost.spiritCost).toBeCloseTo(0.3, 6);
    expect(costed.cost.sodaFlOz).toBeCloseTo(4.5, 6);
    expect(costed.cost.recipeCost).toBeCloseTo(0.3 + 4.5 * (60 / 3840), 8);

    const pack = fountainBibKnowledgePack();
    expect(pack.exampleWalkthrough.recipe).toMatch(/Hawkeye.*Pepsi/i);
    expect(pack.truthGates.join(' ')).toMatch(/Cup mark ≠ liquid fill|liquid fill/i);
  });
});
