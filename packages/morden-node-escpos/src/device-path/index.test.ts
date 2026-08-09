/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import { Buffer } from 'node:buffer';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import DevicePathAdapter from './index';

function openAdapter(adapter: DevicePathAdapter): Promise<void> {
  return new Promise((resolve, reject) => {
    adapter.open((error) => {
      if (error)
        reject(error);
      else resolve();
    });
  });
}

function writeAdapter(adapter: DevicePathAdapter, data: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    adapter.write(data, (error) => {
      if (error)
        reject(error);
      else resolve();
    });
  });
}

function closeAdapter(adapter: DevicePathAdapter): Promise<void> {
  return new Promise((resolve, reject) => {
    adapter.close((error) => {
      if (error)
        reject(error);
      else resolve();
    });
  });
}

describe('devicePathAdapter', () => {
  let dir: string | null = null;

  afterEach(async () => {
    if (dir) {
      await rm(dir, { recursive: true, force: true });
      dir = null;
    }
  });

  it('writes raw bytes to a device path (temp file stands in for hardware)', async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'escpos-usb-'));
    const devicePath = path.join(dir, 'lp0');
    const payload = Buffer.from([0x1B, 0x40, 0x55, 0x53, 0x42, 0x0A]);

    const adapter = new DevicePathAdapter(devicePath);
    await openAdapter(adapter);
    await writeAdapter(adapter, payload);
    await closeAdapter(adapter);

    expect(await readFile(devicePath)).toEqual(payload);
  });

  it('rejects an empty path', () => {
    expect(() => new DevicePathAdapter('')).toThrow(/non-empty path/);
    expect(() => new DevicePathAdapter('   ')).toThrow(/non-empty path/);
  });
});
