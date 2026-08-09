/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { createHash, randomBytes } from 'node:crypto';

/** Device tokens are distinct from human sessions, integrator API keys, and webhook secrets. */
export const DEVICE_TOKEN_PREFIX = 'pa_';

/**
 * Generate a high-entropy Printer Agent device token.
 * Format: `pa_` + base64url(32 random bytes).
 */
export function generateDeviceToken(): string {
  return `${DEVICE_TOKEN_PREFIX}${randomBytes(32).toString('base64url')}`;
}

/** SHA-256 hex digest for at-rest storage. */
export function hashDeviceToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

/** Short non-secret label for console lists (never reconstructs the token). */
export function deviceTokenPrefix(token: string): string {
  return token.slice(0, 10);
}
