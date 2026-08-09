/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { NetworkAdapter, Printer } from 'morden-node-escpos';
import type { LeasedJob, TcpConnectionHints } from './protocol/types';
import { decodeJobPayload } from './protocol/codec';

function openAdapter(adapter: NetworkAdapter): Promise<void> {
  return new Promise((resolve, reject) => {
    adapter.open((error) => {
      if (error)
        reject(error);
      else resolve();
    });
  });
}

/**
 * Print leased raw ESC/POS bytes over TCP using the MIT NetworkAdapter stack.
 */
export async function printLeasedJobOverTcp(job: LeasedJob): Promise<void> {
  const hints = job.connectionHints;
  if (hints.transport !== 'tcp') {
    throw new Error(
      `Unsupported connectionHints.transport "${hints.transport}" in this Printer Agent slice (TCP only)`,
    );
  }
  await printRawOverTcp(hints, decodeJobPayload(job));
}

export async function printRawOverTcp(
  hints: TcpConnectionHints,
  payload: Buffer,
): Promise<void> {
  const adapter = new NetworkAdapter(hints.address, hints.port);
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
