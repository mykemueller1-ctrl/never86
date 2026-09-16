import { describe, expect, it, vi } from 'vitest';
import { XAI_API_KEY_NAME, XAI_MODEL_DEFAULT } from './keysAccess';
import {
  GROK_SEAT_BOUNDARY,
  GROK_SEAT_ROLE,
  explainWithGrok,
  fallbackExplain,
  grokSeatStatus,
  grokSeatSystemPrompt,
} from './grokSeat';

const input = {
  fact: 'MZ-452 moved from $48.00 to $56.00 on the same 20 lb case.',
  nextMove: 'Check the new price with your rep.',
  claimBoundary: 'Fictional sample. Not recovered cash.',
};

describe('Grok path inside One Seat', () => {
  it('is explain-only and fail-closed without XAI_API_KEY', () => {
    expect(GROK_SEAT_ROLE).toBe('explain-only');
    expect(GROK_SEAT_BOUNDARY).toMatch(/must not invent dollars/);
    expect(grokSeatStatus({}).ready).toBe(false);
    if (grokSeatStatus({}).ready) return;
    expect(grokSeatStatus({}).reason).toBe('xai_key_missing');
    expect(grokSeatStatus({}).model).toBe(XAI_MODEL_DEFAULT);
  });

  it('does not invent dollars when the key is missing', async () => {
    const result = await explainWithGrok(input, {});
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('xai_key_missing');
    expect(result.error).toMatch(/XAI_API_KEY/);
    expect(fallbackExplain(input)).toContain(input.nextMove);
    expect(fallbackExplain(input)).toContain(input.claimBoundary);
  });

  it('calls xAI chat-completions when a key exists and never sends a secret in the prompt', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Same cheese. Higher price. Ask the rep. Not recovered cash.' } }] }),
    });
    const result = await explainWithGrok(input, { [XAI_API_KEY_NAME]: 'xai-test-key-not-real' }, fetchMock);
    expect(result).toEqual({
      ok: true,
      source: 'grok',
      model: XAI_MODEL_DEFAULT,
      text: 'Same cheese. Higher price. Ask the rep. Not recovered cash.',
    });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.x.ai/v1/chat/completions');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer xai-test-key-not-real');
    const body = JSON.parse(String(init.body));
    expect(body.model).toBe(XAI_MODEL_DEFAULT);
    expect(JSON.stringify(body)).not.toContain('xai-test-key-not-real');
    expect(grokSeatSystemPrompt()).toMatch(/Do not invent dollars/);
    expect(grokSeatSystemPrompt()).toMatch(/ChatGPT/);
  });
});
