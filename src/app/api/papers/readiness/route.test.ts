import { afterEach, describe, expect, it } from 'vitest';
import { GET } from './route';

const KEYS = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'] as const;

describe('GET /api/papers/readiness', () => {
  const previous = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]));

  afterEach(() => {
    for (const key of KEYS) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  });

  it('fail-closes when Google secrets are unset and never echoes values', async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    const closed = await (await GET()).json();
    expect(closed.honesty).toBe('Missing');
    expect(closed.ready).toBe(false);
    expect(closed.missingSecrets).toEqual(['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']);
    expect(JSON.stringify(closed)).not.toMatch(/secret-value|GOCSPX/);

    process.env.GOOGLE_CLIENT_ID = 'secret-value-do-not-echo.apps.googleusercontent.com';
    process.env.GOOGLE_CLIENT_SECRET = 'GOCSPX-do-not-echo';
    const open = await (await GET()).json();
    expect(open.honesty).toBe('Estimated');
    expect(open.ready).toBe(true);
    expect(open.missingSecrets).toEqual([]);
    expect(JSON.stringify(open)).not.toMatch(/secret-value|GOCSPX/);
    expect(open.honesty).not.toBe('Verified');
  });
});
