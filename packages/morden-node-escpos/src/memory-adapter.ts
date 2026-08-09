/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
// eslint-disable-next-line unicorn/prefer-node-protocol -- browser entry bundles the Buffer polyfill
import { Buffer } from 'buffer';
import { Adapter } from './adapter';

/**
 * In-memory Adapter that captures flushed ESC/POS bytes.
 * Used for server-side / headless render without opening a physical device.
 */
export class MemoryAdapter extends Adapter<[]> {
  private chunks: Buffer[] = [];

  open(callback?: (error: Error | null) => void): this {
    callback?.(null);
    return this;
  }

  write(data: Buffer | string, callback?: (error: Error | null) => void): this {
    const chunk = typeof data === 'string' ? Buffer.from(data, 'binary') : Buffer.from(data);
    this.chunks.push(chunk);
    callback?.(null);
    return this;
  }

  close(callback?: (error: Error | null) => void): this {
    callback?.(null);
    return this;
  }

  read(_callback?: (data: Buffer) => void): void {
    // No device to read from.
  }

  /** Concatenate all bytes written since the last clear. */
  getBuffer(): Buffer {
    return Buffer.concat(this.chunks);
  }

  clear(): void {
    this.chunks = [];
  }
}
