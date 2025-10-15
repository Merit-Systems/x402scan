import 'server-only';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { env } from '@/env';

neonConfig.webSocketConstructor = ws;

export const indexerDb = new Pool({
  connectionString: env.INDEXER_DB_URL,
});

export async function queryIndexerDb<T>(query: string, params: unknown[] = []): Promise<T[]> {
    const result = await indexerDb.query(query, params);
    return result.rows as T[];
}