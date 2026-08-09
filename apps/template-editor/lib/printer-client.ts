/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
'use client';

import type { PrintJobJSON } from 'morden-node-escpos/schema';
import type {
  PrinterDescriptor,
  TcpPrinterDescriptor,
  WebSerialPrinterDescriptor,
  WebUSBPrinterDescriptor,
} from './printer-api';

import {
  BrowserPrinterController,
  loadBrowserImage,
  TcpSocketAdapter,
  WebSerialAdapter,
  WebUSBAdapter,
} from 'morden-node-escpos/browser';

function hexadecimal(value: number): string {
  return value.toString(16).padStart(4, '0').toUpperCase();
}

function usbDescriptor(
  device: WebUSBPrinterDescriptor['device'],
  index = 0,
): WebUSBPrinterDescriptor {
  const identifier = device.serialNumber
    ?? `${device.vendorId}:${device.productId}:${index}`;
  return {
    id: `webusb:${identifier}`,
    label: device.productName
      ?? `USB ESC/POS ${hexadecimal(device.vendorId)}:${hexadecimal(device.productId)}`,
    transport: 'webusb',
    vendorId: device.vendorId,
    productId: device.productId,
    ...(device.serialNumber ? { serialNumber: device.serialNumber } : {}),
    device,
  };
}

function serialDescriptor(
  port: WebSerialPrinterDescriptor['port'],
  index = 0,
  baudRate = 9600,
): WebSerialPrinterDescriptor {
  const info = port.getInfo();
  const usbId = info.usbVendorId === undefined
    ? `port-${index + 1}`
    : `${hexadecimal(info.usbVendorId)}:${hexadecimal(info.usbProductId ?? 0)}`;
  return {
    id: `webserial:${usbId}:${index}`,
    label: `Serial ESC/POS ${usbId}`,
    transport: 'webserial',
    baudRate,
    port,
  };
}

export async function requestWebUSBPrinter(): Promise<WebUSBPrinterDescriptor> {
  return usbDescriptor(await WebUSBAdapter.requestDevice());
}

export async function getAuthorizedWebUSBPrinters(): Promise<WebUSBPrinterDescriptor[]> {
  const devices = await WebUSBAdapter.getAuthorizedDevices();
  return devices.map(usbDescriptor);
}

export async function requestWebSerialPrinter(
  baudRate: number,
): Promise<WebSerialPrinterDescriptor> {
  return serialDescriptor(await WebSerialAdapter.requestPort(), 0, baudRate);
}

export async function getAuthorizedWebSerialPrinters(
  baudRate: number,
): Promise<WebSerialPrinterDescriptor[]> {
  const ports = await WebSerialAdapter.getAuthorizedPorts();
  return ports.map((port, index) => serialDescriptor(port, index, baudRate));
}

export function createTcpPrinter(host: string, port: number): TcpPrinterDescriptor {
  return {
    id: `tcp:${host}:${port}`,
    label: `Network ESC/POS ${host}:${port}`,
    transport: 'tcp',
    host,
    port,
  };
}

export function isTcpPrintingSupported(): boolean {
  return TcpSocketAdapter.isSupported();
}

function createAdapter(printer: PrinterDescriptor) {
  switch (printer.transport) {
    case 'webusb':
      return new WebUSBAdapter(printer.device);
    case 'webserial':
      return new WebSerialAdapter(printer.port, printer.baudRate);
    case 'tcp':
      return new TcpSocketAdapter(printer.host, printer.port);
  }
}

let printQueue: Promise<void> = Promise.resolve();

function enqueuePrint<T>(task: () => Promise<T>): Promise<T> {
  const result = printQueue.then(task, task);
  printQueue = result.then(() => undefined, () => undefined);
  return result;
}

export function printTemplate(
  printer: PrinterDescriptor,
  template: PrintJobJSON,
  data: Record<string, unknown>,
): Promise<void> {
  return enqueuePrint(async () => {
    const controller = new BrowserPrinterController({
      adapter: createAdapter(printer),
      encoding: template.config?.encoding ?? 'GB18030',
      width: template.config?.width ?? 32,
      imageLoader: loadBrowserImage,
    });

    try {
      await controller.init();
      await controller.executeFromTemplate(template, data);
      await controller.flush();
    }
    finally {
      if (controller.isInit) {
        await controller.close();
      }
    }
  });
}

export interface PrinterError {
  code: 'notSelected' | 'permission' | 'disconnected' | 'failed'
  detail?: string
}

export function classifyPrinterError(error: unknown): PrinterError {
  const message = error instanceof Error ? error.message : String(error);
  if (/NotFoundError|No device selected|No port selected/i.test(message)) {
    return { code: 'notSelected' };
  }
  if (/SecurityError|secure context|permission|denied|access/i.test(message)) {
    return { code: 'permission' };
  }
  if (/NetworkError|disconnected|device unavailable|not available/i.test(message)) {
    return { code: 'disconnected' };
  }
  return { code: 'failed', detail: message };
}
