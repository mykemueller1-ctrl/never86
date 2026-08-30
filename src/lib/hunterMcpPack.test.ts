import { describe, expect, it } from 'vitest';
import { getHunterStandupPack } from './hunterMcpPack';

describe('hunterMcpPack', () => {
  it('returns inline standup with scoring and queries', () => {
    const pack = getHunterStandupPack();
    expect(pack.icpScoring.keepIfTotalAtLeast).toBe(60);
    expect(pack.searchQueries.x.length).toBeGreaterThan(3);
    expect(pack.searchQueries.reddit.length).toBeGreaterThan(2);
    expect(pack.voice.bannedPhrases).toContain('AI-powered');
    expect(pack.hardStops.some((s) => s.includes('NOT post'))).toBe(true);
  });
});
