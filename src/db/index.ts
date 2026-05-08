import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

let dbInstance: NeonHttpDatabase<typeof schema> | null = null;

export function getDb() {
  if (dbInstance) return dbInstance;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }

  const sql = neon(databaseUrl);
  dbInstance = drizzle(sql, { schema });
  return dbInstance;
}
