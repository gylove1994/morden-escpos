/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { z } from 'zod';
import { PlanLimitError } from '../../../../lib/billing/errors';
import { assertPlanAllows } from '../../../../lib/billing/plan-limits';
import { ConnectionHintsSchema } from '../../../../lib/connection-hints';
import {
  canManagePrinters,
  getConsoleSession,
} from '../../../../lib/console-auth';
import { organizationStatusBlockResponse } from '../../../../lib/platform/org-guard';
import {
  createPrinter,
  listPrinters,
  PrinterAgentNotFoundError,
} from '../../../../lib/printers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreateBodySchema = z.object({
  printerAgentId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(120),
  connectionHints: ConnectionHintsSchema,
});

/**
 * List Printers for the active Organization.
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

  const printers = await listPrinters(consoleSession.organization.id);
  return Response.json({ printers });
}

/**
 * Create/confirm a Printer under a Printer Agent with connection hints.
 * owner/admin MAY; member MUST NOT. Cloud plan limits apply on create.
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

  if (!canManagePrinters(consoleSession.role)) {
    return Response.json(
      {
        error: 'forbidden',
        message: 'owner or admin role required to create a Printer',
      },
      { status: 403 },
    );
  }

  const inactive = await organizationStatusBlockResponse(
    consoleSession.organization.id,
  );
  if (inactive) {
    return inactive;
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

    const created = await createPrinter({
      organizationId: consoleSession.organization.id,
      printerAgentId: parsed.data.printerAgentId,
      name: parsed.data.name,
      connectionHints: parsed.data.connectionHints,
    });
    return Response.json({ printer: created }, { status: 201 });
  }
  catch (error) {
    if (error instanceof PlanLimitError) {
      return Response.json(error.toJSON(), { status: 403 });
    }
    if (error instanceof PrinterAgentNotFoundError) {
      return Response.json(
        { error: 'printer_agent_not_found', message: error.message },
        { status: 404 },
      );
    }
    throw error;
  }
}
