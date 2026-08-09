/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { BootedServer } from './harness';
import { Buffer } from 'node:buffer';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { auth } from '../lib/auth';
import {
  authOriginHeaders,
  createOrganization,
  mergeCookies,
  signIn,
  signUp,
} from './auth-helpers';
import { FakePrinterAgent } from './fake-printer-agent';
import { bootServer } from './harness';

/** Known ESC/POS fixture: ESC @ "Hi" LF — independent of MIT text encoding. */
const EXPECTED_RAW = Buffer.from([0x1B, 0x40, 0x48, 0x69, 0x0A]);
const EXPECTED_RAW_HEX = '1b4048690a';

const TEMPLATE_DEFINITION = {
  name: 'receipt-{{title}}',
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

describe('template CRUD + server-side render enqueue', () => {
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

    return {
      cookie: org.cookie,
      organizationId: orgJson.id,
      deviceToken: agentBody.deviceToken,
      printerAgentId: agentBody.printerAgent.id,
      printerId: printerBody.printer.id,
      email,
      password,
    };
  }

  it('admin can create, list, update, and delete JSON templates; member cannot mutate', async () => {
    const ctx = await bootstrapOrg('tpl-crud');

    const memberEmail = `tpl-member-${suffix}@example.com`;
    const password = 'correct-horse-battery';
    const memberSignUp = await signUp(booted.baseUrl, {
      name: 'Tpl Member',
      email: memberEmail,
      password,
    });
    expect(memberSignUp.response.status).toBeLessThan(300);
    const memberUser = await memberSignUp.response.json() as { user: { id: string } };

    await auth.api.addMember({
      body: {
        organizationId: ctx.organizationId,
        userId: memberUser.user.id,
        role: 'member',
      },
    });

    const memberSignIn = await signIn(booted.baseUrl, { email: memberEmail, password });
    const setActive = await fetch(`${booted.baseUrl}/api/auth/organization/set-active`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: memberSignIn.cookie }),
      body: JSON.stringify({ organizationId: ctx.organizationId }),
    });
    expect(setActive.status).toBeLessThan(300);
    const memberCookie = mergeCookies(memberSignIn.cookie, setActive);

    const forbiddenCreate = await fetch(`${booted.baseUrl}/api/console/templates`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: memberCookie }),
      body: JSON.stringify({
        name: 'blocked',
        definition: TEMPLATE_DEFINITION,
      }),
    });
    expect(forbiddenCreate.status).toBe(403);

    const created = await fetch(`${booted.baseUrl}/api/console/templates`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({
        name: 'Kitchen ticket',
        definition: TEMPLATE_DEFINITION,
      }),
    });
    expect(created.status).toBe(201);
    const createdBody = await created.json() as {
      template: {
        id: string
        name: string
        definition: { commands: Array<{ type: string }> }
      }
    };
    expect(createdBody.template.name).toBe('Kitchen ticket');
    expect(createdBody.template.definition.commands[0]?.type).toBe('raw');

    const listed = await fetch(`${booted.baseUrl}/api/console/templates`, {
      headers: authOriginHeaders({ Cookie: memberCookie }),
    });
    expect(listed.status).toBe(200);
    const listBody = await listed.json() as {
      templates: Array<{ id: string, name: string }>
    };
    expect(listBody.templates.some(t => t.id === createdBody.template.id)).toBe(true);

    const updated = await fetch(
      `${booted.baseUrl}/api/console/templates/${createdBody.template.id}`,
      {
        method: 'PATCH',
        headers: authOriginHeaders({ Cookie: ctx.cookie }),
        body: JSON.stringify({ name: 'Kitchen ticket v2' }),
      },
    );
    expect(updated.status).toBe(200);
    const updatedBody = await updated.json() as { template: { name: string } };
    expect(updatedBody.template.name).toBe('Kitchen ticket v2');

    const deleted = await fetch(
      `${booted.baseUrl}/api/console/templates/${createdBody.template.id}`,
      {
        method: 'DELETE',
        headers: authOriginHeaders({ Cookie: ctx.cookie }),
      },
    );
    expect(deleted.status).toBe(204);

    const missing = await fetch(
      `${booted.baseUrl}/api/console/templates/${createdBody.template.id}`,
      { headers: authOriginHeaders({ Cookie: ctx.cookie }) },
    );
    expect(missing.status).toBe(404);
  });

  it('enqueue with templateId+inputs renders raw before lease; leased payload is raw only', async () => {
    const ctx = await bootstrapOrg('tpl-enqueue');

    const createTpl = await fetch(`${booted.baseUrl}/api/console/templates`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({
        name: 'Raw hex ticket',
        definition: TEMPLATE_DEFINITION,
      }),
    });
    expect(createTpl.status).toBe(201);
    const tplBody = await createTpl.json() as { template: { id: string } };

    const enqueue = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({
        printerId: ctx.printerId,
        templateId: tplBody.template.id,
        inputs: {
          title: 'Order 42',
          payload: EXPECTED_RAW_HEX,
        },
        idempotencyKey: `tpl-${suffix}`,
      }),
    });
    expect(enqueue.status).toBe(201);
    const enqueued = await enqueue.json() as {
      job: {
        id: string
        status: string
        payloadBase64: string
        payloadByteLength: number
      }
      deduped: boolean
    };
    expect(enqueued.deduped).toBe(false);
    expect(enqueued.job.status).toBe('queued');
    expect(enqueued.job.payloadByteLength).toBe(EXPECTED_RAW.byteLength);
    expect(Buffer.from(enqueued.job.payloadBase64, 'base64')).toEqual(EXPECTED_RAW);

    const agent = new FakePrinterAgent(booted.baseUrl, ctx.deviceToken);
    const leased = await agent.lease();
    expect(leased.response.status).toBe(200);
    expect(leased.job).not.toBeNull();
    expect(leased.job?.id).toBe(enqueued.job.id);
    // Black-box protocol assertion: leased payload is the rendered raw bytes only.
    expect(leased.job?.payloadBase64).toBe(EXPECTED_RAW.toString('base64'));
    expect(leased.job?.payloadByteLength).toBe(EXPECTED_RAW.byteLength);
    expect(Buffer.from(leased.job!.payloadBase64, 'base64')).toEqual(EXPECTED_RAW);
    // No template/inputs leak on the leased wire payload.
    expect(JSON.stringify(leased.job)).not.toContain('templateId');
    expect(JSON.stringify(leased.job)).not.toContain('{{payload}}');

    const succeeded = await agent.report(enqueued.job.id, 'succeeded');
    expect(succeeded.response.status).toBe(200);
  });

  it('invalid template or inputs fail clearly at enqueue time', async () => {
    const ctx = await bootstrapOrg('tpl-invalid');

    const createTpl = await fetch(`${booted.baseUrl}/api/console/templates`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({
        name: 'Strict inputs',
        definition: TEMPLATE_DEFINITION,
      }),
    });
    expect(createTpl.status).toBe(201);
    const tplBody = await createTpl.json() as { template: { id: string } };

    const badInputs = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({
        printerId: ctx.printerId,
        templateId: tplBody.template.id,
        inputs: { title: 'missing payload' },
      }),
    });
    expect(badInputs.status).toBe(400);
    const badBody = await badInputs.json() as {
      error: string
      message: string
      details?: string[]
    };
    expect(badBody.error).toBe('invalid_template_inputs');
    expect(badBody.details?.length).toBeGreaterThan(0);

    const missingTpl = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({
        printerId: ctx.printerId,
        templateId: '00000000-0000-4000-8000-000000000000',
        inputs: { title: 'x', payload: EXPECTED_RAW_HEX },
      }),
    });
    expect(missingTpl.status).toBe(404);
    const missingBody = await missingTpl.json() as { error: string };
    expect(missingBody.error).toBe('template_not_found');

    const invalidDefinition = await fetch(`${booted.baseUrl}/api/console/templates`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({
        name: 'broken',
        definition: { commands: 'nope' },
      }),
    });
    expect(invalidDefinition.status).toBe(400);

    // Failed enqueue must not leave a leasable job.
    const agent = new FakePrinterAgent(booted.baseUrl, ctx.deviceToken);
    const idle = await agent.lease();
    expect(idle.response.status).toBe(204);
    expect(idle.job).toBeNull();
  });
});
