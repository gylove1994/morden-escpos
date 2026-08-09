/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { PlanLimitError } from '../../../../lib/billing/errors';
import { assertPlanAllows } from '../../../../lib/billing/plan-limits';
import {
  canManageOrganizationSettings,
  getConsoleSession,
} from '../../../../lib/console-auth';
import { db } from '../../../../lib/db';
import { printerStub } from '../../../../lib/db/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreateBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
});

/**
 * Thin guarded stub for printer create (#5 will own the full inventory model).
 *
 * Purpose: enforce cloud plan limits at the future create seam and prove
 * over-quota rejection at the HTTP boundary.
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

  const allowed = await canManageOrganizationSettings(request.headers);
  if (!allowed) {
    return Response.json(
      {
        error: 'forbidden',
        message: 'owner or admin role required to create a printer',
      },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  }
  catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = CreateBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    await assertPlanAllows(consoleSession.organization.id, 'printer');
  }
  catch (error) {
    if (error instanceof PlanLimitError) {
      return Response.json(error.toJSON(), { status: 403 });
    }
    throw error;
  }

  const id = randomUUID();
  const [created] = await db
    .insert(printerStub)
    .values({
      id,
      organizationId: consoleSession.organization.id,
      name: parsed.data.name,
    })
    .returning();

  return Response.json(
    {
      stub: true as const,
      ticket: '#5',
      printer: {
        id: created?.id ?? id,
        name: created?.name ?? parsed.data.name,
        organizationId: consoleSession.organization.id,
      },
    },
    { status: 201 },
  );
}
