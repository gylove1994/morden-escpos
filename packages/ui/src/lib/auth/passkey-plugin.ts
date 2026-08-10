import type { PasskeyPluginOptions } from '@better-auth-ui/core/plugins';
/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import { createAuthPlugin } from '@better-auth-ui/core';
import {
  passkeyPlugin as corePasskeyPlugin,

} from '@better-auth-ui/core/plugins';

import { PasskeyButton } from '#components/auth/passkey/passkey-button';
import { Passkeys } from '#components/auth/passkey/passkeys';

export const passkeyPlugin = createAuthPlugin(
  corePasskeyPlugin.id,
  (options: PasskeyPluginOptions = {}) => ({
    ...corePasskeyPlugin(options),
    authButtons: [PasskeyButton],
    securityCards: [Passkeys],
  }),
);
