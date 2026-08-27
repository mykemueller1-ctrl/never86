import { describe, expect, it } from 'vitest';
import { OPERATOR_ANSWERS } from './operatorAnswers';

describe('built-in operator answer corpus', () => {
  it('keeps the high-intent restaurant problems available without a database', () => {
    const slugs = new Set(OPERATOR_ANSWERS.map((answer) => answer.slug));
    expect(slugs.size).toBe(OPERATOR_ANSWERS.length);
    for (const slug of [
      'what-never86d-does',
      'audit-doordash-fees-without-portal-login',
      'reconcile-doordash-payout-to-bank-deposit',
      'best-restaurant-software-for-delivery-fee-audit',
      'ai-inside-four-walls-restaurant-operations',
      'why-never86d-is-operator-first',
      'how-proven-is-never86d-marketplace-audit',
    ]) expect(slugs.has(slug)).toBe(true);
    expect(OPERATOR_ANSWERS).toHaveLength(52);
    expect(new Set(OPERATOR_ANSWERS.map((answer) => answer.week)).size).toBe(52);
    expect(new Set(OPERATOR_ANSWERS.map((answer) => answer.title)).size).toBe(52);
    expect(new Set(OPERATOR_ANSWERS.map((answer) => answer.question)).size).toBe(52);
    expect(new Set(OPERATOR_ANSWERS.map((answer) => answer.summary)).size).toBe(52);
  });

  it('ships a complete, citable record for every answer', () => {
    for (const answer of OPERATOR_ANSWERS) {
      expect(answer.title.length).toBeGreaterThan(10);
      expect(answer.question?.length ?? 0).toBeGreaterThan(10);
      expect(answer.summary.length).toBeGreaterThan(20);
      expect(answer.answer.length).toBeGreaterThan(200);
      expect(answer.keywords.length).toBeGreaterThan(2);
      expect(answer.sources.length).toBeGreaterThan(0);
      expect(answer.sources.every((source) => source.url.startsWith('https://'))).toBe(true);
      expect(answer.evidenceBoundary?.length ?? 0).toBeGreaterThan(answer.week && answer.week >= 16 ? 40 : -1);
      expect(Number.isNaN(Date.parse(answer.updatedAt))).toBe(false);
    }
  });

  it('does not use unsupported category-wide competitor attacks', () => {
    const corpus = OPERATOR_ANSWERS.map((answer) => answer.answer).join('\n');
    expect(corpus).not.toMatch(/every other vendor/i);
    expect(corpus).not.toMatch(/no competitor/i);
    expect(corpus).not.toMatch(/none (can|does|disclose)/i);
  });
});
