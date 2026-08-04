import { vi } from 'vitest';

vi.mock('usb', async importOriginal => ({
  ...await importOriginal<typeof import('usb')>(),
  getDeviceList: () => [],
}));
