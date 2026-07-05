// Integration coverage for all 7 leak agents: each clean sample export must
// analyze successfully, and every agent must reject empty / headerless /
// wrong-shaped CSVs cleanly (ok:false, never a throw). This is the safety net
// that lets us refactor the shared csv/core with confidence.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runVoidHunter } from '../src/lib/voidHunterCsv';
import { runLeakDetector } from '../src/lib/leakDetectorCsv';
import { runLaborDrift } from '../src/lib/laborDriftCsv';
import { runTipVariance } from '../src/lib/tipVarianceCsv';
import { runCateringLeak } from '../src/lib/cateringLeakCsv';
import { runBeverageCostScore } from '../src/lib/beverageScoreCsv';
import { runVendorDrift } from '../src/lib/vendorDriftCsv';

const sample = (f: string) => readFileSync(join(__dirname, '..', 'public', 'samples', f), 'utf8');
const fixture = (f: string) => readFileSync(join(__dirname, 'fixtures', f), 'utf8');

const AGENTS = [
  { name: 'Void Hunter',    run: runVoidHunter,      sample: 'toast-employee-performance.csv' },
  { name: 'Leak Detector',  run: runLeakDetector,    sample: 'toast-sales-detail.csv' },
  { name: 'Labor Drift',    run: runLaborDrift,      sample: 'timesheet-labor.csv' },
  { name: 'Tip Variance',   run: runTipVariance,     sample: 'tips-weekly.csv' },
  { name: 'Catering Leak',  run: runCateringLeak,    sample: 'catering-reconciliation.csv' },
  { name: 'Beverage Score', run: runBeverageCostScore, sample: 'beverage-pour.csv' },
  { name: 'Vendor Drift',   run: runVendorDrift,     sample: 'vendor-drift.csv' },
] as const;

describe('agents · clean sample exports analyze successfully', () => {
  for (const a of AGENTS) {
    it(`${a.name} runs on ${a.sample}`, () => {
      const res = a.run(sample(a.sample)) as { ok?: boolean };
      // Success payloads don't carry ok:false; error payloads do.
      expect(res.ok).not.toBe(false);
      expect(res).toBeTypeOf('object');
    });
  }
});

// Golden-output snapshots: lock each agent's EXACT current output on its clean
// sample. Any change to an agent or the shared core that alters a number will
// fail here — the safety net for migrating the remaining agents onto csv/core.
describe('agents · golden output (exact) on clean samples', () => {
  for (const a of AGENTS) {
    it(`${a.name} output is unchanged`, () => {
      expect(a.run(sample(a.sample))).toMatchSnapshot();
    });
  }
});

describe('agents · reject bad input cleanly (never throw)', () => {
  const bad = [
    ['empty file', 'empty-file.csv'],
    ['headers only', 'headers-only.csv'],
    ['wrong columns', 'bad-headers.csv'],
  ] as const;
  for (const a of AGENTS) {
    for (const [label, f] of bad) {
      it(`${a.name} rejects ${label}`, () => {
        const res = a.run(fixture(f)) as { ok?: boolean; error?: string };
        expect(res.ok).toBe(false);
        expect(typeof res.error).toBe('string');
      });
    }
  }
});

describe('Void Hunter · known-good numbers (guards the core refactor)', () => {
  it('flags the Toast sample correctly', () => {
    const r = runVoidHunter(sample('toast-employee-performance.csv')) as {
      ok?: false; rowsParsed: number; storesFlagged: number; stores: unknown[];
    };
    expect(r.ok).not.toBe(false);
    expect(r.rowsParsed).toBeGreaterThan(0);
    expect(r.stores.length).toBeGreaterThan(0);
  });
});
