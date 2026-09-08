import { readFileSync } from 'node:fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { NAG_TOAST_GT } from './nagToastGt';
import {
  isToastTrainingCorpusOnly,
  NAG_TOAST_SCORE_BOX,
  TOAST_TRAINING_CORPUS_BOX,
} from './trainingCorpus';
import { answerToastDeskQuestion, collectToastFacts, parseToastReport, toastSourceTags } from '@/lib/toastParse';

function load(name: string): string {
  return readFileSync(path.join(process.cwd(), 'tests/fixtures/toast', name), 'utf8');
}

function bytes(name: string): Uint8Array {
  return new TextEncoder().encode(load(name));
}

const TRAINING_LABOR = 'training-shape-LaborBreakDown.csv';
const TRAINING_SALES = 'training-shape-SalesSummary.csv';
const TRAINING_ITEMS = 'training-shape-ItemSelectionDetails.csv';
const NAG_LABOR = 'LaborBreakDown_2026-08-31.csv';
const NAG_SALES = 'SalesSummary_2026-08-31.csv';
const NAG_WEEK = 'SalesSummary_2026-08-24_2026-08-30.csv';
const NAG_ITEMS = 'ItemSelectionDetails.csv';

/** Shape-only fake $ — not NAG GT, not a live Taco Bomba/Bamba pull. */
const SHAPE_ONLY = {
  laborCost: 44444.44,
  netSales: 99999.01,
  voidLines: 7,
} as const;

describe('Toast training corpus hold-off', () => {
  it('names the box paths and does not treat them as NAG score', () => {
    expect(TOAST_TRAINING_CORPUS_BOX).toBe('missions/kristin-nag/related-not-nag-tacobamba');
    expect(NAG_TOAST_SCORE_BOX).toBe('missions/kristin-nag/breaktest/GROUND-TRUTH-Qs-1-8-10-11.md');
    expect(isToastTrainingCorpusOnly(`${TOAST_TRAINING_CORPUS_BOX}/SalesSummary.xlsx`)).toBe(true);
    expect(isToastTrainingCorpusOnly('LaborBreakDown_2026-08-31.csv')).toBe(false);
    expect(isToastTrainingCorpusOnly('Unit A')).toBe(false);
  });

  it('parses the training shape but marks corpus=training', () => {
    const pack = parseToastReport(load(TRAINING_LABOR), TRAINING_LABOR);
    expect(pack?.corpus).toBe('training');
    expect(pack?.location).toMatch(/Taco Bomba/);
    expect(pack?.laborCost).toBe(SHAPE_ONLY.laborCost);
    expect(pack?.laborCost).not.toBe(NAG_TOAST_GT.laborCost);
  });

  it('keeps NAG Q1/Q8/Q10 when a training file sits on the same seat', () => {
    const facts = collectToastFacts([
      { filename: NAG_LABOR, sourceTags: toastSourceTags(NAG_LABOR, bytes(NAG_LABOR)) },
      { filename: NAG_SALES, sourceTags: toastSourceTags(NAG_SALES, bytes(NAG_SALES)) },
      { filename: NAG_WEEK, sourceTags: toastSourceTags(NAG_WEEK, bytes(NAG_WEEK)) },
      { filename: NAG_ITEMS, sourceTags: toastSourceTags(NAG_ITEMS, bytes(NAG_ITEMS)) },
      { filename: TRAINING_LABOR, sourceTags: toastSourceTags(TRAINING_LABOR, bytes(TRAINING_LABOR)) },
      { filename: TRAINING_SALES, sourceTags: toastSourceTags(TRAINING_SALES, bytes(TRAINING_SALES)) },
      { filename: TRAINING_ITEMS, sourceTags: toastSourceTags(TRAINING_ITEMS, bytes(TRAINING_ITEMS)) },
    ]);
    expect(facts.heldOffTraining).toBe(true);
    expect(facts.labor?.laborCost).toBe(NAG_TOAST_GT.laborCost);
    expect(facts.packs.every((p) => p.corpus !== 'training')).toBe(true);

    const q1 = answerToastDeskQuestion('What was labor cost and labor % Aug 31?', facts);
    const q8 = answerToastDeskQuestion('What were net sales Aug 31 and Aug 24-30? Strongest day?', facts);
    const q10 = answerToastDeskQuestion('What were voids Aug 24-30?', facts);
    const joined = [q1, q8, q10].map((row) => row?.facts.join('\n') ?? '').join('\n');
    expect(q1?.verifiedClose).toBe(true);
    expect(joined).toMatch(/1,211\.85/);
    expect(joined).toMatch(/3,408\.15/);
    expect(joined).toMatch(/36,827\.34/);
    expect(joined).toMatch(/24 void lines|Void\?=true → 24/);
    expect(joined).not.toMatch(/44,444\.44/);
    expect(joined).not.toMatch(/99,999\.01/);
    expect(joined).not.toMatch(/125,273\.41/);
    expect(joined).not.toMatch(/Training Taco/);
  });

  it('training-only on a NAG seat stays Missing — no shape $ into Q1/Q8/Q10', () => {
    const facts = collectToastFacts([
      {
        filename: `missions/kristin-nag/related-not-nag-tacobamba/${TRAINING_LABOR}`,
        sourceTags: toastSourceTags(TRAINING_LABOR, bytes(TRAINING_LABOR)),
      },
      { filename: TRAINING_SALES, sourceTags: toastSourceTags(TRAINING_SALES, bytes(TRAINING_SALES)) },
      { filename: TRAINING_ITEMS, sourceTags: toastSourceTags(TRAINING_ITEMS, bytes(TRAINING_ITEMS)) },
    ]);
    expect(facts.heldOffTraining).toBe(true);
    expect(facts.labor).toBeNull();
    expect(facts.packs).toEqual([]);

    const q1 = answerToastDeskQuestion('What was labor cost and labor % Aug 31?', facts);
    const q8 = answerToastDeskQuestion('What were net sales Aug 31 and Aug 24-30? Strongest day?', facts);
    const q10 = answerToastDeskQuestion('What were voids Aug 24-30?', facts);
    const joined = [q1, q8, q10].map((row) => `${row?.headline}\n${row?.facts.join('\n')}`).join('\n');
    expect(q1?.verifiedClose).toBe(false);
    expect(q8?.verifiedClose).toBe(false);
    expect(q10?.verifiedClose).toBe(false);
    expect(joined).toMatch(/Missing/);
    expect(joined).toMatch(/not used for NAG answers/);
    expect(joined).not.toMatch(/44,444\.44/);
    expect(joined).not.toMatch(/99,999\.01/);
    expect(joined).not.toMatch(/\$50\.00/);
    expect(joined).not.toMatch(/125,273\.41/);
  });
});
