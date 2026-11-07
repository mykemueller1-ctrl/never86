import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';
import { rememberPapersToken, resetPapersTokenStore } from '@/lib/papersInboxHttp';
import { createMemoryObjectStore } from '@/lib/simpleOwnerDemo/objectStore';
import { createMemoryRepository } from '@/lib/simpleOwnerDemo/repository';
import { createSimpleOwnerDemoService } from '@/lib/simpleOwnerDemo/service';
import { setSimpleOwnerDemoServiceForTests } from '@/lib/simpleOwnerDemo/runtime';
import { OPERATOR_COOKIE, signOperatorSession } from '@/lib/operatorSession';

const envKeys = ['DATABASE_URL', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'OPERATOR_SESSION_SECRET'] as const;
const previousEnv: Partial<Record<(typeof envKeys)[number], string | undefined>> = {};

function request(cookie?: string): NextRequest {
  const headers = new Headers();
  if (cookie) headers.set('cookie', cookie);
  return new NextRequest('http://localhost/api/papers/status', { method: 'GET', headers });
}

async function seatCookie(operatorId: number): Promise<string> {
  const token = await signOperatorSession(operatorId, `seat${operatorId}@example.com`, Date.now());
  if (!token) throw new Error('test session was not signed');
  return `${OPERATOR_COOKIE}=${token}`;
}

describe('GET /api/papers/status for the owner page', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    for (const key of envKeys) previousEnv[key] = process.env[key];
    delete process.env.DATABASE_URL;
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
    process.env.OPERATOR_SESSION_SECRET = 'test-operator-session-secret';
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (/googleapis|google\.com|neon\.tech|amazonaws/i.test(url)) {
        throw new Error(`blocked outbound call ${url}`);
      }
      return new Response('not found', { status: 404 });
    });
    setSimpleOwnerDemoServiceForTests(createSimpleOwnerDemoService({
      repo: createMemoryRepository(),
      objects: createMemoryObjectStore(),
    }));
    resetPapersTokenStore();
    rememberPapersToken({
      operatorId: 'seat:11',
      accessToken: 'synthetic-access-token',
      refreshToken: null,
      email: null,
    });
  });

  afterAll(() => {
    fetchSpy?.mockRestore();
    setSimpleOwnerDemoServiceForTests(null);
    resetPapersTokenStore();
    for (const key of envKeys) {
      const value = previousEnv[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('returns JSON for the signed owner seat, not an HTML not-found page', async () => {
    const owner = await GET(request(await seatCookie(11)));
    const ownerText = await owner.text();
    const ownerBody = JSON.parse(ownerText) as {
      success: boolean;
      ready: boolean;
      honesty: string;
      connection: { gmail: boolean; drive: boolean; email: string | null };
      missingSecrets: string[];
    };
    expect(owner.status).toBe(200);
    expect(owner.headers.get('content-type')).toMatch(/application\/json/);
    expect(ownerText).not.toMatch(/This page could not be found/);
    expect(ownerBody.success).toBe(true);
    expect(ownerBody.ready).toBe(true);
    expect(ownerBody.honesty).toBe('Missing');
    expect(ownerBody.connection).toEqual({ gmail: true, drive: true, outlook: false, email: null });
    expect(ownerBody.missingSecrets).toEqual([]);
    expect(ownerText).not.toMatch(/synthetic-access-token|test-google-client-secret/);
    expect(fetchSpy).not.toHaveBeenCalled();

    const other = await GET(request(await seatCookie(22)));
    const otherBody = await other.json() as { connection: { gmail: boolean } };
    expect(other.status).toBe(200);
    expect(other.headers.get('content-type')).toMatch(/application\/json/);
    expect(otherBody.connection.gmail).toBe(false);

    const forged = await GET(request(`${OPERATOR_COOKIE}=not-a-token`));
    const forgedText = await forged.text();
    const forgedBody = JSON.parse(forgedText) as { success: boolean; connection: { gmail: boolean } };
    expect(forged.status).toBe(200);
    expect(forged.headers.get('content-type')).toMatch(/application\/json/);
    expect(forgedText).not.toMatch(/This page could not be found/);
    expect(forgedBody.success).toBe(true);
    expect(forgedBody.connection.gmail).toBe(false);
  });
});
