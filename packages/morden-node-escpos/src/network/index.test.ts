/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { AddressInfo } from 'node:net';
import { Buffer } from 'node:buffer';
import { createServer } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import NetworkAdapter from './index';

function listen(): Promise<{ server: ReturnType<typeof createServer>, port: number, chunks: Buffer[] }> {
  const chunks: Buffer[] = [];
  const server = createServer((socket) => {
    socket.on('data', (chunk) => {
      chunks.push(Buffer.from(chunk));
    });
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address() as AddressInfo;
      resolve({ server, port: address.port, chunks });
    });
  });
}

function openAdapter(adapter: NetworkAdapter): Promise<void> {
  return new Promise((resolve, reject) => {
    adapter.open((error) => {
      if (error)
        reject(error);
      else resolve();
    });
  });
}

function writeAdapter(adapter: NetworkAdapter, data: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    adapter.write(data, (error) => {
      if (error)
        reject(error);
      else resolve();
    });
  });
}

function closeAdapter(adapter: NetworkAdapter): Promise<void> {
  return new Promise((resolve, reject) => {
    adapter.close((error) => {
      if (error)
        reject(error);
      else resolve();
    });
  });
}

describe('networkAdapter', () => {
  let server: ReturnType<typeof createServer> | null = null;

  afterEach(async () => {
    if (server) {
      await new Promise<void>(resolve => server!.close(() => resolve()));
      server = null;
    }
  });

  it('writes raw bytes over TCP to a listening printer endpoint', async () => {
    const listening = await listen();
    server = listening.server;
    const payload = Buffer.from([0x1B, 0x40, 0x48, 0x69, 0x0A]);

    const adapter = new NetworkAdapter('127.0.0.1', listening.port);
    await openAdapter(adapter);
    await writeAdapter(adapter, payload);
    await closeAdapter(adapter);

    // Allow the server to receive the final chunk.
    await new Promise(resolve => setTimeout(resolve, 25));
    expect(Buffer.concat(listening.chunks)).toEqual(payload);
  });

  it('rejects invalid constructor arguments', () => {
    expect(() => new NetworkAdapter('')).toThrow(/non-empty address/);
    expect(() => new NetworkAdapter('127.0.0.1', 0)).toThrow(/port/);
  });
});
