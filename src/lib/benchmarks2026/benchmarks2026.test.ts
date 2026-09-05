import { describe, expect, it } from 'vitest';
import {
  BENCHMARKS_2026,
  getBenchmark,
  getBenchmarksForTopic,
  listBenchmarkSources,
} from './index';

describe('benchmarks2026', () => {
  it('gives every row a non-empty source list', () => {
    for (const row of BENCHMARKS_2026) {
      expect(row.sources.length).toBeGreaterThan(0);
      for (const source of row.sources) {
        expect(source.url).toMatch(/^https?:\/\//);
        expect(source.title.length).toBeGreaterThan(0);
      }
    }
  });

  it('has unique ids', () => {
    const ids = BENCHMARKS_2026.map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('never names a real client', () => {
    const blob = JSON.stringify(BENCHMARKS_2026).toLowerCase();
    expect(blob).not.toMatch(/taco\s*bamba/);
  });

  it('covers all six 2026 topics', () => {
    const topics = new Set(BENCHMARKS_2026.map((row) => row.topic));
    expect(topics).toEqual(
      new Set([
        'pos-fee-drag',
        'delivery-marketplace-skim',
        'labor-shortage',
        'cash-variance',
        'prime-cost-pressure',
        'comp-void-abuse',
      ]),
    );
  });

  it('filters by topic', () => {
    const rows = getBenchmarksForTopic('comp-void-abuse');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.topic === 'comp-void-abuse')).toBe(true);
  });

  it('looks up a benchmark by id', () => {
    expect(getBenchmark('prime-cost-full-service')?.flagAbovePct).toBe(65);
    expect(getBenchmark('does-not-exist')).toBeUndefined();
  });

  it('dedupes sources across rows', () => {
    const sources = listBenchmarkSources();
    const urls = sources.map((s) => s.url);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
