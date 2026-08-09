/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { PrintJobJSON } from './controller/json-schema';
import { JSONPrintExecutor } from './controller/json-executor';
import { TemplateEngine } from './controller/template-engine';
import { MemoryAdapter } from './memory-adapter';
import { Printer } from './printer';

export type RenderBytesOptions = {
  /** Default encoding when the job does not set config.encoding. */
  encoding?: string
  /** Default print width when the job does not set config.width. */
  width?: number
};

/**
 * Render a fully resolved PrintJobJSON to raw ESC/POS bytes.
 * Does not open USB/network devices — bytes are captured in memory.
 */
export async function renderPrintJobToBytes(
  job: PrintJobJSON,
  options: RenderBytesOptions = {},
): Promise<Buffer> {
  const adapter = new MemoryAdapter();
  const printer = new Printer(adapter, {
    encoding: job.config?.encoding ?? options.encoding ?? 'GB18030',
    width: job.config?.width ?? options.width ?? 48,
  });
  const executor = new JSONPrintExecutor(printer);
  await executor.executeJob(job);
  await printer.flush();
  return adapter.getBuffer();
}

/**
 * Validate template inputs (when defined), substitute `{{variables}}`,
 * then render the resulting print job to raw ESC/POS bytes.
 *
 * Throws `TemplateInputValidationError` when `template.inputs` rejects `data`.
 */
export async function renderTemplateToBytes(
  template: PrintJobJSON,
  data: Record<string, unknown>,
  options: RenderBytesOptions = {},
): Promise<Buffer> {
  const engine = new TemplateEngine();
  const job = engine.render(template, data);
  return renderPrintJobToBytes(job, options);
}
