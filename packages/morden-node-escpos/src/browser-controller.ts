/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { Adapter } from './adapter';
import type { ImageLoader } from './controller/json-executor';
import type { PrintCommandUnion, PrintJobJSON } from './controller/json-schema';

import { JSONPrintExecutor } from './controller/json-executor';
import { TemplateEngine } from './controller/template-engine';
import { Printer } from './printer';

export interface BrowserPrinterControllerOptions {
  adapter: Adapter<[]>
  encoding?: string
  width?: number
  imageLoader?: ImageLoader
}

export class BrowserPrinterController {
  private readonly adapter: Adapter<[]>;
  private readonly printer: Printer<[]>;
  private readonly executor: JSONPrintExecutor;
  private initialized = false;

  constructor(options: BrowserPrinterControllerOptions) {
    this.adapter = options.adapter;
    this.printer = new Printer(this.adapter, {
      encoding: options.encoding ?? 'GB18030',
      width: options.width ?? 32,
    });
    this.executor = new JSONPrintExecutor(this.printer, options.imageLoader);
  }

  get isInit(): boolean {
    return this.initialized;
  }

  init(): Promise<this> {
    return new Promise((resolve, reject) => {
      this.adapter.open((error) => {
        if (error) {
          reject(error);
          return;
        }
        this.initialized = true;
        resolve(this);
      });
    });
  }

  executeCommand(command: PrintCommandUnion): Promise<void> {
    return this.executor.executeCommand(command);
  }

  executeJob(job: PrintJobJSON): Promise<void> {
    return this.executor.executeJob(job);
  }

  async executeFromTemplate(
    template: PrintJobJSON,
    data: Record<string, unknown>,
  ): Promise<void> {
    const job = new TemplateEngine().render(template, data);
    await this.executeJob(job);
  }

  async flush(): Promise<void> {
    await this.printer.flush();
  }

  close(): Promise<this> {
    return new Promise((resolve, reject) => {
      this.adapter.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        this.initialized = false;
        resolve(this);
      });
    });
  }

  getPrinter(): Printer<[]> {
    return this.printer;
  }
}
