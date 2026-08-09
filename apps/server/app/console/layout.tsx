/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getConsoleSession } from '../../lib/console-auth';
import { isCloudEdition } from '../../lib/edition';
import { getConsoleMessages } from '../../lib/i18n/server';
import { SignOutButton } from '../components/auth-forms';
import { LocaleSwitcher } from '../components/locale-switcher';

export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  const session = await getConsoleSession();
  if (!session) {
    redirect('/login');
  }

  const { messages } = await getConsoleMessages();
  const cloud = isCloudEdition();

  return (
    <div className="shell">
      <header className="shell-header">
        <div>
          <div className="shell-brand">{messages.brand}</div>
          <div className="shell-meta">
            <span>{session.user.email}</span>
            {session.organization
              ? (
                  <>
                    <span>
                      {messages.shell.organization}
                      :
                      {' '}
                      {session.organization.name}
                    </span>
                    <span>
                      {messages.shell.role}
                      :
                      {' '}
                      {session.role ?? 'unknown'}
                    </span>
                  </>
                )
              : <span>{messages.shell.noOrganization}</span>}
          </div>
        </div>
        <div className="shell-header-actions">
          <LocaleSwitcher />
          <SignOutButton />
        </div>
      </header>
      <nav className="shell-nav" aria-label={messages.nav.ariaLabel}>
        <a href="/console">{messages.nav.overview}</a>
        {session.organization
          ? (
              <>
                <a href="/console/printer-agents">{messages.nav.printerAgents}</a>
                {cloud ? <a href="/console/billing">{messages.nav.billing}</a> : null}
                <a href="/console/printers">{messages.nav.printers}</a>
                <a href="/console/jobs">{messages.nav.jobs}</a>
              </>
            )
          : <a href="/console/create-organization">{messages.nav.createOrganization}</a>}
        {cloud ? <a href="/console/platform">Platform</a> : null}
      </nav>
      <div className="shell-body">{children}</div>
    </div>
  );
}
