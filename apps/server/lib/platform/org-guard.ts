/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { organization } from '../db/schema';
import {
  isOrganizationOperable,
  isOrganizationStatus,
  type OrganizationStatus,
} from './tenant-status';

export async function getOrganizationStatus(
  organizationId: string,
): Promise<OrganizationStatus | null> {
  const row = await db.query.organization.findFirst({
    where: eq(organization.id, organizationId),
    columns: { status: true },
  });
  if (!row) {
    return null;
  }
  return isOrganizationStatus(row.status) ? row.status : 'active';
}

/**
 * Block console mutations when the active Organization is suspended or banned.
 * Returns a Response when blocked; null when operable.
 */
export async function organizationStatusBlockResponse(
  organizationId: string,
): Promise<Response | null> {
  const status = await getOrganizationStatus(organizationId);
  if (!status || isOrganizationOperable(status)) {
    return null;
  }

  return Response.json(
    {
      error: 'organization_inactive',
      status,
      message:
        status === 'banned'
          ? 'This Organization is banned'
          : 'This Organization is suspended',
    },
    { status: 403 },
  );
}
