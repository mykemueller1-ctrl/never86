/**
 * Toast-parse TRAINING corpus — shapes only. Off the NAG seat.
 *
 * Box (not in this git unless already committed):
 *   missions/kristin-nag/related-not-nag-tacobamba
 *
 * Those Taco Bomba / Taco Bamba Excel+Toast sheets teach parser
 * shapes. They must never become NAG Q1 / Q8 / Q10 / Q11 dollars.
 *
 * Score / ground truth for this PR stays the NAG seat file:
 *   missions/kristin-nag/breaktest/GROUND-TRUTH-Qs-1-8-10-11.md
 *
 * Do not hardcode those location numbers into NAG answers.
 * Big .xlsx sheets stay unparsed (zip bytes) and still hold off.
 */

export const TOAST_TRAINING_CORPUS_BOX =
  'missions/kristin-nag/related-not-nag-tacobamba' as const;

export const NAG_TOAST_SCORE_BOX =
  'missions/kristin-nag/breaktest/GROUND-TRUTH-Qs-1-8-10-11.md' as const;

const TRAINING_CORPUS_RE = /taco[\s._-]*bomb[a]|related[\s._-]*not[\s._-]*nag/i;

export function isToastTrainingCorpusOnly(haystack: string): boolean {
  return TRAINING_CORPUS_RE.test(haystack);
}
