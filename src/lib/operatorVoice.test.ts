import { describe, expect, it } from 'vitest';
import { BANNED_PHRASES, getOperatorVoice } from './operatorVoice';

describe('operatorVoice', () => {
  it('exports banned SaaS-founder phrases', () => {
    expect(BANNED_PHRASES).toContain('AI-powered');
    expect(BANNED_PHRASES).toContain('game-changer');
    expect(BANNED_PHRASES.length).toBeGreaterThan(10);
  });

  it('defines Myke, marketing, and CTO seats', () => {
    const voice = getOperatorVoice();
    expect(voice.seats.myke.seat).toContain('Founder');
    expect(voice.seats.headOfMarketing.never).toContain('Vendor pitch');
    expect(voice.seats.cto.soundsLike[0]).toContain('Operators first');
    expect(voice.canonicalDoc).toBe('docs/company/OPERATOR_VOICE.md');
  });
});
