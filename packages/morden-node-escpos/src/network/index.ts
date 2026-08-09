/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import { Buffer } from 'node:buffer';
import net from 'node:net';

import { Adapter } from '../adapter';

/**
 * Node.js TCP adapter for RAW ESC/POS printers (typically port 9100).
 */
export default class NetworkAdapter extends Adapter<[]> {
  private socket: net.Socket | null = null;

  constructor(
    readonly address: string,
    readonly port = 9100,
    readonly timeoutMs = 30_000,
  ) {
    super();
    if (!address.trim()) {
      throw new Error('NetworkAdapter requires a non-empty address');
    }
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('NetworkAdapter port must be an integer between 1 and 65535');
    }
  }

  open(callback?: (error: Error | null) => void): this {
    if (this.socket) {
      callback?.(null);
      return this;
    }

    const socket = net.connect({ host: this.address, port: this.port });
    this.socket = socket;
    socket.setTimeout(this.timeoutMs);

    let settled = false;
    const settle = (error: Error | null) => {
      if (settled)
        return;
      settled = true;
      callback?.(error);
    };

    socket.once('connect', () => {
      this.emit('connect', { address: this.address, port: this.port });
      settle(null);
    });

    socket.once('error', (error) => {
      this.socket = null;
      settle(error);
    });

    socket.once('timeout', () => {
      const error = new Error(
        `TCP connection to ${this.address}:${this.port} timed out after ${this.timeoutMs}ms`,
      );
      socket.destroy(error);
      this.socket = null;
      settle(error);
    });

    return this;
  }

  write(data: Buffer | string, callback?: (error: Error | null) => void): this {
    const socket = this.socket;
    if (!socket || socket.destroyed) {
      callback?.(new Error('TCP printer is not connected'));
      return this;
    }

    const bufferData = typeof data === 'string' ? Buffer.from(data) : data;
    socket.write(bufferData, (error) => {
      if (!error) {
        this.emit('data', bufferData);
      }
      callback?.(error ?? null);
    });
    return this;
  }

  close(callback?: (error: Error | null) => void): this {
    const socket = this.socket;
    if (!socket) {
      callback?.(null);
      return this;
    }

    this.socket = null;
    let settled = false;
    const settle = (error: Error | null) => {
      if (settled)
        return;
      settled = true;
      if (!error) {
        this.emit('close', { address: this.address, port: this.port });
      }
      callback?.(error);
    };

    socket.end(() => settle(null));
    socket.once('error', error => settle(error));
    return this;
  }

  read(_callback?: (data: Buffer) => void): void {
    // RAW print path is write-only for MVP TCP.
  }
}
