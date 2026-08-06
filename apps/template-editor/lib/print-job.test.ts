/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { PrintJobJSON } from 'morden-node-escpos/schema';

import { describe, expect, it } from 'vitest';

import { createDefaultDocument, defaultPrintJob } from './default-template';
import { createCommand, fromPrintJob, importPrintJob, parseSampleData, toPrintJob, validatePrintJob } from './print-job';

describe('print job conversion', () => {
  it('normalizes state commands into content formats without editor ids', () => {
    const document = fromPrintJob(defaultPrintJob, '{}', index => `node-${index}`);
    const job = toPrintJob(document);
    const roundTrip = fromPrintJob(job, '{}', index => `round-trip-${index}`);
    const comparableCommands = (commands: typeof document.commands) =>
      commands.map(({ command, format }) => ({ command, format }));

    expect(document.commands.some(item =>
      item.command.type === 'align'
      || item.command.type === 'style'
      || item.command.type === 'size',
    )).toBe(false);
    expect(comparableCommands(roundTrip.commands)).toEqual(comparableCommands(document.commands));
    expect(JSON.stringify(job)).not.toContain('node-');
    expect(document.cutMode).toBe('full');
    expect(document.commands.some(item => item.command.type === 'cut')).toBe(false);
    expect(job.commands.at(-1)).toEqual({ type: 'cut' });
  });

  it('preserves independent formats for adjacent content', () => {
    const document = fromPrintJob({
      commands: [
        { type: 'align', value: 'CT' },
        { type: 'style', value: 'B' },
        { type: 'size', width: 2, height: 2 },
        { type: 'text', content: 'Heading' },
        { type: 'align', value: 'LT' },
        { type: 'style', value: 'NORMAL' },
        { type: 'size', width: 1, height: 1 },
        { type: 'text', content: 'Body' },
      ],
    }, '{}', index => `node-${index}`);

    expect(document.commands).toHaveLength(2);
    expect(document.commands[0]?.format).toEqual({
      align: 'CT',
      style: 'B',
      width: 2,
      height: 2,
    });
    expect(document.commands[1]?.format).toEqual({
      align: 'LT',
      style: 'NORMAL',
      width: 1,
      height: 1,
    });
    expect(document.commands[0]?.richValue).toEqual([{
      type: 'p',
      children: [{ text: 'Heading', bold: true, width: 2, height: 2 }],
    }]);
    expect(toPrintJob(document).commands).toEqual([
      { type: 'align', value: 'CT' },
      { type: 'style', value: 'B' },
      { type: 'size', width: 2, height: 2 },
      { type: 'text', content: 'Heading' },
      { type: 'align', value: 'LT' },
      { type: 'style', value: 'NORMAL' },
      { type: 'size', width: 1, height: 1 },
      { type: 'text', content: 'Body' },
    ]);
  });

  it('folds inline text runs into one rich text command and restores the ESC/POS sequence', () => {
    const source: PrintJobJSON = {
      commands: [
        { type: 'align', value: 'CT' },
        { type: 'style', value: 'B' },
        { type: 'size', width: 2, height: 2 },
        { type: 'pureText', content: '重要：' },
        { type: 'style', value: 'I' as const },
        { type: 'size', width: 1, height: 3 },
        { type: 'text', content: '{{message}}' },
      ],
    };

    const document = fromPrintJob(source, '{}', index => `rich-${index}`);

    expect(document.commands).toHaveLength(1);
    expect(document.commands[0]?.command).toEqual({ type: 'text', content: '重要：{{message}}' });
    expect(document.commands[0]?.richValue).toEqual([{
      type: 'p',
      children: [
        { text: '重要：', bold: true, width: 2, height: 2 },
        { text: '{{message}}', italic: true, width: 1, height: 3 },
      ],
    }]);
    expect(toPrintJob(document).commands).toEqual(source.commands);
  });

  it('preserves trailing inline text and explicit blank lines', () => {
    const inlineDocument = fromPrintJob({
      commands: [{ type: 'pureText', content: '未换行' }],
    }, '{}', index => `inline-${index}`);
    const blankLineDocument = fromPrintJob({
      commands: [
        { type: 'text', content: '第一行' },
        { type: 'newLine' },
      ],
    }, '{}', index => `line-${index}`);

    expect(inlineDocument.commands[0]?.command.type).toBe('pureText');
    expect(toPrintJob(inlineDocument).commands).toEqual([{ type: 'pureText', content: '未换行' }]);
    expect(blankLineDocument.commands[0]?.richValue).toHaveLength(2);
    expect(toPrintJob(blankLineDocument).commands).toEqual([
      { type: 'text', content: '第一行' },
      { type: 'newLine' },
    ]);
  });

  it('normalizes standalone newLine commands to one-line feed components', () => {
    const document = fromPrintJob({
      commands: [
        { type: 'newLine' },
        { type: 'drawLine', character: '-' },
      ],
    }, '{}', index => `standalone-${index}`);

    expect(document.commands[0]?.command).toEqual({ type: 'feed', lines: 1 });
    expect(toPrintJob(document).commands).toEqual([
      { type: 'feed', lines: 1 },
      { type: 'drawLine', character: '-' },
    ]);
  });

  it('imports legacy cuts as one document setting and always exports it last', () => {
    const document = fromPrintJob({
      commands: [
        { type: 'cut' },
        { type: 'text', content: '正文' },
        { type: 'cut', partial: true },
      ],
    }, '{}', index => `cut-${index}`);

    expect(document.cutMode).toBe('partial');
    expect(document.commands.every(item => item.command.type !== 'cut')).toBe(true);
    expect(toPrintJob(document).commands).toEqual([
      { type: 'text', content: '正文' },
      { type: 'cut', partial: true },
    ]);
  });

  it('supports full, partial, and disabled document cut modes', () => {
    const document = fromPrintJob({ commands: [] });

    document.cutMode = 'full';
    expect(toPrintJob(document).commands).toEqual([{ type: 'cut' }]);

    document.cutMode = 'partial';
    expect(toPrintJob(document).commands).toEqual([{ type: 'cut', partial: true }]);

    document.cutMode = 'none';
    expect(toPrintJob(document).commands).toEqual([]);
  });

  it('maps paper width to ESC/POS character width', () => {
    const document = createDefaultDocument();
    document.paperWidth = 80;

    expect(toPrintJob(document).config?.width).toBe(48);
  });

  it('round-trips the template input schema', () => {
    const source: PrintJobJSON = {
      inputs: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', title: '姓名' },
        },
      },
      commands: [{ type: 'text', content: '{{name}}' }],
    };

    const document = fromPrintJob(source);
    expect(document.inputSchema).toEqual(source.inputs);
    expect(toPrintJob(document).inputs).toEqual(source.inputs);
  });
});

describe('print job validation', () => {
  it('creates a URL-backed raster command', () => {
    expect(createCommand('raster')).toEqual({
      type: 'raster',
      path: 'https://placehold.co/320x120/png?text=LOGO',
      mode: 'normal',
    });
  });

  it('reports malformed JSON', () => {
    expect(importPrintJob('{"commands":')).toEqual({
      errors: ['文件不是有效的 JSON，请检查逗号、引号或括号。'],
    });
  });

  it('reports command field errors with their index', () => {
    const result = validatePrintJob({
      commands: [{ type: 'qrcode', content: 42 }],
    });

    expect(result.errors).toContain('commands[0].content 必须是字符串');
  });

  it('requires image commands to contain a non-empty path', () => {
    const result = validatePrintJob({
      commands: [{ type: 'raster', path: '   ' }],
    });

    expect(result.errors).toContain('commands[0].path 必须是非空字符串');
  });

  it('validates custom table array paths', () => {
    const valid = validatePrintJob({
      commands: [{
        type: 'tableCustom',
        each: 'order.items',
        data: [{ text: '{{name}}', cols: 16 }],
      }],
    });
    const invalid = validatePrintJob({
      commands: [{
        type: 'tableCustom',
        each: 42,
        data: [{ text: '{{name}}', cols: 16 }],
      }],
    });

    expect(valid.errors).toEqual([]);
    expect(invalid.errors).toContain('commands[0].each 必须是数组路径字符串');
  });

  it('preserves recognized advanced commands on import', () => {
    const result = importPrintJob(JSON.stringify({
      commands: [{ type: 'cashdraw', pin: 2 }],
    }));

    expect(result.document?.commands[0]?.command).toEqual({ type: 'cashdraw', pin: 2 });
  });

  it('requires sample data to be an object', () => {
    expect(parseSampleData('[]').error).toBe('示例数据必须是 JSON 对象。');
  });
});
