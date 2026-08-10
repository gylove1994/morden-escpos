/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { ReactNode } from 'react';
import { requireConsoleSession } from '../../lib/console-guards';
import { SignOutButton } from '../components/auth-forms';

export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  const session = await requireConsoleSession();
  const hasOrganization = Boolean(session.organization);

  return (
    <div
      className="shell"
      data-shell={hasOrganization ? 'business' : 'onboarding'}
    >
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
        {hasOrganization
          ? (
              <>
                <a href="/console">Overview</a>
                <a href="/console/printer-agents">Printer Agents</a>
                <a href="/console/billing">Billing</a>
                <a href="/console/printers">Printers</a>
                <a href="/console/jobs">Jobs</a>
              </>
            )
          : <a href="/console/onboarding">Onboarding</a>}
      </nav>
      <div className="shell-body">{children}</div>
    </div>
  );
}
