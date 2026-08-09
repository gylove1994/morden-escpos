import type { BootedServer } from './harness';
/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { auth } from '../lib/auth';
import {
  authOriginHeaders,
  createOrganization,
  mergeCookies,
  signIn,
  signUp,
} from './auth-helpers';
import { bootServer } from './harness';

describe('human session auth and Organization RBAC', () => {
  let booted: BootedServer;
  const suffix = Date.now().toString(36);

  beforeAll(async () => {
    booted = await bootServer({ port: 0 });
  }, 120_000);

  afterAll(async () => {
    await booted.close();
  });

  it('rejects console session access without a human session cookie', async () => {
    const response = await fetch(`${booted.baseUrl}/api/console/session`);
    expect(response.status).toBe(401);

    const body = await response.json() as { error: string };
    expect(body.error).toBe('unauthorized');
  });

  it('signs up, creates an Organization as owner, and serves a session', async () => {
    const email = `owner-${suffix}@example.com`;
    const password = 'correct-horse-battery';

    const signedUp = await signUp(booted.baseUrl, {
      name: 'Owner User',
      email,
      password,
    });
    expect(signedUp.response.status).toBeLessThan(300);
    expect(signedUp.cookie.length).toBeGreaterThan(0);

    const created = await createOrganization(booted.baseUrl, signedUp.cookie, {
      name: `Org ${suffix}`,
      slug: `org-${suffix}`,
    });
    expect(created.response.status).toBeLessThan(300);

    const orgBody = await created.response.json() as {
      id?: string
      name?: string
      slug?: string
      members?: Array<{ role: string }>
    };
    expect(orgBody.name).toBe(`Org ${suffix}`);
    expect(orgBody.slug).toBe(`org-${suffix}`);
    expect(orgBody.members?.[0]?.role).toBe('owner');

    const sessionResponse = await fetch(`${booted.baseUrl}/api/console/session`, {
      headers: { Cookie: created.cookie },
    });
    expect(sessionResponse.status).toBe(200);

    const sessionBody = await sessionResponse.json() as {
      user: { email: string }
      organization: { slug: string } | null
      role: string | null
      authKind: string
    };
    expect(sessionBody.user.email).toBe(email);
    expect(sessionBody.organization?.slug).toBe(`org-${suffix}`);
    expect(sessionBody.role).toBe('owner');
    expect(sessionBody.authKind).toBe('human-session');

    const settingsResponse = await fetch(`${booted.baseUrl}/api/console/org-settings`, {
      method: 'PATCH',
      headers: authOriginHeaders({ Cookie: created.cookie }),
      body: JSON.stringify({ name: `Org ${suffix} Renamed` }),
    });
    expect(settingsResponse.status).toBe(200);
  });

  it('rejects invalid credentials and gates member role on org settings', async () => {
    const ownerEmail = `rbac-owner-${suffix}@example.com`;
    const memberEmail = `rbac-member-${suffix}@example.com`;
    const password = 'correct-horse-battery';

    const ownerSignUp = await signUp(booted.baseUrl, {
      name: 'RBAC Owner',
      email: ownerEmail,
      password,
    });
    expect(ownerSignUp.response.status).toBeLessThan(300);

    const org = await createOrganization(booted.baseUrl, ownerSignUp.cookie, {
      name: `RBAC Org ${suffix}`,
      slug: `rbac-org-${suffix}`,
    });
    expect(org.response.status).toBeLessThan(300);
    const orgJson = await org.response.json() as { id: string };

    const badSignIn = await signIn(booted.baseUrl, {
      email: ownerEmail,
      password: 'wrong-password-value',
    });
    expect(badSignIn.response.status).toBeGreaterThanOrEqual(400);

    const memberSignUp = await signUp(booted.baseUrl, {
      name: 'RBAC Member',
      email: memberEmail,
      password,
    });
    expect(memberSignUp.response.status).toBeLessThan(300);
    const memberJson = await memberSignUp.response.json() as { user: { id: string } };

    // Server-side membership grant (invitation email is out of scope for MVP).
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
      body: JSON.stringify({ name: 'Should Not Update' }),
    });
    expect(forbidden.status).toBe(403);

    const sessionAsMember = await fetch(`${booted.baseUrl}/api/console/session`, {
      headers: { Cookie: memberCookie },
    });
    expect(sessionAsMember.status).toBe(200);
    const sessionBody = await sessionAsMember.json() as { role: string | null };
    expect(sessionBody.role).toBe('member');
  });
});
