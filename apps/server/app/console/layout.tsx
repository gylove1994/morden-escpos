/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getConsoleSession } from '../../lib/console-auth';
import { SignOutButton } from '../components/auth-forms';

export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  const session = await getConsoleSession();
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="shell">
      <header className="shell-header">
        <div>
          <div className="shell-brand">morden-escpos</div>
          <div className="shell-meta">
            <span>{session.user.email}</span>
            {session.organization
              ? (
                  <>
                    <span>
                      Organization:
                      {' '}
                      {session.organization.name}
                    </span>
                    <span>
                      Role:
                      {' '}
                      {session.role ?? 'unknown'}
                    </span>
                  </>
                )
              : <span>No active Organization</span>}
          </div>
        </div>
        <SignOutButton />
      </header>
      <nav className="shell-nav" aria-label="Console">
        <a href="/console">Overview</a>
        {session.organization
          ? (
              <>
                <a href="/console/printer-agents">Printer Agents</a>
                <a href="/console/printers">Printers</a>
                <a href="/console/printer-groups">Printer Groups</a>
                <a href="/console/templates">Templates</a>
                <a href="/console/jobs">Jobs</a>
              </>
            )
          : <a href="/console/create-organization">Create Organization</a>}
      </nav>
      <div className="shell-body">{children}</div>
    </div>
  );
}
