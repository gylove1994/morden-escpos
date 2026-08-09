/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { ConnectionHints } from './connection-hints';
import type { PrintJobKind, PrintJobPurpose, PrintJobRow, PrintJobStatus } from './db/schema';
import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import { and, asc, desc, eq, inArray, isNotNull, lt, ne } from 'drizzle-orm';
import { SERVER_CONFIG } from './config';
import { parseConnectionHintsJson } from './connection-hints';
import { db } from './db';
import { printer, printJob } from './db/schema';
import { resolveActiveGroupPrinters } from './printer-groups';
import { renderTemplateJob, TemplateRenderError } from './template-render';
import { getTemplate, TemplateNotFoundError } from './templates';

export interface PrintJobPublic {
  id: string
  organizationId: string
  printerId: string | null
  printerAgentId: string
  printerGroupId: string | null
  parentJobId: string | null
  kind: PrintJobKind
  purpose: PrintJobPurpose
  templateId: string | null
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

function asKind(value: string): PrintJobKind {
  switch (value) {
    case 'parent':
    case 'child':
    case 'single':
      return value;
    default:
      return 'single';
  }
}

function asPurpose(value: string): PrintJobPurpose {
  return value === 'template_confirmation' ? 'template_confirmation' : 'standard';
}

function asStatus(value: string): PrintJobStatus {
  switch (value) {
    case 'queued':
    case 'leased':
    case 'printing':
    case 'succeeded':
    case 'failed':
    case 'partial_failed':
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
    printerGroupId: row.printerGroupId,
    parentJobId: row.parentJobId,
    kind: asKind(row.kind),
    purpose: asPurpose(row.purpose),
    templateId: row.templateId,
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

export class PrinterGroupNotEnqueueableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PrinterGroupNotEnqueueableError';
  }
}

export class JobReportConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JobReportConflictError';
  }
}

export class JobRetryConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JobRetryConflictError';
  }
}

export class EnqueueTargetRequiredError extends Error {
  constructor(message = 'Select a Printer or Printer Group before confirmation print') {
    super(message);
    this.name = 'EnqueueTargetRequiredError';
  }
}

export { TemplateNotFoundError, TemplateRenderError };

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

export async function listChildJobs(input: {
  organizationId: string
  parentJobId: string
}): Promise<PrintJobPublic[]> {
  const rows = await db
    .select()
    .from(printJob)
    .where(
      and(
        eq(printJob.organizationId, input.organizationId),
        eq(printJob.parentJobId, input.parentJobId),
      ),
    )
    .orderBy(asc(printJob.createdAt));
  return rows.map(toPublic);
}

async function findByIdempotencyKey(input: {
  organizationId: string
  idempotencyKey: string
}): Promise<PrintJobRow | null> {
  const existing = await db
    .select()
    .from(printJob)
    .where(
      and(
        eq(printJob.organizationId, input.organizationId),
        eq(printJob.idempotencyKey, input.idempotencyKey),
      ),
    )
    .limit(1);
  return existing[0] ?? null;
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
  purpose?: PrintJobPurpose
  templateId?: string | null
}): Promise<{ job: PrintJobPublic, children: PrintJobPublic[], deduped: boolean }> {
  const payload = decodePayloadBase64(input.payloadBase64);
  const idempotencyKey = input.idempotencyKey?.trim() || null;
  const purpose = input.purpose ?? 'standard';
  const templateId = input.templateId ?? null;

  if (idempotencyKey) {
    const existing = await findByIdempotencyKey({
      organizationId: input.organizationId,
      idempotencyKey,
    });
    if (existing) {
      const children = existing.kind === 'parent'
        ? await listChildJobs({
            organizationId: input.organizationId,
            parentJobId: existing.id,
          })
        : [];
      return { job: toPublic(existing), children, deduped: true };
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
        printerGroupId: null,
        parentJobId: null,
        kind: 'single',
        purpose,
        templateId,
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

    return { job: toPublic(row), children: [], deduped: false };
  }
  catch (error) {
    // Concurrent idempotent retries: unique index race → return existing.
    if (idempotencyKey && isUniqueViolation(error)) {
      const existing = await findByIdempotencyKey({
        organizationId: input.organizationId,
        idempotencyKey,
      });
      if (existing) {
        const children = existing.kind === 'parent'
          ? await listChildJobs({
              organizationId: input.organizationId,
              parentJobId: existing.id,
            })
          : [];
        return { job: toPublic(existing), children, deduped: true };
      }
    }
    throw error;
  }
}

/**
 * Enqueue to a Printer Group: create one parent aggregation job and N child
 * jobs (one per active member Printer) sharing the parent id.
 */
export async function enqueueGroupJob(input: {
  organizationId: string
  printerGroupId: string
  payloadBase64: string
  idempotencyKey?: string | null
  purpose?: PrintJobPurpose
  templateId?: string | null
}): Promise<{ job: PrintJobPublic, children: PrintJobPublic[], deduped: boolean }> {
  const payload = decodePayloadBase64(input.payloadBase64);
  const idempotencyKey = input.idempotencyKey?.trim() || null;
  const payloadBase64 = payload.toString('base64');
  const purpose = input.purpose ?? 'standard';
  const templateId = input.templateId ?? null;

  if (idempotencyKey) {
    const existing = await findByIdempotencyKey({
      organizationId: input.organizationId,
      idempotencyKey,
    });
    if (existing) {
      const children = existing.kind === 'parent'
        ? await listChildJobs({
            organizationId: input.organizationId,
            parentJobId: existing.id,
          })
        : [];
      return { job: toPublic(existing), children, deduped: true };
    }
  }

  const resolved = await resolveActiveGroupPrinters({
    organizationId: input.organizationId,
    printerGroupId: input.printerGroupId,
  });

  if (!resolved) {
    throw new PrinterGroupNotEnqueueableError(
      'Printer Group not found in Organization',
    );
  }

  if (resolved.printers.length === 0) {
    throw new PrinterGroupNotEnqueueableError(
      'Printer Group has no active Printers to fan out to',
    );
  }

  const now = new Date();
  const parentId = randomUUID();

  try {
    return await db.transaction(async (tx) => {
      const [parent] = await tx
        .insert(printJob)
        .values({
          id: parentId,
          organizationId: input.organizationId,
          printerId: null,
          printerAgentId: resolved.group.printerAgentId,
          printerGroupId: resolved.group.id,
          parentJobId: null,
          kind: 'parent',
          purpose,
          templateId,
          status: 'queued',
          payloadBase64,
          payloadByteLength: payload.byteLength,
          idempotencyKey,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      if (!parent) {
        throw new Error('Failed to enqueue parent print job');
      }

      const childRows = await tx
        .insert(printJob)
        .values(
          resolved.printers.map(target => ({
            id: randomUUID(),
            organizationId: input.organizationId,
            printerId: target.id,
            printerAgentId: target.printerAgentId,
            printerGroupId: resolved.group.id,
            parentJobId: parentId,
            kind: 'child' as const,
            purpose,
            templateId,
            status: 'queued' as const,
            payloadBase64,
            payloadByteLength: payload.byteLength,
            idempotencyKey: null,
            createdAt: now,
            updatedAt: now,
          })),
        )
        .returning();

      return {
        job: toPublic(parent),
        children: childRows.map(toPublic),
        deduped: false,
      };
    });
  }
  catch (error) {
    if (idempotencyKey && isUniqueViolation(error)) {
      const existing = await findByIdempotencyKey({
        organizationId: input.organizationId,
        idempotencyKey,
      });
      if (existing) {
        const children = existing.kind === 'parent'
          ? await listChildJobs({
              organizationId: input.organizationId,
              parentJobId: existing.id,
            })
          : [];
        return { job: toPublic(existing), children, deduped: true };
      }
    }
    throw error;
  }
}

/**
 * Enqueue by rendering a stored JSON template with inputs to raw ESC/POS.
 * Render happens before the job is persisted so leased payloads are raw only.
 * Invalid template/inputs fail at enqueue (no queued job is created).
 * Exactly one of printerId / printerGroupId is required.
 */
export async function enqueueTemplateJob(input: {
  organizationId: string
  printerId?: string | null
  printerGroupId?: string | null
  templateId: string
  inputs: Record<string, unknown>
  idempotencyKey?: string | null
  purpose?: PrintJobPurpose
}): Promise<{ job: PrintJobPublic, children: PrintJobPublic[], deduped: boolean }> {
  const printerId = input.printerId?.trim() || null;
  const printerGroupId = input.printerGroupId?.trim() || null;
  if (Boolean(printerId) === Boolean(printerGroupId)) {
    throw new EnqueueTargetRequiredError();
  }

  const idempotencyKey = input.idempotencyKey?.trim() || null;
  const purpose = input.purpose ?? 'standard';

  if (idempotencyKey) {
    const existing = await findByIdempotencyKey({
      organizationId: input.organizationId,
      idempotencyKey,
    });
    if (existing) {
      const children = existing.kind === 'parent'
        ? await listChildJobs({
            organizationId: input.organizationId,
            parentJobId: existing.id,
          })
        : [];
      return { job: toPublic(existing), children, deduped: true };
    }
  }

  const template = await getTemplate({
    organizationId: input.organizationId,
    templateId: input.templateId,
  });
  if (!template) {
    throw new TemplateNotFoundError();
  }

  // Fail closed before target lookup when inputs/definition cannot render.
  const payload = await renderTemplateJob({
    definition: template.definition,
    inputs: input.inputs,
  });
  const payloadBase64 = payload.toString('base64');

  if (printerGroupId) {
    return enqueueGroupJob({
      organizationId: input.organizationId,
      printerGroupId,
      payloadBase64,
      idempotencyKey,
      purpose,
      templateId: template.id,
    });
  }

  return enqueueRawJob({
    organizationId: input.organizationId,
    printerId: printerId!,
    payloadBase64,
    idempotencyKey,
    purpose,
    templateId: template.id,
  });
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object'
    && error !== null
    && 'code' in error
    && (error as { code?: string }).code === '23505'
  );
}

type JobTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Aggregate parent status from children.
 * Parent succeeds only when every child succeeds; mixed terminals → partial_failed.
 */
async function aggregateParentJob(
  tx: JobTransaction,
  parentJobId: string,
  now: Date,
): Promise<void> {
  const children = await tx
    .select()
    .from(printJob)
    .where(eq(printJob.parentJobId, parentJobId));

  if (children.length === 0) {
    return;
  }

  const statuses = children.map(child => asStatus(child.status));
  const allTerminal = statuses.every(
    status => status === 'succeeded' || status === 'failed',
  );

  if (!allTerminal) {
    await tx
      .update(printJob)
      .set({
        status: 'queued',
        errorMessage: null,
        completedAt: null,
        updatedAt: now,
      })
      .where(
        and(
          eq(printJob.id, parentJobId),
          eq(printJob.kind, 'parent'),
        ),
      );
    return;
  }

  const succeededCount = statuses.filter(status => status === 'succeeded').length;
  const failedCount = statuses.filter(status => status === 'failed').length;

  let status: PrintJobStatus;
  let errorMessage: string | null = null;
  if (failedCount === 0) {
    status = 'succeeded';
  }
  else if (succeededCount === 0) {
    status = 'failed';
    errorMessage = `All ${failedCount} child jobs failed`;
  }
  else {
    status = 'partial_failed';
    errorMessage = `${failedCount} of ${children.length} child jobs failed`;
  }

  await tx
    .update(printJob)
    .set({
      status,
      errorMessage,
      completedAt: now,
      leaseExpiresAt: null,
      updatedAt: now,
    })
    .where(
      and(
        eq(printJob.id, parentJobId),
        eq(printJob.kind, 'parent'),
      ),
    );
}

/**
 * Return expired leased/printing jobs to queued so another poll can pick them up.
 * Parent aggregation jobs are never leased.
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
        ne(printJob.kind, 'parent'),
        isNotNull(printJob.leaseExpiresAt),
        lt(printJob.leaseExpiresAt, now),
      ),
    )
    .returning({ id: printJob.id });
  return result.length;
}

/**
 * Short-poll lease: exclusively claim the next queued single/child job for this
 * Printer Agent. Parent aggregation jobs are never leased.
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
          ne(printJob.kind, 'parent'),
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
          inArray(printJob.kind, ['single', 'child']),
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

    if (!leased || !leased.printerId) {
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
 * Terminal child reports re-aggregate the parent job.
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
          ne(printJob.kind, 'parent'),
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

    if (job.kind === 'parent') {
      throw new JobReportConflictError('Parent aggregation jobs cannot be reported by Printer Agents');
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
      if (updated.parentJobId) {
        await aggregateParentJob(tx, updated.parentJobId, now);
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
    if (updated.parentJobId) {
      await aggregateParentJob(tx, updated.parentJobId, now);
    }
    return toPublic(updated);
  });
}

/**
 * Retry a failed child job without re-running successful siblings.
 * Resets the child to queued and re-opens the parent aggregation job.
 */
export async function retryFailedChildJob(input: {
  organizationId: string
  jobId: string
}): Promise<{ job: PrintJobPublic, parent: PrintJobPublic | null }> {
  const now = new Date();

  return db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(printJob)
      .where(
        and(
          eq(printJob.id, input.jobId),
          eq(printJob.organizationId, input.organizationId),
        ),
      )
      .limit(1)
      .for('update');

    const job = rows[0];
    if (!job) {
      throw new JobRetryConflictError('Job not found in Organization');
    }

    if (job.kind !== 'child') {
      throw new JobRetryConflictError('Only failed child jobs are retryable');
    }

    if (job.status !== 'failed') {
      throw new JobRetryConflictError(
        `Cannot retry job in status ${job.status}; only failed children may be retried`,
      );
    }

    const [updated] = await tx
      .update(printJob)
      .set({
        status: 'queued',
        errorMessage: null,
        leaseExpiresAt: null,
        leasedAt: null,
        printingAt: null,
        completedAt: null,
        updatedAt: now,
      })
      .where(eq(printJob.id, job.id))
      .returning();

    if (!updated) {
      throw new JobRetryConflictError('Failed to retry job');
    }

    let parent: PrintJobPublic | null = null;
    if (updated.parentJobId) {
      await aggregateParentJob(tx, updated.parentJobId, now);
      const parents = await tx
        .select()
        .from(printJob)
        .where(eq(printJob.id, updated.parentJobId))
        .limit(1);
      parent = parents[0] ? toPublic(parents[0]) : null;
    }

    return { job: toPublic(updated), parent };
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
