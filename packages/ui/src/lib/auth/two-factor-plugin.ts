import type { TwoFactorPluginOptions } from '@better-auth-ui/core/plugins';
/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import { createAuthPlugin } from '@better-auth-ui/core';
import {
  twoFactorPlugin as coreTwoFactorPlugin,

} from '@better-auth-ui/core/plugins';

import { TwoFactorChallenge } from '#components/auth/two-factor/two-factor-challenge';
import { TwoFactorSettings } from '#components/auth/two-factor/two-factor-settings';

export const twoFactorPlugin = createAuthPlugin(
  coreTwoFactorPlugin.id,
  (options: TwoFactorPluginOptions = {}) => ({
    ...coreTwoFactorPlugin(options),
    securityCards: [TwoFactorSettings],
    views: {
      auth: { twoFactor: TwoFactorChallenge },
    },
  }),
);
