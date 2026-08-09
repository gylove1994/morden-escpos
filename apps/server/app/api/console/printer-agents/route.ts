/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { z } from 'zod';
import {
  canManagePrinterAgents,
  getConsoleSession,
} from '../../../../lib/console-auth';
import {
  createPrinterAgent,
  listPrinterAgents,
} from '../../../../lib/printer-agents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreateBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
});

/**
 * List Printer Agents for the active Organization.
 * Any signed-in org member MAY list; device tokens are never returned.
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

  const printerAgents = await listPrinterAgents(consoleSession.organization.id);
  return Response.json({ printerAgents });
}

/**
 * Create a Printer Agent and return the device token once.
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

  if (!canManagePrinterAgents(consoleSession.role)) {
    return Response.json(
      {
        error: 'forbidden',
        message: 'owner or admin role required to create a Printer Agent',
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

  const created = await createPrinterAgent({
    organizationId: consoleSession.organization.id,
    name: parsed.data.name,
  });

  return Response.json(
    {
      printerAgent: created.printerAgent,
      deviceToken: created.deviceToken,
      deviceTokenShownOnce: true,
    },
    { status: 201 },
  );
}
