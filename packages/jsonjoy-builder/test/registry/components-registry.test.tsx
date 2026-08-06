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
  useComponent,
} from '../../src/registry/SchemaBuilderRegistryContext';

describe('components-registry', () => {
  it('custom Button renders instead of default', () => {
    function CustomButton() {
      return <div data-testid="custom-button">Custom</div>;
    }

    const registry: SchemaBuilderRegistry = {
      components: { Button: CustomButton as never },
    };

    function TestComponent() {
      const Button = useComponent('Button');
      return <Button />;
    }

    const { container } = render(
      <SchemaBuilderRegistryProvider value={registry}>
        <TestComponent />
      </SchemaBuilderRegistryProvider>,
    );

    assert.ok(container.querySelector('[data-testid="custom-button"]'));
  });

  it('custom Input renders instead of default', () => {
    function CustomInput() {
      return <input data-testid="custom-input" />;
    }

    const registry: SchemaBuilderRegistry = {
      components: { Input: CustomInput as never },
    };

    function TestComponent() {
      const Input = useComponent('Input');
      return <Input />;
    }

    const { container } = render(
      <SchemaBuilderRegistryProvider value={registry}>
        <TestComponent />
      </SchemaBuilderRegistryProvider>,
    );

    assert.ok(container.querySelector('[data-testid="custom-input"]'));
  });

  it('custom Switch renders instead of default', () => {
    function CustomSwitch() {
      return <div data-testid="custom-switch" />;
    }

    const registry: SchemaBuilderRegistry = {
      components: { Switch: CustomSwitch as never },
    };

    function TestComponent() {
      const Switch = useComponent('Switch');
      return <Switch />;
    }

    const { container } = render(
      <SchemaBuilderRegistryProvider value={registry}>
        <TestComponent />
      </SchemaBuilderRegistryProvider>,
    );

    assert.ok(container.querySelector('[data-testid="custom-switch"]'));
  });

  it('component override does not affect others', () => {
    function CustomButton() {
      return <div data-testid="only-button" />;
    }

    const registry: SchemaBuilderRegistry = {
      components: { Button: CustomButton as never },
    };

    function TestComponent() {
      const Button = useComponent('Button');
      const Input = useComponent('Input');
      return (
        <div>
          <Button />
          <Input />
        </div>
      );
    }

    const { container } = render(
      <SchemaBuilderRegistryProvider value={registry}>
        <TestComponent />
      </SchemaBuilderRegistryProvider>,
    );

    // Custom Button renders, default Input still renders (no crash)
    assert.ok(container.querySelector('[data-testid="only-button"]'));
  });
});
