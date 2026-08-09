/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { PlanLimitError } from '../../../../lib/billing/errors';
import { assertPlanAllows } from '../../../../lib/billing/plan-limits';
import { incrementMonthlyJobCount } from '../../../../lib/billing/subscription';
import { getConsoleSession } from '../../../../lib/console-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EnqueueBodySchema = z.object({
  // Minimal stub payload — #5 owns real raw enqueue + idempotency.
  target: z.enum(['printer', 'printer_group']).default('printer'),
  name: z.string().trim().min(1).max(120).optional(),
});

/**
 * Thin guarded stub for monthly job enqueue (#5 will own the queue protocol).
 *
 * Purpose: enforce cloud monthly job plan limits at the future enqueue seam
 * and prove over-quota rejection at the HTTP boundary. Does NOT lease/print.
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
  }
  catch (error) {
    if (error instanceof PlanLimitError) {
      return Response.json(error.toJSON(), { status: 403 });
    }
    throw error;
  }

  const monthlyJobs = await incrementMonthlyJobCount(
    consoleSession.organization.id,
  );
  const id = randomUUID();

  return Response.json(
    {
      stub: true as const,
      ticket: '#5',
      job: {
        id,
        organizationId: consoleSession.organization.id,
        target: parsed.data.target,
        name: parsed.data.name ?? null,
        status: 'accepted_stub',
      },
      usage: { monthlyJobs },
    },
    { status: 201 },
  );
}
