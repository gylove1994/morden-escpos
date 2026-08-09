/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { ConnectionHints } from './connection-hints';
import type { PrintJobRow, PrintJobStatus } from './db/schema';
import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import { and, asc, desc, eq, inArray, isNotNull, lt } from 'drizzle-orm';
import { SERVER_CONFIG } from './config';
import { parseConnectionHintsJson } from './connection-hints';
import { db } from './db';
import { printer, printJob } from './db/schema';

export interface PrintJobPublic {
  id: string
  organizationId: string
  printerId: string
  printerAgentId: string
  status: PrintJobStatus
  payloadBase64: string
  payloadByteLength: number
  idempotencyKey: string | null
  leaseExpiresAt: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
  leasedAt: string | null
  printingAt: string | null
  completedAt: string | null
}

export interface LeasedJobPayload {
  id: string
  printerId: string
  printerAgentId: string
  status: 'leased'
  payloadBase64: string
  payloadByteLength: number
  connectionHints: ConnectionHints
  leaseExpiresAt: string
  createdAt: string
}

function asStatus(value: string): PrintJobStatus {
  switch (value) {
    case 'queued':
    case 'leased':
    case 'printing':
    case 'succeeded':
    case 'failed':
      return value;
    default:
      return 'queued';
  }
}

function toPublic(row: PrintJobRow): PrintJobPublic {
  return {
    id: row.id,
    organizationId: row.organizationId,
    printerId: row.printerId,
    printerAgentId: row.printerAgentId,
    status: asStatus(row.status),
    payloadBase64: row.payloadBase64,
    payloadByteLength: row.payloadByteLength,
    idempotencyKey: row.idempotencyKey,
    leaseExpiresAt: row.leaseExpiresAt?.toISOString() ?? null,
    errorMessage: row.errorMessage,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    leasedAt: row.leasedAt?.toISOString() ?? null,
    printingAt: row.printingAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

export function decodePayloadBase64(payloadBase64: string): Buffer {
  const normalized = payloadBase64.replace(/\s+/g, '');
  if (!/^[A-Z0-9+/]*={0,2}$/i.test(normalized) || normalized.length % 4 !== 0) {
    throw new InvalidPayloadError();
  }
  const buf = Buffer.from(normalized, 'base64');
  // Reject strings that are not valid base64 round-trips (Node is lenient).
  if (buf.toString('base64').replace(/=+$/, '') !== normalized.replace(/=+$/, '')) {
    throw new InvalidPayloadError();
  }
  if (buf.byteLength === 0) {
    throw new InvalidPayloadError('Payload must not be empty');
  }
  if (buf.byteLength > 256 * 1024) {
    throw new InvalidPayloadError('Payload exceeds 256 KiB MVP limit');
  }
  return buf;
}

export class InvalidPayloadError extends Error {
  constructor(message = 'Invalid base64 ESC/POS payload') {
    super(message);
    this.name = 'InvalidPayloadError';
  }
}

export class PrinterNotEnqueueableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PrinterNotEnqueueableError';
  }
}

export class JobReportConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JobReportConflictError';
  }
}

export async function listPrintJobs(
  organizationId: string,
  limit = 50,
): Promise<PrintJobPublic[]> {
  const rows = await db
    .select()
    .from(printJob)
    .where(eq(printJob.organizationId, organizationId))
    .orderBy(desc(printJob.createdAt))
    .limit(Math.min(Math.max(limit, 1), 200));
  return rows.map(toPublic);
}

export async function getPrintJob(input: {
  organizationId: string
  jobId: string
}): Promise<PrintJobPublic | null> {
  const rows = await db
    .select()
    .from(printJob)
    .where(
      and(
        eq(printJob.id, input.jobId),
        eq(printJob.organizationId, input.organizationId),
      ),
    )
    .limit(1);
  return rows[0] ? toPublic(rows[0]) : null;
}

/**
 * Enqueue a raw ESC/POS job for a Printer.
 * When an idempotency key matches an existing org job, returns that job and
 * `deduped: true` without creating a second print.
 */
export async function enqueueRawJob(input: {
  organizationId: string
  printerId: string
  payloadBase64: string
  idempotencyKey?: string | null
}): Promise<{ job: PrintJobPublic, deduped: boolean }> {
  const payload = decodePayloadBase64(input.payloadBase64);
  const idempotencyKey = input.idempotencyKey?.trim() || null;

  if (idempotencyKey) {
    const existing = await db
      .select()
      .from(printJob)
      .where(
        and(
          eq(printJob.organizationId, input.organizationId),
          eq(printJob.idempotencyKey, idempotencyKey),
        ),
      )
      .limit(1);
    if (existing[0]) {
      return { job: toPublic(existing[0]), deduped: true };
    }
  }

  const printers = await db
    .select()
    .from(printer)
    .where(
      and(
        eq(printer.id, input.printerId),
        eq(printer.organizationId, input.organizationId),
      ),
    )
    .limit(1);

  const target = printers[0];
  if (!target) {
    throw new PrinterNotEnqueueableError('Printer not found in Organization');
  }
  if (target.status !== 'active') {
    throw new PrinterNotEnqueueableError('Printer is disabled');
  }

  const now = new Date();
  try {
    const [row] = await db
      .insert(printJob)
      .values({
        id: randomUUID(),
        organizationId: input.organizationId,
        printerId: target.id,
        printerAgentId: target.printerAgentId,
        status: 'queued',
        payloadBase64: payload.toString('base64'),
        payloadByteLength: payload.byteLength,
        idempotencyKey,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!row) {
      throw new Error('Failed to enqueue print job');
    }

    return { job: toPublic(row), deduped: false };
  }
  catch (error) {
    // Concurrent idempotent retries: unique index race → return existing.
    if (idempotencyKey && isUniqueViolation(error)) {
      const existing = await db
        .select()
        .from(printJob)
        .where(
          and(
            eq(printJob.organizationId, input.organizationId),
            eq(printJob.idempotencyKey, idempotencyKey),
          ),
        )
        .limit(1);
      if (existing[0]) {
        return { job: toPublic(existing[0]), deduped: true };
      }
    }
    throw error;
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object'
    && error !== null
    && 'code' in error
    && (error as { code?: string }).code === '23505'
  );
}

/**
 * Return expired leased/printing jobs to queued so another poll can pick them up.
 */
export async function requeueExpiredLeases(
  now: Date = new Date(),
): Promise<number> {
  const result = await db
    .update(printJob)
    .set({
      status: 'queued',
      leaseExpiresAt: null,
      leasedAt: null,
      printingAt: null,
      errorMessage: null,
      updatedAt: now,
    })
    .where(
      and(
        inArray(printJob.status, ['leased', 'printing']),
        isNotNull(printJob.leaseExpiresAt),
        lt(printJob.leaseExpiresAt, now),
      ),
    )
    .returning({ id: printJob.id });
  return result.length;
}

/**
 * Short-poll lease: exclusively claim the next queued job for this Printer Agent.
 * Uses FOR UPDATE SKIP LOCKED so concurrent polls do not double-lease.
 */
export async function leaseNextJob(input: {
  printerAgentId: string
  organizationId: string
}): Promise<LeasedJobPayload | null> {
  const now = new Date();
  const leaseExpiresAt = new Date(now.getTime() + SERVER_CONFIG.JOB_LEASE_MS);

  return db.transaction(async (tx) => {
    await tx
      .update(printJob)
      .set({
        status: 'queued',
        leaseExpiresAt: null,
        leasedAt: null,
        printingAt: null,
        errorMessage: null,
        updatedAt: now,
      })
      .where(
        and(
          eq(printJob.printerAgentId, input.printerAgentId),
          inArray(printJob.status, ['leased', 'printing']),
          isNotNull(printJob.leaseExpiresAt),
          lt(printJob.leaseExpiresAt, now),
        ),
      );

    const candidates = await tx
      .select({
        job: printJob,
        connectionHintsJson: printer.connectionHintsJson,
      })
      .from(printJob)
      .innerJoin(printer, eq(printer.id, printJob.printerId))
      .where(
        and(
          eq(printJob.printerAgentId, input.printerAgentId),
          eq(printJob.organizationId, input.organizationId),
          eq(printJob.status, 'queued'),
          eq(printer.status, 'active'),
        ),
      )
      .orderBy(asc(printJob.createdAt))
      .limit(1)
      .for('update', { of: printJob, skipLocked: true });

    const candidate = candidates[0];
    if (!candidate) {
      return null;
    }

    const [leased] = await tx
      .update(printJob)
      .set({
        status: 'leased',
        leaseExpiresAt,
        leasedAt: now,
        printingAt: null,
        errorMessage: null,
        updatedAt: now,
      })
      .where(eq(printJob.id, candidate.job.id))
      .returning();

    if (!leased) {
      return null;
    }

    return {
      id: leased.id,
      printerId: leased.printerId,
      printerAgentId: leased.printerAgentId,
      status: 'leased',
      payloadBase64: leased.payloadBase64,
      payloadByteLength: leased.payloadByteLength,
      connectionHints: parseConnectionHintsJson(candidate.connectionHintsJson),
      leaseExpiresAt: leaseExpiresAt.toISOString(),
      createdAt: leased.createdAt.toISOString(),
    };
  });
}

/**
 * Printer Agent reports printing / succeeded / failed for a leased job.
 */
export async function reportJob(input: {
  printerAgentId: string
  organizationId: string
  jobId: string
  status: 'printing' | 'succeeded' | 'failed'
  errorMessage?: string | null
}): Promise<PrintJobPublic> {
  const now = new Date();

  return db.transaction(async (tx) => {
    // Requeue expired work first so stale leases cannot be reported after expiry.
    await tx
      .update(printJob)
      .set({
        status: 'queued',
        leaseExpiresAt: null,
        leasedAt: null,
        printingAt: null,
        errorMessage: null,
        updatedAt: now,
      })
      .where(
        and(
          eq(printJob.id, input.jobId),
          inArray(printJob.status, ['leased', 'printing']),
          isNotNull(printJob.leaseExpiresAt),
          lt(printJob.leaseExpiresAt, now),
        ),
      );

    const rows = await tx
      .select()
      .from(printJob)
      .where(
        and(
          eq(printJob.id, input.jobId),
          eq(printJob.printerAgentId, input.printerAgentId),
          eq(printJob.organizationId, input.organizationId),
        ),
      )
      .limit(1)
      .for('update');

    const job = rows[0];
    if (!job) {
      throw new JobReportConflictError('Job not found for this Printer Agent');
    }

    if (input.status === 'printing') {
      if (job.status !== 'leased' && job.status !== 'printing') {
        throw new JobReportConflictError(
          `Cannot report printing from status ${job.status}`,
        );
      }
      const leaseExpiresAt = new Date(now.getTime() + SERVER_CONFIG.JOB_LEASE_MS);
      const [updated] = await tx
        .update(printJob)
        .set({
          status: 'printing',
          printingAt: job.printingAt ?? now,
          leaseExpiresAt,
          updatedAt: now,
          errorMessage: null,
        })
        .where(eq(printJob.id, job.id))
        .returning();
      if (!updated) {
        throw new JobReportConflictError('Failed to update job');
      }
      return toPublic(updated);
    }

    if (job.status !== 'leased' && job.status !== 'printing') {
      throw new JobReportConflictError(
        `Cannot report ${input.status} from status ${job.status}`,
      );
    }

    if (input.status === 'failed') {
      const message = input.errorMessage?.trim();
      if (!message) {
        throw new JobReportConflictError('errorMessage is required when status is failed');
      }
      const [updated] = await tx
        .update(printJob)
        .set({
          status: 'failed',
          errorMessage: message,
          leaseExpiresAt: null,
          completedAt: now,
          updatedAt: now,
        })
        .where(eq(printJob.id, job.id))
        .returning();
      if (!updated) {
        throw new JobReportConflictError('Failed to update job');
      }
      return toPublic(updated);
    }

    const [updated] = await tx
      .update(printJob)
      .set({
        status: 'succeeded',
        errorMessage: null,
        leaseExpiresAt: null,
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(printJob.id, job.id))
      .returning();
    if (!updated) {
      throw new JobReportConflictError('Failed to update job');
    }
    return toPublic(updated);
  });
}

/**
 * Test helper: force a job's lease expiry into the past (HTTP tests only).
 */
export async function expireJobLeaseForTests(jobId: string): Promise<void> {
  const past = new Date(Date.now() - 1_000);
  await db
    .update(printJob)
    .set({ leaseExpiresAt: past, updatedAt: past })
    .where(eq(printJob.id, jobId));
}
