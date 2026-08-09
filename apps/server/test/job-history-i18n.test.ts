/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { BootedServer } from './harness';
import { Buffer } from 'node:buffer';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { parseConsoleLocale } from '../lib/i18n/locales';
import { formatMessage, getMessages } from '../lib/i18n/messages';
import {
  authOriginHeaders,
  createOrganization,
  signUp,
} from './auth-helpers';
import { FakePrinterAgent } from './fake-printer-agent';
import { bootServer } from './harness';

const ESC_POS_BYTES = Buffer.from([0x1B, 0x40, 0x48, 0x69, 0x0A]);
const ESC_POS_BASE64 = ESC_POS_BYTES.toString('base64');

describe('console job history + zh/en i18n (#14)', () => {
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
      deviceToken: agentBody.deviceToken,
      printerId: printerBody.printer.id,
    };
  }

  it('lists truthful statuses and failure messages in job history', async () => {
    const ctx = await bootstrapOrg('hist-fail');

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
    const drained = await agent.drainOne('failed', 'paper jam at cutter');
    expect(drained.final?.status).toBe('failed');
    expect(drained.final?.errorMessage).toBe('paper jam at cutter');

    const history = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      headers: { Cookie: ctx.cookie },
    });
    expect(history.status).toBe(200);
    const body = await history.json() as {
      jobs: Array<{
        id: string
        status: string
        errorMessage: string | null
        purpose: string
        parentJobId: string | null
        childCount: number
        relation: string
      }>
    };
    const listed = body.jobs.find(j => j.id === enqueued.job.id);
    expect(listed).toBeDefined();
    expect(listed?.status).toBe('failed');
    expect(listed?.errorMessage).toBe('paper jam at cutter');
    expect(listed?.purpose).toBe('standard');
    expect(listed?.parentJobId).toBeNull();
    expect(listed?.childCount).toBe(0);
    expect(listed?.relation).toBe('standalone');
  });

  it('labels template confirmation jobs in history (hook for #10)', async () => {
    const ctx = await bootstrapOrg('hist-confirm');

    const enqueue = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({
        printerId: ctx.printerId,
        payloadBase64: ESC_POS_BASE64,
        purpose: 'template_confirmation',
      }),
    });
    expect(enqueue.status).toBe(201);
    const enqueued = await enqueue.json() as {
      job: { id: string, purpose: string }
    };
    expect(enqueued.job.purpose).toBe('template_confirmation');

    const history = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      headers: { Cookie: ctx.cookie },
    });
    const body = await history.json() as {
      jobs: Array<{ id: string, purpose: string }>
    };
    const listed = body.jobs.find(j => j.id === enqueued.job.id);
    expect(listed?.purpose).toBe('template_confirmation');
  });

  it('exposes parent/child relationships when present (compatible with #8)', async () => {
    const ctx = await bootstrapOrg('hist-fanout');

    const parentEnqueue = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({
        printerId: ctx.printerId,
        payloadBase64: ESC_POS_BASE64,
        idempotencyKey: `parent-${suffix}`,
      }),
    });
    expect(parentEnqueue.status).toBe(201);
    const parentBody = await parentEnqueue.json() as { job: { id: string } };

    const childA = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({
        printerId: ctx.printerId,
        payloadBase64: ESC_POS_BASE64,
        parentJobId: parentBody.job.id,
      }),
    });
    expect(childA.status).toBe(201);
    const childABody = await childA.json() as {
      job: { id: string, parentJobId: string | null }
    };
    expect(childABody.job.parentJobId).toBe(parentBody.job.id);

    const childB = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({
        printerId: ctx.printerId,
        payloadBase64: ESC_POS_BASE64,
        parentJobId: parentBody.job.id,
      }),
    });
    expect(childB.status).toBe(201);

    const history = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      headers: { Cookie: ctx.cookie },
    });
    const body = await history.json() as {
      jobs: Array<{
        id: string
        parentJobId: string | null
        childCount: number
        relation: string
      }>
    };

    const parent = body.jobs.find(j => j.id === parentBody.job.id);
    expect(parent?.relation).toBe('parent');
    expect(parent?.childCount).toBe(2);
    expect(parent?.parentJobId).toBeNull();

    const child = body.jobs.find(j => j.id === childABody.job.id);
    expect(child?.relation).toBe('child');
    expect(child?.parentJobId).toBe(parentBody.job.id);
    expect(child?.childCount).toBe(0);

    const missingParent = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: ctx.cookie }),
      body: JSON.stringify({
        printerId: ctx.printerId,
        payloadBase64: ESC_POS_BASE64,
        parentJobId: '00000000-0000-4000-8000-000000000000',
      }),
    });
    expect(missingParent.status).toBe(400);
  });

  it('supports zh and en console message catalogs only', () => {
    expect(parseConsoleLocale('zh')).toBe('zh');
    expect(parseConsoleLocale('en')).toBe('en');
    expect(parseConsoleLocale('ja')).toBe('en');
    expect(parseConsoleLocale(undefined)).toBe('en');

    const en = getMessages('en');
    const zh = getMessages('zh');
    expect(en.jobs.kindConfirmation).toMatch(/confirmation/i);
    expect(zh.jobs.kindConfirmation).toContain('确认');
    expect(en.nav.jobs).toBe('Jobs');
    expect(zh.nav.jobs).toBe('任务');
    expect(
      formatMessage(zh.jobs.relationParent, { count: 2 }),
    ).toContain('2');
    expect(
      formatMessage(en.jobs.relationChild, { parentId: 'abc' }),
    ).toContain('abc');
  });

  it('serves console HTML in the selected locale cookie', async () => {
    const ctx = await bootstrapOrg('hist-i18n');

    const enPage = await fetch(`${booted.baseUrl}/console/jobs`, {
      headers: {
        Cookie: `${ctx.cookie}; console_locale=en`,
      },
    });
    expect(enPage.status).toBe(200);
    const enHtml = await enPage.text();
    expect(enHtml).toContain('lang="en"');
    expect(enHtml).toMatch(/Job history|Print jobs/);

    const zhPage = await fetch(`${booted.baseUrl}/console/jobs`, {
      headers: {
        Cookie: `${ctx.cookie}; console_locale=zh`,
      },
    });
    expect(zhPage.status).toBe(200);
    const zhHtml = await zhPage.text();
    expect(zhHtml).toContain('lang="zh"');
    expect(zhHtml).toMatch(/任务历史|打印任务/);
  });
});
