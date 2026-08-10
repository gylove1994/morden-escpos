import type { ConsoleSession } from './console-auth';
/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { redirect } from 'next/navigation';
import { getConsoleSession } from './console-auth';

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
 * Requires an active Organization. Zero-Organization operators stay in onboarding.
 */
export async function requireConsoleOrganization(): Promise<
  ConsoleSession & { organization: NonNullable<ConsoleSession['organization']> }
> {
  const session = await requireConsoleSession();
  if (!session.organization) {
    redirect('/console/onboarding');
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
