/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { PrintJobJSON } from './controller/json-schema';
import { describe, expect, it } from 'vitest';
import { TemplateInputValidationError } from './controller/template-inputs';
import { renderPrintJobToBytes, renderTemplateToBytes } from './render-bytes';

describe('renderPrintJobToBytes / renderTemplateToBytes', () => {
  it('renders a raw hex command to the expected ESC/POS bytes', async () => {
    const job: PrintJobJSON = {
      commands: [{ type: 'raw', data: '1b 40 48 69 0a' }],
    };

    const bytes = await renderPrintJobToBytes(job);
    expect(bytes.equals(Buffer.from([0x1b, 0x40, 0x48, 0x69, 0x0a]))).toBe(true);
  });

  it('substitutes template variables then renders raw bytes', async () => {
    const template: PrintJobJSON = {
      inputs: {
        type: 'object',
        required: ['payload'],
        properties: {
          payload: { type: 'string' },
        },
      },
      commands: [{ type: 'raw', data: '{{payload}}' }],
    };

    const bytes = await renderTemplateToBytes(template, {
      payload: '1b4048690a',
    });
    expect(bytes.equals(Buffer.from([0x1b, 0x40, 0x48, 0x69, 0x0a]))).toBe(true);
  });

  it('rejects invalid template inputs before producing bytes', async () => {
    const template: PrintJobJSON = {
      inputs: {
        type: 'object',
        required: ['payload'],
        properties: {
          payload: { type: 'string' },
        },
      },
      commands: [{ type: 'raw', data: '{{payload}}' }],
    };

    await expect(renderTemplateToBytes(template, {})).rejects.toBeInstanceOf(
      TemplateInputValidationError,
    );
  });
});
