import { describe, expect, it } from 'vitest';
import { STAFF_ROLE_DAY_POLICIES } from './staffRoleDayPack';
import {
  STAFF_WORKER_ASK_HITS,
  STAFF_WORKER_ASK_PROMPTS,
  answerStaffWorkerAsk,
  findStaffWorkerAskPrivacyHits,
} from './staffWorkerAskPack';

describe('staff worker Ask pack', () => {
  it('answers Community Special, what can I wear, and pour spec from sourced extracts', () => {
    const special = answerStaffWorkerAsk('What is the Community Special?');
    expect(special.ok).toBe(true);
    if (special.ok) {
      expect(special.source).toBe('menu_specials');
      expect(special.answer).toMatch(/posted specialty pizza/i);
      expect(special.answer).not.toMatch(/\$\d/);
      expect(special.inventedDollars).toBe(false);
    }

    const wear = answerStaffWorkerAsk('What can I wear?');
    expect(wear.ok).toBe(true);
    if (wear.ok) {
      expect(wear.source).toBe('dress_sop');
      expect(wear.answer).toMatch(/CTap shirt/i);
      expect(wear.answer).toMatch(/Headphones are not permitted/i);
      expect(wear.answer).toMatch(/game-day apparel/i);
    }

    const pour = answerStaffWorkerAsk('What is the pour spec?');
    expect(pour.ok).toBe(true);
    if (pour.ok) {
      expect(pour.source).toBe('pour_spec');
      expect(pour.answer).toContain('Mixed drinks go in the pilsner');
      expect(pour.answer).toContain('Shot is 1.5 oz');
      expect(pour.answer).toContain('Wine pour is 5 oz');
    }
    expect(STAFF_WORKER_ASK_PROMPTS).toEqual(['Community Special', 'What can I wear?', 'Pour spec']);
  });

  it('answers waitress quiz days and refuses invented dollars', () => {
    const quiz = answerStaffWorkerAsk('waitress quiz day 3 written test 80 percent');
    expect(quiz.ok).toBe(true);
    if (quiz.ok) {
      expect(quiz.source).toBe('waitress_quiz');
      expect(quiz.answer).toMatch(/80%/);
    }

    const specials = answerStaffWorkerAsk('How do I ring the weekly specials and fish fry?');
    expect(specials.ok).toBe(true);
    if (specials.ok) {
      expect(specials.answer).toMatch(/wing specials/i);
      expect(specials.answer).not.toMatch(/\$\d/);
    }

    const dollars = answerStaffWorkerAsk('How much is the Community Special?');
    expect(dollars.ok).toBe(false);
    if (!dollars.ok) {
      expect(dollars.cannotAnswer).toBe(true);
      expect(dollars.reason).toMatch(/does not invent dollars/i);
    }
  });

  it('cannot-answers unknown questions and keeps pour spec aligned to the desk policy', () => {
    const unknown = answerStaffWorkerAsk('What is tonight\'s drawer count?');
    expect(unknown.ok).toBe(false);
    if (!unknown.ok) {
      expect(unknown.needed).toMatch(/does not invent dollars, counting, or recipes/i);
    }
    const pourPolicy = STAFF_ROLE_DAY_POLICIES.find((policy) => policy.id === 'pour-spec');
    const pour = answerStaffWorkerAsk('pilsner shot wine pour');
    expect(pour.ok).toBe(true);
    if (pour.ok) {
      expect(pour.answer).toContain(pourPolicy?.rules[0] ?? 'missing');
    }
  });

  it('keeps Karlee, Ashley, emails, PINs, and weekly-dollar bonuses out of the Ask pack', () => {
    expect(findStaffWorkerAskPrivacyHits(STAFF_WORKER_ASK_HITS)).toEqual([]);
    expect(findStaffWorkerAskPrivacyHits(STAFF_WORKER_ASK_HITS.map((hit) => answerStaffWorkerAsk(hit.prompts[0])))).toEqual([]);
    const blob = JSON.stringify(STAFF_WORKER_ASK_HITS);
    expect(blob).not.toMatch(/karlee|sturtz|ashley|holding/i);
    expect(blob).not.toMatch(/@/);
    expect(blob).not.toMatch(/\bPIN\b/i);
    expect(blob).not.toMatch(/\$\d/);
  });
});
