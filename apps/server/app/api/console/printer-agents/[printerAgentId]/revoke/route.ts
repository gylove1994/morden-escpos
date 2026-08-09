/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import {
  canManagePrinterAgents,
  getConsoleSession,
} from '../../../../../../lib/console-auth';
import { revokePrinterAgent } from '../../../../../../lib/printer-agents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ printerAgentId: string }>
}

/**
 * Revoke a Printer Agent device token. The old token stops authenticating.
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

  if (!canManagePrinterAgents(consoleSession.role)) {
    return Response.json(
      {
        error: 'forbidden',
        message: 'owner or admin role required to revoke a Printer Agent token',
      },
      { status: 403 },
    );
  }

  const { printerAgentId } = await context.params;
  if (!printerAgentId) {
    return Response.json({ error: 'invalid_printer_agent_id' }, { status: 400 });
  }

  const revoked = await revokePrinterAgent({
    organizationId: consoleSession.organization.id,
    printerAgentId,
  });

  if (!revoked) {
    return Response.json(
      { error: 'not_found', message: 'Printer Agent not found' },
      { status: 404 },
    );
  }

  return Response.json({ printerAgent: revoked });
}
