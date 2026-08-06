/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { Buffer as NodeBuffer } from 'node:buffer';

// eslint-disable-next-line unicorn/prefer-node-protocol -- browser entry bundles the Buffer polyfill
import { Buffer } from 'buffer';
import { Adapter } from '../adapter';

export interface SerialPortInfo {
  usbVendorId?: number
  usbProductId?: number
}

interface SerialWriter {
  write: (data: Uint8Array) => Promise<void>
  releaseLock: () => void
}

export interface WebSerialPort {
  readable: ReadableStream<Uint8Array> | null
  writable: {
    getWriter: () => SerialWriter
  } | null
  open: (options: { baudRate: number }) => Promise<void>
  close: () => Promise<void>
  getInfo: () => SerialPortInfo
}

interface WebSerial {
  getPorts: () => Promise<WebSerialPort[]>
  requestPort: () => Promise<WebSerialPort>
}

function getWebSerial(): WebSerial {
  const serial = (navigator as Navigator & { serial?: WebSerial }).serial;
  if (!serial) {
    throw new Error('当前浏览器不支持 Web Serial，请使用最新版 Chrome 或 Edge。');
  }
  return serial;
}

export class WebSerialAdapter extends Adapter<[]> {
  constructor(
    readonly port: WebSerialPort,
    readonly baudRate = 9600,
  ) {
    super();
  }

  static requestPort(): Promise<WebSerialPort> {
    return getWebSerial().requestPort();
  }

  static getAuthorizedPorts(): Promise<WebSerialPort[]> {
    return getWebSerial().getPorts();
  }

  open(callback?: (error: Error | null) => void): this {
    void this.port.open({ baudRate: this.baudRate }).then(
      () => {
        this.emit('connect', this.port);
        callback?.(null);
      },
      error => callback?.(error instanceof Error ? error : new Error(String(error))),
    );
    return this;
  }

  write(data: Buffer | string, callback?: (error: Error | null) => void): this {
    void this.writeData(data).then(
      () => callback?.(null),
      error => callback?.(error instanceof Error ? error : new Error(String(error))),
    );
    return this;
  }

  private async writeData(data: Buffer | string): Promise<void> {
    if (!this.port.writable) {
      throw new Error('串口尚未打开或不可写。');
    }
    const writer = this.port.writable.getWriter();
    try {
      const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
      await writer.write(bytes);
      this.emit('data', data);
    }
    finally {
      writer.releaseLock();
    }
  }

  close(callback?: (error: Error | null) => void): this {
    void this.port.close().then(
      () => {
        this.emit('close', this.port);
        callback?.(null);
      },
      error => callback?.(error instanceof Error ? error : new Error(String(error))),
    );
    return this;
  }

  read(callback?: (data: NodeBuffer) => void): void {
    if (!this.port.readable || !callback) {
      return;
    }
    const reader = this.port.readable.getReader();
    void reader.read().then(({ value }) => {
      reader.releaseLock();
      if (value) {
        callback(Buffer.from(value));
      }
    });
  }
}
