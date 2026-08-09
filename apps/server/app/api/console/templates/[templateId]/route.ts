/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { z } from 'zod';
import {
  canManageTemplates,
  getConsoleSession,
} from '../../../../../lib/console-auth';
import {
  deleteTemplate,
  getTemplate,
  InvalidTemplateDefinitionError,
  TemplateNotFoundError,
  updateTemplate,
} from '../../../../../lib/templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UpdateBodySchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  definition: z.unknown().optional(),
}).refine(
  value => value.name !== undefined || value.definition !== undefined,
  { message: 'At least one of name or definition is required' },
);

type RouteContext = {
  params: Promise<{ templateId: string }>
};

/**
 * Fetch a single JSON print template.
 * Any signed-in org member MAY read.
 */
export async function GET(request: Request, context: RouteContext) {
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

  const { templateId } = await context.params;
  const template = await getTemplate({
    organizationId: consoleSession.organization.id,
    templateId,
  });
  if (!template) {
    return Response.json(
      { error: 'template_not_found', message: 'Template not found in Organization' },
      { status: 404 },
    );
  }

  return Response.json({ template });
}

/**
 * Update a stored JSON print template.
 * owner/admin MAY; member MUST NOT.
 */
export async function PATCH(request: Request, context: RouteContext) {
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

  const parsed = UpdateBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { templateId } = await context.params;

  try {
    const template = await updateTemplate({
      organizationId: consoleSession.organization.id,
      templateId,
      name: parsed.data.name,
      definition: parsed.data.definition,
    });
    return Response.json({ template });
  }
  catch (error) {
    if (error instanceof TemplateNotFoundError) {
      return Response.json(
        { error: 'template_not_found', message: error.message },
        { status: 404 },
      );
    }
    if (error instanceof InvalidTemplateDefinitionError) {
      return Response.json(
        { error: 'invalid_template', message: error.message },
        { status: 400 },
      );
    }
    throw error;
  }
}

/**
 * Delete a stored JSON print template.
 * owner/admin MAY; member MUST NOT.
 */
export async function DELETE(request: Request, context: RouteContext) {
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

  const { templateId } = await context.params;

  try {
    await deleteTemplate({
      organizationId: consoleSession.organization.id,
      templateId,
    });
    return new Response(null, { status: 204 });
  }
  catch (error) {
    if (error instanceof TemplateNotFoundError) {
      return Response.json(
        { error: 'template_not_found', message: error.message },
        { status: 404 },
      );
    }
    throw error;
  }
}
