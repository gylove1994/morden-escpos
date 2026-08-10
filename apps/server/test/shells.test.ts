/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { BootedServer } from './harness';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createOrganization,
  mergeCookies,
  signUp,
} from './auth-helpers';
import { bootServer } from './harness';

function expectRedirectTo(response: Response, baseUrl: string, pathname: string) {
  expect([302, 303, 307, 308]).toContain(response.status);
  const location = response.headers.get('location');
  expect(location).toBeTruthy();
  expect(new URL(location!, baseUrl).pathname).toBe(pathname);
}

describe('console shell plane guards', () => {
  let booted: BootedServer;
  const suffix = Date.now().toString(36);

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

    expectRedirectTo(protectedResponse, booted.baseUrl, '/login');

    const loginResponse = await fetch(`${booted.baseUrl}/login`);
    expect(loginResponse.status).toBe(200);
    const html = await loginResponse.text();
    expect(html).toContain('data-shell="login"');
    expect(html).not.toContain('data-shell="onboarding"');
    expect(html).not.toContain('Forgot password?');
    expect(html).not.toContain('忘记密码？');
  });

  it('confines zero-Organization operators to the onboarding shell', async () => {
    const email = `zero-org-${suffix}@example.com`;
    const password = 'correct-horse-battery';
    const signedUp = await signUp(booted.baseUrl, {
      name: 'Zero Org',
      email,
      password,
    });
    expect(signedUp.response.status).toBeLessThan(300);

    const overview = await fetch(`${booted.baseUrl}/console`, {
      redirect: 'manual',
      headers: { Cookie: signedUp.cookie },
    });
    expectRedirectTo(overview, booted.baseUrl, '/console/onboarding');

    const printers = await fetch(`${booted.baseUrl}/console/printers`, {
      redirect: 'manual',
      headers: { Cookie: signedUp.cookie },
    });
    expectRedirectTo(printers, booted.baseUrl, '/console/onboarding');

    const onboarding = await fetch(`${booted.baseUrl}/console/onboarding`, {
      headers: { Cookie: signedUp.cookie },
    });
    expect(onboarding.status).toBe(200);
    const html = await onboarding.text();
    expect(html).toContain('data-shell="onboarding"');
    expect(html).not.toContain('href="/console/printer-agents"');

    const legacyCreateOrg = await fetch(`${booted.baseUrl}/console/create-organization`, {
      redirect: 'manual',
      headers: { Cookie: signedUp.cookie },
    });
    expect(legacyCreateOrg.status).toBe(404);

    const created = await createOrganization(booted.baseUrl, signedUp.cookie, {
      name: `Onboarded ${suffix}`,
      slug: `onboarded-${suffix}`,
    });
    expect(created.response.status).toBeLessThan(300);
    const cookie = mergeCookies(signedUp.cookie, created.response);

    const business = await fetch(`${booted.baseUrl}/console`, {
      headers: { Cookie: cookie },
    });
    expect(business.status).toBe(200);
    const businessHtml = await business.text();
    expect(businessHtml).toContain('data-shell="business"');
    expect(businessHtml).not.toContain('data-shell="onboarding"');
    expect(businessHtml).toContain('data-testid="business-nav"');
    expect(businessHtml).toContain('data-testid="organization-switcher"');
    expect(businessHtml).toContain('data-nav="Overview"');
    expect(businessHtml).toContain('data-nav="Printer Agents"');
    expect(businessHtml).toContain('data-nav="Printers"');
    expect(businessHtml).toContain('data-nav="Printer Groups"');
    expect(businessHtml).toContain('data-nav="Templates"');
    expect(businessHtml).toContain('data-nav="Jobs"');
    expect(businessHtml).toContain('data-nav="Billing"');
    expect(businessHtml).not.toContain('data-nav="Platform"');
    expect(businessHtml).not.toMatch(/href="\/console\/platform"/);

    const platform = await fetch(`${booted.baseUrl}/console/platform`, {
      headers: { Cookie: cookie },
    });
    expect(platform.status).toBe(200);
    const platformHtml = await platform.text();
    expect(platformHtml).toContain('data-shell="platform"');
    expect(platformHtml).toContain('data-testid="platform-nav"');
    expect(platformHtml).not.toContain('data-testid="business-nav"');
  });
});
