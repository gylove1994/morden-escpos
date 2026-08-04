import type { PrintJobJSON } from 'morden-node-escpos/schema';

import type { PrinterDescriptor } from './printer-api';
import { PrinterController, USBAdapter } from 'morden-node-escpos';

import 'server-only';

function hexadecimal(value: number): string {
  return value.toString(16).padStart(4, '0').toUpperCase();
}

export function findUsbPrinters(): PrinterDescriptor[] {
  return USBAdapter.findPrinter().map((device) => {
    const { idVendor: vendorId, idProduct: productId } = device.deviceDescriptor;
    const id = `${vendorId}:${productId}:${device.busNumber}:${device.deviceAddress}`;

    return {
      id,
      label: `USB ESC/POS ${hexadecimal(vendorId)}:${hexadecimal(productId)}`,
      vendorId,
      productId,
      busNumber: device.busNumber,
      deviceAddress: device.deviceAddress,
    };
  });
}

export function printerErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (/LIBUSB_ERROR_ACCESS|access denied|permission/i.test(message)) {
    return '没有访问打印机的权限。请配置 USB/udev 权限后重试。';
  }
  if (/LIBUSB_ERROR_BUSY|resource busy|busy/i.test(message)) {
    return '打印机正被其他程序占用，请关闭占用程序后重试。';
  }
  if (/not available|not find printer|no device|not found/i.test(message)) {
    return '所选打印机已断开，请刷新设备列表。';
  }
  if (/endpoint/i.test(message)) {
    return '无法找到打印机写入端点，请检查设备是否兼容 ESC/POS。';
  }

  return `打印失败：${message}`;
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
    const controller = new PrinterController({
      encoding: template.config?.encoding ?? 'GB18030',
      width: template.config?.width ?? 32,
      device: printer,
    });

    try {
      await controller.init();
      await controller.executeFromTemplate(template, data);
      await controller.flush();
    }
    finally {
      await controller.close();
    }
  });
}
