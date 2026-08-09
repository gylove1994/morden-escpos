/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Better Auth catch-all for human session endpoints (sign-up, sign-in, organization, …).
 * Printer Agent device-token routes MUST live elsewhere (#4).
 */
export const { GET, POST } = toNextJsHandler(auth);
