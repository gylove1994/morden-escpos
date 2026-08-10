/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { BootedServer } from './harness';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { auth } from '../lib/auth';
import { SERVER_CONFIG } from '../lib/config';
import {
  authOriginHeaders,
  createOrganization,
  mergeCookies,
  signIn,
  signUp,
} from './auth-helpers';
import { bootServer } from './harness';

describe('suspended vs forbidden console experiences', () => {
  let booted: BootedServer;
  const suffix = Date.now().toString(36);
  const adminSecret = SERVER_CONFIG.PLATFORM_ADMIN_SECRET!;

  beforeAll(async () => {
    booted = await bootServer({ port: 0 });
  }, 120_000);

  afterAll(async () => {
    await booted?.close();
  });

  it('distinguishes Organization suspension from RBAC forbidden', async () => {
    const ownerEmail = `susp-owner-${suffix}@example.com`;
    const memberEmail = `susp-member-${suffix}@example.com`;
    const password = 'correct-horse-battery';

    const owner = await signUp(booted.baseUrl, {
      name: 'Susp Owner',
      email: ownerEmail,
      password,
    });
    expect(owner.response.status).toBeLessThan(300);

    const org = await createOrganization(booted.baseUrl, owner.cookie, {
      name: `Susp Org ${suffix}`,
      slug: `susp-org-${suffix}`,
    });
    expect(org.response.status).toBeLessThan(300);
    const orgJson = await org.response.json() as { id: string };
    const ownerCookie = mergeCookies(owner.cookie, org.response);

    const member = await signUp(booted.baseUrl, {
      name: 'Susp Member',
      email: memberEmail,
      password,
    });
    expect(member.response.status).toBeLessThan(300);
    const memberJson = await member.response.json() as { user: { id: string } };

    await auth.api.addMember({
      body: {
        organizationId: orgJson.id,
        userId: memberJson.user.id,
        role: 'member',
      },
    });

    const memberSignIn = await signIn(booted.baseUrl, {
      email: memberEmail,
      password,
    });
    expect(memberSignIn.response.status).toBeLessThan(300);
    const setActive = await fetch(`${booted.baseUrl}/api/auth/organization/set-active`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: memberSignIn.cookie }),
      body: JSON.stringify({ organizationId: orgJson.id }),
    });
    expect(setActive.status).toBeLessThan(300);
    const memberCookie = mergeCookies(memberSignIn.cookie, setActive);

    const forbidden = await fetch(`${booted.baseUrl}/api/console/org-settings`, {
      method: 'PATCH',
      headers: authOriginHeaders({ Cookie: memberCookie }),
      body: JSON.stringify({ name: 'Nope' }),
    });
    expect(forbidden.status).toBe(403);
    const forbiddenBody = await forbidden.json() as { error: string };
    expect(forbiddenBody.error).toBe('forbidden');

    const forbiddenPage = await fetch(`${booted.baseUrl}/console/forbidden`, {
      headers: { Cookie: memberCookie },
    });
    expect(forbiddenPage.status).toBe(200);
    const forbiddenHtml = await forbiddenPage.text();
    expect(forbiddenHtml).toContain('data-experience="rbac-forbidden"');
    expect(forbiddenHtml).not.toContain('data-experience="organization-suspended"');

    const suspend = await fetch(
      `${booted.baseUrl}/api/platform/organizations/${orgJson.id}/status`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${adminSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'suspended' }),
      },
    );
    expect(suspend.status).toBeLessThan(300);

    const inactive = await fetch(`${booted.baseUrl}/api/console/org-settings`, {
      method: 'PATCH',
      headers: authOriginHeaders({ Cookie: ownerCookie }),
      body: JSON.stringify({ name: 'Still Nope' }),
    });
    expect(inactive.status).toBe(403);
    const inactiveBody = await inactive.json() as { error: string, status: string };
    expect(inactiveBody.error).toBe('organization_inactive');
    expect(inactiveBody.status).toBe('suspended');

    const consoleRedirect = await fetch(`${booted.baseUrl}/console`, {
      redirect: 'manual',
      headers: { Cookie: ownerCookie },
    });
    expect([302, 303, 307, 308]).toContain(consoleRedirect.status);
    const location = consoleRedirect.headers.get('location');
    expect(location).toBeTruthy();
    expect(new URL(location!, booted.baseUrl).pathname).toBe('/console/suspended');

    const suspendedPage = await fetch(`${booted.baseUrl}/console/suspended?status=suspended`, {
      headers: { Cookie: ownerCookie },
    });
    expect(suspendedPage.status).toBe(200);
    const suspendedHtml = await suspendedPage.text();
    expect(suspendedHtml).toContain('data-experience="organization-suspended"');
    expect(suspendedHtml).toContain('data-status="suspended"');
    expect(suspendedHtml).not.toContain('data-experience="rbac-forbidden"');
  });
});
