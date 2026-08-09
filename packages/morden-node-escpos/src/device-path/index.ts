/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { FileHandle } from 'node:fs/promises';
import { Buffer } from 'node:buffer';
import { open as fsOpen } from 'node:fs/promises';

import { Adapter } from '../adapter';

/**
 * Writes raw ESC/POS bytes to a filesystem device path.
 * Used for USB printer device nodes such as `/dev/usb/lp0`.
 *
 * Hardware is not required for unit tests — any writable path works (temp files).
 */
export default class DevicePathAdapter extends Adapter<[]> {
  private handle: FileHandle | null = null;

  constructor(readonly path: string) {
    super();
    if (!path.trim()) {
      throw new Error('DevicePathAdapter requires a non-empty path');
    }
  }

  open(callback?: (error: Error | null) => void): this {
    if (this.handle) {
      callback?.(null);
      return this;
    }

    void fsOpen(this.path, 'w')
      .then((handle) => {
        this.handle = handle;
        this.emit('connect', { path: this.path });
        callback?.(null);
      })
      .catch((error: Error) => {
        this.handle = null;
        callback?.(error);
      });

    return this;
  }

  write(data: string | Buffer, callback?: (error: Error | null) => void): this {
    const handle = this.handle;
    if (!handle) {
      callback?.(new Error(`Device path ${this.path} is not open`));
      return this;
    }

    const bufferData = typeof data === 'string' ? Buffer.from(data) : data;
    void handle.write(bufferData)
      .then(() => {
        this.emit('data', bufferData);
        callback?.(null);
      })
      .catch((error: Error) => {
        callback?.(error);
      });

    return this;
  }

  close(callback?: (error: Error | null) => void): this {
    const handle = this.handle;
    if (!handle) {
      callback?.(null);
      return this;
    }

    this.handle = null;
    void handle.close()
      .then(() => {
        this.emit('close', { path: this.path });
        callback?.(null);
      })
      .catch((error: Error) => {
        callback?.(error);
      });

    return this;
  }

  read(_callback?: (data: Buffer) => void): void {
    // RAW print path is write-only for MVP USB device nodes.
  }
}
