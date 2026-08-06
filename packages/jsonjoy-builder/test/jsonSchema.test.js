/**
 * Copyright (c) 2025 Ophir LOJKINE
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import assert from 'node:assert';
import { describe, it } from 'vitest';
import metaschema from '../metaschema.schema.json' with { type: 'json' };
import {
  isBooleanSchema,
  isObjectSchema,
  jsonSchemaType,
} from '../src/types/jsonSchema';

describe('jSON Schema', () => {
  it('should successfully parse the JSON Schema metaschema', () => {
    const result = jsonSchemaType.safeParse(metaschema);
    if (!result.success) {
      console.error('Validation error:', result.error);
    }
    assert.strictEqual(result.success, true);
  });

  it('schema type checker functions should work correctly', () => {
    const objectSchema = { type: 'object', properties: {} };
    const booleanSchema = true;

    assert.strictEqual(isObjectSchema(objectSchema), true);
    assert.strictEqual(isBooleanSchema(objectSchema), false);

    assert.strictEqual(isObjectSchema(booleanSchema), false);
    assert.strictEqual(isBooleanSchema(booleanSchema), true);
  });
});
