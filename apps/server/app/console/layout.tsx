/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { getBusinessNavItems } from '../../lib/business-nav';
import { requireConsoleSession } from '../../lib/console-guards';
import { getConsoleLocale } from '../../lib/console-locale';
import { listConsoleOrganizations } from '../../lib/console-organizations';
import { SignOutButton } from '../components/auth-forms';
import { BusinessShell } from '../components/business-shell';
import { PlatformShell } from '../components/platform-shell';

export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  const session = await requireConsoleSession();
  const locale = await getConsoleLocale();
  const switchLocale = locale === 'en' ? 'zh' : 'en';
  const localeSwitchLabel = locale === 'en' ? '中文' : 'English';
  const plane = (await headers()).get('x-console-plane') ?? 'business';

  if (plane === 'platform') {
    return (
      <PlatformShell userEmail={session.user.email}>
        {children}
      </PlatformShell>
    );
  }

  if (plane === 'status') {
    return (
      <div className="mx-auto w-[min(40rem,calc(100%-2rem))] py-16" data-shell="status">
        {children}
      </div>
    );
  }

  if (!session.organization || plane === 'onboarding') {
    return (
      <div className="shell" data-shell="onboarding">
        <header className="shell-header flex items-center justify-between gap-4 py-4">
          <div>
            <div className="font-semibold">morden-escpos</div>
            <div className="text-sm text-muted-foreground">
              <span>{session.user.email}</span>
              <span> · No active Organization</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`/api/console/locale?locale=${switchLocale}&next=/console/onboarding`}
              className="text-sm underline underline-offset-4"
            >
              {localeSwitchLabel}
            </a>
            <SignOutButton />
          </div>
        </header>
        <nav className="mb-4" aria-label="Onboarding">
          <a href="/console/onboarding">Onboarding</a>
        </nav>
        <div>{children}</div>
      </div>
    );
  }

  const organizations = await listConsoleOrganizations();
  const navItems = getBusinessNavItems();

  return (
    <BusinessShell
      organizations={organizations}
      activeOrganization={{
        id: session.organization.id,
        name: session.organization.name,
        slug: session.organization.slug,
      }}
      role={session.role}
      userEmail={session.user.email}
      navItems={navItems}
      localeSwitchHref={`/api/console/locale?locale=${switchLocale}&next=/console`}
      localeSwitchLabel={localeSwitchLabel}
    >
      {children}
    </BusinessShell>
  );
}
