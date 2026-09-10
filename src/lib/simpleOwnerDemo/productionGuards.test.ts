import { afterEach, describe, expect, it, vi } from 'vitest';
import { signDemoTenant, verifyDemoTenant } from './tenant';
import { createDefaultSimpleOwnerDemoService } from './runtime';
import { createSimpleOwnerDemoService } from './service';
import { createMemoryRepository } from './repository';
import { createMemoryObjectStore } from './objectStore';

afterEach(() => vi.unstubAllEnvs());
describe('production persistence and signing guards', () => {
  it('rejects a cookie signed with the public development fallback in production', async () => {
    for (const key of ['SIMPLE_OWNER_DEMO_SECRET', 'OPERATOR_SESSION_SECRET', 'REPORTS_PASSWORD', 'ADMIN_PASSWORD']) vi.stubEnv(key, '');
    vi.stubEnv('NODE_ENV', 'development');
    const token = await signDemoTenant('demo:fixture', Date.now());
    expect(token).toBeTruthy();
    vi.stubEnv('NODE_ENV', 'production');
    expect(await signDemoTenant('demo:fixture', Date.now())).toBeNull();
    expect(await verifyDemoTenant(token!, Date.now())).toBeNull();
  });
  it('allows explicitly configured signing in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SIMPLE_OWNER_DEMO_SECRET', 'test-only-explicit-signing-key');
    const token = await signDemoTenant('demo:fixture', Date.now());
    expect(await verifyDemoTenant(token!, Date.now())).toBe('demo:fixture');
  });
  it('cannot claim durable persistence using memory mode in production', () => {
    expect(createDefaultSimpleOwnerDemoService({ NODE_ENV: 'production', SIMPLE_OWNER_DEMO_MEMORY: '1' })).toMatchObject({ ok: false, status: 503 });
  });
  it('rejects oversized questions before database reads or writes', async () => {
    const repo = createMemoryRepository();
    const read = vi.spyOn(repo, 'listUploads');
    const service = createSimpleOwnerDemoService({ repo, objects: createMemoryObjectStore() });
    expect(await service.ask({ operatorId: 'demo:fixture', question: 'x'.repeat(8001) })).toMatchObject({ ok: false, status: 413 });
    expect(read).not.toHaveBeenCalled();
    expect(repo.asks).toHaveLength(0);
  });
});
