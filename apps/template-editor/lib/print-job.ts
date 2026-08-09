/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { PrintCommandUnion, PrintJobJSON, TemplateInputSchema } from 'morden-node-escpos/schema';

import type { CutMode, EditorDocument, ImportResult, PaperWidth, UserMessage, ValidationResult } from './editor-types';

import { z } from 'zod';
import { decodePrintCommands, encodePrintCommands } from './content-format';

const commandTypes = new Set([
  'text',
  'pureText',
  'print',
  'newLine',
  'align',
  'style',
  'size',
  'font',
  'barcode',
  'qrcode',
  'qrimage',
  'image',
  'raster',
  'cut',
  'feed',
  'control',
  'hardware',
  'marginLeft',
  'marginRight',
  'marginBottom',
  'drawLine',
  'table',
  'tableCustom',
  'spacing',
  'lineSpace',
  'cashdraw',
  'beep',
  'color',
  'reverseColors',
  'raw',
  'encode',
  'characterCodeTable',
  'model',
  'starFullCut',
  'emphasize',
  'cancelEmphasize',
]);

const jobEnvelopeSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  config: z.object({
    encoding: z.string().optional(),
    width: z.number().positive().optional(),
    model: z.enum(['qsprinter']).nullable().optional(),
  }).optional(),
  inputs: z.record(z.string(), z.unknown()).optional(),
  commands: z.array(z.record(z.string(), z.unknown())),
});

function message(key: string, path?: string): UserMessage {
  return path ? { key, values: { path } } : { key };
}

function validateCommand(command: Record<string, unknown>, index: number): UserMessage[] {
  const prefix = `commands[${index}]`;
  const errors: UserMessage[] = [];

  if (typeof command.type !== 'string' || !commandTypes.has(command.type)) {
    return [message('unsupportedCommand', `${prefix}.type`)];
  }

  if (['text', 'pureText', 'print'].includes(command.type) && typeof command.content !== 'string') {
    errors.push(message('mustBeString', `${prefix}.content`));
  }

  if (command.type === 'align' && !['LT', 'CT', 'RT', 'lt', 'ct', 'rt'].includes(String(command.value))) {
    errors.push(message('invalidAlignment', `${prefix}.value`));
  }

  if (command.type === 'size' && (
    typeof command.width !== 'number'
    || typeof command.height !== 'number'
    || command.width < 1
    || command.height < 1
  )) {
    errors.push(message('invalidSize', prefix));
  }

  if (command.type === 'qrcode' && typeof command.content !== 'string') {
    errors.push(message('mustBeString', `${prefix}.content`));
  }

  if (
    (command.type === 'image' || command.type === 'raster')
    && (typeof command.path !== 'string' || command.path.trim().length === 0)
  ) {
    errors.push(message('nonEmptyString', `${prefix}.path`));
  }

  if (command.type === 'table' && !Array.isArray(command.data)) {
    errors.push(message('mustBeArray', `${prefix}.data`));
  }

  if (command.type === 'tableCustom') {
    if (!Array.isArray(command.data) || command.data.some(item =>
      typeof item !== 'object'
      || item === null
      || typeof (item as Record<string, unknown>).text !== 'string',
    )) {
      errors.push(message('invalidColumns', `${prefix}.data`));
    }
    if (command.each !== undefined && typeof command.each !== 'string') {
      errors.push(message('invalidArrayPath', `${prefix}.each`));
    }
  }

  if (command.type === 'feed' && command.lines !== undefined && typeof command.lines !== 'number') {
    errors.push(message('mustBeNumber', `${prefix}.lines`));
  }

  return errors;
}

export function validatePrintJob(value: unknown): ValidationResult {
  const result = jobEnvelopeSchema.safeParse(value);

  if (!result.success) {
    return {
      errors: result.error.issues.map(issue => ({
        key: 'schemaIssue',
        values: {
          path: issue.path.join('.') || 'template',
          detail: issue.message,
        },
      })),
    };
  }

  const commandErrors = result.data.commands.flatMap(validateCommand);
  if (commandErrors.length > 0) {
    return { errors: commandErrors };
  }

  return {
    job: result.data as unknown as PrintJobJSON,
    errors: [],
  };
}

function createNodeId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `node-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isCutCommand(command: PrintCommandUnion): boolean {
  return command.type === 'cut' || command.type === 'starFullCut';
}

function inferCutMode(commands: PrintCommandUnion[]): CutMode {
  const cutCommand = commands.findLast(isCutCommand);
  if (!cutCommand) {
    return 'none';
  }
  return cutCommand.type === 'cut' && cutCommand.partial ? 'partial' : 'full';
}

export function fromPrintJob(
  job: PrintJobJSON,
  sampleDataText = '{}',
  idFactory: (index: number) => string = () => createNodeId(),
  fallbackName = '未命名模板',
): EditorDocument {
  const paperWidth: PaperWidth = (job.config?.width ?? 32) > 32 ? 80 : 58;
  const cutMode = inferCutMode(job.commands);
  const commands = job.commands.filter(command => !isCutCommand(command));

  return {
    name: job.name ?? fallbackName,
    description: job.description ?? '',
    paperWidth,
    encoding: job.config?.encoding ?? 'GB18030',
    model: job.config?.model ?? null,
    cutMode,
    commands: decodePrintCommands(commands, idFactory),
    inputSchema: structuredClone(job.inputs ?? { type: 'object', properties: {} }),
    sampleDataText,
  };
}

export function toPrintJob(document: EditorDocument): PrintJobJSON {
  const encodedCommands = encodePrintCommands(document.commands);
  const cutMode = document.cutMode ?? inferCutMode(encodedCommands);
  const commands = encodedCommands.filter(command => !isCutCommand(command));
  if (cutMode === 'full') {
    commands.push({ type: 'cut' });
  }
  else if (cutMode === 'partial') {
    commands.push({ type: 'cut', partial: true });
  }

  const job: PrintJobJSON = {
    name: document.name,
    config: {
      encoding: document.encoding,
      width: document.paperWidth === 58 ? 32 : 48,
      model: document.model,
    },
    commands,
  };

  if (Object.keys(document.inputSchema).length > 0) {
    job.inputs = structuredClone(document.inputSchema);
  }

  if (document.description) {
    job.description = document.description;
  }

  return job;
}

export function importPrintJob(jsonText: string, sampleDataText = '{}', fallbackName?: string): ImportResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  }
  catch {
    return { errors: [{ key: 'invalidJsonFile' }] };
  }

  const result = validatePrintJob(parsed);
  if (!result.job) {
    return { errors: result.errors };
  }

  return {
    document: fromPrintJob(result.job, sampleDataText, undefined, fallbackName),
    errors: [],
  };
}

export function parseSampleData(text: string): { data?: Record<string, unknown>, errorKey?: 'sampleMustBeObject' | 'invalidSampleJson' } {
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { errorKey: 'sampleMustBeObject' };
    }
    return { data: parsed as Record<string, unknown> };
  }
  catch {
    return { errorKey: 'invalidSampleJson' };
  }
}

export function isTemplateInputSchema(value: unknown): value is TemplateInputSchema {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export interface CommandDefaults {
  text: string
  inlineText: string
  product: string
  quantity: string
  amount: string
}

export function createCommand(type: string, labels: Partial<CommandDefaults> = {}): PrintCommandUnion {
  const text = labels.text ?? '双击或在右侧编辑文本';
  const inlineText = labels.inlineText ?? '行内文本';
  const product = labels.product ?? '商品';
  const quantity = labels.quantity ?? '数量';
  const amount = labels.amount ?? '金额';
  const presets: Record<string, PrintCommandUnion> = {
    text: { type: 'text', content: text },
    pureText: { type: 'pureText', content: inlineText },
    drawLine: { type: 'drawLine', character: '-' },
    table: { type: 'table', data: [product, quantity, amount] },
    tableCustom: {
      type: 'tableCustom',
      data: [
        { text: product, cols: 16, align: 'LEFT' },
        { text: quantity, cols: 6, align: 'CENTER' },
        { text: amount, cols: 10, align: 'RIGHT' },
      ],
      options: { size: [1, 1], encoding: 'GB18030' },
    },
    qrcode: { type: 'qrcode', content: 'https://example.com', size: 5, level: 'M' },
    raster: {
      type: 'raster',
      path: 'https://placehold.co/320x120/png?text=LOGO',
      mode: 'normal',
    },
    feed: { type: 'feed', lines: 1 },
  };

  const command = presets[type];
  if (!command) {
    throw new Error(`不支持创建 ${type} 命令`);
  }
  return structuredClone(command);
}
