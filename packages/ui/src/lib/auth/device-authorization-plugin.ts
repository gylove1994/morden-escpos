import type { DeviceAuthorizationPluginOptions } from '@better-auth-ui/core/plugins';
/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import { createAuthPlugin } from '@better-auth-ui/core';
import {
  deviceAuthorizationPlugin as coreDeviceAuthorizationPlugin,

} from '@better-auth-ui/core/plugins';

import { DeviceAuthorization } from '#components/auth/device-authorization/device-authorization';

export const deviceAuthorizationPlugin = createAuthPlugin(
  coreDeviceAuthorizationPlugin.id,
  (options: DeviceAuthorizationPluginOptions = {}) => ({
    ...coreDeviceAuthorizationPlugin(options),
    views: {
      auth: {
        deviceAuthorization: DeviceAuthorization,
      },
    },
  }),
);
