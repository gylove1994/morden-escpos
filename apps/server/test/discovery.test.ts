/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { auth } from '../lib/auth';
import { db } from '../lib/db';
import { printJob } from '../lib/db/schema';
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

const ESC_POS_BYTES = Buffer.from([0x1b, 0x40, 0x48, 0x69, 0x0a]);
const ESC_POS_BASE64 = ESC_POS_BYTES.toString('base64');

describe('Printer discovery, confirm, disable, and online presence', () => {
  let booted: BootedServer;
  const suffix = Date.now().toString(36);

  beforeAll(async () => {
    booted = await bootServer({ port: 0 });
  }, 120_000);

  afterAll(async () => {
    await booted.close();
  });

  async function bootstrapOwner(label: string) {
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
      printerAgent: { id: string, presence: string }
      deviceToken: string
    };

    return {
      cookie: org.cookie,
      organizationId: orgJson.id,
      deviceToken: agentBody.deviceToken,
      printerAgentId: agentBody.printerAgent.id,
      email,
      password,
    };
  }

  it('accepts discovery reports, confirms/names Printers, and shows ownership + online', async () => {
    const ctx = await bootstrapOwner('discover-happy');
    const agent = new FakePrinterAgent(booted.baseUrl, ctx.deviceToken);

    const beforeAgents = await fetch(`${booted.baseUrl}/api/console/printer-agents`, {
      headers: { Cookie: ctx.cookie },
    });
    expect(beforeAgents.status).toBe(200);
    const beforeBody = await beforeAgents.json() as {
      printerAgents: Array<{ id: string, presence: string }>
    };
    const beforeAgent = beforeBody.printerAgents.find(a => a.id === ctx.printerAgentId);
    expect(beforeAgent?.presence).toBe('offline');

    const reported = await agent.reportDiscoveries([
      {
        connectionHints: {
          transport: 'tcp',
          address: '10.0.0.55',
          port: 9100,
        },
        suggestedName: 'Kitchen',
      },
    ]);
    expect(reported.response.status).toBe(200);
    expect(reported.body?.status).toBe('ok');
    expect(reported.body?.discoveries).toHaveLength(1);
    expect(reported.body?.discoveries[0]?.endpointKey).toBe('tcp://10.0.0.55:9100');
    expect(reported.body?.discoveries[0]?.confirmedPrinterId).toBeNull();
    const discoveryId = reported.body!.discoveries[0]!.id;

    const rereport = await agent.reportDiscoveries([
      {
        connectionHints: {
          transport: 'tcp',
          address: '10.0.0.55',
          port: 9100,
        },
        suggestedName: 'Kitchen',
      },
    ]);
    expect(rereport.response.status).toBe(200);
    expect(rereport.body?.discoveries[0]?.id).toBe(discoveryId);

    const pending = await fetch(
      `${booted.baseUrl}/api/console/discoveries?pending=1`,
      { headers: { Cookie: ctx.cookie } },
    );
    expect(pending.status).toBe(200);
    const pendingBody = await pending.json() as {
      discoveries: Array<{ id: string, printerAgentId: string }>
    };
    expect(pendingBody.discoveries.some(d => d.id === discoveryId)).toBe(true);

    const confirm = await fetch(
      `${booted.baseUrl}/api/console/discoveries/${discoveryId}/confirm`,
      {
        method: 'POST',
        headers: authOriginHeaders({ Cookie: ctx.cookie }),
        body: JSON.stringify({ name: 'Kitchen receipt' }),
      },
    );
    expect(confirm.status).toBe(201);
    const confirmed = await confirm.json() as {
      printer: {
        id: string
        name: string
        printerAgentId: string
        printerAgentName: string
        printerAgentPresence: string
        status: string
      }
      discovery: { confirmedPrinterId: string | null }
    };
    expect(confirmed.printer.name).toBe('Kitchen receipt');
    expect(confirmed.printer.printerAgentId).toBe(ctx.printerAgentId);
    expect(confirmed.printer.printerAgentName).toContain('agent');
    expect(confirmed.printer.printerAgentPresence).toBe('online');
    expect(confirmed.discovery.confirmedPrinterId).toBe(confirmed.printer.id);

    const printers = await fetch(`${booted.baseUrl}/api/console/printers`, {
      headers: { Cookie: ctx.cookie },
    });
    expect(printers.status).toBe(200);
    const printersBody = await printers.json() as {
      printers: Array<{
        id: string
        printerAgentId: string
        printerAgentName: string
        printerAgentPresence: string
      }>
    };
    const listed = printersBody.printers.find(p => p.id === confirmed.printer.id);
    expect(listed?.printerAgentId).toBe(ctx.printerAgentId);
    expect(listed?.printerAgentPresence).toBe('online');

    const agentsAfter = await fetch(`${booted.baseUrl}/api/console/printer-agents`, {
      headers: { Cookie: ctx.cookie },
    });
    const agentsAfterBody = await agentsAfter.json() as {
      printerAgents: Array<{ id: string, presence: string, lastAuthenticatedAt: string | null }>
    };
    const afterAgent = agentsAfterBody.printerAgents.find(a => a.id === ctx.printerAgentId);
    expect(afterAgent?.presence).toBe('online');
    expect(afterAgent?.lastAuthenticatedAt).toBeTruthy();
  });

  it('disables a Printer without deleting job history and rejects new enqueue', async () => {
    const ctx = await bootstrapOwner('discover-disable');
    const agent = new FakePrinterAgent(booted.baseUrl, ctx.deviceToken);

    const reported = await agent.reportDiscoveries([
      {
        connectionHints: {
          transport: 'tcp',
          address: '10.0.0.66',
          port: 9100,
        },
      },
    ]);
    expect(reported.response.status).toBe(200);
    const discoveryId = reported.body!.discoveries[0]!.id;

    const confirm = await fetch(
      `${booted.baseUrl}/api/console/discoveries/${discoveryId}/confirm`,
      {
        method: 'POST',
        headers: authOriginHeaders({ Cookie: ctx.cookie }),
        body: JSON.stringify({ name: 'Disable me' }),
      },
    );
    expect(confirm.status).toBe(201);
    const confirmed = await confirm.json() as { printer: { id: string } };

    const enqueue = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({
        printerId: confirmed.printer.id,
        payloadBase64: ESC_POS_BASE64,
      }),
    });
    expect(enqueue.status).toBe(201);
    const enqueued = await enqueue.json() as { job: { id: string, status: string } };
    expect(enqueued.job.status).toBe('queued');

    const disable = await fetch(
      `${booted.baseUrl}/api/console/printers/${confirmed.printer.id}/disable`,
      {
        method: 'POST',
        headers: authOriginHeaders({ Cookie: ctx.cookie }),
      },
    );
    expect(disable.status).toBe(200);
    const disabled = await disable.json() as {
      printer: { id: string, status: string }
    };
    expect(disabled.printer.status).toBe('disabled');

    const blocked = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({
        printerId: confirmed.printer.id,
        payloadBase64: ESC_POS_BASE64,
      }),
    });
    expect(blocked.status).toBeGreaterThanOrEqual(400);

    const history = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      headers: { Cookie: ctx.cookie },
    });
    expect(history.status).toBe(200);
    const historyBody = await history.json() as {
      jobs: Array<{ id: string, printerId: string }>
    };
    expect(historyBody.jobs.some(j => j.id === enqueued.job.id)).toBe(true);

    const jobRows = await db
      .select()
      .from(printJob)
      .where(eq(printJob.id, enqueued.job.id))
      .limit(1);
    expect(jobRows[0]?.printerId).toBe(confirmed.printer.id);

    const printers = await fetch(`${booted.baseUrl}/api/console/printers`, {
      headers: { Cookie: ctx.cookie },
    });
    const printersBody = await printers.json() as {
      printers: Array<{ id: string, status: string }>
    };
    expect(printersBody.printers.find(p => p.id === confirmed.printer.id)?.status)
      .toBe('disabled');
  });

  it('gates discovery confirm and disable to owner/admin', async () => {
    const ctx = await bootstrapOwner('discover-rbac');
    const agent = new FakePrinterAgent(booted.baseUrl, ctx.deviceToken);
    const reported = await agent.reportDiscoveries([
      {
        connectionHints: {
          transport: 'tcp',
          address: '10.0.0.77',
          port: 9100,
        },
      },
    ]);
    const discoveryId = reported.body!.discoveries[0]!.id;

    const memberEmail = `discover-member-${suffix}@example.com`;
    const password = 'correct-horse-battery';
    const memberSignUp = await signUp(booted.baseUrl, {
      name: 'Member',
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

    const memberSignIn = await signIn(booted.baseUrl, { email: memberEmail, password });
    const setActive = await fetch(`${booted.baseUrl}/api/auth/organization/set-active`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: memberSignIn.cookie }),
      body: JSON.stringify({ organizationId: ctx.organizationId }),
    });
    const memberCookie = mergeCookies(memberSignIn.cookie, setActive);

    const forbiddenConfirm = await fetch(
      `${booted.baseUrl}/api/console/discoveries/${discoveryId}/confirm`,
      {
        method: 'POST',
        headers: authOriginHeaders({ Cookie: memberCookie }),
        body: JSON.stringify({ name: 'Nope' }),
      },
    );
    expect(forbiddenConfirm.status).toBe(403);

    const ownerConfirm = await fetch(
      `${booted.baseUrl}/api/console/discoveries/${discoveryId}/confirm`,
      {
        method: 'POST',
        headers: authOriginHeaders({ Cookie: ctx.cookie }),
        body: JSON.stringify({ name: 'Allowed' }),
      },
    );
    expect(ownerConfirm.status).toBe(201);
    const confirmed = await ownerConfirm.json() as { printer: { id: string } };

    const forbiddenDisable = await fetch(
      `${booted.baseUrl}/api/console/printers/${confirmed.printer.id}/disable`,
      {
        method: 'POST',
        headers: authOriginHeaders({ Cookie: memberCookie }),
      },
    );
    expect(forbiddenDisable.status).toBe(403);
  });
});
