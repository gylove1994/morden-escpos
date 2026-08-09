/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import process from 'node:process';

const databaseUrl = 'postgres://morden:morden@127.0.0.1:5432/morden_escpos_test';
const baseUrl = 'http://127.0.0.1:43128';

// Vitest/Vite sets BASE_URL to the Vite `base` path (often "/"), which is not a
// valid absolute URL for SERVER_CONFIG. Always overwrite scaffold test env.
process.env.PORT = '43128';
process.env.BASE_URL = baseUrl;
process.env.LOG_LEVEL = 'info';
process.env.EDITION = 'cloud';
process.env.DATABASE_URL = databaseUrl;

// When the harness boots Next in dev mode, Next sets NODE_ENV=development and
// the config module reads APP_* keys — keep both shapes populated for tests.
process.env.APP_NODE_ENV = 'development';
process.env.APP_PORT = '43128';
process.env.APP_BASE_URL = baseUrl;
process.env.APP_LOG_LEVEL = 'info';
process.env.APP_EDITION = 'cloud';
process.env.APP_DATABASE_URL = databaseUrl;
