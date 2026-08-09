/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { JobStatus, ReportStatus } from './types';

/**
 * Allowed Printer Agent report transitions for a leased job.
 * Server also enforces these; the client checks locally before reporting.
 */
const ALLOWED: ReadonlyArray<readonly [JobStatus, ReportStatus]> = [
  ['leased', 'printing'],
  ['printing', 'succeeded'],
  ['printing', 'failed'],
];

export function isAllowedJobTransition(from: JobStatus, to: ReportStatus): boolean {
  return ALLOWED.some(([a, b]) => a === from && b === to);
}

export function assertAllowedJobTransition(from: JobStatus, to: ReportStatus): void {
  if (!isAllowedJobTransition(from, to)) {
    throw new Error(`Illegal job status transition: ${from} → ${to}`);
  }
}
