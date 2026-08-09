/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { z } from 'zod';
import { PlanLimitError } from '../../../../lib/billing/errors';
import { assertPlanAllows } from '../../../../lib/billing/plan-limits';
import { incrementMonthlyJobCount } from '../../../../lib/billing/subscription';
import { getConsoleSession } from '../../../../lib/console-auth';
import {
  enqueueRawJob,
  InvalidPayloadError,
  listPrintJobs,
  PrinterNotEnqueueableError,
} from '../../../../lib/jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EnqueueBodySchema = z.object({
  printerId: z.string().trim().min(1),
  payloadBase64: z.string().min(1),
  idempotencyKey: z.string().trim().min(1).max(200).optional(),
});

/**
 * List recent print jobs for the active Organization.
 * Any signed-in org member MAY list.
 */
export async function GET(request: Request) {
  const consoleSession = await getConsoleSession(request.headers);
  if (!consoleSession) {
    return Response.json(
      { error: 'unauthorized', message: 'Sign in required' },
      { status: 401 },
    );
  }

  if (!consoleSession.organization) {
    return Response.json(
      { error: 'no_organization', message: 'Active Organization required' },
      { status: 400 },
    );
  }

  const url = new URL(request.url);
  const limitRaw = url.searchParams.get('limit');
  const limit = limitRaw ? Number(limitRaw) : 50;
  const jobs = await listPrintJobs(
    consoleSession.organization.id,
    Number.isFinite(limit) ? limit : 50,
  );
  return Response.json({ jobs });
}

/**
 * Enqueue a raw ESC/POS job targeting a Printer.
 * Any signed-in org member MAY enqueue. Idempotency keys dedupe retries.
 * Cloud plan limits apply on new enqueue (deduped retries do not consume quota).
 */
export async function POST(request: Request) {
  const consoleSession = await getConsoleSession(request.headers);
  if (!consoleSession) {
    return Response.json(
      { error: 'unauthorized', message: 'Sign in required' },
      { status: 401 },
    );
  }

  if (!consoleSession.organization) {
    return Response.json(
      { error: 'no_organization', message: 'Active Organization required' },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  }
  catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = EnqueueBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    await assertPlanAllows(consoleSession.organization.id, 'monthly_job');

    const result = await enqueueRawJob({
      organizationId: consoleSession.organization.id,
      printerId: parsed.data.printerId,
      payloadBase64: parsed.data.payloadBase64,
      idempotencyKey: parsed.data.idempotencyKey,
    });

    let monthlyJobs: number | undefined;
    if (!result.deduped) {
      monthlyJobs = await incrementMonthlyJobCount(
        consoleSession.organization.id,
      );
    }

    return Response.json(
      {
        job: result.job,
        deduped: result.deduped,
        ...(monthlyJobs !== undefined ? { usage: { monthlyJobs } } : {}),
      },
      { status: result.deduped ? 200 : 201 },
    );
  }
  catch (error) {
    if (error instanceof PlanLimitError) {
      return Response.json(error.toJSON(), { status: 403 });
    }
    if (error instanceof InvalidPayloadError) {
      return Response.json(
        { error: 'invalid_payload', message: error.message },
        { status: 400 },
      );
    }
    if (error instanceof PrinterNotEnqueueableError) {
      return Response.json(
        { error: 'printer_not_enqueueable', message: error.message },
        { status: 404 },
      );
    }
    throw error;
  }
}
