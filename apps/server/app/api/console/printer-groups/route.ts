/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { z } from 'zod';
import {
  canManagePrinterGroups,
  getConsoleSession,
} from '../../../../lib/console-auth';
import {
  createPrinterGroup,
  listPrinterGroups,
  PrinterAgentNotFoundForGroupError,
  PrinterGroupMemberInvalidError,
} from '../../../../lib/printer-groups';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreateBodySchema = z.object({
  printerAgentId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(120),
  printerIds: z.array(z.string().trim().min(1)).max(100).optional(),
});

/**
 * List Printer Groups for the active Organization.
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

  const printerGroups = await listPrinterGroups(consoleSession.organization.id);
  return Response.json({ printerGroups });
}

/**
 * Create a Printer Group under exactly one Printer Agent.
 * owner/admin MAY; member MUST NOT.
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

  if (!canManagePrinterGroups(consoleSession.role)) {
    return Response.json(
      {
        error: 'forbidden',
        message: 'owner or admin role required to create a Printer Group',
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
    const created = await createPrinterGroup({
      organizationId: consoleSession.organization.id,
      printerAgentId: parsed.data.printerAgentId,
      name: parsed.data.name,
      printerIds: parsed.data.printerIds,
    });
    return Response.json({ printerGroup: created }, { status: 201 });
  }
  catch (error) {
    if (error instanceof PrinterAgentNotFoundForGroupError) {
      return Response.json(
        { error: 'printer_agent_not_found', message: error.message },
        { status: 404 },
      );
    }
    if (error instanceof PrinterGroupMemberInvalidError) {
      return Response.json(
        { error: 'invalid_printer_group_members', message: error.message },
        { status: 400 },
      );
    }
    throw error;
  }
}
