import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';

// Provide env vars so module-level SDK constructors don't throw on import.
process.env.ANTHROPIC_API_KEY ??= 'test-anthropic-key';
process.env.RESEND_API_KEY ??= 'test-resend-key';
process.env.CRON_SECRET ??= 'test-cron-secret';
process.env.DATABASE_URL ??= 'postgresql://user:pass@localhost/testdb';
process.env.OWNER_EMAIL ??= 'owner@example.com';

afterEach(() => {
  vi.clearAllMocks();
});
