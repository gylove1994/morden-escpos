/**
 * Copyright (c) 2025 Ophir LOJKINE
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { SchemaBuilderRegistry } from '../../src/registry/types';
import assert from 'node:assert/strict';
import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import {
  SchemaBuilderRegistryProvider,
  useRegistry,
} from '../../src/registry/SchemaBuilderRegistryContext';

describe('schemaBuilderRegistryProvider nesting', () => {
  function ParentButton() {
    return null;
  }
  function ChildButton() {
    return null;
  }
  function ChildInput() {
    return null;
  }

  it('child provider without value is no-op (uses parent)', () => {
    const parentRegistry: SchemaBuilderRegistry = {
      components: {
        Button: ParentButton,
      },
    };
    let captured: SchemaBuilderRegistry | null = null;

    function Child() {
      captured = useRegistry();
      return null;
    }

    render(
      <SchemaBuilderRegistryProvider value={parentRegistry}>
        <SchemaBuilderRegistryProvider>
          <Child />
        </SchemaBuilderRegistryProvider>
      </SchemaBuilderRegistryProvider>,
    );

    assert.equal(captured?.components?.Button, ParentButton);
  });

  it('child provider with value merges with parent', () => {
    const parentRegistry: SchemaBuilderRegistry = {
      components: {
        Button: ParentButton,
      },
    };
    const childRegistry: SchemaBuilderRegistry = {
      components: {
        Input: ChildInput,
      },
    };
    let captured: SchemaBuilderRegistry | null = null;

    function Child() {
      captured = useRegistry();
      return null;
    }

    render(
      <SchemaBuilderRegistryProvider value={parentRegistry}>
        <SchemaBuilderRegistryProvider value={childRegistry}>
          <Child />
        </SchemaBuilderRegistryProvider>
      </SchemaBuilderRegistryProvider>,
    );

    assert.equal(captured?.components?.Button, ParentButton);
    assert.equal(captured?.components?.Input, ChildInput);
  });

  it('child override replaces parent key', () => {
    const parentRegistry: SchemaBuilderRegistry = {
      components: {
        Button: ParentButton,
      },
    };
    const childRegistry: SchemaBuilderRegistry = {
      components: {
        Button: ChildButton,
      },
    };
    let captured: SchemaBuilderRegistry | null = null;

    function Child() {
      captured = useRegistry();
      return null;
    }

    render(
      <SchemaBuilderRegistryProvider value={parentRegistry}>
        <SchemaBuilderRegistryProvider value={childRegistry}>
          <Child />
        </SchemaBuilderRegistryProvider>
      </SchemaBuilderRegistryProvider>,
    );

    assert.equal(captured?.components?.Button, ChildButton);
  });
});
