/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { WebUSBDevice } from './webusb';

import { Buffer } from 'node:buffer';
import { describe, expect, it, vi } from 'vitest';

import { WebUSBAdapter } from './webusb';

function callbackResult(
  action: (callback: (error: Error | null) => void) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    action(error => error ? reject(error) : resolve());
  });
}

describe('webUSBAdapter', () => {
  it('claims the printer interface and writes in chunks', async () => {
    const transferOut = vi.fn().mockResolvedValue(undefined);
    const releaseInterface = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn().mockResolvedValue(undefined);
    const configuration = {
      configurationValue: 1,
      interfaces: [{
        interfaceNumber: 2,
        alternates: [{
          alternateSetting: 0,
          interfaceClass: 0x07,
          endpoints: [{
            endpointNumber: 3,
            direction: 'out' as const,
            type: 'bulk' as const,
          }],
        }],
      }],
    };
    const device: WebUSBDevice = {
      opened: true,
      vendorId: 0x1234,
      productId: 0x5678,
      configuration,
      configurations: [configuration],
      open: vi.fn(),
      close,
      selectConfiguration: vi.fn(),
      claimInterface: vi.fn().mockResolvedValue(undefined),
      releaseInterface,
      selectAlternateInterface: vi.fn(),
      transferOut,
    };
    const adapter = new WebUSBAdapter(device);

    await callbackResult(callback => adapter.open(callback));
    await callbackResult(callback => adapter.write(Buffer.alloc(5000), callback));
    await callbackResult(callback => adapter.close(callback));

    expect(device.claimInterface).toHaveBeenCalledWith(2);
    expect(transferOut).toHaveBeenCalledTimes(2);
    expect(transferOut.mock.calls[0]?.[0]).toBe(3);
    expect(transferOut.mock.calls[0]?.[1]).toHaveLength(4096);
    expect(transferOut.mock.calls[1]?.[1]).toHaveLength(904);
    expect(releaseInterface).toHaveBeenCalledWith(2);
    expect(close).toHaveBeenCalledOnce();
  });
});
