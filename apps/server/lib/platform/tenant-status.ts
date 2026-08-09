/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */

/** Cloud platform tenant lifecycle statuses. */
export const ORGANIZATION_STATUSES = ['active', 'suspended', 'banned'] as const;
export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];

export function isOrganizationStatus(value: string): value is OrganizationStatus {
  return (ORGANIZATION_STATUSES as readonly string[]).includes(value);
}

export function isOrganizationOperable(status: string): boolean {
  return status === 'active';
}
