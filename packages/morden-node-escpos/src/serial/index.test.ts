/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { SerialPortLike } from './index';
import { Buffer } from 'node:buffer';
import { EventEmitter } from 'node:events';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import SerialAdapter from './index';

function openAdapter(adapter: SerialAdapter): Promise<void> {
  return new Promise((resolve, reject) => {
    adapter.open((error) => {
      if (error)
        reject(error);
      else resolve();
    });
  });
}

function writeAdapter(adapter: SerialAdapter, data: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    adapter.write(data, (error) => {
      if (error)
        reject(error);
      else resolve();
    });
  });
}

function closeAdapter(adapter: SerialAdapter): Promise<void> {
  return new Promise((resolve, reject) => {
    adapter.close((error) => {
      if (error)
        reject(error);
      else resolve();
    });
  });
}

class FakeSerialPort extends EventEmitter implements SerialPortLike {
  readonly chunks: Buffer[] = [];
  opened = false;
  closed = false;

  constructor(
    readonly options: { path: string, baudRate: number },
  ) {
    super();
  }

  open(): void {
    this.opened = true;
  }

  write(data: Buffer, callback: (error: Error | null | undefined) => void): void {
    this.chunks.push(Buffer.from(data));
    callback(null);
  }

  close(callback?: (error: Error | null | undefined) => void): void {
    this.closed = true;
    callback?.(null);
  }
}

describe('serialAdapter', () => {
  let dir: string | null = null;

  afterEach(async () => {
    if (dir) {
      await rm(dir, { recursive: true, force: true });
      dir = null;
    }
  });

  it('writes raw bytes to a serial path via filesystem (temp file, no hardware)', async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'escpos-serial-'));
    const devicePath = path.join(dir, 'ttyUSB0');
    const payload = Buffer.from([0x1B, 0x40, 0x53, 0x45, 0x52, 0x0A]);

    const adapter = new SerialAdapter(devicePath, 115200);
    await openAdapter(adapter);
    await writeAdapter(adapter, payload);
    await closeAdapter(adapter);

    expect(await readFile(devicePath)).toEqual(payload);
  });

  it('applies baudRate through an injectable port factory (adapter seam, no hardware)', async () => {
    let created: FakeSerialPort | null = null;
    const payload = Buffer.from([0x1B, 0x40]);

    const adapter = new SerialAdapter('/dev/ttyUSB9', 57600, {
      portFactory: (options) => {
        created = new FakeSerialPort(options);
        return created;
      },
    });

    await openAdapter(adapter);
    await writeAdapter(adapter, payload);
    await closeAdapter(adapter);

    expect(created).not.toBeNull();
    expect(created!.options).toEqual({ path: '/dev/ttyUSB9', baudRate: 57600 });
    expect(created!.opened).toBe(true);
    expect(created!.closed).toBe(true);
    expect(Buffer.concat(created!.chunks)).toEqual(payload);
  });

  it('rejects invalid constructor arguments', () => {
    expect(() => new SerialAdapter('')).toThrow(/non-empty path/);
    expect(() => new SerialAdapter('/dev/ttyUSB0', 0)).toThrow(/baudRate/);
    expect(() => new SerialAdapter('/dev/ttyUSB0', 299)).toThrow(/baudRate/);
  });
});
