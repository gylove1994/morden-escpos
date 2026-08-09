/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { ProtocolClient } from '../src/protocol/client';
import type { LeasedJob } from '../src/protocol/types';
import { describe, expect, it, vi } from 'vitest';
import { IdleBackoff } from '../src/backoff';
import { drainOnce, runPrinterAgentLoop } from '../src/loop';

function leasedJob(overrides: Partial<LeasedJob> = {}): LeasedJob {
  return {
    id: 'job_1',
    printerId: 'printer_1',
    printerAgentId: 'printer_agent_1',
    status: 'leased',
    payloadBase64: 'G0BISQo=',
    payloadByteLength: 5,
    connectionHints: {
      transport: 'tcp',
      address: '127.0.0.1',
      port: 9100,
    },
    leaseExpiresAt: '2026-08-09T12:00:30.000Z',
    createdAt: '2026-08-09T12:00:00.000Z',
    ...overrides,
  };
}

describe('printer Agent drain / poll loop', () => {
  it('reports printing → succeeded when TCP print works', async () => {
    const job = leasedJob();
    const reports: Array<{ status: string, errorMessage?: string }> = [];
    const client = {
      lease: vi.fn(async () => job),
      report: vi.fn(async (_id: string, status: string, errorMessage?: string) => {
        reports.push({ status, ...(errorMessage ? { errorMessage } : {}) });
        return { id: job.id, status, printerAgentId: job.printerAgentId };
      }),
    } as unknown as ProtocolClient;

    const result = await drainOnce({
      client,
      backoff: new IdleBackoff({ initialMs: 10, maxMs: 20, multiplier: 2 }),
      afterWorkMs: 0,
      printJob: async () => {},
      logger: { info() {}, warn() {}, error() {} },
    });

    expect(result).toEqual({
      kind: 'printed',
      jobId: 'job_1',
      printerAgentId: 'printer_agent_1',
    });
    expect(reports).toEqual([
      { status: 'printing' },
      { status: 'succeeded' },
    ]);
  });

  it('reports printing → failed with errorMessage when print throws', async () => {
    const job = leasedJob();
    const reports: Array<{ status: string, errorMessage?: string }> = [];
    const client = {
      lease: vi.fn(async () => job),
      report: vi.fn(async (_id: string, status: string, errorMessage?: string) => {
        reports.push({ status, ...(errorMessage ? { errorMessage } : {}) });
        return { id: job.id, status, printerAgentId: job.printerAgentId };
      }),
    } as unknown as ProtocolClient;

    const result = await drainOnce({
      client,
      backoff: new IdleBackoff({ initialMs: 10, maxMs: 20, multiplier: 2 }),
      afterWorkMs: 0,
      printJob: async () => {
        throw new Error('connection refused');
      },
      logger: { info() {}, warn() {}, error() {} },
    });

    expect(result.kind).toBe('failed');
    expect(reports).toEqual([
      { status: 'printing' },
      { status: 'failed', errorMessage: 'connection refused' },
    ]);
  });

  it('applies idle backoff when lease returns no work', async () => {
    const backoff = new IdleBackoff({ initialMs: 5, maxMs: 20, multiplier: 2 });
    let leases = 0;
    const client = {
      lease: vi.fn(async () => {
        leases += 1;
        return null;
      }),
      report: vi.fn(),
    } as unknown as ProtocolClient;

    const abort = new AbortController();
    const loopPromise = runPrinterAgentLoop({
      client,
      backoff,
      afterWorkMs: 0,
      signal: abort.signal,
      logger: { info() {}, warn() {}, error() {} },
    });

    await new Promise(resolve => setTimeout(resolve, 40));
    abort.abort();
    await loopPromise.catch(() => {});

    expect(leases).toBeGreaterThanOrEqual(2);
    expect(backoff.currentMs()).toBeGreaterThan(5);
  });
});
