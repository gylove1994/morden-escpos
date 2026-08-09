/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { LeasedJob, TcpConnectionHints } from './protocol/types';
import { decodeJobPayload } from './protocol/codec';
import { printRawOverTcp } from './print-job';

/**
 * Print leased raw ESC/POS bytes over TCP.
 * Prefer {@link printLeasedJob} from `./print-job` when connectionHints may be USB/Serial.
 */
export async function printLeasedJobOverTcp(job: LeasedJob): Promise<void> {
  const hints = job.connectionHints;
  if (hints.transport !== 'tcp') {
    throw new Error(
      `Unsupported connectionHints.transport "${hints.transport}" for TCP helper; use printLeasedJob`,
    );
  }
  await printRawOverTcp(hints, decodeJobPayload(job));
}

export { printRawOverTcp };
export type { TcpConnectionHints };
