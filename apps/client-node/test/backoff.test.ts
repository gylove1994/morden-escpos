/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { describe, expect, it } from 'vitest';
import { IdleBackoff } from '../src/backoff';

describe('idleBackoff', () => {
  it('grows exponentially up to max and resets after work', () => {
    const backoff = new IdleBackoff({
      initialMs: 1000,
      maxMs: 8000,
      multiplier: 2,
    });

    expect(backoff.onIdle()).toBe(1000);
    expect(backoff.currentMs()).toBe(2000);
    expect(backoff.onIdle()).toBe(2000);
    expect(backoff.currentMs()).toBe(4000);
    expect(backoff.onIdle()).toBe(4000);
    expect(backoff.currentMs()).toBe(8000);
    expect(backoff.onIdle()).toBe(8000);
    expect(backoff.currentMs()).toBe(8000);

    backoff.onWork();
    expect(backoff.currentMs()).toBe(1000);
  });
});
