import type { TemplateInputSchema } from './json-schema';

import { describe, expect, it } from 'vitest';

import {
  extractDefinedPaths,
  getSchemaAtPath,
  isPathDefined,
  validateTemplateInputs,
} from './template-inputs';

const schema: TemplateInputSchema = {
  type: 'object',
  required: ['customer', 'items'],
  properties: {
    customer: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' },
      },
    },
    items: {
      type: 'array',
      items: {
        type: 'object',
        required: ['price'],
        properties: {
          price: { type: 'number' },
          label: { type: 'string' },
        },
      },
    },
  },
};

describe('template input paths', () => {
  it('extracts nested object and array wildcard paths', () => {
    expect([...extractDefinedPaths(schema)]).toEqual([
      'customer',
      'customer.name',
      'items',
      'items.*',
      'items.*.price',
      'items.*.label',
    ]);
  });

  it('matches numeric array indexes against wildcard paths', () => {
    const paths = extractDefinedPaths(schema);
    expect(isPathDefined('items.0.price', paths)).toBe(true);
    expect(isPathDefined('items.12.label', paths)).toBe(true);
    expect(isPathDefined('items.0.unknown', paths)).toBe(false);
  });

  it('locates an array schema by path', () => {
    expect(getSchemaAtPath(schema, 'items')?.type).toBe('array');
    expect(getSchemaAtPath(schema, 'items.0.price')?.type).toBe('number');
  });
});

describe('validateTemplateInputs', () => {
  it('accepts data matching required nested types', () => {
    expect(validateTemplateInputs(schema, {
      customer: { name: 'Ada' },
      items: [{ label: 'Tea', price: 12.5 }],
    })).toEqual({ ok: true, errors: [] });
  });

  it('reports missing fields and invalid array item types', () => {
    const result = validateTemplateInputs(schema, {
      customer: {},
      items: [{ price: '12.5' }],
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('$.customer.name 为必填项');
    expect(result.errors).toContain('$.items.0.price 应为 number，实际为 string');
  });
});
