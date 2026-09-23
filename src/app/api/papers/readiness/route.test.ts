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
    expect(open.honesty).toBe('Missing');
    expect(open.note).toMatch(/Papers stay Missing/);
    expect(open.note).toMatch(/not connected/);
    expect(open.connection).toEqual({ gmail: false, drive: false, outlook: false, email: null });
    expect(open.fileFirst).toBe(true);
    expect(open.lead).toEqual(['photo', 'pdf', 'chat']);
    expect(open.folders.map((folder: { name: string; honesty: string; status: string }) => (
      `${folder.name}:${folder.honesty}:${folder.status}`
    ))).toEqual([
      'Invoices:Missing:missing',
      'Z-EOD:Missing:missing',
      'Labor:Missing:missing',
      'Liquor-Beer:Missing:missing',
    ]);
    expect(JSON.stringify(open)).not.toMatch(/gmail":true|drive":true|Gmail \+ Drive connected/);
    expect(open.ready).toBe(true);
    expect(open.missingSecrets).toEqual([]);
    expect(JSON.stringify(open)).not.toMatch(/secret-value|GOCSPX/);
    expect(open.honesty).not.toBe('Verified');
  });
});
