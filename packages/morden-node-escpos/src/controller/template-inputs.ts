/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { TemplateInputSchema, TemplateInputType } from './json-schema';

export interface TemplateInputValidationResult {
  ok: boolean
  errors: string[]
}

export class TemplateInputValidationError extends Error {
  readonly errors: string[];

  constructor(errors: string[]) {
    super(`模板输入校验失败：${errors.join('；')}`);
    this.name = 'TemplateInputValidationError';
    this.errors = errors;
  }
}

function schemaTypes(schema: TemplateInputSchema): TemplateInputType[] {
  if (Array.isArray(schema.type)) {
    return schema.type;
  }
  if (schema.type) {
    return [schema.type];
  }
  if (schema.properties) {
    return ['object'];
  }
  if (schema.items) {
    return ['array'];
  }
  return [];
}

function valueType(value: unknown): TemplateInputType {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  if (Number.isInteger(value)) {
    return 'integer';
  }
  return typeof value as TemplateInputType;
}

function matchesType(value: unknown, expected: TemplateInputType): boolean {
  if (expected === 'number') {
    return typeof value === 'number' && Number.isFinite(value);
  }
  if (expected === 'integer') {
    return typeof value === 'number' && Number.isInteger(value);
  }
  if (expected === 'object') {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
  if (expected === 'array') {
    return Array.isArray(value);
  }
  if (expected === 'null') {
    return value === null;
  }
  if (expected === 'string') {
    return typeof value === 'string';
  }
  if (expected === 'boolean') {
    return typeof value === 'boolean';
  }
  return false;
}

function validateValue(
  schema: TemplateInputSchema,
  value: unknown,
  path: string,
  errors: string[],
): void {
  const types = schemaTypes(schema);
  if (types.length > 0 && !types.some(type => matchesType(value, type))) {
    errors.push(`${path} 应为 ${types.join(' 或 ')}，实际为 ${valueType(value)}`);
    return;
  }

  if (schema.enum && !schema.enum.some(item => Object.is(item, value))) {
    errors.push(`${path} 不在允许值范围内`);
    return;
  }

  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    const properties = schema.properties ?? {};
    for (const required of schema.required ?? []) {
      if (!(required in record) || record[required] === undefined) {
        errors.push(`${path}.${required} 为必填项`);
      }
    }
    for (const [key, childValue] of Object.entries(record)) {
      const childSchema = properties[key];
      if (childSchema) {
        validateValue(childSchema, childValue, `${path}.${key}`, errors);
      }
      else if (schema.additionalProperties === false) {
        errors.push(`${path}.${key} 未在输入 Schema 中定义`);
      }
      else if (typeof schema.additionalProperties === 'object') {
        validateValue(schema.additionalProperties, childValue, `${path}.${key}`, errors);
      }
    }
  }

  if (Array.isArray(value) && schema.items) {
    const items = schema.items;
    if (Array.isArray(items)) {
      value.forEach((item, index) => {
        const itemSchema = items[index];
        if (itemSchema) {
          validateValue(itemSchema, item, `${path}.${index}`, errors);
        }
      });
    }
    else {
      value.forEach((item, index) => validateValue(items, item, `${path}.${index}`, errors));
    }
  }
}

export function validateTemplateInputs(
  schema: TemplateInputSchema,
  data: Record<string, unknown>,
): TemplateInputValidationResult {
  const errors: string[] = [];
  validateValue(schema, data, '$', errors);
  return { ok: errors.length === 0, errors };
}

function collectPaths(schema: TemplateInputSchema, prefix: string, paths: Set<string>): void {
  for (const [key, child] of Object.entries(schema.properties ?? {})) {
    const path = prefix ? `${prefix}.${key}` : key;
    paths.add(path);
    collectPaths(child, path, paths);

    const items = Array.isArray(child.items) ? child.items[0] : child.items;
    if (items) {
      const itemPath = `${path}.*`;
      paths.add(itemPath);
      collectPaths(items, itemPath, paths);
    }
  }
}

export function extractDefinedPaths(schema: TemplateInputSchema | undefined): Set<string> {
  const paths = new Set<string>();
  if (schema) {
    collectPaths(schema, '', paths);
  }
  return paths;
}

function normalizePath(path: string): string {
  return path
    .split('.')
    .map(segment => /^\d+$/.test(segment) ? '*' : segment)
    .join('.');
}

export function isPathDefined(path: string, definedPaths: ReadonlySet<string>): boolean {
  return definedPaths.has(normalizePath(path.trim()));
}

export function getSchemaAtPath(
  schema: TemplateInputSchema | undefined,
  path: string,
): TemplateInputSchema | undefined {
  let current = schema;
  for (const segment of path.split('.').filter(Boolean)) {
    if (!current) {
      return undefined;
    }
    if (/^\d+$/.test(segment) || segment === '*') {
      current = Array.isArray(current.items) ? current.items[0] : current.items;
    }
    else {
      current = current.properties?.[segment];
    }
  }
  return current;
}
