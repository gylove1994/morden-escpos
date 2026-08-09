/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SERVER_CONFIG } from '../lib/config';
import {
  authOriginHeaders,
  createOrganization,
  signUp,
} from './auth-helpers';
import type { BootedServer } from './harness';
import { bootServer } from './harness';

describe('cloud platform tenant ops', () => {
  let booted: BootedServer;
  const suffix = Date.now().toString(36);
  const adminSecret = SERVER_CONFIG.PLATFORM_ADMIN_SECRET!;

  beforeAll(async () => {
    booted = await bootServer({ port: 0 });
  }, 120_000);

  afterAll(async () => {
    await booted.close();
  });

  async function signUpWithOrg(label: string) {
    const email = `${label}-${suffix}@example.com`;
    const signedUp = await signUp(booted.baseUrl, {
      name: label,
      email,
      password: 'correct-horse-battery',
    });
    expect(signedUp.response.status).toBeLessThan(300);

    const org = await createOrganization(booted.baseUrl, signedUp.cookie, {
      name: `${label} Org ${suffix}`,
      slug: `${label}-org-${suffix}`,
    });
    expect(org.response.status).toBeLessThan(300);
    const orgJson = await org.response.json() as { id: string, slug: string };
    return {
      cookie: org.cookie,
      organizationId: orgJson.id,
      slug: orgJson.slug ?? `${label}-org-${suffix}`,
    };
  }

  it('looks up an Organization and bans/suspends it', async () => {
    const { cookie, organizationId, slug } = await signUpWithOrg('tenant');

    const unauthorized = await fetch(
      `${booted.baseUrl}/api/platform/organizations?q=${encodeURIComponent(slug)}`,
    );
    expect(unauthorized.status).toBe(401);

    const lookup = await fetch(
      `${booted.baseUrl}/api/platform/organizations?q=${encodeURIComponent(slug)}`,
      {
        headers: { Authorization: `Bearer ${adminSecret}` },
      },
    );
    expect(lookup.status).toBe(200);
    const lookupBody = await lookup.json() as {
      organizations: Array<{ id: string, slug: string, status: string }>
    };
    expect(lookupBody.organizations.some(o => o.id === organizationId)).toBe(true);
    expect(
      lookupBody.organizations.find(o => o.id === organizationId)?.status,
    ).toBe('active');

    const suspend = await fetch(
      `${booted.baseUrl}/api/platform/organizations/${organizationId}/status`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'suspended' }),
      },
    );
    expect(suspend.status).toBe(200);
    const suspendBody = await suspend.json() as {
      organization: { status: string }
    };
    expect(suspendBody.organization.status).toBe('suspended');

    const blocked = await fetch(`${booted.baseUrl}/api/console/printer-agents`, {
      method: 'POST',
      headers: {
        ...authOriginHeaders(cookie),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'should-block' }),
    });
    expect(blocked.status).toBe(403);
    const blockedBody = await blocked.json() as { error: string, status: string };
    expect(blockedBody.error).toBe('organization_inactive');
    expect(blockedBody.status).toBe('suspended');

    const ban = await fetch(
      `${booted.baseUrl}/api/platform/organizations/${organizationId}/status`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'banned' }),
      },
    );
    expect(ban.status).toBe(200);
    const banBody = await ban.json() as { organization: { status: string } };
    expect(banBody.organization.status).toBe('banned');

    const restore = await fetch(
      `${booted.baseUrl}/api/platform/organizations/${organizationId}/status`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'active' }),
      },
    );
    expect(restore.status).toBe(200);

    const allowed = await fetch(`${booted.baseUrl}/api/console/printer-agents`, {
      method: 'POST',
      headers: {
        ...authOriginHeaders(cookie),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'after-restore' }),
    });
    expect(allowed.status).toBe(201);
  });
});
