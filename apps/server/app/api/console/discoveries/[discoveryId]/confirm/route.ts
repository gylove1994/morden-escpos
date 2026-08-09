/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { z } from 'zod';
import {
  canManagePrinters,
  getConsoleSession,
} from '../../../../../../lib/console-auth';
import {
  confirmDiscovery,
  DiscoveryAlreadyConfirmedError,
  DiscoveryNotFoundError,
} from '../../../../../../lib/discoveries';
import { PrinterAgentNotFoundError } from '../../../../../../lib/printers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ConfirmBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
});

interface RouteContext {
  params: Promise<{ discoveryId: string }>
}

/**
 * Confirm and name a discovered endpoint as a Printer.
 * owner/admin MAY; member MUST NOT.
 */
export async function POST(request: Request, context: RouteContext) {
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
        message: 'owner or admin role required to confirm a discovery',
      },
      { status: 403 },
    );
  }

  const { discoveryId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  }
  catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = ConfirmBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await confirmDiscovery({
      organizationId: consoleSession.organization.id,
      discoveryId,
      name: parsed.data.name,
    });
    return Response.json(result, { status: 201 });
  }
  catch (error) {
    if (error instanceof DiscoveryNotFoundError) {
      return Response.json(
        { error: 'discovery_not_found', message: error.message },
        { status: 404 },
      );
    }
    if (error instanceof DiscoveryAlreadyConfirmedError) {
      return Response.json(
        { error: 'discovery_already_confirmed', message: error.message },
        { status: 409 },
      );
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
