/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  authOriginHeaders,
  createOrganization,
  signUp,
} from './auth-helpers';
import { FakePrinterAgent } from './fake-printer-agent';
import type { BootedServer } from './harness';
import { bootServer } from './harness';

const ESC_POS_BYTES = Buffer.from([0x1b, 0x40, 0x47, 0x72, 0x70, 0x0a]); // ESC @ Grp LF
const ESC_POS_BASE64 = ESC_POS_BYTES.toString('base64');

describe('Printer Group fan-out + parent aggregation + child retry', () => {
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

    async function createPrinter(name: string, address: string) {
      const response = await fetch(`${booted.baseUrl}/api/console/printers`, {
        method: 'POST',
        headers: authOriginHeaders({ Cookie: org.cookie }),
        body: JSON.stringify({
          printerAgentId: agentBody.printerAgent.id,
          name,
          connectionHints: {
            transport: 'tcp',
            address,
            port: 9100,
          },
        }),
      });
      expect(response.status).toBe(201);
      const body = await response.json() as { printer: { id: string } };
      return body.printer.id;
    }

    const printerA = await createPrinter(`${label} printer A`, '10.0.0.10');
    const printerB = await createPrinter(`${label} printer B`, '10.0.0.11');

    return {
      cookie: org.cookie,
      organizationId: orgJson.id,
      deviceToken: agentBody.deviceToken,
      printerAgentId: agentBody.printerAgent.id,
      printerA,
      printerB,
    };
  }

  it('admin creates/updates a Printer Group under one Printer Agent', async () => {
    const ctx = await bootstrapOrg('group-crud');

    const create = await fetch(`${booted.baseUrl}/api/console/printer-groups`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({
        printerAgentId: ctx.printerAgentId,
        name: 'Kitchen',
        printerIds: [ctx.printerA],
      }),
    });
    expect(create.status).toBe(201);
    const created = await create.json() as {
      printerGroup: {
        id: string
        printerAgentId: string
        name: string
        printerIds: string[]
      }
    };
    expect(created.printerGroup.printerAgentId).toBe(ctx.printerAgentId);
    expect(created.printerGroup.name).toBe('Kitchen');
    expect(created.printerGroup.printerIds).toEqual([ctx.printerA]);

    const update = await fetch(
      `${booted.baseUrl}/api/console/printer-groups/${created.printerGroup.id}`,
      {
        method: 'PATCH',
        headers: authOriginHeaders({ Cookie: ctx.cookie }),
        body: JSON.stringify({
          name: 'Kitchen duo',
          printerIds: [ctx.printerA, ctx.printerB],
        }),
      },
    );
    expect(update.status).toBe(200);
    const updated = await update.json() as {
      printerGroup: { name: string, printerIds: string[] }
    };
    expect(updated.printerGroup.name).toBe('Kitchen duo');
    expect(updated.printerGroup.printerIds.sort()).toEqual(
      [ctx.printerA, ctx.printerB].sort(),
    );

    const listed = await fetch(`${booted.baseUrl}/api/console/printer-groups`, {
      headers: { Cookie: ctx.cookie },
    });
    expect(listed.status).toBe(200);
    const listBody = await listed.json() as {
      printerGroups: Array<{ id: string }>
    };
    expect(listBody.printerGroups.some(g => g.id === created.printerGroup.id)).toBe(true);
  });

  it('enqueue to a Printer Group fans out N children with shared parent id', async () => {
    const ctx = await bootstrapOrg('group-fanout');

    const groupResponse = await fetch(`${booted.baseUrl}/api/console/printer-groups`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({
        printerAgentId: ctx.printerAgentId,
        name: 'Fanout',
        printerIds: [ctx.printerA, ctx.printerB],
      }),
    });
    expect(groupResponse.status).toBe(201);
    const groupBody = await groupResponse.json() as { printerGroup: { id: string } };

    const enqueue = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({
        printerGroupId: groupBody.printerGroup.id,
        payloadBase64: ESC_POS_BASE64,
        idempotencyKey: `group-${suffix}-fanout`,
      }),
    });
    expect(enqueue.status).toBe(201);
    const enqueued = await enqueue.json() as {
      job: {
        id: string
        kind: string
        status: string
        printerId: string | null
        printerGroupId: string | null
        parentJobId: string | null
      }
      children: Array<{
        id: string
        kind: string
        parentJobId: string | null
        printerId: string | null
        status: string
      }>
      deduped: boolean
    };

    expect(enqueued.deduped).toBe(false);
    expect(enqueued.job.kind).toBe('parent');
    expect(enqueued.job.status).toBe('queued');
    expect(enqueued.job.printerId).toBeNull();
    expect(enqueued.job.printerGroupId).toBe(groupBody.printerGroup.id);
    expect(enqueued.job.parentJobId).toBeNull();
    expect(enqueued.children).toHaveLength(2);
    expect(enqueued.children.every(child => child.kind === 'child')).toBe(true);
    expect(enqueued.children.every(child => child.parentJobId === enqueued.job.id)).toBe(true);
    expect(enqueued.children.every(child => child.status === 'queued')).toBe(true);
    expect(
      enqueued.children.map(child => child.printerId).sort(),
    ).toEqual([ctx.printerA, ctx.printerB].sort());

    const agent = new FakePrinterAgent(booted.baseUrl, ctx.deviceToken);
    const first = await agent.drainOne('succeeded');
    const second = await agent.drainOne('succeeded');
    expect(first.statuses).toEqual([200, 200, 200]);
    expect(second.statuses).toEqual([200, 200, 200]);
    expect(first.leased?.id).not.toBe(second.leased?.id);
    expect(
      [first.leased?.id, second.leased?.id].sort(),
    ).toEqual(enqueued.children.map(child => child.id).sort());

    const idle = await agent.lease();
    expect(idle.response.status).toBe(204);

    const history = await fetch(`${booted.baseUrl}/api/console/jobs?limit=50`, {
      headers: { Cookie: ctx.cookie },
    });
    expect(history.status).toBe(200);
    const historyBody = await history.json() as {
      jobs: Array<{ id: string, status: string, kind: string }>
    };
    const parent = historyBody.jobs.find(job => job.id === enqueued.job.id);
    expect(parent?.kind).toBe('parent');
    expect(parent?.status).toBe('succeeded');
  });

  it('parent becomes partial_failed when one child fails; retry only requeues the failed child', async () => {
    const ctx = await bootstrapOrg('group-partial');

    const groupResponse = await fetch(`${booted.baseUrl}/api/console/printer-groups`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({
        printerAgentId: ctx.printerAgentId,
        name: 'Partial',
        printerIds: [ctx.printerA, ctx.printerB],
      }),
    });
    const groupBody = await groupResponse.json() as { printerGroup: { id: string } };

    const enqueue = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({
        printerGroupId: groupBody.printerGroup.id,
        payloadBase64: ESC_POS_BASE64,
      }),
    });
    expect(enqueue.status).toBe(201);
    const enqueued = await enqueue.json() as {
      job: { id: string }
      children: Array<{ id: string, printerId: string | null }>
    };
    expect(enqueued.children).toHaveLength(2);

    const agent = new FakePrinterAgent(booted.baseUrl, ctx.deviceToken);
    const firstLease = await agent.lease();
    expect(firstLease.response.status).toBe(200);
    const firstJobId = firstLease.job!.id;
    await agent.report(firstJobId, 'printing');
    await agent.report(firstJobId, 'succeeded');

    const secondLease = await agent.lease();
    expect(secondLease.response.status).toBe(200);
    const secondJobId = secondLease.job!.id;
    await agent.report(secondJobId, 'printing');
    await agent.report(secondJobId, 'failed', 'paper jam');

    const historyAfterFail = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      headers: { Cookie: ctx.cookie },
    });
    const afterFailBody = await historyAfterFail.json() as {
      jobs: Array<{
        id: string
        status: string
        kind: string
        errorMessage: string | null
      }>
    };
    const parentAfterFail = afterFailBody.jobs.find(job => job.id === enqueued.job.id);
    expect(parentAfterFail?.status).toBe('partial_failed');
    expect(parentAfterFail?.errorMessage).toMatch(/1 of 2 child jobs failed/);

    const failedChild = afterFailBody.jobs.find(
      job => job.id === secondJobId && job.kind === 'child',
    );
    const succeededChild = afterFailBody.jobs.find(
      job => job.id === firstJobId && job.kind === 'child',
    );
    expect(failedChild?.status).toBe('failed');
    expect(succeededChild?.status).toBe('succeeded');

    const retry = await fetch(
      `${booted.baseUrl}/api/console/jobs/${secondJobId}/retry`,
      {
        method: 'POST',
        headers: authOriginHeaders({ Cookie: ctx.cookie }),
      },
    );
    expect(retry.status).toBe(200);
    const retryBody = await retry.json() as {
      job: { id: string, status: string }
      parent: { id: string, status: string } | null
    };
    expect(retryBody.job.id).toBe(secondJobId);
    expect(retryBody.job.status).toBe('queued');
    expect(retryBody.parent?.id).toBe(enqueued.job.id);
    expect(retryBody.parent?.status).toBe('queued');

    const idleBeforeRetryDrain = await agent.lease();
    // Only the retried failed child should be available — successful sibling stays succeeded.
    expect(idleBeforeRetryDrain.response.status).toBe(200);
    expect(idleBeforeRetryDrain.job?.id).toBe(secondJobId);

    await agent.report(secondJobId, 'printing');
    await agent.report(secondJobId, 'succeeded');

    const noMore = await agent.lease();
    expect(noMore.response.status).toBe(204);

    const historyFinal = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      headers: { Cookie: ctx.cookie },
    });
    const finalBody = await historyFinal.json() as {
      jobs: Array<{ id: string, status: string }>
    };
    expect(finalBody.jobs.find(job => job.id === enqueued.job.id)?.status).toBe('succeeded');
    expect(finalBody.jobs.find(job => job.id === firstJobId)?.status).toBe('succeeded');
    expect(finalBody.jobs.find(job => job.id === secondJobId)?.status).toBe('succeeded');
  });

  it('rejects enqueue to an empty or unknown Printer Group with a clear error', async () => {
    const ctx = await bootstrapOrg('group-empty');

    const emptyGroup = await fetch(`${booted.baseUrl}/api/console/printer-groups`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({
        printerAgentId: ctx.printerAgentId,
        name: 'Empty',
        printerIds: [],
      }),
    });
    expect(emptyGroup.status).toBe(201);
    const emptyBody = await emptyGroup.json() as { printerGroup: { id: string } };

    const enqueueEmpty = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({
        printerGroupId: emptyBody.printerGroup.id,
        payloadBase64: ESC_POS_BASE64,
      }),
    });
    expect(enqueueEmpty.status).toBe(400);
    const emptyError = await enqueueEmpty.json() as {
      error: string
      message: string
    };
    expect(emptyError.error).toBe('empty_printer_group');
    expect(emptyError.message).toMatch(/no active Printers/i);

    const enqueueMissing = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({
        printerGroupId: '00000000-0000-4000-8000-000000000000',
        payloadBase64: ESC_POS_BASE64,
      }),
    });
    expect(enqueueMissing.status).toBe(404);
    const missingError = await enqueueMissing.json() as {
      error: string
      message: string
    };
    expect(missingError.error).toBe('printer_group_not_found');
    expect(missingError.message).toMatch(/not found/i);
  });
});
