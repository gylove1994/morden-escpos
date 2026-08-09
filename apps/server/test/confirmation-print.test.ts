/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { BootedServer } from './harness';
import { Buffer } from 'node:buffer';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  authOriginHeaders,
  createOrganization,
  signUp,
} from './auth-helpers';
import { FakePrinterAgent } from './fake-printer-agent';
import { bootServer } from './harness';

const TEMPLATE_DEFINITION = {
  name: 'confirm-{{title}}',
  inputs: {
    type: 'object',
    required: ['title', 'payload'],
    properties: {
      title: { type: 'string' },
      payload: { type: 'string' },
    },
  },
  commands: [
    { type: 'raw', data: '{{payload}}' },
  ],
};

/** ESC @ "Hi" LF */
const EXPECTED_RAW = Buffer.from([0x1B, 0x40, 0x48, 0x69, 0x0A]);
const EXPECTED_RAW_HEX = '1b4048690a';

describe('embedded editor confirmation print', () => {
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
          address: '10.0.0.9',
          port: 9100,
        },
      }),
    });
    expect(printerResponse.status).toBe(201);
    const printerBody = await printerResponse.json() as {
      printer: { id: string, printerAgentId: string }
    };

    const groupResponse = await fetch(`${booted.baseUrl}/api/console/printer-groups`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: org.cookie }),
      body: JSON.stringify({
        printerAgentId: agentBody.printerAgent.id,
        name: `${label} group`,
        printerIds: [printerBody.printer.id],
      }),
    });
    expect(groupResponse.status).toBe(201);
    const groupBody = await groupResponse.json() as {
      printerGroup: { id: string }
    };

    const createTpl = await fetch(`${booted.baseUrl}/api/console/templates`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: org.cookie }),
      body: JSON.stringify({
        name: `${label} template`,
        definition: TEMPLATE_DEFINITION,
      }),
    });
    expect(createTpl.status).toBe(201);
    const tplBody = await createTpl.json() as { template: { id: string } };

    return {
      cookie: org.cookie,
      organizationId: orgJson.id,
      deviceToken: agentBody.deviceToken,
      printerAgentId: agentBody.printerAgent.id,
      printerId: printerBody.printer.id,
      printerGroupId: groupBody.printerGroup.id,
      templateId: tplBody.template.id,
    };
  }

  it('blocks confirmation enqueue without Printer or Printer Group target', async () => {
    const ctx = await bootstrapOrg('confirm-notarget');
    const response = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({
        templateId: ctx.templateId,
        inputs: { title: 'x', payload: EXPECTED_RAW_HEX },
        purpose: 'template_confirmation',
      }),
    });
    expect(response.status).toBe(400);
    const body = await response.json() as { error: string };
    expect(body.error).toBe('target_required');
  });

  it('enqueues confirmation print to a Printer and labels purpose in job history', async () => {
    const ctx = await bootstrapOrg('confirm-printer');
    const enqueue = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({
        printerId: ctx.printerId,
        templateId: ctx.templateId,
        inputs: { title: 'confirm', payload: EXPECTED_RAW_HEX },
        purpose: 'template_confirmation',
      }),
    });
    expect(enqueue.status).toBe(201);
    const enqueued = await enqueue.json() as {
      job: {
        id: string
        purpose: string
        templateId: string | null
        kind: string
      }
    };
    expect(enqueued.job.purpose).toBe('template_confirmation');
    expect(enqueued.job.templateId).toBe(ctx.templateId);
    expect(enqueued.job.kind).toBe('single');

    const history = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
    });
    expect(history.status).toBe(200);
    const historyBody = await history.json() as {
      jobs: Array<{ id: string, purpose: string, templateId: string | null }>
    };
    const listed = historyBody.jobs.find(job => job.id === enqueued.job.id);
    expect(listed?.purpose).toBe('template_confirmation');
    expect(listed?.templateId).toBe(ctx.templateId);

    const agent = new FakePrinterAgent(booted.baseUrl, ctx.deviceToken);
    const leased = await agent.lease();
    expect(leased.response.status).toBe(200);
    expect(leased.job).not.toBeNull();
    expect(Buffer.from(leased.job!.payloadBase64, 'base64')).toEqual(EXPECTED_RAW);
    expect(JSON.stringify(leased.job)).not.toContain('templateId');
  });

  it('enqueues confirmation print to a Printer Group through formal fan-out', async () => {
    const ctx = await bootstrapOrg('confirm-group');
    const enqueue = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({
        printerGroupId: ctx.printerGroupId,
        templateId: ctx.templateId,
        inputs: { title: 'group', payload: EXPECTED_RAW_HEX },
        purpose: 'template_confirmation',
      }),
    });
    expect(enqueue.status).toBe(201);
    const enqueued = await enqueue.json() as {
      job: { id: string, purpose: string, kind: string }
      children: Array<{ purpose: string, kind: string }>
    };
    expect(enqueued.job.kind).toBe('parent');
    expect(enqueued.job.purpose).toBe('template_confirmation');
    expect(enqueued.children).toHaveLength(1);
    expect(enqueued.children[0]?.kind).toBe('child');
    expect(enqueued.children[0]?.purpose).toBe('template_confirmation');
  });
});
