/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { OrganizationStatus } from './tenant-status';
import { eq, ilike, or } from 'drizzle-orm';
import { db } from '../db';
import { organization } from '../db/schema';
import {
  isOrganizationStatus,
} from './tenant-status';

export interface PlatformOrganization {
  id: string
  name: string
  slug: string
  status: OrganizationStatus
  createdAt: Date
}

function toPlatformOrganization(
  row: typeof organization.$inferSelect,
): PlatformOrganization {
  const status = isOrganizationStatus(row.status) ? row.status : 'active';
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status,
    createdAt: row.createdAt,
  };
}

/**
 * Look up Organizations by id, slug, or case-insensitive name substring.
 * Cloud platform tenant-ops only.
 */
export async function lookupOrganizations(
  query: string,
  limit = 20,
): Promise<PlatformOrganization[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const pattern = `%${trimmed.replace(/[%_]/g, '\\$&')}%`;
  const rows = await db
    .select()
    .from(organization)
    .where(
      or(
        eq(organization.id, trimmed),
        eq(organization.slug, trimmed),
        ilike(organization.name, pattern),
        ilike(organization.slug, pattern),
      ),
    )
    .limit(Math.min(Math.max(limit, 1), 50));

  return rows.map(toPlatformOrganization);
}

export async function getOrganizationById(
  organizationId: string,
): Promise<PlatformOrganization | null> {
  const row = await db.query.organization.findFirst({
    where: eq(organization.id, organizationId),
  });
  return row ? toPlatformOrganization(row) : null;
}

/**
 * Set Organization status to suspended / banned / active (restore).
 */
export async function setOrganizationStatus(
  organizationId: string,
  status: OrganizationStatus,
): Promise<PlatformOrganization | null> {
  const [updated] = await db
    .update(organization)
    .set({ status })
    .where(eq(organization.id, organizationId))
    .returning();

  return updated ? toPlatformOrganization(updated) : null;
}
