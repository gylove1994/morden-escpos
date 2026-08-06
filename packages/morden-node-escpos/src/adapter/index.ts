/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { Buffer } from 'node:buffer';

// eslint-disable-next-line unicorn/prefer-node-protocol -- browser entry bundles the events polyfill
import EventEmitter from 'events';

export class NotImplementedException extends Error {}

export abstract class Adapter<CloseArgs extends unknown[]> extends EventEmitter {
  abstract open(callback?: (error: Error | null) => void): this;
  abstract write(data: Buffer | string, callback?: (error: Error | null) => void): this;
  abstract close(callback?: (error: Error | null) => void, ...closeArgs: CloseArgs): this;
  abstract read(callback?: (data: Buffer) => void): void;
}
