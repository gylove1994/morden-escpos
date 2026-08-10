/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { ReactNode } from 'react';
import { SignOutButton } from './auth-forms';

export function PlatformShell({
  children,
  userEmail,
}: {
  children: ReactNode
  userEmail: string
}) {
  return (
    <div className="min-h-svh" data-shell="platform">
      <header className="flex items-center justify-between gap-4 border-b px-4 py-3">
        <div>
          <div className="font-semibold">morden-escpos Platform</div>
          <div className="text-sm text-muted-foreground">
            Cloud tenant operations ·
            {' '}
            {userEmail}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="/console" className="text-sm underline underline-offset-4">
            Business console
          </a>
          <SignOutButton />
        </div>
      </header>
      <nav
        className="flex gap-4 border-b px-4 py-2 text-sm"
        aria-label="Platform"
        data-testid="platform-nav"
      >
        <a href="/console/platform" data-nav="Tenant ops">Tenant ops</a>
      </nav>
      <main className="p-4">{children}</main>
    </div>
  );
}
