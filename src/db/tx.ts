import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle, type NeonDatabase } from 'drizzle-orm/neon-serverless';
import { databaseUrlPresent } from '@/lib/persistHealth';
import * as schema from './schema';

// neon-http cannot BEGIN/COMMIT. Activation writes use a WebSocket pool
// so consume + operator/location/credential land in one transaction.
// Fail-closed when DATABASE_URL is missing. Never log the URL.

if (typeof WebSocket !== 'undefined') {
  neonConfig.webSocketConstructor = WebSocket;
}

type SeatTxDb = NeonDatabase<typeof schema>;

let _pool: Pool | null = null;
let _wsDb: SeatTxDb | null = null;

function getWsDb(): SeatTxDb {
  const url = process.env.DATABASE_URL?.trim();
  if (!url || !databaseUrlPresent()) {
    throw new Error(
      'DATABASE_URL is not set. The primary (Neon) database is unavailable — ' +
        'set DATABASE_URL in the environment.',
    );
  }
  if (!_wsDb) {
    _pool = new Pool({ connectionString: url });
    _wsDb = drizzle(_pool, { schema });
  }
  return _wsDb;
}

export async function withSeatTransaction<T>(fn: (tx: SeatTxDb) => Promise<T>): Promise<T> {
  return getWsDb().transaction(async (tx) => fn(tx as unknown as SeatTxDb));
}
