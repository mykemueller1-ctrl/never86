import { afterEach, describe, expect, it } from 'vitest';
import { GET } from './route';

const prior = process.env.OPENAI_APPS_CHALLENGE;

afterEach(() => {
  if (prior === undefined) delete process.env.OPENAI_APPS_CHALLENGE;
  else process.env.OPENAI_APPS_CHALLENGE = prior;
});

describe('OpenAI domain challenge', () => {
  it('fails closed before a publisher token is configured', async () => {
    delete process.env.OPENAI_APPS_CHALLENGE;
    const response = await GET();
    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('returns the exact configured token as plain text', async () => {
    process.env.OPENAI_APPS_CHALLENGE = 'openai-domain-token';
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('openai-domain-token');
    expect(response.headers.get('content-type')).toContain('text/plain');
  });
});
