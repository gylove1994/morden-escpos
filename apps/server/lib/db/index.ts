/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { SERVER_CONFIG } from '../config';
import * as schema from './schema';

const globalForDb = globalThis as unknown as {
  postgresSql?: ReturnType<typeof postgres>
  db?: ReturnType<typeof drizzle<typeof schema>>
};

function createSql() {
  return postgres(SERVER_CONFIG.DATABASE_URL, {
    max: 5,
    prepare: false,
  });
}

export const sql = globalForDb.postgresSql ?? createSql();
export const db = globalForDb.db ?? drizzle(sql, { schema });

if (SERVER_CONFIG.NODE_ENV !== 'production') {
  globalForDb.postgresSql = sql;
  globalForDb.db = db;
}

export async function checkDatabaseConnectivity(): Promise<void> {
  await sql`select 1`;
}

export async function closeDatabase(): Promise<void> {
  await sql.end({ timeout: 5 });
  globalForDb.postgresSql = undefined;
  globalForDb.db = undefined;
}
