/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { headers } from 'next/headers';
import { auth } from './auth';

export interface ConsoleSession {
  user: {
    id: string
    name: string
    email: string
  }
  session: {
    id: string
    activeOrganizationId?: string | null
  }
  organization: {
    id: string
    name: string
    slug: string
  } | null
  role: 'owner' | 'admin' | 'member' | null
}

/**
 * Load the human console session and active Organization membership.
 * Returns null when there is no valid session cookie.
 */
export async function getConsoleSession(
  requestHeaders?: Headers,
): Promise<ConsoleSession | null> {
  const hdrs = requestHeaders ?? new Headers(await headers());
  const result = await auth.api.getSession({ headers: hdrs });
  if (!result) {
    return null;
  }

  const activeOrganizationId = result.session.activeOrganizationId ?? null;
  let organization: ConsoleSession['organization'] = null;
  let role: ConsoleSession['role'] = null;

  if (activeOrganizationId) {
    const full = await auth.api.getFullOrganization({
      headers: hdrs,
      query: { organizationId: activeOrganizationId },
    });
    if (full) {
      organization = {
        id: full.id,
        name: full.name,
        slug: full.slug,
      };
      const membership = full.members.find(m => m.userId === result.user.id);
      if (membership?.role === 'owner' || membership?.role === 'admin' || membership?.role === 'member') {
        role = membership.role;
      }
    }
  }

  return {
    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
    },
    session: {
      id: result.session.id,
      activeOrganizationId,
    },
    organization,
    role,
  };
}

/**
 * Whether the active Organization membership may update org settings.
 * owner and admin MAY; member MUST NOT (Better Auth default RBAC).
 */
export async function canManageOrganizationSettings(
  requestHeaders: Headers,
): Promise<boolean> {
  const permission = await auth.api.hasPermission({
    headers: requestHeaders,
    body: {
      permissions: {
        organization: ['update'],
      },
    },
  });
  return permission?.success === true;
}

/**
 * Whether the role may create / revoke / rotate Printer Agent device tokens.
 * owner and admin MAY; member MUST NOT.
 */
export function canManagePrinterAgents(
  role: ConsoleSession['role'],
): boolean {
  return role === 'owner' || role === 'admin';
}

/**
 * Whether the role may create / confirm Printers under a Printer Agent.
 * owner and admin MAY; member MUST NOT.
 */
export function canManagePrinters(
  role: ConsoleSession['role'],
): boolean {
  return role === 'owner' || role === 'admin';
}

/**
 * Whether the role may create / update / delete JSON print templates.
 * owner and admin MAY; member MUST NOT (members MAY list and enqueue).
 */
export function canManageTemplates(
  role: ConsoleSession['role'],
): boolean {
  return role === 'owner' || role === 'admin';
}
