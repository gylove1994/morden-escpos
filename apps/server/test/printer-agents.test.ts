/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { BootedServer } from './harness';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { auth } from '../lib/auth';
import { db } from '../lib/db';
import { printerAgent } from '../lib/db/schema';
import { hashDeviceToken } from '../lib/device-token';
import {
  authOriginHeaders,
  createOrganization,
  mergeCookies,
  signIn,
  signUp,
} from './auth-helpers';
import { bootServer } from './harness';

async function protocolHeartbeat(baseUrl: string, token: string | null) {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(`${baseUrl}/api/protocol/v1/printer-agents/heartbeat`, {
    method: 'POST',
    headers,
  });
}

describe('printer Agent registration and device token lifecycle', () => {
  let booted: BootedServer;
  const suffix = Date.now().toString(36);

  beforeAll(async () => {
    booted = await bootServer({ port: 0 });
  }, 120_000);

  afterAll(async () => {
    await booted.close();
  });

  it('creates a Printer Agent, shows token once, stores hash, and authenticates protocol', async () => {
    const email = `agent-owner-${suffix}@example.com`;
    const password = 'correct-horse-battery';

    const signedUp = await signUp(booted.baseUrl, {
      name: 'Agent Owner',
      email,
      password,
    });
    expect(signedUp.response.status).toBeLessThan(300);

    const org = await createOrganization(booted.baseUrl, signedUp.cookie, {
      name: `Agents Org ${suffix}`,
      slug: `agents-org-${suffix}`,
    });
    expect(org.response.status).toBeLessThan(300);

    const createResponse = await fetch(`${booted.baseUrl}/api/console/printer-agents`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: org.cookie }),
      body: JSON.stringify({ name: 'Front desk' }),
    });
    expect(createResponse.status).toBe(201);

    const created = await createResponse.json() as {
      printerAgent: { id: string, name: string, status: string, deviceTokenPrefix: string }
      deviceToken: string
      deviceTokenShownOnce: boolean
    };
    expect(created.deviceTokenShownOnce).toBe(true);
    expect(created.deviceToken.startsWith('pa_')).toBe(true);
    expect(created.printerAgent.name).toBe('Front desk');
    expect(created.printerAgent.status).toBe('active');
    expect(created.printerAgent.deviceTokenPrefix).toBe(created.deviceToken.slice(0, 10));

    const rows = await db
      .select()
      .from(printerAgent)
      .where(eq(printerAgent.id, created.printerAgent.id))
      .limit(1);
    expect(rows[0]?.deviceTokenHash).toBe(hashDeviceToken(created.deviceToken));
    expect(rows[0]?.deviceTokenHash).not.toBe(created.deviceToken);

    const listResponse = await fetch(`${booted.baseUrl}/api/console/printer-agents`, {
      headers: { Cookie: org.cookie },
    });
    expect(listResponse.status).toBe(200);
    const listBody = await listResponse.json() as {
      printerAgents: Array<{ id: string, deviceToken?: string }>
    };
    expect(listBody.printerAgents.some(a => a.id === created.printerAgent.id)).toBe(true);
    expect(listBody.printerAgents[0]).not.toHaveProperty('deviceToken');

    const okHeartbeat = await protocolHeartbeat(booted.baseUrl, created.deviceToken);
    expect(okHeartbeat.status).toBe(200);
    const heartbeatBody = await okHeartbeat.json() as {
      status: string
      printerAgentId: string
    };
    expect(heartbeatBody.status).toBe('ok');
    expect(heartbeatBody.printerAgentId).toBe(created.printerAgent.id);
  });

  it('rejects invalid and revoked tokens; rotate invalidates the old token', async () => {
    const email = `agent-rotate-${suffix}@example.com`;
    const password = 'correct-horse-battery';

    const signedUp = await signUp(booted.baseUrl, {
      name: 'Rotate Owner',
      email,
      password,
    });
    const org = await createOrganization(booted.baseUrl, signedUp.cookie, {
      name: `Rotate Org ${suffix}`,
      slug: `rotate-org-${suffix}`,
    });
    expect(org.response.status).toBeLessThan(300);

    const missing = await protocolHeartbeat(booted.baseUrl, null);
    expect(missing.status).toBe(401);

    const invalid = await protocolHeartbeat(booted.baseUrl, 'pa_not-a-real-token-value');
    expect(invalid.status).toBe(401);

    const createResponse = await fetch(`${booted.baseUrl}/api/console/printer-agents`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: org.cookie }),
      body: JSON.stringify({ name: 'Warehouse' }),
    });
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json() as {
      printerAgent: { id: string }
      deviceToken: string
    };
    const firstToken = created.deviceToken;

    expect((await protocolHeartbeat(booted.baseUrl, firstToken)).status).toBe(200);

    const rotateResponse = await fetch(
      `${booted.baseUrl}/api/console/printer-agents/${created.printerAgent.id}/rotate`,
      {
        method: 'POST',
        headers: authOriginHeaders({ Cookie: org.cookie }),
      },
    );
    expect(rotateResponse.status).toBe(200);
    const rotated = await rotateResponse.json() as {
      deviceToken: string
      printerAgent: { status: string }
    };
    expect(rotated.deviceToken).not.toBe(firstToken);
    expect(rotated.printerAgent.status).toBe('active');

    expect((await protocolHeartbeat(booted.baseUrl, firstToken)).status).toBe(401);
    expect((await protocolHeartbeat(booted.baseUrl, rotated.deviceToken)).status).toBe(200);

    const revokeResponse = await fetch(
      `${booted.baseUrl}/api/console/printer-agents/${created.printerAgent.id}/revoke`,
      {
        method: 'POST',
        headers: authOriginHeaders({ Cookie: org.cookie }),
      },
    );
    expect(revokeResponse.status).toBe(200);
    const revoked = await revokeResponse.json() as {
      printerAgent: { status: string }
    };
    expect(revoked.printerAgent.status).toBe('revoked');

    expect((await protocolHeartbeat(booted.baseUrl, rotated.deviceToken)).status).toBe(401);

    const hashedRows = await db
      .select()
      .from(printerAgent)
      .where(eq(printerAgent.id, created.printerAgent.id))
      .limit(1);
    expect(hashedRows[0]?.deviceTokenHash).toBeNull();
  });

  it('gates create/revoke/rotate to owner/admin; members may list', async () => {
    const ownerEmail = `agent-rbac-owner-${suffix}@example.com`;
    const memberEmail = `agent-rbac-member-${suffix}@example.com`;
    const password = 'correct-horse-battery';

    const ownerSignUp = await signUp(booted.baseUrl, {
      name: 'RBAC Agent Owner',
      email: ownerEmail,
      password,
    });
    const org = await createOrganization(booted.baseUrl, ownerSignUp.cookie, {
      name: `RBAC Agents ${suffix}`,
      slug: `rbac-agents-${suffix}`,
    });
    const orgJson = await org.response.json() as { id: string };

    const createAsOwner = await fetch(`${booted.baseUrl}/api/console/printer-agents`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: org.cookie }),
      body: JSON.stringify({ name: 'Kitchen' }),
    });
    expect(createAsOwner.status).toBe(201);
    const created = await createAsOwner.json() as { printerAgent: { id: string } };

    const memberSignUp = await signUp(booted.baseUrl, {
      name: 'RBAC Agent Member',
      email: memberEmail,
      password,
    });
    const memberJson = await memberSignUp.response.json() as { user: { id: string } };

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
    const setActive = await fetch(`${booted.baseUrl}/api/auth/organization/set-active`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: memberSignIn.cookie }),
      body: JSON.stringify({ organizationId: orgJson.id }),
    });
    expect(setActive.status).toBeLessThan(300);
    const memberCookie = mergeCookies(memberSignIn.cookie, setActive);

    const listAsMember = await fetch(`${booted.baseUrl}/api/console/printer-agents`, {
      headers: { Cookie: memberCookie },
    });
    expect(listAsMember.status).toBe(200);

    const createAsMember = await fetch(`${booted.baseUrl}/api/console/printer-agents`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: memberCookie }),
      body: JSON.stringify({ name: 'Should Fail' }),
    });
    expect(createAsMember.status).toBe(403);

    const revokeAsMember = await fetch(
      `${booted.baseUrl}/api/console/printer-agents/${created.printerAgent.id}/revoke`,
      {
        method: 'POST',
        headers: authOriginHeaders({ Cookie: memberCookie }),
      },
    );
    expect(revokeAsMember.status).toBe(403);

    const rotateAsMember = await fetch(
      `${booted.baseUrl}/api/console/printer-agents/${created.printerAgent.id}/rotate`,
      {
        method: 'POST',
        headers: authOriginHeaders({ Cookie: memberCookie }),
      },
    );
    expect(rotateAsMember.status).toBe(403);
  });
});
