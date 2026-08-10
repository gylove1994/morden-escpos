/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { ConsoleSession } from './console-auth';
import { redirect } from 'next/navigation';
import { getConsoleSession } from './console-auth';
import { getOrganizationStatus } from './platform/org-guard';
import { isOrganizationOperable } from './platform/tenant-status';

/**
 * Requires a human session. Unauthenticated visitors go to the Login shell.
 */
export async function requireConsoleSession(): Promise<ConsoleSession> {
  const session = await getConsoleSession();
  if (!session) {
    redirect('/login');
  }
  return session;
}

/**
 * Requires an active, operable Organization.
 * Zero-Organization → onboarding; suspended/banned → suspended experience.
 */
export async function requireConsoleOrganization(): Promise<
  ConsoleSession & { organization: NonNullable<ConsoleSession['organization']> }
> {
  const session = await requireConsoleSession();
  if (!session.organization) {
    redirect('/console/onboarding');
  }

  const status = await getOrganizationStatus(session.organization.id);
  if (status && !isOrganizationOperable(status)) {
    redirect(`/console/suspended?status=${status}`);
  }

  return session as ConsoleSession & {
    organization: NonNullable<ConsoleSession['organization']>
  };
}

/**
 * Onboarding-only plane for operators without an active Organization.
 */
export async function requireConsoleOnboarding(): Promise<ConsoleSession> {
  const session = await requireConsoleSession();
  if (session.organization) {
    redirect('/console');
  }
  return session;
}
