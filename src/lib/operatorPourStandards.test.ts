import { describe, expect, it } from 'vitest';
import {
  askPourStandards,
  declarePourStandards,
  proposePourStandardsMemory,
  resolveHousePour,
  pourStandardsKnowledgePack,
} from './operatorPourStandards';

describe('operatorPourStandards', () => {
  it('asks each unit for pour sizes and never assumes 1.5 oz', () => {
    const ask = askPourStandards({ storeId: 'demo-unit-1' });
    expect(ask.invented).toBe(false);
    expect(ask.status).toBe('missing');
    expect(ask.evidenceState).toBe('Missing Evidence');
    expect(ask.ask.some((row) => row.category === 'spirit_shot')).toBe(true);
    expect(ask.ask.find((row) => row.category === 'spirit_shot')?.choicesFlOz).toContain(1.5);
    expect(ask.ask.find((row) => row.category === 'spirit_shot')?.choicesFlOz).toContain(1.75);
    expect(ask.ask.find((row) => row.category === 'spirit_shot')?.choicesFlOz).toContain(2);
    expect(ask.lines).toEqual([]);
  });

  it('accepts different houses: 1.5 shot vs 1.75 mixed vs 2 shot', () => {
    const houseA = declarePourStandards({
      storeId: 'unit-a',
      lines: [
        { category: 'spirit_shot', pourSpecFlOz: 1.5, label: 'jigger shot', approvedBy: 'owner' },
        { category: 'mixed_drink_liquor', pourSpecFlOz: 1.75, label: 'rail mix', approvedBy: 'owner' },
        { category: 'wine_glass', pourSpecFlOz: 5, approvedBy: 'owner' },
        { category: 'draft_pour', pourSpecFlOz: 16, approvedBy: 'owner' },
      ],
    });
    expect('ok' in houseA && houseA.ok === false).toBe(false);
    if ('status' in houseA) {
      expect(houseA.status).toBe('complete');
      const shot = resolveHousePour(houseA, 'spirit_shot');
      expect(shot.ok).toBe(true);
      if (shot.ok) expect(shot.pourSpecFlOz).toBe(1.5);
      const mix = resolveHousePour(houseA, 'mixed_drink_liquor');
      expect(mix.ok).toBe(true);
      if (mix.ok) expect(mix.pourSpecFlOz).toBe(1.75);
    }

    const houseB = declarePourStandards({
      storeId: 'unit-b',
      lines: [
        { category: 'spirit_shot', pourSpecFlOz: 2, label: 'free-pour house', approvedBy: 'gm' },
        { category: 'mixed_drink_liquor', pourSpecFlOz: 2, approvedBy: 'gm' },
        { category: 'wine_glass', pourSpecFlOz: 6, approvedBy: 'gm' },
        { category: 'draft_pour', pourSpecFlOz: 12, approvedBy: 'gm' },
      ],
    });
    if ('status' in houseB) {
      const shot = resolveHousePour(houseB, 'spirit_shot');
      expect(shot.ok && shot.pourSpecFlOz === 2).toBe(true);
    }
  });

  it('blocks resolve when house pour is missing — does not invent 1.5', () => {
    const missing = resolveHousePour(null, 'spirit_shot');
    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.evidenceState).toBe('Missing Evidence');
      expect(missing.error).toMatch(/do not assume 1\.5/i);
      expect(missing.ask.question).toMatch(/fluid ounces/i);
    }

    const partial = declarePourStandards({
      storeId: 'unit-c',
      lines: [{ category: 'wine_glass', pourSpecFlOz: 5 }],
    });
    if ('status' in partial) {
      expect(partial.status).toBe('partial');
      const shot = resolveHousePour(partial, 'spirit_shot');
      expect(shot.ok).toBe(false);
    }
  });

  it('builds a Memory Curator proposal under recipe/pack/yield mapping', () => {
    const house = declarePourStandards({
      storeId: 'unit-a',
      locationId: 'bar-1',
      lines: [
        { category: 'spirit_shot', pourSpecFlOz: 1.5, source: 'bar book 2026' },
        { category: 'mixed_drink_liquor', pourSpecFlOz: 1.75, source: 'bar book 2026' },
        { category: 'wine_glass', pourSpecFlOz: 5 },
        { category: 'draft_pour', pourSpecFlOz: 16 },
      ],
    });
    expect('status' in house).toBe(true);
    if ('status' in house) {
      const mem = proposePourStandardsMemory(house);
      expect(mem.ok).toBe(true);
      if (mem.ok) {
        expect(mem.memoryType).toBe('recipe/pack/yield mapping');
        expect(mem.rawRule).toMatch(/spirit_shot=1\.5/);
        expect(mem.rawRule).toMatch(/mixed_drink_liquor=1\.75/);
        expect(mem.normalizedInterpretation).toMatch(/Not a universal/);
      }
    }
    expect(pourStandardsKnowledgePack().truthGates.join(' ')).toMatch(/per unit/);
  });
});
