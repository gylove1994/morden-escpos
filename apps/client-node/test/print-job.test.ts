/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { AddressInfo } from 'node:net';
import { createServer } from 'node:net';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { LeasedJob } from '../src/protocol/types';
import { printLeasedJob } from '../src/print-job';

function leasedJob(overrides: Partial<LeasedJob>): LeasedJob {
  const payload = Buffer.from([0x1B, 0x40, 0x48, 0x49, 0x0A]);
  return {
    id: 'job_1',
    printerId: 'printer_1',
    printerAgentId: 'printer_agent_1',
    status: 'leased',
    payloadBase64: payload.toString('base64'),
    payloadByteLength: payload.byteLength,
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

describe('printLeasedJob connectionHints routing', () => {
  let server: ReturnType<typeof createServer> | null = null;
  let dir: string | null = null;

  afterEach(async () => {
    if (server) {
      await new Promise<void>(resolve => server!.close(() => resolve()));
      server = null;
    }
    if (dir) {
      await rm(dir, { recursive: true, force: true });
      dir = null;
    }
  });

  it('sends leased raw bytes over TCP when transport is tcp', async () => {
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

    const payload = Buffer.from([0x1B, 0x40, 0x54, 0x43, 0x50, 0x0A]);
    await printLeasedJob(leasedJob({
      payloadBase64: payload.toString('base64'),
      payloadByteLength: payload.byteLength,
      connectionHints: { transport: 'tcp', address: '127.0.0.1', port },
    }));
    await new Promise(resolve => setTimeout(resolve, 25));
    expect(Buffer.concat(chunks)).toEqual(payload);
  });

  it('sends leased raw bytes over USB device path (temp file stands in for hardware)', async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'client-node-usb-'));
    const devicePath = path.join(dir, 'lp0');
    const payload = Buffer.from([0x1B, 0x40, 0x55, 0x53, 0x42, 0x0A]);

    await printLeasedJob(leasedJob({
      payloadBase64: payload.toString('base64'),
      payloadByteLength: payload.byteLength,
      connectionHints: { transport: 'usb', path: devicePath },
    }));

    expect(await readFile(devicePath)).toEqual(payload);
  });

  it('sends leased raw bytes over Serial path with baudRate (temp file, no hardware)', async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'client-node-serial-'));
    const devicePath = path.join(dir, 'ttyUSB0');
    const payload = Buffer.from([0x1B, 0x40, 0x53, 0x45, 0x52, 0x0A]);

    await printLeasedJob(leasedJob({
      payloadBase64: payload.toString('base64'),
      payloadByteLength: payload.byteLength,
      connectionHints: {
        transport: 'serial',
        path: devicePath,
        baudRate: 115200,
      },
    }));

    expect(await readFile(devicePath)).toEqual(payload);
  });
});
