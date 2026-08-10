/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { BootedServer } from './harness';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bootServer } from './harness';

describe('console shell plane guards', () => {
  let booted: BootedServer;

  beforeAll(async () => {
    booted = await bootServer({ port: 0 });
  }, 120_000);

  afterAll(async () => {
    await booted?.close();
  });

  it('sends unauthenticated visitors from protected console routes to the Login shell', async () => {
    const protectedResponse = await fetch(`${booted.baseUrl}/console`, {
      redirect: 'manual',
    });

    expect([302, 303, 307, 308]).toContain(protectedResponse.status);
    const location = protectedResponse.headers.get('location');
    expect(location).toBeTruthy();
    expect(new URL(location!, booted.baseUrl).pathname).toBe('/login');

    const loginResponse = await fetch(`${booted.baseUrl}/login`);
    expect(loginResponse.status).toBe(200);
    const html = await loginResponse.text();
    expect(html).toContain('data-shell="login"');
    expect(html).not.toContain('data-shell="onboarding"');
    expect(html).not.toContain('Forgot password?');
    expect(html).not.toContain('忘记密码？');
  });
});
