/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
'use client';

import type { ReactNode } from 'react';
import type { BusinessNavItem } from '../../lib/business-nav';
import type { ConsoleOrganizationOption } from '../../lib/console-organizations';
import { Separator } from '@workspace/ui/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@workspace/ui/components/ui/sidebar';
import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';
import { AppSidebar } from './app-sidebar';

export function BusinessShell({
  children,
  organizations,
  activeOrganization,
  role,
  userEmail,
  navItems,
  localeSwitchHref,
  localeSwitchLabel,
}: {
  children: ReactNode
  organizations: ConsoleOrganizationOption[]
  activeOrganization: ConsoleOrganizationOption
  role: string | null
  userEmail: string
  navItems: BusinessNavItem[]
  localeSwitchHref: string
  localeSwitchLabel: string
}) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex min-h-svh w-full" data-shell="business">
          <AppSidebar
            organizations={organizations}
            activeOrganization={activeOrganization}
            role={role}
            userEmail={userEmail}
            navItems={navItems}
            localeSwitchHref={localeSwitchHref}
            localeSwitchLabel={localeSwitchLabel}
          />
          <SidebarInset>
            <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <div className="text-sm">
                <span className="font-medium">{activeOrganization.name}</span>
                <span className="text-muted-foreground">
                  {' '}
                  ·
                  {activeOrganization.slug}
                </span>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
