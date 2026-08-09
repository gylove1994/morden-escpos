/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { auth } from '../lib/auth';
import { signWebhookPayload } from '../lib/webhook-secret';
import {
  authOriginHeaders,
  createOrganization,
  mergeCookies,
  signIn,
  signUp,
} from './auth-helpers';
import type { BootedServer } from './harness';
import { bootServer } from './harness';

const ESC_POS_BYTES = Buffer.from([0x1b, 0x40, 0x48, 0x69, 0x0a]);
const ESC_POS_BASE64 = ESC_POS_BYTES.toString('base64');

describe('Integrator enqueue: API keys + webhook auth', () => {
  let booted: BootedServer;
  const suffix = Date.now().toString(36);

  beforeAll(async () => {
    booted = await bootServer({ port: 0 });
  }, 120_000);

  afterAll(async () => {
    await booted.close();
  });

  async function bootstrapOrg(label: string) {
    const email = `${label}-${suffix}@example.com`;
    const password = 'correct-horse-battery';
    const signedUp = await signUp(booted.baseUrl, {
      name: label,
      email,
      password,
    });
    expect(signedUp.response.status).toBeLessThan(300);

    const org = await createOrganization(booted.baseUrl, signedUp.cookie, {
      name: `${label} Org ${suffix}`,
      slug: `${label}-org-${suffix}`,
    });
    expect(org.response.status).toBeLessThan(300);
    const orgJson = await org.response.json() as { id: string };

    const agentResponse = await fetch(`${booted.baseUrl}/api/console/printer-agents`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: org.cookie }),
      body: JSON.stringify({ name: `${label} agent` }),
    });
    expect(agentResponse.status).toBe(201);
    const agentBody = await agentResponse.json() as {
      printerAgent: { id: string }
      deviceToken: string
    };

    const printerResponse = await fetch(`${booted.baseUrl}/api/console/printers`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: org.cookie }),
      body: JSON.stringify({
        printerAgentId: agentBody.printerAgent.id,
        name: `${label} printer`,
        connectionHints: {
          transport: 'tcp',
          address: '10.0.0.55',
          port: 9100,
        },
      }),
    });
    expect(printerResponse.status).toBe(201);
    const printerBody = await printerResponse.json() as {
      printer: { id: string }
    };

    return {
      cookie: org.cookie,
      organizationId: orgJson.id,
      deviceToken: agentBody.deviceToken,
      printerId: printerBody.printer.id,
      email,
      password,
    };
  }

  async function addMember(organizationId: string, label: string) {
    const email = `${label}-${suffix}@example.com`;
    const password = 'correct-horse-battery';
    const memberSignUp = await signUp(booted.baseUrl, {
      name: label,
      email,
      password,
    });
    const memberJson = await memberSignUp.response.json() as { user: { id: string } };
    await auth.api.addMember({
      body: {
        organizationId,
        userId: memberJson.user.id,
        role: 'member',
      },
    });
    const memberSignIn = await signIn(booted.baseUrl, { email, password });
    const setActive = await fetch(`${booted.baseUrl}/api/auth/organization/set-active`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: memberSignIn.cookie }),
      body: JSON.stringify({ organizationId }),
    });
    expect(setActive.status).toBeLessThan(300);
    return mergeCookies(memberSignIn.cookie, setActive);
  }

  it('owner creates API key; integrator enqueue succeeds; revoke and bad auth fail', async () => {
    const ctx = await bootstrapOrg('ik-happy');

    const createKey = await fetch(`${booted.baseUrl}/api/console/api-keys`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({ name: 'POS bridge' }),
    });
    expect(createKey.status).toBe(201);
    const created = await createKey.json() as {
      apiKey: { id: string, name: string, status: string, keyPrefix: string }
      token: string
      tokenShownOnce: boolean
    };
    expect(created.tokenShownOnce).toBe(true);
    expect(created.token.startsWith('ik_')).toBe(true);
    expect(created.apiKey.name).toBe('POS bridge');
    expect(created.apiKey.keyPrefix).toBe(created.token.slice(0, 10));

    const listKeys = await fetch(`${booted.baseUrl}/api/console/api-keys`, {
      headers: { Cookie: ctx.cookie },
    });
    expect(listKeys.status).toBe(200);
    const listBody = await listKeys.json() as {
      apiKeys: Array<{ id: string, token?: string }>
    };
    expect(listBody.apiKeys.some(k => k.id === created.apiKey.id)).toBe(true);
    expect(listBody.apiKeys[0]).not.toHaveProperty('token');

    const enqueueBody = {
      printerId: ctx.printerId,
      payloadBase64: ESC_POS_BASE64,
      idempotencyKey: `ik-${suffix}-1`,
    };

    const okEnqueue = await fetch(`${booted.baseUrl}/api/integrator/v1/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${created.token}`,
      },
      body: JSON.stringify(enqueueBody),
    });
    expect(okEnqueue.status).toBe(201);
    const enqueued = await okEnqueue.json() as {
      job: { id: string, status: string, organizationId: string }
      deduped: boolean
    };
    expect(enqueued.deduped).toBe(false);
    expect(enqueued.job.status).toBe('queued');
    expect(enqueued.job.organizationId).toBe(ctx.organizationId);

    const noAuth = await fetch(`${booted.baseUrl}/api/integrator/v1/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enqueueBody),
    });
    expect(noAuth.status).toBe(401);

    const badKey = await fetch(`${booted.baseUrl}/api/integrator/v1/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ik_not-a-real-key',
      },
      body: JSON.stringify(enqueueBody),
    });
    expect(badKey.status).toBe(401);

    const revoke = await fetch(
      `${booted.baseUrl}/api/console/api-keys/${created.apiKey.id}/revoke`,
      { method: 'POST', headers: { Cookie: ctx.cookie } },
    );
    expect(revoke.status).toBe(200);

    const afterRevoke = await fetch(`${booted.baseUrl}/api/integrator/v1/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${created.token}`,
      },
      body: JSON.stringify({
        ...enqueueBody,
        idempotencyKey: `ik-${suffix}-revoked`,
      }),
    });
    expect(afterRevoke.status).toBe(401);
  });

  it('webhook shared-secret and signed enqueue succeed; bad signature rejected', async () => {
    const ctx = await bootstrapOrg('wh-happy');

    const createSecret = await fetch(`${booted.baseUrl}/api/console/webhook-secrets`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({ name: 'Orders hook' }),
    });
    expect(createSecret.status).toBe(201);
    const created = await createSecret.json() as {
      webhookSecret: { id: string, name: string, secretPrefix: string }
      secret: string
      secretShownOnce: boolean
    };
    expect(created.secretShownOnce).toBe(true);
    expect(created.secret.startsWith('whsec_')).toBe(true);
    expect(created.webhookSecret.secretPrefix).toBe(created.secret.slice(0, 12));

    const sharedBody = JSON.stringify({
      printerId: ctx.printerId,
      payloadBase64: ESC_POS_BASE64,
      idempotencyKey: `wh-shared-${suffix}`,
    });

    const sharedOk = await fetch(`${booted.baseUrl}/api/webhooks/v1/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': created.secret,
      },
      body: sharedBody,
    });
    expect(sharedOk.status).toBe(201);
    const sharedJson = await sharedOk.json() as {
      job: { id: string, status: string }
    };
    expect(sharedJson.job.status).toBe('queued');

    const signedBody = JSON.stringify({
      printerId: ctx.printerId,
      payloadBase64: ESC_POS_BASE64,
      idempotencyKey: `wh-signed-${suffix}`,
    });
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = signWebhookPayload(created.secret, timestamp, signedBody);

    const signedOk = await fetch(`${booted.baseUrl}/api/webhooks/v1/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Id': created.webhookSecret.id,
        'X-Webhook-Timestamp': timestamp,
        'X-Webhook-Signature': `sha256=${signature}`,
      },
      body: signedBody,
    });
    expect(signedOk.status).toBe(201);

    const noAuth = await fetch(`${booted.baseUrl}/api/webhooks/v1/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: sharedBody,
    });
    expect(noAuth.status).toBe(401);

    const badSecret = await fetch(`${booted.baseUrl}/api/webhooks/v1/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': 'whsec_not-real',
      },
      body: sharedBody,
    });
    expect(badSecret.status).toBe(401);

    const badSig = await fetch(`${booted.baseUrl}/api/webhooks/v1/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Id': created.webhookSecret.id,
        'X-Webhook-Timestamp': timestamp,
        'X-Webhook-Signature': `sha256=${'ab'.repeat(32)}`,
      },
      body: signedBody,
    });
    expect(badSig.status).toBe(401);

    const revoke = await fetch(
      `${booted.baseUrl}/api/console/webhook-secrets/${created.webhookSecret.id}/revoke`,
      { method: 'POST', headers: { Cookie: ctx.cookie } },
    );
    expect(revoke.status).toBe(200);

    const afterRevoke = await fetch(`${booted.baseUrl}/api/webhooks/v1/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': created.secret,
      },
      body: JSON.stringify({
        printerId: ctx.printerId,
        payloadBase64: ESC_POS_BASE64,
        idempotencyKey: `wh-revoked-${suffix}`,
      }),
    });
    expect(afterRevoke.status).toBe(401);
  });

  it('API key / webhook secret cannot authenticate as device token (and vice versa)', async () => {
    const ctx = await bootstrapOrg('cross-auth');

    const createKey = await fetch(`${booted.baseUrl}/api/console/api-keys`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({ name: 'Cross key' }),
    });
    const keyBody = await createKey.json() as { token: string };

    const createSecret = await fetch(`${booted.baseUrl}/api/console/webhook-secrets`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({ name: 'Cross secret' }),
    });
    const secretBody = await createSecret.json() as {
      secret: string
      webhookSecret: { id: string }
    };

    const enqueuePayload = JSON.stringify({
      printerId: ctx.printerId,
      payloadBase64: ESC_POS_BASE64,
      idempotencyKey: `cross-${suffix}`,
    });

    // API key must not work on Printer Agent protocol.
    const keyOnProtocol = await fetch(
      `${booted.baseUrl}/api/protocol/v1/printer-agents/heartbeat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${keyBody.token}`,
        },
      },
    );
    expect(keyOnProtocol.status).toBe(401);

    // Webhook secret must not work on Printer Agent protocol.
    const secretOnProtocol = await fetch(
      `${booted.baseUrl}/api/protocol/v1/printer-agents/heartbeat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secretBody.secret}`,
        },
      },
    );
    expect(secretOnProtocol.status).toBe(401);

    // Device token must not work on integrator REST enqueue.
    const deviceOnIntegrator = await fetch(`${booted.baseUrl}/api/integrator/v1/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.deviceToken}`,
      },
      body: enqueuePayload,
    });
    expect(deviceOnIntegrator.status).toBe(401);

    // Webhook secret must not work as integrator Bearer API key.
    const secretOnIntegrator = await fetch(`${booted.baseUrl}/api/integrator/v1/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secretBody.secret}`,
      },
      body: enqueuePayload,
    });
    expect(secretOnIntegrator.status).toBe(401);

    // Device token must not work as webhook shared secret.
    const deviceOnWebhook = await fetch(`${booted.baseUrl}/api/webhooks/v1/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': ctx.deviceToken,
      },
      body: enqueuePayload,
    });
    expect(deviceOnWebhook.status).toBe(401);

    // API key must not work as webhook shared secret.
    const keyOnWebhook = await fetch(`${booted.baseUrl}/api/webhooks/v1/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': keyBody.token,
      },
      body: enqueuePayload,
    });
    expect(keyOnWebhook.status).toBe(401);
  });

  it('gates API key / webhook secret create+revoke to owner/admin', async () => {
    const ctx = await bootstrapOrg('rbac-auth');
    const memberCookie = await addMember(ctx.organizationId, 'rbac-member');

    const memberCreateKey = await fetch(`${booted.baseUrl}/api/console/api-keys`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: memberCookie }),
      body: JSON.stringify({ name: 'Member key' }),
    });
    expect(memberCreateKey.status).toBe(403);

    const memberCreateSecret = await fetch(`${booted.baseUrl}/api/console/webhook-secrets`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: memberCookie }),
      body: JSON.stringify({ name: 'Member secret' }),
    });
    expect(memberCreateSecret.status).toBe(403);

    const ownerCreateKey = await fetch(`${booted.baseUrl}/api/console/api-keys`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({ name: 'Owner key' }),
    });
    expect(ownerCreateKey.status).toBe(201);
    const keyJson = await ownerCreateKey.json() as { apiKey: { id: string } };

    const memberList = await fetch(`${booted.baseUrl}/api/console/api-keys`, {
      headers: { Cookie: memberCookie },
    });
    expect(memberList.status).toBe(200);

    const memberRevoke = await fetch(
      `${booted.baseUrl}/api/console/api-keys/${keyJson.apiKey.id}/revoke`,
      { method: 'POST', headers: { Cookie: memberCookie } },
    );
    expect(memberRevoke.status).toBe(403);
  });
});
