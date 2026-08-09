/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { Buffer } from 'node:buffer';
import type {
  ConnectionHints,
  LeasedJob,
  SerialConnectionHints,
  TcpConnectionHints,
  UsbConnectionHints,
} from './protocol/types';
import {
  DevicePathAdapter,
  NetworkAdapter,
  Printer,
  SerialAdapter,
} from 'morden-node-escpos';
import { decodeJobPayload } from './protocol/codec';

type PrintAdapter = DevicePathAdapter | NetworkAdapter | SerialAdapter;

function openAdapter(adapter: PrintAdapter): Promise<void> {
  return new Promise((resolve, reject) => {
    adapter.open((error) => {
      if (error)
        reject(error);
      else resolve();
    });
  });
}

async function printWithAdapter(
  adapter: PrintAdapter,
  payload: Buffer,
): Promise<void> {
  await openAdapter(adapter);

  const printer = new Printer(adapter, {
    encoding: 'GB18030',
    width: 48,
  });

  try {
    printer.raw(payload);
    await printer.close();
  }
  catch (error) {
    await new Promise<void>((resolve) => {
      adapter.close(() => resolve());
    });
    throw error;
  }
}

/**
 * Print leased raw ESC/POS bytes using connectionHints to select transport.
 */
export async function printLeasedJob(job: LeasedJob): Promise<void> {
  const payload = decodeJobPayload(job);
  await printRawWithHints(job.connectionHints, payload);
}

export async function printRawWithHints(
  hints: ConnectionHints,
  payload: Buffer,
): Promise<void> {
  switch (hints.transport) {
    case 'tcp':
      return printRawOverTcp(hints, payload);
    case 'usb':
      return printRawOverUsb(hints, payload);
    case 'serial':
      return printRawOverSerial(hints, payload);
    default: {
      const exhaustive: never = hints;
      throw new Error(`Unknown connectionHints.transport: ${JSON.stringify(exhaustive)}`);
    }
  }
}

export async function printRawOverTcp(
  hints: TcpConnectionHints,
  payload: Buffer,
): Promise<void> {
  const adapter = new NetworkAdapter(hints.address, hints.port);
  await printWithAdapter(adapter, payload);
}

export async function printRawOverUsb(
  hints: UsbConnectionHints,
  payload: Buffer,
): Promise<void> {
  const adapter = new DevicePathAdapter(hints.path);
  await printWithAdapter(adapter, payload);
}

export async function printRawOverSerial(
  hints: SerialConnectionHints,
  payload: Buffer,
): Promise<void> {
  const adapter = new SerialAdapter(hints.path, hints.baudRate ?? 9600);
  await printWithAdapter(adapter, payload);
}
