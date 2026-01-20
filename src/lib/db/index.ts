import { drizzle } from 'drizzle-orm/neon-http';
import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import * as schema from './schema';

// Allow build to proceed without DATABASE_URL
const databaseUrl = process.env.DATABASE_URL || '';

let sql: NeonQueryFunction<false, false>;
try {
  sql = neon(databaseUrl);
} catch {
  // During build time, DATABASE_URL may not be set
  sql = (() => Promise.resolve([])) as unknown as NeonQueryFunction<false, false>;
}

export const db = drizzle(sql, { schema });

export * from './schema';
