/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */

export type IdleBackoffOptions = {
  initialMs: number
  maxMs: number
  multiplier: number
};

/**
 * Exponential idle backoff for short-poll loops when no work is available.
 */
export class IdleBackoff {
  private delayMs: number;

  constructor(private readonly options: IdleBackoffOptions) {
    this.delayMs = options.initialMs;
  }

  /** Current delay to wait before the next idle poll. */
  currentMs(): number {
    return this.delayMs;
  }

  /** Record an empty poll (204) and advance the backoff window. */
  onIdle(): number {
    const current = this.delayMs;
    this.delayMs = Math.min(
      this.options.maxMs,
      Math.max(this.options.initialMs, Math.floor(this.delayMs * this.options.multiplier)),
    );
    return current;
  }

  /** Reset after work was leased / handled. */
  onWork(): void {
    this.delayMs = this.options.initialMs;
  }

  reset(): void {
    this.onWork();
  }
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new Error('aborted'));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason ?? new Error('aborted'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
