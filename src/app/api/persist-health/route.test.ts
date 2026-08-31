import { afterEach, describe, expect, it } from 'vitest';
import { GET } from './route';

const ORIGINAL_URL = process.env.DATABASE_URL;
const FAKE_URL = 'postgresql://factory.invalid:secret-must-never-leak@ep-xxx.invalid/never86';

afterEach(() => {
  if (ORIGINAL_URL === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = ORIGINAL_URL;
});

describe('GET /api/persist-health', () => {
  it('returns false when DATABASE_URL is missing', async () => {
    delete process.env.DATABASE_URL;
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual({ databaseUrlPresent: false });
    expect(Object.keys(body)).toEqual(['databaseUrlPresent']);
    expect(JSON.stringify(body)).not.toMatch(/postgres(ql)?:\/\//i);
  });

  it('returns true when DATABASE_URL is set and never echoes the value', async () => {
    process.env.DATABASE_URL = FAKE_URL;
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual({ databaseUrlPresent: true });
    expect(Object.keys(body)).toEqual(['databaseUrlPresent']);
    const raw = JSON.stringify(body);
    expect(raw).not.toContain(FAKE_URL);
    expect(raw).not.toContain('secret-must-never-leak');
    expect(raw).not.toMatch(/postgres(ql)?:\/\//i);
  });
});
