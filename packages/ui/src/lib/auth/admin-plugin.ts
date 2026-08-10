import type { AdminPluginOptions } from '@better-auth-ui/core/plugins';
/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import { createAuthPlugin } from '@better-auth-ui/core';
import {

  adminPlugin as coreAdminPlugin,
} from '@better-auth-ui/core/plugins';

import { StopImpersonating } from '#components/auth/admin/stop-impersonating';

export const adminPlugin = createAuthPlugin(
  coreAdminPlugin.id,
  (options: AdminPluginOptions = {}) => ({
    ...coreAdminPlugin(options),
    userMenuItems: [StopImpersonating],
  }),
);
