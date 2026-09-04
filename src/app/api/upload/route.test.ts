import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { createMemoryObjectStore } from '@/lib/simpleOwnerDemo/objectStore';
import { createMemoryRepository } from '@/lib/simpleOwnerDemo/repository';
import { createSimpleOwnerDemoService } from '@/lib/simpleOwnerDemo/service';
import { setSimpleOwnerDemoServiceForTests } from '@/lib/simpleOwnerDemo/runtime';
import { POST as uploadPost } from './route';
import { POST as askPost } from '../ask/route';
import { GET as readinessGet } from '../operator/readiness/route';

function installMemoryService() {
  const repo = createMemoryRepository();
  const objects = createMemoryObjectStore();
  const svc = createSimpleOwnerDemoService({ repo, objects });
  setSimpleOwnerDemoServiceForTests(svc);
  return { repo, objects };
}

beforeEach(() => {
  installMemoryService();
});

afterEach(() => {
  setSimpleOwnerDemoServiceForTests(null);
});

describe('POST /api/upload and POST /api/ask', () => {
  it('persists a file and a question on the same minted operator_id', async () => {
    const form = new FormData();
    form.set(
      'file',
      new File([new Uint8Array([1, 2, 3, 4])], 'Hourly_Sales_Report.pdf', { type: 'application/pdf' }),
    );
    const uploadRes = await uploadPost(
      new NextRequest('http://localhost/api/upload', { method: 'POST', body: form }),
    );
    const uploadBody = await uploadRes.json();
    expect(uploadRes.status).toBe(200);
    expect(uploadBody.success).toBe(true);
    expect(uploadBody.persisted).toBe(true);
    expect(uploadBody.storageBackend).toBe('memory');
    expect(uploadBody.objectKey).toMatch(/^simple-owner\//);
    expect(uploadBody.readiness.readyCount).toBe(1);

    const cookie = uploadRes.headers.get('set-cookie') ?? '';
    expect(cookie).toMatch(/n86_simple_owner=/);

    const askRes = await askPost(
      new NextRequest('http://localhost/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie.split(';')[0],
        },
        body: JSON.stringify({
          question: "What's going on with labor?",
          tray: 'labor',
          mouth: 'type',
        }),
      }),
    );
    const askBody = await askRes.json();
    expect(askRes.status).toBe(200);
    expect(askBody.success).toBe(true);
    expect(askBody.persisted).toBe(true);
    expect(askBody.operatorId).toBe(uploadBody.operatorId);
    expect(askBody.answer.facts.join(' ')).toMatch(/Hourly sales|Ready:/);
    expect(askBody.answer.verifiedClose).toBe(false);
    expect(Array.isArray(askBody.sourceTags)).toBe(true);

    const readyRes = await readinessGet(
      new NextRequest('http://localhost/api/operator/readiness', {
        headers: { Cookie: cookie.split(';')[0] },
      }),
    );
    const readyBody = await readyRes.json();
    expect(readyBody.readiness.uploadCount).toBe(1);
    expect(readyBody.readiness.askCount).toBe(1);
    expect(readyBody.readiness.evidence.find((row: { id: string }) => row.id === 'hourly')?.state).toBe(
      'READY',
    );
  });

  it('does not return a hardcoded local-phone answer', async () => {
    const res = await askPost(
      new NextRequest('http://localhost/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'invoice and food cost', tray: 'food', mouth: 'type' }),
      }),
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(JSON.stringify(body)).not.toMatch(/stays on this phone/i);
    expect(body.answer.facts.join(' ')).toMatch(/stored for operator_id/);
  });
});
