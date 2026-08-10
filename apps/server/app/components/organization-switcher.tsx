/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
'use client';

import type { ConsoleOrganizationOption } from '../../lib/console-organizations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@workspace/ui/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@workspace/ui/components/ui/sidebar';
import { ChevronsUpDown, GalleryVerticalEnd } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authClient } from '../../lib/auth-client';

export function OrganizationSwitcher({
  organizations,
  activeOrganization,
  role,
}: {
  organizations: ConsoleOrganizationOption[]
  activeOrganization: ConsoleOrganizationOption
  role: string | null
}) {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function setActive(organizationId: string) {
    if (organizationId === activeOrganization.id) {
      return;
    }
    setPendingId(organizationId);
    await authClient.organization.setActive({ organizationId });
    setPendingId(null);
    router.refresh();
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              data-testid="organization-switcher"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <GalleryVerticalEnd className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeOrganization.name}</span>
                <span className="truncate text-xs">
                  {activeOrganization.slug}
                  {role ? ` · ${role}` : ''}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Organizations
            </DropdownMenuLabel>
            {organizations.map(org => (
              <DropdownMenuItem
                key={org.id}
                disabled={pendingId === org.id}
                onClick={() => {
                  void setActive(org.id);
                }}
                data-organization-id={org.id}
              >
                <div className="flex flex-col gap-0.5">
                  <span>{org.name}</span>
                  <span className="text-xs text-muted-foreground">{org.slug}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
