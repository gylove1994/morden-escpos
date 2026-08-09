/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { Server } from 'node:http';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import next from 'next';
import { closeDatabase } from '../lib/db';
import { runMigrations } from '../lib/db/migrate';

export interface BootedServer {
  baseUrl: string
  close: () => Promise<void>
}

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Boots the Next.js SaaS server against Postgres for protocol-level tests.
 * Applies Drizzle migrations before accepting traffic.
 */
export async function bootServer(options?: {
  port?: number
}): Promise<BootedServer> {
  await runMigrations();

  const listenPort = options?.port ?? 0;
  const app = next({
    dev: true,
    dir: serverRoot,
    hostname: '127.0.0.1',
  });

  await app.prepare();
  const handle = app.getRequestHandler();

  const server: Server = createServer((req, res) => {
    const requestUrl = req.url ?? '/';
    void handle(req, res, {
      pathname: requestUrl.split('?')[0] ?? '/',
      query: Object.fromEntries(new URL(requestUrl, 'http://127.0.0.1').searchParams),
      path: requestUrl,
      href: requestUrl,
      search: requestUrl.includes('?') ? requestUrl.slice(requestUrl.indexOf('?')) : null,
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(listenPort, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('Failed to bind SaaS server test harness');
  }

  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    baseUrl,
    async close() {
      await new Promise<void>((resolve, reject) => {
        server.close(error => (error ? reject(error) : resolve()));
      });
      await app.close();
      await closeDatabase();
    },
  };
}
