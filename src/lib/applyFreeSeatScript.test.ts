import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('scripts/apply-free-seat.sh', () => {
  it('exits 2 when DATABASE_URL is missing', () => {
    const script = path.resolve('scripts/apply-free-seat.sh');
    try {
      const env = { ...process.env };
      delete env.DATABASE_URL;
      execFileSync('bash', [script], {
        env,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      throw new Error('expected exit 2');
    } catch (err: unknown) {
      const e = err as { status?: number; stderr?: string };
      expect(e.status).toBe(2);
      expect(String(e.stderr || '')).toMatch(/DATABASE_URL is missing/);
      expect(String(e.stderr || '')).not.toMatch(/postgres(ql)?:\/\//i);
    }
  });

  it('is the only apply path and never embeds a connection string', () => {
    const src = readFileSync(path.resolve('scripts/apply-free-seat.sh'), 'utf8');
    expect(src).toMatch(/Canonical path/);
    expect(src).toMatch(/do not add a second apply-free-seat-neon\.sh/);
    expect(src).not.toMatch(/postgresql:\/\//);
  });
});
