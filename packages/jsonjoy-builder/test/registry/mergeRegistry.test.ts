import type { SchemaBuilderRegistry } from '../../src/registry/types';
import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { mergeRegistry } from '../../src/registry/mergeRegistry';

describe('mergeRegistry', () => {
  it('undefined override returns base', () => {
    const base: SchemaBuilderRegistry = {
      components: { Button: (() => null) as never },
    };
    const result = mergeRegistry(base, undefined);
    assert.equal(result.components?.Button, base.components?.Button);
  });

  it('undefined base returns override', () => {
    const override: SchemaBuilderRegistry = {
      components: { Button: (() => null) as never },
    };
    const result = mergeRegistry(undefined, override);
    assert.equal(result.components?.Button, override.components?.Button);
  });

  it('both undefined returns empty object', () => {
    const result = mergeRegistry(undefined, undefined);
    assert.deepEqual(result, {});
  });

  it('component override replaces without affecting other components', () => {
    const base: SchemaBuilderRegistry = {
      components: {
        Button: (() => 'BaseButton') as never,
        Input: (() => 'BaseInput') as never,
      },
    };
    const override: SchemaBuilderRegistry = {
      components: { Button: (() => 'OverrideButton') as never },
    };
    const result = mergeRegistry(base, override);
    assert.equal(result.components?.Button, override.components?.Button);
    assert.equal(result.components?.Input, base.components?.Input);
  });

  it('slotProps shallow merges per slot', () => {
    const base: SchemaBuilderRegistry = {
      slotProps: { FieldFrame: { variant: 'default', size: 'md' } },
    };
    const override: SchemaBuilderRegistry = {
      slotProps: { FieldFrame: { variant: 'compact' } },
    };
    const result = mergeRegistry(base, override);
    assert.equal(
      (result.slotProps?.FieldFrame as Record<string, unknown>).variant,
      'compact',
    );
    assert.equal(
      (result.slotProps?.FieldFrame as Record<string, unknown>).size,
      'md',
    );
  });
});
