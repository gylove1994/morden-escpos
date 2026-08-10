import type { AnonymousPluginOptions } from '@better-auth-ui/core/plugins';
/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import { createAuthPlugin } from '@better-auth-ui/core';
import {

  anonymousPlugin as coreAnonymousPlugin,
} from '@better-auth-ui/core/plugins';

import { AnonymousButton } from '#components/auth/anonymous/anonymous-button';

export const anonymousPlugin = createAuthPlugin(
  coreAnonymousPlugin.id,
  (options: AnonymousPluginOptions = {}) => ({
    ...coreAnonymousPlugin(options),
    authButtons: [AnonymousButton],
  }),
);
