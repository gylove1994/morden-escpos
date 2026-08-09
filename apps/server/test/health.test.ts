import type { BootedServer } from './harness';
/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GET as healthGet } from '../app/api/health/route';
import { GET as openApiGet } from '../app/api/protocol/openapi/route';
import { bootServer } from './harness';

describe('saas server scaffold', () => {
  let booted: BootedServer;

  beforeAll(async () => {
    booted = await bootServer({ port: 0 });
  }, 120_000);

  afterAll(async () => {
    await booted.close();
  });

  it('boots and serves a successful health check against Postgres', async () => {
    const response = await fetch(`${booted.baseUrl}/api/health`);
    expect(response.status).toBe(200);

    const body = await response.json() as {
      status: string
      edition: string
      database: string
    };

    expect(body).toEqual({
      status: 'ok',
      edition: 'cloud',
      database: 'up',
    });
  });

  it('exposes the Print Queue Agent Protocol OpenAPI skeleton', async () => {
    const response = await fetch(`${booted.baseUrl}/api/protocol/openapi`);
    expect(response.status).toBe(200);

    const body = await response.text();
    expect(body).toContain('Print Queue Agent Protocol');
    expect(body).toContain('printer-agents/heartbeat');
    expect(response.headers.get('x-morden-protocol-contract')).toBe(
      'contracts/print-queue-agent-protocol.openapi.yaml',
    );
  });

  it('keeps route handlers callable for future protocol tests', async () => {
    const health = await healthGet();
    expect(health.status).toBe(200);

    const openapi = await openApiGet();
    expect(openapi.status).toBe(200);
  });
});
