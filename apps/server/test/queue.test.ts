/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { auth } from '../lib/auth';
import { expireJobLeaseForTests } from '../lib/jobs';
import {
  authOriginHeaders,
  createOrganization,
  mergeCookies,
  signIn,
  signUp,
} from './auth-helpers';
import { FakePrinterAgent } from './fake-printer-agent';
import type { BootedServer } from './harness';
import { bootServer } from './harness';

const ESC_POS_BYTES = Buffer.from([0x1b, 0x40, 0x48, 0x69, 0x0a]); // ESC @ Hi LF
const ESC_POS_BASE64 = ESC_POS_BYTES.toString('base64');

describe('Raw enqueue → lease → report (single Printer)', () => {
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
          address: '10.0.0.42',
          port: 9100,
        },
      }),
    });
    expect(printerResponse.status).toBe(201);
    const printerBody = await printerResponse.json() as {
      printer: {
        id: string
        printerAgentId: string
        connectionHints: { transport: string, address: string, port: number }
      }
    };

    return {
      cookie: org.cookie,
      organizationId: orgJson.id,
      deviceToken: agentBody.deviceToken,
      printerAgentId: agentBody.printerAgent.id,
      printerId: printerBody.printer.id,
      connectionHints: printerBody.printer.connectionHints,
      email,
      password,
    };
  }

  it('admin creates Printer with connection hints; member enqueues; fake agent leases and reports', async () => {
    const ctx = await bootstrapOrg('queue-happy');

    const memberEmail = `queue-member-${suffix}@example.com`;
    const password = 'correct-horse-battery';
    const memberSignUp = await signUp(booted.baseUrl, {
      name: 'Queue Member',
      email: memberEmail,
      password,
    });
    const memberJson = await memberSignUp.response.json() as { user: { id: string } };
    await auth.api.addMember({
      body: {
        organizationId: ctx.organizationId,
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
      body: JSON.stringify({ organizationId: ctx.organizationId }),
    });
    expect(setActive.status).toBeLessThan(300);
    const memberCookie = mergeCookies(memberSignIn.cookie, setActive);

    const enqueue = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: memberCookie }),
      body: JSON.stringify({
        printerId: ctx.printerId,
        payloadBase64: ESC_POS_BASE64,
        idempotencyKey: `order-${suffix}-1`,
      }),
    });
    expect(enqueue.status).toBe(201);
    const enqueued = await enqueue.json() as {
      job: { id: string, status: string, payloadByteLength: number }
      deduped: boolean
    };
    expect(enqueued.deduped).toBe(false);
    expect(enqueued.job.status).toBe('queued');
    expect(enqueued.job.payloadByteLength).toBe(ESC_POS_BYTES.byteLength);

    const agent = new FakePrinterAgent(booted.baseUrl, ctx.deviceToken);
    const drained = await agent.drainOne('succeeded');
    expect(drained.statuses).toEqual([200, 200, 200]);
    expect(drained.leased).not.toBeNull();
    expect(drained.leased?.id).toBe(enqueued.job.id);
    expect(drained.leased?.printerId).toBe(ctx.printerId);
    expect(drained.leased?.payloadBase64).toBe(ESC_POS_BASE64);
    expect(drained.leased?.payloadByteLength).toBe(ESC_POS_BYTES.byteLength);
    expect(Buffer.from(drained.leased!.payloadBase64, 'base64')).toEqual(ESC_POS_BYTES);
    expect(drained.leased?.connectionHints).toEqual({
      transport: 'tcp',
      address: '10.0.0.42',
      port: 9100,
    });
    expect(drained.printing?.status).toBe('printing');
    expect(drained.final?.status).toBe('succeeded');

    const idle = await agent.lease();
    expect(idle.response.status).toBe(204);
    expect(idle.job).toBeNull();

    const history = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      headers: { Cookie: memberCookie },
    });
    expect(history.status).toBe(200);
    const historyBody = await history.json() as {
      jobs: Array<{ id: string, status: string }>
    };
    const listed = historyBody.jobs.find(j => j.id === enqueued.job.id);
    expect(listed?.status).toBe('succeeded');
  });

  it('dedupes enqueue retries with the same idempotency key', async () => {
    const ctx = await bootstrapOrg('queue-idem');
    const key = `idem-${suffix}`;

    const first = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({
        printerId: ctx.printerId,
        payloadBase64: ESC_POS_BASE64,
        idempotencyKey: key,
      }),
    });
    expect(first.status).toBe(201);
    const firstBody = await first.json() as {
      job: { id: string }
      deduped: boolean
    };
    expect(firstBody.deduped).toBe(false);

    const second = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({
        printerId: ctx.printerId,
        payloadBase64: ESC_POS_BASE64,
        idempotencyKey: key,
      }),
    });
    expect(second.status).toBe(200);
    const secondBody = await second.json() as {
      job: { id: string }
      deduped: boolean
    };
    expect(secondBody.deduped).toBe(true);
    expect(secondBody.job.id).toBe(firstBody.job.id);

    const agent = new FakePrinterAgent(booted.baseUrl, ctx.deviceToken);
    const firstLease = await agent.lease();
    expect(firstLease.response.status).toBe(200);
    const secondLease = await agent.lease();
    expect(secondLease.response.status).toBe(204);
  });

  it('reports failed with error message and rejects missing errorMessage', async () => {
    const ctx = await bootstrapOrg('queue-fail');

    const enqueue = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({
        printerId: ctx.printerId,
        payloadBase64: ESC_POS_BASE64,
      }),
    });
    expect(enqueue.status).toBe(201);
    const enqueued = await enqueue.json() as { job: { id: string } };

    const agent = new FakePrinterAgent(booted.baseUrl, ctx.deviceToken);
    const leased = await agent.lease();
    expect(leased.response.status).toBe(200);
    expect(leased.job?.id).toBe(enqueued.job.id);

    await agent.report(enqueued.job.id, 'printing');

    const badFail = await fetch(
      `${booted.baseUrl}/api/protocol/v1/jobs/${enqueued.job.id}/report`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ctx.deviceToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'failed' }),
      },
    );
    expect(badFail.status).toBe(400);

    const failed = await agent.report(enqueued.job.id, 'failed', 'TCP connection refused');
    expect(failed.response.status).toBe(200);
    expect(failed.job?.status).toBe('failed');
    expect(failed.job?.errorMessage).toBe('TCP connection refused');
  });

  it('requeues expired leases so another poll can pick up the job', async () => {
    const ctx = await bootstrapOrg('queue-lease');

    const enqueue = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({
        printerId: ctx.printerId,
        payloadBase64: ESC_POS_BASE64,
      }),
    });
    expect(enqueue.status).toBe(201);
    const enqueued = await enqueue.json() as { job: { id: string } };

    const agent = new FakePrinterAgent(booted.baseUrl, ctx.deviceToken);
    const firstLease = await agent.lease();
    expect(firstLease.response.status).toBe(200);
    expect(firstLease.job?.id).toBe(enqueued.job.id);

    const blocked = await agent.lease();
    expect(blocked.response.status).toBe(204);

    await expireJobLeaseForTests(enqueued.job.id);

    const reclaimed = await agent.lease();
    expect(reclaimed.response.status).toBe(200);
    expect(reclaimed.job?.id).toBe(enqueued.job.id);
    expect(reclaimed.job?.status).toBe('leased');
    expect(reclaimed.job?.payloadBase64).toBe(ESC_POS_BASE64);
    expect(reclaimed.job?.connectionHints).toEqual(ctx.connectionHints);

    const printing = await agent.report(enqueued.job.id, 'printing');
    expect(printing.response.status).toBe(200);
    const succeeded = await agent.report(enqueued.job.id, 'succeeded');
    expect(succeeded.response.status).toBe(200);
    expect(succeeded.job?.status).toBe('succeeded');
  });

  it('gates Printer create to owner/admin; members may list and enqueue', async () => {
    const ctx = await bootstrapOrg('queue-rbac');
    const memberEmail = `queue-rbac-member-${suffix}@example.com`;
    const password = 'correct-horse-battery';

    const memberSignUp = await signUp(booted.baseUrl, {
      name: 'RBAC Queue Member',
      email: memberEmail,
      password,
    });
    const memberJson = await memberSignUp.response.json() as { user: { id: string } };
    await auth.api.addMember({
      body: {
        organizationId: ctx.organizationId,
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
      body: JSON.stringify({ organizationId: ctx.organizationId }),
    });
    const memberCookie = mergeCookies(memberSignIn.cookie, setActive);

    const createAsMember = await fetch(`${booted.baseUrl}/api/console/printers`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: memberCookie }),
      body: JSON.stringify({
        printerAgentId: ctx.printerAgentId,
        name: 'Should Fail',
        connectionHints: {
          transport: 'usb',
          path: '/dev/usb/lp0',
        },
      }),
    });
    expect(createAsMember.status).toBe(403);

    const listAsMember = await fetch(`${booted.baseUrl}/api/console/printers`, {
      headers: { Cookie: memberCookie },
    });
    expect(listAsMember.status).toBe(200);

    const enqueueAsMember = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: memberCookie }),
      body: JSON.stringify({
        printerId: ctx.printerId,
        payloadBase64: ESC_POS_BASE64,
      }),
    });
    expect(enqueueAsMember.status).toBe(201);
  });

  it('rejects protocol lease/report without a valid device token', async () => {
    const missing = await fetch(`${booted.baseUrl}/api/protocol/v1/jobs/lease`, {
      method: 'POST',
    });
    expect(missing.status).toBe(401);

    const invalid = await fetch(`${booted.baseUrl}/api/protocol/v1/jobs/lease`, {
      method: 'POST',
      headers: { Authorization: 'Bearer pa_not-real' },
    });
    expect(invalid.status).toBe(401);
  });
});
