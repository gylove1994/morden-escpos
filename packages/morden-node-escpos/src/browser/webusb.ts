/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { Buffer } from 'node:buffer';

import { Adapter } from '../adapter';

const PRINTER_CLASS = 0x07;
const DEFAULT_CONFIGURATION = 1;
const TRANSFER_CHUNK_BYTES = 4 * 1024;

interface USBEndpointLike {
  endpointNumber: number
  direction: 'in' | 'out'
  type: 'bulk' | 'interrupt' | 'isochronous'
}

interface USBAlternateLike {
  alternateSetting: number
  interfaceClass: number
  endpoints: USBEndpointLike[]
}

interface USBInterfaceLike {
  interfaceNumber: number
  alternates: USBAlternateLike[]
}

interface USBConfigurationLike {
  configurationValue: number
  interfaces: USBInterfaceLike[]
}

export interface WebUSBDevice {
  opened: boolean
  vendorId: number
  productId: number
  productName?: string
  serialNumber?: string
  configuration: USBConfigurationLike | null
  configurations: USBConfigurationLike[]
  open: () => Promise<void>
  close: () => Promise<void>
  selectConfiguration: (configurationValue: number) => Promise<void>
  claimInterface: (interfaceNumber: number) => Promise<void>
  releaseInterface: (interfaceNumber: number) => Promise<void>
  selectAlternateInterface: (interfaceNumber: number, alternateSetting: number) => Promise<void>
  transferOut: (endpointNumber: number, data: BufferSource) => Promise<unknown>
}

interface WebUSB {
  getDevices: () => Promise<WebUSBDevice[]>
  requestDevice: (options: { filters: Array<{ classCode: number }> }) => Promise<WebUSBDevice>
}

function getWebUSB(): WebUSB {
  const usb = (navigator as Navigator & { usb?: WebUSB }).usb;
  if (!usb) {
    throw new Error('当前浏览器不支持 WebUSB，请使用最新版 Chrome 或 Edge。');
  }
  return usb;
}

export class WebUSBAdapter extends Adapter<[]> {
  private interfaceNumber: number | null = null;
  private endpointNumber: number | null = null;

  constructor(readonly device: WebUSBDevice) {
    super();
  }

  static requestDevice(): Promise<WebUSBDevice> {
    return getWebUSB().requestDevice({ filters: [{ classCode: PRINTER_CLASS }] });
  }

  static getAuthorizedDevices(): Promise<WebUSBDevice[]> {
    return getWebUSB().getDevices();
  }

  open(callback?: (error: Error | null) => void): this {
    void this.openDevice().then(
      () => callback?.(null),
      error => callback?.(error instanceof Error ? error : new Error(String(error))),
    );
    return this;
  }

  private async openDevice(): Promise<void> {
    if (!this.device.opened) {
      await this.device.open();
    }
    if (!this.device.configuration) {
      const configurationValue
        = this.device.configurations[0]?.configurationValue ?? DEFAULT_CONFIGURATION;
      await this.device.selectConfiguration(configurationValue);
    }

    const interfaces = this.device.configuration?.interfaces ?? [];
    for (const usbInterface of interfaces) {
      for (const alternate of usbInterface.alternates) {
        const endpoint = alternate.endpoints.find(item =>
          item.direction === 'out' && item.type === 'bulk',
        );
        if (alternate.interfaceClass !== PRINTER_CLASS || !endpoint) {
          continue;
        }

        await this.device.claimInterface(usbInterface.interfaceNumber);
        if (alternate.alternateSetting !== 0) {
          await this.device.selectAlternateInterface(
            usbInterface.interfaceNumber,
            alternate.alternateSetting,
          );
        }
        this.interfaceNumber = usbInterface.interfaceNumber;
        this.endpointNumber = endpoint.endpointNumber;
        this.emit('connect', this.device);
        return;
      }
    }

    throw new Error('无法找到 USB 打印机的批量写入端点。');
  }

  write(data: Buffer | string, callback?: (error: Error | null) => void): this {
    void this.writeData(data).then(
      () => callback?.(null),
      error => callback?.(error instanceof Error ? error : new Error(String(error))),
    );
    return this;
  }

  private async writeData(data: Buffer | string): Promise<void> {
    if (this.endpointNumber === null) {
      throw new Error('WebUSB 打印机尚未连接。');
    }
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    for (let offset = 0; offset < bytes.byteLength; offset += TRANSFER_CHUNK_BYTES) {
      const chunk = bytes.subarray(offset, offset + TRANSFER_CHUNK_BYTES);
      const transferable = new Uint8Array(chunk.byteLength);
      transferable.set(chunk);
      await this.device.transferOut(this.endpointNumber, transferable);
    }
    this.emit('data', data);
  }

  close(callback?: (error: Error | null) => void): this {
    void this.closeDevice().then(
      () => callback?.(null),
      error => callback?.(error instanceof Error ? error : new Error(String(error))),
    );
    return this;
  }

  private async closeDevice(): Promise<void> {
    if (this.interfaceNumber !== null && this.device.opened) {
      await this.device.releaseInterface(this.interfaceNumber);
    }
    if (this.device.opened) {
      await this.device.close();
    }
    this.interfaceNumber = null;
    this.endpointNumber = null;
    this.emit('close', this.device);
  }

  read(): void {}
}
