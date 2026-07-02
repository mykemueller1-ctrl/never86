import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Lazy singleton. Building the Neon client at module load means a missing or
// mis-rotated DATABASE_URL throws the moment ANY route that imports `db` is
// evaluated — which on Next.js surfaces as a 500 on that route (and at build
// time can fail the whole deploy). Defer construction to first actual use so a
// bad env var becomes a caught, per-request error instead of a hard crash.
type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>;

let _client: DrizzleClient | null = null;

function getClient(): DrizzleClient {
  if (_client) return _client;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. The primary (Neon) database is unavailable — ' +
        'set DATABASE_URL in the environment.',
    );
  }
  _client = drizzle(neon(url), { schema });
  return _client;
}

// Proxy preserves every existing `db.insert(...)` / `db.update(...)` call site
// verbatim; the real client is created on first property access.
export const db: DrizzleClient = new Proxy({} as DrizzleClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client as object, prop, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
