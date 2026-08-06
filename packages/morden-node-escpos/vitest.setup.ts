/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import { vi } from 'vitest';

vi.mock('usb', async importOriginal => ({
  ...await importOriginal<typeof import('usb')>(),
  getDeviceList: () => [],
}));
