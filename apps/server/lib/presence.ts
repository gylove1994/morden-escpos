/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { SERVER_CONFIG } from './config';

export type PresenceStatus = 'online' | 'offline';

/**
 * Derive online/offline from last poll/heartbeat timestamp.
 * Null/missing lastAuthenticatedAt means the Printer Agent has never checked in.
 */
export function presenceFromLastSeen(
  lastAuthenticatedAt: Date | string | null | undefined,
  now: Date = new Date(),
  windowMs: number = SERVER_CONFIG.PRINTER_AGENT_ONLINE_WINDOW_MS,
): PresenceStatus {
  if (!lastAuthenticatedAt) {
    return 'offline';
  }

  const seenAt = typeof lastAuthenticatedAt === 'string'
    ? new Date(lastAuthenticatedAt)
    : lastAuthenticatedAt;

  if (Number.isNaN(seenAt.getTime())) {
    return 'offline';
  }

  const ageMs = now.getTime() - seenAt.getTime();
  return ageMs >= 0 && ageMs <= windowMs ? 'online' : 'offline';
}
