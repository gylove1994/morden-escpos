import type { LastLoginMethodPluginOptions } from '@better-auth-ui/core/plugins';
/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import { createAuthPlugin } from '@better-auth-ui/core';
import {
  lastLoginMethodPlugin as coreLastLoginMethodPlugin,

} from '@better-auth-ui/core/plugins';

export const lastLoginMethodPlugin = createAuthPlugin(
  coreLastLoginMethodPlugin.id,
  (options: LastLoginMethodPluginOptions = {}) => ({
    ...coreLastLoginMethodPlugin(options),
  }),
);
