/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { Buffer } from 'node:buffer';

import { Adapter } from '../adapter';

interface SocketWriter {
  write: (data: Uint8Array) => Promise<void>
  close: () => Promise<void>
  releaseLock: () => void
}

interface OpenedSocket {
  readable: ReadableStream<Uint8Array>
  writable: {
    getWriter: () => SocketWriter
  }
}

interface TCPSocketLike {
  opened: Promise<OpenedSocket>
  close: () => Promise<void>
}

type TCPSocketConstructor = new (
  remoteAddress: string,
  remotePort: number,
  options?: { keepAlive?: boolean },
) => TCPSocketLike;

function getTCPSocketConstructor(): TCPSocketConstructor {
  const constructor = (globalThis as typeof globalThis & {
    TCPSocket?: TCPSocketConstructor
  }).TCPSocket;
  if (!constructor) {
    throw new Error(
      '当前环境不支持 Direct Sockets。网络打印需要启用该能力的 Chrome 隔离式 Web 应用。',
    );
  }
  return constructor;
}

export class TcpSocketAdapter extends Adapter<[]> {
  private socket: TCPSocketLike | null = null;
  private writer: SocketWriter | null = null;

  constructor(
    readonly host: string,
    readonly port = 9100,
  ) {
    super();
  }

  static isSupported(): boolean {
    return 'TCPSocket' in globalThis;
  }

  open(callback?: (error: Error | null) => void): this {
    void this.openSocket().then(
      () => callback?.(null),
      error => callback?.(error instanceof Error ? error : new Error(String(error))),
    );
    return this;
  }

  private async openSocket(): Promise<void> {
    const TCPSocket = getTCPSocketConstructor();
    this.socket = new TCPSocket(this.host, this.port, { keepAlive: true });
    const opened = await this.socket.opened;
    this.writer = opened.writable.getWriter();
    this.emit('connect', { host: this.host, port: this.port });
  }

  write(data: Buffer | string, callback?: (error: Error | null) => void): this {
    void this.writeData(data).then(
      () => callback?.(null),
      error => callback?.(error instanceof Error ? error : new Error(String(error))),
    );
    return this;
  }

  private async writeData(data: Buffer | string): Promise<void> {
    if (!this.writer) {
      throw new Error('TCP 打印机尚未连接。');
    }
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    await this.writer.write(bytes);
    this.emit('data', data);
  }

  close(callback?: (error: Error | null) => void): this {
    void this.closeSocket().then(
      () => callback?.(null),
      error => callback?.(error instanceof Error ? error : new Error(String(error))),
    );
    return this;
  }

  private async closeSocket(): Promise<void> {
    if (this.writer) {
      await this.writer.close();
      this.writer.releaseLock();
      this.writer = null;
    }
    await this.socket?.close();
    this.socket = null;
    this.emit('close', { host: this.host, port: this.port });
  }

  read(): void {}
}
