/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { z } from 'zod';
import {
  canManagePrinterGroups,
  getConsoleSession,
} from '../../../../../lib/console-auth';
import {
  PrinterGroupMemberInvalidError,
  PrinterGroupNotFoundError,
  updatePrinterGroup,
} from '../../../../../lib/printer-groups';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UpdateBodySchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  printerIds: z.array(z.string().trim().min(1)).max(100).optional(),
}).refine(
  value => value.name !== undefined || value.printerIds !== undefined,
  { message: 'At least one of name or printerIds is required' },
);

/**
 * Update a Printer Group (name and/or membership).
 * owner/admin MAY; member MUST NOT. Group stays bound to its Printer Agent.
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ printerGroupId: string }> },
) {
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
        message: 'owner or admin role required to update a Printer Group',
      },
      { status: 403 },
    );
  }

  const { printerGroupId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  }
  catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = UpdateBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const updated = await updatePrinterGroup({
      organizationId: consoleSession.organization.id,
      printerGroupId,
      name: parsed.data.name,
      printerIds: parsed.data.printerIds,
    });
    return Response.json({ printerGroup: updated });
  }
  catch (error) {
    if (error instanceof PrinterGroupNotFoundError) {
      return Response.json(
        { error: 'printer_group_not_found', message: error.message },
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
