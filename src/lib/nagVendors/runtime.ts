import { persistHealth } from '@/lib/persistHealth';
import {
  createMemoryObjectStore,
  createNeonFallbackObjectStore,
  createR2ObjectStore,
  readR2Config,
} from '@/lib/simpleOwnerDemo/objectStore';
import { createNeonBlobWriter } from '@/lib/simpleOwnerDemo/repository';
import { createMemoryRepository, createNeonRepository } from './repository';
import { createNagVendorService, type NagVendorService } from './service';

let testOverride: NagVendorService | null = null;
let defaultService: ReturnType<typeof createDefaultNagVendorService> | null = null;

export function setNagVendorServiceForTests(service: NagVendorService | null): void {
  testOverride = service;
  if (service) defaultService = null;
}

export function createDefaultNagVendorService(
  env: Record<string, string | undefined> = process.env,
): NagVendorService | { ok: false; status: number; error: string; code: string } {
  const databaseUrl = env.DATABASE_URL?.trim();
  const r2 = readR2Config(env);

  if (env.SIMPLE_OWNER_DEMO_MEMORY === '1') {
    return createNagVendorService({
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
  return createNagVendorService({ repo, objects });
}

export function getNagVendorService(
  env: Record<string, string | undefined> = process.env,
): NagVendorService | { ok: false; status: number; error: string; code: string } {
  if (testOverride) return testOverride;
  if (!defaultService) {
    defaultService = createDefaultNagVendorService(env);
  }
  return defaultService;
}

export function isNagVendorServiceError(
  value: NagVendorService | { ok: false; status: number; error: string; code: string },
): value is { ok: false; status: number; error: string; code: string } {
  return 'ok' in value && value.ok === false;
}
