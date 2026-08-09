/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { z } from 'zod';
import {
  canManageTemplates,
  getConsoleSession,
} from '../../../../lib/console-auth';
import {
  createTemplate,
  InvalidTemplateDefinitionError,
  listTemplates,
} from '../../../../lib/templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreateBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  definition: z.unknown(),
});

/**
 * List JSON print templates for the active Organization.
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

  const templates = await listTemplates(consoleSession.organization.id);
  return Response.json({ templates });
}

/**
 * Create a stored JSON print template.
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

  if (!canManageTemplates(consoleSession.role)) {
    return Response.json(
      {
        error: 'forbidden',
        message: 'owner or admin role required to manage templates',
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
    const template = await createTemplate({
      organizationId: consoleSession.organization.id,
      name: parsed.data.name,
      definition: parsed.data.definition,
    });
    return Response.json({ template }, { status: 201 });
  }
  catch (error) {
    if (error instanceof InvalidTemplateDefinitionError) {
      return Response.json(
        { error: 'invalid_template', message: error.message },
        { status: 400 },
      );
    }
    throw error;
  }
}
