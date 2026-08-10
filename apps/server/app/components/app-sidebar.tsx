/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
'use client';

import type { BusinessNavItem } from '../../lib/business-nav';
import type { ConsoleOrganizationOption } from '../../lib/console-organizations';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@workspace/ui/components/ui/sidebar';
import {
  Building2,
  FileText,
  Layers3,
  LayoutDashboard,
  Printer,
  ReceiptText,
  Server,
  Workflow,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignOutButton } from './auth-forms';
import { OrganizationSwitcher } from './organization-switcher';

const ICONS = {
  overview: LayoutDashboard,
  agents: Server,
  printers: Printer,
  groups: Layers3,
  templates: FileText,
  jobs: Workflow,
  billing: ReceiptText,
} as const;

export function AppSidebar({
  organizations,
  activeOrganization,
  role,
  userEmail,
  navItems,
  localeSwitchHref,
  localeSwitchLabel,
}: {
  organizations: ConsoleOrganizationOption[]
  activeOrganization: ConsoleOrganizationOption
  role: string | null
  userEmail: string
  navItems: BusinessNavItem[]
  localeSwitchHref: string
  localeSwitchLabel: string
}) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" data-testid="business-sidebar">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5 text-sm font-semibold">
          <Building2 className="size-4" />
          <span className="truncate">morden-escpos</span>
        </div>
        <OrganizationSwitcher
          organizations={organizations}
          activeOrganization={activeOrganization}
          role={role}
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Business</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu data-testid="business-nav">
              {navItems.map((item) => {
                const Icon = ICONS[item.icon];
                const active = pathname === item.href
                  || (item.href !== '/console' && pathname.startsWith(`${item.href}/`));
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link href={item.href} data-nav={item.title}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex flex-col gap-2 px-2 pb-2 text-xs text-muted-foreground">
          <span className="truncate" title={userEmail}>{userEmail}</span>
          <a href={localeSwitchHref} className="underline underline-offset-4">
            {localeSwitchLabel}
          </a>
          <SignOutButton />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
