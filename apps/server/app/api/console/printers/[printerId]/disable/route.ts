/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import {
  canManagePrinters,
  getConsoleSession,
} from '../../../../../../lib/console-auth';
import { disablePrinter } from '../../../../../../lib/printers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ printerId: string }>
};

/**
 * Disable a Printer without deleting job history.
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
        message: 'owner or admin role required to disable a Printer',
      },
      { status: 403 },
    );
  }

  const { printerId } = await context.params;
  const printer = await disablePrinter({
    organizationId: consoleSession.organization.id,
    printerId,
  });

  if (!printer) {
    return Response.json(
      { error: 'printer_not_found', message: 'Printer not found in Organization' },
      { status: 404 },
    );
  }

  return Response.json({ printer });
}
