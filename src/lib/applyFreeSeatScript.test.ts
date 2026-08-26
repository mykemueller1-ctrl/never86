import { execFileSync } from 'node:child_process';
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
    }
  });
});
