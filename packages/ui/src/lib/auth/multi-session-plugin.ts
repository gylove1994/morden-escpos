import type { MultiSessionPluginOptions } from '@better-auth-ui/core/plugins';
/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import { createAuthPlugin } from '@better-auth-ui/core';
import {
  multiSessionPlugin as coreMultiSessionPlugin,

} from '@better-auth-ui/core/plugins';

import { ManageAccounts } from '#components/auth/multi-session/manage-accounts';
import { SwitchAccountSubmenu } from '#components/auth/multi-session/switch-account-submenu';

export const multiSessionPlugin = createAuthPlugin(
  coreMultiSessionPlugin.id,
  (options: MultiSessionPluginOptions = {}) => ({
    ...coreMultiSessionPlugin(options),
    accountCards: [ManageAccounts],
    userMenuItems: [SwitchAccountSubmenu],
  }),
);
