import { persistHealth } from '@/lib/persistHealth';
import {
  createMemoryObjectStore,
  createNeonFallbackObjectStore,
  createR2ObjectStore,
  readR2Config,
} from './objectStore';
import { createMemoryRepository, createNeonBlobWriter, createNeonRepository } from './repository';
import { createSimpleOwnerDemoService, type SimpleOwnerDemoService } from './service';

let testOverride: SimpleOwnerDemoService | null = null;

export function setSimpleOwnerDemoServiceForTests(service: SimpleOwnerDemoService | null): void {
  testOverride = service;
}

export function createDefaultSimpleOwnerDemoService(
  env: Record<string, string | undefined> = process.env,
): SimpleOwnerDemoService | { ok: false; status: number; error: string; code: string } {
  const databaseUrl = env.DATABASE_URL?.trim();
  const r2 = readR2Config(env);

  if (env.SIMPLE_OWNER_DEMO_MEMORY === '1') {
    return createSimpleOwnerDemoService({
      repo: createMemoryRepository(),
      objects: createMemoryObjectStore(),
    });
  }

  if (!databaseUrl && !persistHealth(env).databaseUrlPresent) {
    return {
      ok: false,
      status: 503,
      error: 'Persist is not configured for this seat.',
      code: 'persist_unavailable',
    };
  }

  if (!databaseUrl) {
    return {
      ok: false,
      status: 503,
      error: 'Persist is not configured for this seat.',
      code: 'persist_unavailable',
    };
  }

  const repo = createNeonRepository(databaseUrl);
  const objects = r2
    ? createR2ObjectStore(r2)
    : createNeonFallbackObjectStore(createNeonBlobWriter(databaseUrl));
  return createSimpleOwnerDemoService({ repo, objects });
}

export function getSimpleOwnerDemoService(
  env: Record<string, string | undefined> = process.env,
): SimpleOwnerDemoService | { ok: false; status: number; error: string; code: string } {
  if (testOverride) return testOverride;
  return createDefaultSimpleOwnerDemoService(env);
}

export function isServiceError(
  value: SimpleOwnerDemoService | { ok: false; status: number; error: string; code: string },
): value is { ok: false; status: number; error: string; code: string } {
  return 'ok' in value && value.ok === false;
}
