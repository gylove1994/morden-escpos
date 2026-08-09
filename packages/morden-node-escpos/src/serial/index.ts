/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { FileHandle } from 'node:fs/promises';
import { Buffer } from 'node:buffer';
import { open as fsOpen } from 'node:fs/promises';

import { Adapter } from '../adapter';

const DEFAULT_BAUD_RATE = 9600;
const MIN_BAUD_RATE = 300;
const MAX_BAUD_RATE = 1_000_000;

export type SerialPortLike = {
  open: () => Promise<void> | void
  write: (data: Buffer, callback: (error: Error | null | undefined) => void) => void
  close: (callback?: (error: Error | null | undefined) => void) => void
};

export type SerialPortFactory = (options: {
  path: string
  baudRate: number
}) => SerialPortLike | Promise<SerialPortLike>;

/**
 * Serial transport adapter for RAW ESC/POS printers.
 *
 * Opens `path` (e.g. `/dev/ttyUSB0`, `COM3`) and writes payload bytes.
 * When a `portFactory` is provided it is used so baud rate can be applied via
 * a real serial binding (e.g. `serialport`). Without a factory, the adapter
 * writes through the filesystem — suitable for adapter tests with temp files
 * and for device nodes already configured by the OS.
 */
export default class SerialAdapter extends Adapter<[]> {
  readonly baudRate: number;
  private handle: FileHandle | null = null;
  private port: SerialPortLike | null = null;
  private readonly portFactory: SerialPortFactory | undefined;

  constructor(
    readonly path: string,
    baudRate: number = DEFAULT_BAUD_RATE,
    options?: { portFactory?: SerialPortFactory },
  ) {
    super();
    if (!path.trim()) {
      throw new Error('SerialAdapter requires a non-empty path');
    }
    if (!Number.isInteger(baudRate) || baudRate < MIN_BAUD_RATE || baudRate > MAX_BAUD_RATE) {
      throw new Error(
        `SerialAdapter baudRate must be an integer between ${MIN_BAUD_RATE} and ${MAX_BAUD_RATE}`,
      );
    }
    this.baudRate = baudRate;
    this.portFactory = options?.portFactory;
  }

  open(callback?: (error: Error | null) => void): this {
    if (this.handle || this.port) {
      callback?.(null);
      return this;
    }

    if (this.portFactory) {
      void Promise.resolve(this.portFactory({ path: this.path, baudRate: this.baudRate }))
        .then(async (port) => {
          await port.open();
          this.port = port;
          this.emit('connect', { path: this.path, baudRate: this.baudRate });
          callback?.(null);
        })
        .catch((error: Error) => {
          this.port = null;
          callback?.(error);
        });
      return this;
    }

    void fsOpen(this.path, 'w')
      .then((handle) => {
        this.handle = handle;
        this.emit('connect', { path: this.path, baudRate: this.baudRate });
        callback?.(null);
      })
      .catch((error: Error) => {
        this.handle = null;
        callback?.(error);
      });

    return this;
  }

  write(data: string | Buffer, callback?: (error: Error | null) => void): this {
    const bufferData = typeof data === 'string' ? Buffer.from(data) : data;

    if (this.port) {
      this.port.write(bufferData, (error) => {
        if (!error) {
          this.emit('data', bufferData);
        }
        callback?.(error ?? null);
      });
      return this;
    }

    const handle = this.handle;
    if (!handle) {
      callback?.(new Error(`Serial path ${this.path} is not open`));
      return this;
    }

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
    if (this.port) {
      const port = this.port;
      this.port = null;
      port.close((error) => {
        if (!error) {
          this.emit('close', { path: this.path, baudRate: this.baudRate });
        }
        callback?.(error ?? null);
      });
      return this;
    }

    const handle = this.handle;
    if (!handle) {
      callback?.(null);
      return this;
    }

    this.handle = null;
    void handle.close()
      .then(() => {
        this.emit('close', { path: this.path, baudRate: this.baudRate });
        callback?.(null);
      })
      .catch((error: Error) => {
        callback?.(error);
      });

    return this;
  }

  read(_callback?: (data: Buffer) => void): void {
    // RAW print path is write-only for MVP serial.
  }
}
