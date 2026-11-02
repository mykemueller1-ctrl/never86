/**
 * Action Shift sample morning card + locked swarm hand-off prompt.
 * SAMPLE only. Never recovered money. Human always taps send.
 */
export const GM_MORNING_LINES = [
  'Cheese went from $48 to $56 a case.',
  "That's 20¢ more on every pizza.",
  'We sold 385 this week.',
  '$77 this week.',
  'Call the cheese guy or raise the price on the menu.',
  "Reply when it's done.",
] as const;

export const GM_SAMPLE_MATH = [
  '$56 − $48 = $8 a case',
  '$8 ÷ 40 pizzas a case (sample) = 20¢ a pizza',
  '385 × 20¢ = $77 this week',
  'SAMPLE math. Not money recovered. Not your store.',
] as const;

export const FREE_SEAT_COPY = 'First owner seat free, no card required, no POS connection to start.';

export const ACTION_SHIFT_SWARM_PROMPT =
  'You are the Action Shift proof swarm. Owner already got the one move. Verify the source. ' +
  "Return only the single next variance that changes tomorrow's dollars, in one plain sentence + one next action. " +
  'Never invent numbers. Food stays HOLD without same-day invoices AND a count. No dashboards. ' +
  'No schedule questions. Human always taps send. If nothing clear, say "Nothing else today."';

/** Google one-tap stays off until a client id is configured for this domain. */
export function googleOneTapEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.NEXT_PUBLIC_ACTION_SHIFT_GOOGLE_ONE_TAP === '1' && Boolean(env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim());
}
