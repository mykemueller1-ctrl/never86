import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ActionShiftSampleCard } from '@/components/ActionShiftSampleCard';
import { ACTION_SHIFT_SWARM_PROMPT, GM_MORNING_LINES, googleOneTapEnabled } from './actionShiftSwarm';

describe('Action Shift sample card', () => {
  it('uses the exact GM text and sample math', () => {
    expect(GM_MORNING_LINES.join('\n')).toBe(
      "Cheese went from $48 to $56 a case.\nThat's 20¢ more on every pizza.\nWe sold 385 this week.\n$77 this week.\nCall the cheese guy or raise the price on the menu.\nReply when it's done.",
    );
    expect((56 - 48) / 40).toBeCloseTo(0.2);
    expect(Math.round(385 * 0.2)).toBe(77);
  });
  it('renders SAMPLE, Show the math, Send it, no Pulse, no auto-send', () => {
    const html = renderToStaticMarkup(createElement(ActionShiftSampleCard));
    expect(html).toContain('SAMPLE');
    expect(html).toContain('Show the math');
    expect(html).toContain('Send it');
    expect(html).toContain('First owner seat free, no card required, no POS connection to start.');
    expect(html).not.toMatch(/pulse/i);
    expect(html).not.toContain('Hand to Action Shift swarm');
  });
  it('locks the swarm prompt', () => {
    expect(ACTION_SHIFT_SWARM_PROMPT).toContain('Human always taps send.');
    expect(ACTION_SHIFT_SWARM_PROMPT).toContain('"Nothing else today."');
  });
  it('keeps Google one-tap behind a flag', () => {
    expect(googleOneTapEnabled({})).toBe(false);
    expect(googleOneTapEnabled({ NEXT_PUBLIC_ACTION_SHIFT_GOOGLE_ONE_TAP: '1', NEXT_PUBLIC_GOOGLE_CLIENT_ID: 'x' })).toBe(true);
  });
});
