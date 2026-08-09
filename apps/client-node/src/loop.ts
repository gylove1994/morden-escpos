/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { IdleBackoff, sleep } from './backoff';
import type { ProtocolClient } from './protocol/client';
import { assertAllowedJobTransition } from './protocol/transitions';
import type { LeasedJob } from './protocol/types';
import { printLeasedJobOverTcp } from './tcp-print';

export type PrinterAgentLoopOptions = {
  client: ProtocolClient
  backoff: IdleBackoff
  afterWorkMs: number
  signal?: AbortSignal
  /** Injected for tests; defaults to TCP print via MIT NetworkAdapter. */
  printJob?: (job: LeasedJob) => Promise<void>
  logger?: {
    info: (message: string, meta?: Record<string, unknown>) => void
    warn: (message: string, meta?: Record<string, unknown>) => void
    error: (message: string, meta?: Record<string, unknown>) => void
  }
};

export type DrainResult
  = | { kind: 'idle' }
    | { kind: 'printed', jobId: string, printerAgentId: string }
    | { kind: 'failed', jobId: string, printerAgentId: string, errorMessage: string };

/**
 * Lease one job (if any), report printing, print over TCP, report outcome.
 */
export async function drainOnce(options: PrinterAgentLoopOptions): Promise<DrainResult> {
  const {
    client,
    printJob = printLeasedJobOverTcp,
    logger = defaultLogger,
  } = options;

  const job = await client.lease();
  if (!job) {
    return { kind: 'idle' };
  }

  logger.info('Leased job', {
    jobId: job.id,
    printerAgentId: job.printerAgentId,
    printerId: job.printerId,
  });

  assertAllowedJobTransition('leased', 'printing');
  await client.report(job.id, 'printing');

  try {
    await printJob(job);
    assertAllowedJobTransition('printing', 'succeeded');
    await client.report(job.id, 'succeeded');
    return {
      kind: 'printed',
      jobId: job.id,
      printerAgentId: job.printerAgentId,
    };
  }
  catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Print failed', { jobId: job.id, errorMessage });
    assertAllowedJobTransition('printing', 'failed');
    await client.report(job.id, 'failed', errorMessage);
    return {
      kind: 'failed',
      jobId: job.id,
      printerAgentId: job.printerAgentId,
      errorMessage,
    };
  }
}

/**
 * Short-poll loop with idle backoff for the Node Printer Agent.
 */
export async function runPrinterAgentLoop(options: PrinterAgentLoopOptions): Promise<void> {
  const { backoff, afterWorkMs, signal, logger = defaultLogger } = options;

  while (!signal?.aborted) {
    try {
      const result = await drainOnce(options);
      if (result.kind === 'idle') {
        const waitMs = backoff.onIdle();
        logger.info('No work; idle backoff', { waitMs });
        await sleep(waitMs, signal);
        continue;
      }

      backoff.onWork();
      logger.info('Job handled', {
        kind: result.kind,
        jobId: result.jobId,
        printerAgentId: result.printerAgentId,
      });
      if (afterWorkMs > 0) {
        await sleep(afterWorkMs, signal);
      }
    }
    catch (error) {
      if (signal?.aborted) {
        break;
      }
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Printer Agent poll cycle failed', { message });
      const waitMs = backoff.onIdle();
      await sleep(waitMs, signal);
    }
  }
}

const defaultLogger = {
  info(message: string, meta?: Record<string, unknown>) {
    if (meta) {
      console.info(`[printer-agent] ${message}`, meta);
    }
    else {
      console.info(`[printer-agent] ${message}`);
    }
  },
  warn(message: string, meta?: Record<string, unknown>) {
    if (meta) {
      console.warn(`[printer-agent] ${message}`, meta);
    }
    else {
      console.warn(`[printer-agent] ${message}`);
    }
  },
  error(message: string, meta?: Record<string, unknown>) {
    if (meta) {
      console.error(`[printer-agent] ${message}`, meta);
    }
    else {
      console.error(`[printer-agent] ${message}`);
    }
  },
};
