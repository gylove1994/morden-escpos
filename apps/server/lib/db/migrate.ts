/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { SERVER_CONFIG } from '../config';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(moduleDir, '../../drizzle');

export async function runMigrations(): Promise<void> {
  const migrationSql = postgres(SERVER_CONFIG.DATABASE_URL, { max: 1 });
  const migrationDb = drizzle(migrationSql);

  try {
    await migrate(migrationDb, { migrationsFolder });
  }
  finally {
    await migrationSql.end({ timeout: 5 });
  }
}
