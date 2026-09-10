import { afterEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { createMemoryRepository } from '@/lib/simpleOwnerDemo/repository';
import { createMemoryObjectStore } from '@/lib/simpleOwnerDemo/objectStore';
import { createSimpleOwnerDemoService } from '@/lib/simpleOwnerDemo/service';
import { setSimpleOwnerDemoServiceForTests } from '@/lib/simpleOwnerDemo/runtime';

afterEach(() => setSimpleOwnerDemoServiceForTests(null));
function setup() {
  const repo = createMemoryRepository();
  setSimpleOwnerDemoServiceForTests(createSimpleOwnerDemoService({ repo, objects: createMemoryObjectStore() }));
  return repo;
}
describe('upload request limits', () => {
  it('stores a valid multipart upload through the bounded reader', async () => {
    const repo = setup();
    const form = new FormData();
    form.append('file', new File(['notes'], 'shift.txt', { type: 'text/plain' }));
    const response = await POST(new NextRequest('https://example.test/api/upload', { method: 'POST', body: form }));
    expect(response.status).toBe(200);
    expect(repo.uploads).toHaveLength(1);
  });
  it('rejects the whole oversized batch before any file is stored', async () => {
    const repo = setup();
    const form = new FormData();
    for (let i = 0; i < 13; i++) form.append('file', new File(['notes'], `shift-${i}.txt`));
    const response = await POST(new NextRequest('https://example.test/api/upload', { method: 'POST', body: form }));
    expect(response.status).toBe(413);
    expect(repo.uploads).toHaveLength(0);
  });
  it('rejects a declared excessive body without storing data', async () => {
    const repo = setup();
    const response = await POST(new NextRequest('https://example.test/api/upload', { method: 'POST', body: 'x', headers: { 'content-length': String(25 * 1024 * 1024) } }));
    expect(response.status).toBe(413);
    expect(repo.uploads).toHaveLength(0);
  });
});
