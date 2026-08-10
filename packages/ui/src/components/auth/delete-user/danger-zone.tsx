/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
'use client';

import type { ComponentProps } from 'react';
import { useAuth } from '@better-auth-ui/react';

import { cn } from '#lib/utils';
import { DeleteAccount } from './delete-account';

export interface DangerZoneProps {
  className?: string
}

/**
 * Renders the danger zone heading and {@link DeleteAccount}.
 * Registered as a `securityCard` by `deleteUserPlugin()`; gate by registering the plugin.
 */
export function DangerZone({
  className,
  ...props
}: DangerZoneProps & Omit<ComponentProps<'div'>, 'children' | 'className'>) {
  const { localization } = useAuth();

  return (
    <div className={cn('flex w-full flex-col', className)} {...props}>
      <h2 className="text-sm font-semibold mb-3 text-destructive">
        {localization.settings.dangerZone}
      </h2>

      <DeleteAccount />
    </div>
  );
}
