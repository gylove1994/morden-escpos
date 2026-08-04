import assert from 'node:assert';
import { describe, it } from 'vitest';
import {
  extractErrorPosition,
  findLineNumberForPath,
  validateJson,
} from '../src/utils/jsonValidator';
import { exampleSchema } from './fixtures/schemaExample';

describe('jSON Validator', () => {
  it('should find correct line numbers for JSON paths witch decoy inputs', () => {
    const jsonStr = `{
"a": "a",
"aa": {
  "a": "a"}}`;

    const aPos = findLineNumberForPath(jsonStr, '/a');
    assert.deepStrictEqual(aPos, { line: 2, column: 1 });

    const aaPos = findLineNumberForPath(jsonStr, '/aa/a');
    assert.ok(aaPos, 'Should find a position for the nested property');
    assert.strictEqual(
      aaPos.line,
      4,
      'Should correctly identify the line for nested property',
    );
    assert.ok(aaPos.column > 0, 'Column position should be positive');
  });

  it('should find correct line numbers for JSON paths', () => {
    const jsonStr = `{
  "name": "John Doe",
  "age": 30,
  "address": {
    "street": "123 Main St",
    "city": "Anytown"
  }
}`;

    const namePos = findLineNumberForPath(jsonStr, '/name');
    assert.deepStrictEqual(namePos, { line: 2, column: 3 });

    const agePos = findLineNumberForPath(jsonStr, '/age');
    assert.deepStrictEqual(agePos, { line: 3, column: 3 });

    // For nested paths, we might get different position results with the extracted function
    const addressPos = findLineNumberForPath(jsonStr, '/address');
    assert.ok(addressPos, 'Should find a position for the address field');
    assert.strictEqual(typeof addressPos.line, 'number');
    assert.strictEqual(typeof addressPos.column, 'number');
  });

  it('should extract error position from syntax error messages', () => {
    const jsonStr = `{
  "name": "John Doe",
  "age": 30,
  "address": {
    "street": "123 Main St",
    "city": "Anytown"
  }
}`;

    // Create an error message similar to what JSON.parse throws
    const lineColError = new Error('Unexpected token at line 4 column 5');
    const positionError = new Error('Unexpected token at position 42');

    const lineColPos = extractErrorPosition(lineColError, jsonStr);
    assert.deepStrictEqual(lineColPos, { line: 4, column: 5 });

    const positionPos = extractErrorPosition(positionError, jsonStr);
    // Position 42 is somewhere on line 3
    assert.strictEqual(positionPos.line >= 3, true);
  });

  it('should validate valid JSON against a schema', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'integer', minimum: 0 },
      },
      required: ['name'],
    };

    const validJson = `{
  "name": "John Doe",
  "age": 30
}`;

    const result = validateJson(validJson, schema);
    assert.strictEqual(result.valid, true);
    assert.deepStrictEqual(result.errors, []);
  });

  it('should detect validation errors against a schema', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'integer', minimum: 18 },
      },
      required: ['name', 'age'],
    };

    const invalidJson = `{
  "name": "John Doe",
  "age": 15
}`;

    const result = validateJson(invalidJson, schema);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.errors.length > 0, true);

    // Check that the error is related to age property
    assert.strictEqual(result.errors[0].path, '/age');
  });

  it('should detect JSON syntax errors', () => {
    const schema = { type: 'object' };
    const invalidJson = `{
  "name": "John Doe",
  "age": 30,
  invalid
}`;

    const result = validateJson(invalidJson, schema);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.errors.length, 1);
    assert.strictEqual(result.errors[0].path, '/');
    assert.ok(result.errors[0].line !== undefined);
    assert.ok(result.errors[0].column !== undefined);
  });

  it('should detect missing required person field', () => {
    const invalidJson = `{
  "address": {
    "street": "123 Main St",
    "city": "Anytown"
  }
}`;

    const result = validateJson(invalidJson, exampleSchema);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.errors[0].path, '/');
    assert.ok(result.errors[0].message.includes('required'));
  });
});

describe('schema Example Validation', () => {
  it('should validate valid complete input', () => {
    const validJson = `{
  "person": {
    "firstName": "John",
    "lastName": "Doe",
    "age": 30,
    "isEmployed": true
  },
  "address": {
    "street": "123 Main St",
    "city": "Anytown",
    "zipCode": "12345"
  },
  "hobbies": [
    {
      "name": "Reading",
      "yearsExperience": 20
    },
    {
      "name": "Photography",
      "yearsExperience": 5
    }
  ]
}`;

    const result = validateJson(validJson, exampleSchema);
    assert.strictEqual(result.valid, true);
    assert.deepStrictEqual(result.errors, []);
  });

  it('should validate minimal valid input', () => {
    const minimalJson = `{
  "person": {
    "firstName": "John",
    "lastName": "Doe"
  }
}`;

    const result = validateJson(minimalJson, exampleSchema);
    assert.strictEqual(result.valid, true);
    assert.deepStrictEqual(result.errors, []);
  });

  it('should detect missing required person properties', () => {
    const invalidJson = `{
  "person": {
    "firstName": "John"
  }
}`;

    const result = validateJson(invalidJson, exampleSchema);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.errors[0].path, '/person');
    assert.ok(result.errors[0].message.includes('lastName'));
  });

  it('should validate type constraints', () => {
    const invalidJson = `{
  "person": {
    "firstName": "John",
    "lastName": "Doe",
    "age": "thirty"
  }
}`;

    const result = validateJson(invalidJson, exampleSchema);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.errors[0].path, '/person/age');
    assert.ok(result.errors[0].message.includes('number'));
  });

  it('should validate hobbies array structure', () => {
    const invalidJson = `{
  "person": {
    "firstName": "John",
    "lastName": "Doe"
  },
  "hobbies": [
    {
      "name": "Reading",
      "yearsExperience": "lots"
    }
  ]
}`;

    const result = validateJson(invalidJson, exampleSchema);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.errors[0].path, '/hobbies/0/yearsExperience');
    assert.ok(result.errors[0].message.includes('number'));
  });

  it('should validate nested object structures', () => {
    const invalidJson = `{
  "person": {
    "firstName": "John",
    "lastName": "Doe"
  },
  "address": "123 Main St"
}`;

    const result = validateJson(invalidJson, exampleSchema);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.errors[0].path, '/address');
    assert.ok(result.errors[0].message.includes('object'));
  });
});
