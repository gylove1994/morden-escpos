/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { headers } from 'next/headers';
import { auth } from './auth';

export interface ConsoleOrganizationOption {
  id: string
  name: string
  slug: string
}

/**
 * Lists Organizations the current human session belongs to.
 */
export async function listConsoleOrganizations(
  requestHeaders?: Headers,
): Promise<ConsoleOrganizationOption[]> {
  const hdrs = requestHeaders ?? new Headers(await headers());
  const orgs = await auth.api.listOrganizations({ headers: hdrs });
  if (!orgs) {
    return [];
  }
  return orgs.map(org => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
  }));
}
