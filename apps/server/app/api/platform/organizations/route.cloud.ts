/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import {
  assertPlatformAdmin,
  platformCloudOnlyJsonResponse,
  PlatformEditionError,
  PlatformUnauthorizedError,
  platformUnauthorizedJsonResponse,
} from '../../../../lib/platform/auth';
import { lookupOrganizations } from '../../../../lib/platform/organizations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cloud platform tenant-ops: look up an Organization by id, slug, or name.
 *
 * Auth: `Authorization: Bearer <PLATFORM_ADMIN_SECRET>`.
 */
export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const query = url.searchParams.get('q') ?? url.searchParams.get('query') ?? '';
  if (!query.trim()) {
    return Response.json(
      {
        error: 'invalid_query',
        message: 'Query parameter q is required (Organization id, slug, or name)',
      },
      { status: 400 },
    );
  }

  const organizations = await lookupOrganizations(query);
  return Response.json({ organizations });
}
