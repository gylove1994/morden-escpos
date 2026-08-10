/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { z } from 'zod';
import { auth } from '../../../../lib/auth';
import {
  canManageOrganizationSettings,
  getConsoleSession,
} from '../../../../lib/console-auth';
import { organizationStatusBlockResponse } from '../../../../lib/platform/org-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UpdateBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
});

/**
 * Protected Organization settings update.
 * Gated by Better Auth RBAC: owner/admin MAY update; member MUST NOT.
 */
export async function PATCH(request: Request) {
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
        message: 'owner or admin role required to update Organization settings',
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

  const parsed = UpdateBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const updated = await auth.api.updateOrganization({
    headers: request.headers,
    body: {
      organizationId: consoleSession.organization.id,
      data: { name: parsed.data.name },
    },
  });

  return Response.json({
    organization: {
      id: updated?.id ?? consoleSession.organization.id,
      name: updated?.name ?? parsed.data.name,
      slug: updated?.slug ?? consoleSession.organization.slug,
    },
  });
}
