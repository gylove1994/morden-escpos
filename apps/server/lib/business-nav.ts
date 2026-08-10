/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { isCloudEdition } from './edition';

export interface BusinessNavItem {
  title: string
  href: string
  icon: 'overview' | 'agents' | 'printers' | 'groups' | 'templates' | 'jobs' | 'billing'
}

/**
 * Organization business sidebar items. Platform MUST NOT appear here.
 */
export function getBusinessNavItems(): BusinessNavItem[] {
  const items: BusinessNavItem[] = [
    { title: 'Overview', href: '/console', icon: 'overview' },
    { title: 'Printer Agents', href: '/console/printer-agents', icon: 'agents' },
    { title: 'Printers', href: '/console/printers', icon: 'printers' },
    { title: 'Printer Groups', href: '/console/printer-groups', icon: 'groups' },
    { title: 'Templates', href: '/console/templates', icon: 'templates' },
    { title: 'Jobs', href: '/console/jobs', icon: 'jobs' },
  ];

  if (isCloudEdition()) {
    items.push({ title: 'Billing', href: '/console/billing', icon: 'billing' });
  }

  return items;
}
