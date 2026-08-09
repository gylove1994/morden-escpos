/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { z } from 'zod';
import {
  assertPlatformAdmin,
  platformCloudOnlyJsonResponse,
  PlatformEditionError,
  PlatformUnauthorizedError,
  platformUnauthorizedJsonResponse,
} from '../../../../../../lib/platform/auth';
import { setOrganizationStatus } from '../../../../../../lib/platform/organizations';
import { ORGANIZATION_STATUSES } from '../../../../../../lib/platform/tenant-status';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const StatusBodySchema = z.object({
  status: z.enum(ORGANIZATION_STATUSES),
});

/**
 * Cloud platform tenant-ops: ban / suspend / restore an Organization.
 *
 * Auth: `Authorization: Bearer <PLATFORM_ADMIN_SECRET>`.
 * Body: `{ "status": "active" | "suspended" | "banned" }`.
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ organizationId: string }> },
) {
  try {
    assertPlatformAdmin(request.headers);
  }
  catch (error) {
    if (error instanceof PlatformEditionError) {
      return platformCloudOnlyJsonResponse();
    }
    if (error instanceof PlatformUnauthorizedError) {
      return platformUnauthorizedJsonResponse();
    }
    throw error;
  }

  const { organizationId } = await context.params;
  if (!organizationId) {
    return Response.json(
      { error: 'invalid_organization_id' },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  }
  catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = StatusBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const updated = await setOrganizationStatus(organizationId, parsed.data.status);
  if (!updated) {
    return Response.json(
      { error: 'not_found', message: 'Organization not found' },
      { status: 404 },
    );
  }

  return Response.json({ organization: updated });
}
