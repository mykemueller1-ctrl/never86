import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as statusGet } from '../app/api/papers/status/route';
import { POST as startPost } from '../app/api/papers/google/start/route';
import { GET as invoicesGet, POST as invoicesPost } from '../app/api/papers/invoices/route';
import { POST as foldersPost } from '../app/api/papers/folders/route';
import { POST as pullPost } from '../app/api/papers/pull/route';

function req(path: string, method = 'GET'): NextRequest {
  return new NextRequest(`http://localhost${path}`, { method });
}

async function withoutGoogleSecrets<T>(fn: () => Promise<T>): Promise<T> {
  const prevId = process.env.GOOGLE_CLIENT_ID;
  const prevSecret = process.env.GOOGLE_CLIENT_SECRET;
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
  try {
    return await fn();
  } finally {
    if (prevId === undefined) delete process.env.GOOGLE_CLIENT_ID;
    else process.env.GOOGLE_CLIENT_ID = prevId;
    if (prevSecret === undefined) delete process.env.GOOGLE_CLIENT_SECRET;
    else process.env.GOOGLE_CLIENT_SECRET = prevSecret;
  }
}

describe('papers HTTP fail-closed', () => {
  it('names GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on status and every 503', async () => {
    await withoutGoogleSecrets(async () => {
      const status = await statusGet(req('/api/papers/status'));
      const statusBody = await status.json() as {
        ready: boolean;
        honesty: string;
        missingSecrets: string[];
        requiredEnv: string[];
        envChecklist: Array<{ name: string; required: boolean; present: boolean }>;
      };
      expect(status.status).toBe(200);
      expect(statusBody.ready).toBe(false);
      expect(statusBody.honesty).toBe('Missing');
      expect(statusBody.requiredEnv).toEqual(['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']);
      expect(statusBody.missingSecrets).toEqual(['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']);
      expect(statusBody.envChecklist.filter((row) => row.required).every((row) => row.present === false)).toBe(true);
      expect(JSON.stringify(statusBody)).not.toMatch(/GOCSPX|secret-value/i);

      for (const res of [
        await startPost(req('/api/papers/google/start', 'POST')),
        await invoicesGet(req('/api/papers/invoices')),
        await invoicesPost(req('/api/papers/invoices', 'POST')),
        await foldersPost(req('/api/papers/folders', 'POST')),
        await pullPost(req('/api/papers/pull', 'POST')),
      ]) {
        const body = await res.json() as {
          success: boolean;
          honesty: string;
          code: string;
          requiredEnv: string[];
          missingSecrets: string[];
        };
        expect(res.status).toBe(503);
        expect(body.success).toBe(false);
        expect(body.honesty).toBe('Missing');
        expect(body.code).toBe('papers_google_closed');
        expect(body.requiredEnv).toEqual(['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']);
        expect(body.missingSecrets).toEqual(['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']);
      }
    });
  });
});
