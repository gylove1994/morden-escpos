/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { AddressInfo } from 'node:net';
import type { LeasedJob } from '../src/protocol/types';
import { Buffer } from 'node:buffer';
import { createServer } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { printLeasedJobOverTcp } from '../src/tcp-print';

describe('printLeasedJobOverTcp', () => {
  let server: ReturnType<typeof createServer> | null = null;

  afterEach(async () => {
    if (server) {
      await new Promise<void>(resolve => server!.close(() => resolve()));
      server = null;
    }
  });

  it('sends leased raw bytes to a TCP printer via the MIT NetworkAdapter stack', async () => {
    const chunks: Buffer[] = [];
    server = createServer((socket) => {
      socket.on('data', chunk => chunks.push(Buffer.from(chunk)));
    });

    const port = await new Promise<number>((resolve, reject) => {
      server!.once('error', reject);
      server!.listen(0, '127.0.0.1', () => {
        resolve((server!.address() as AddressInfo).port);
      });
    });

    const payload = Buffer.from([0x1B, 0x40, 0x48, 0x49, 0x0A]);
    const job: LeasedJob = {
      id: 'job_tcp_1',
      printerId: 'printer_1',
      printerAgentId: 'printer_agent_1',
      status: 'leased',
      payloadBase64: payload.toString('base64'),
      payloadByteLength: payload.byteLength,
      connectionHints: {
        transport: 'tcp',
        address: '127.0.0.1',
        port,
      },
      leaseExpiresAt: '2026-08-09T12:00:30.000Z',
      createdAt: '2026-08-09T12:00:00.000Z',
    };

    await printLeasedJobOverTcp(job);
    await new Promise(resolve => setTimeout(resolve, 25));

    expect(Buffer.concat(chunks)).toEqual(payload);
  });

  it('rejects non-TCP connection hints for the TCP helper', async () => {
    const job: LeasedJob = {
      id: 'job_usb_1',
      printerId: 'printer_1',
      printerAgentId: 'printer_agent_1',
      status: 'leased',
      payloadBase64: 'G0BISQo=',
      payloadByteLength: 5,
      connectionHints: {
        transport: 'usb',
        path: '/dev/usb/lp0',
      },
      leaseExpiresAt: '2026-08-09T12:00:30.000Z',
      createdAt: '2026-08-09T12:00:00.000Z',
    };

    await expect(printLeasedJobOverTcp(job)).rejects.toThrow(/TCP helper/);
  });
});
