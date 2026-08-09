/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { describe, expect, it } from 'vitest';
import { presenceFromLastSeen } from '../lib/presence';

describe('presenceFromLastSeen', () => {
  const now = new Date('2026-04-01T12:00:00.000Z');

  it('is offline when never authenticated', () => {
    expect(presenceFromLastSeen(null, now, 60_000)).toBe('offline');
    expect(presenceFromLastSeen(undefined, now, 60_000)).toBe('offline');
  });

  it('is online within the window and offline after', () => {
    expect(presenceFromLastSeen('2026-04-01T11:59:30.000Z', now, 60_000)).toBe('online');
    expect(presenceFromLastSeen('2026-04-01T11:58:00.000Z', now, 60_000)).toBe('offline');
  });
});
