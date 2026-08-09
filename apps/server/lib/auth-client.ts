/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
'use client';

import { organizationClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

/**
 * Browser client for human session auth.
 * Printer Agent device tokens MUST NOT use this client (#4).
 */
export const authClient = createAuthClient({
  plugins: [organizationClient()],
});
