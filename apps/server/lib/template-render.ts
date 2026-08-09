/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { PrintJobJSON } from 'morden-node-escpos/schema';
import type { Buffer } from 'node:buffer';
import { renderTemplateToBytes } from 'morden-node-escpos/render';
import { TemplateInputValidationError } from 'morden-node-escpos/template-inputs';

export class TemplateRenderError extends Error {
  readonly errors: string[];

  constructor(message: string, errors: string[] = []) {
    super(message);
    this.name = 'TemplateRenderError';
    this.errors = errors;
  }
}

/**
 * Render a stored template + inputs to raw ESC/POS via the MIT package.
 * Invalid inputs fail here (enqueue time) before a job is persisted.
 */
export async function renderTemplateJob(input: {
  definition: PrintJobJSON
  inputs: Record<string, unknown>
}): Promise<Buffer> {
  try {
    const bytes = await renderTemplateToBytes(input.definition, input.inputs);
    if (bytes.byteLength === 0) {
      throw new TemplateRenderError('Rendered ESC/POS payload must not be empty');
    }
    if (bytes.byteLength > 256 * 1024) {
      throw new TemplateRenderError('Rendered payload exceeds 256 KiB MVP limit');
    }
    return bytes;
  }
  catch (error) {
    if (error instanceof TemplateInputValidationError) {
      throw new TemplateRenderError(
        'Invalid template inputs',
        error.errors,
      );
    }
    if (error instanceof TemplateRenderError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : 'Template render failed';
    throw new TemplateRenderError(message);
  }
}
