import type React from 'react';
import type { SchemaBuilderRegistry } from '../../src/registry/types';
import assert from 'node:assert/strict';
import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import {
  SchemaBuilderRegistryProvider,
  useSlot,
} from '../../src/registry/SchemaBuilderRegistryContext';

describe('slots-registry', () => {
  it('custom FieldFrame renders children', () => {
    function CustomFieldFrame({ children }: { children: React.ReactNode }) {
      return <div data-testid="custom-frame">{children}</div>;
    }

    const registry: SchemaBuilderRegistry = {
      slots: { FieldFrame: CustomFieldFrame as never },
    };

    function TestComponent() {
      const FieldFrame = useSlot('FieldFrame');
      return (
        <FieldFrame>
          <span data-testid="inner" />
        </FieldFrame>
      );
    }

    const { container } = render(
      <SchemaBuilderRegistryProvider value={registry}>
        <TestComponent />
      </SchemaBuilderRegistryProvider>,
    );

    assert.ok(container.querySelector('[data-testid="custom-frame"]'));
    assert.ok(container.querySelector('[data-testid="inner"]'));
  });

  it('slot override does not affect other slots', () => {
    function CustomFieldFrame({ children }: { children: React.ReactNode }) {
      return <section data-testid="custom-frame">{children}</section>;
    }

    const registry: SchemaBuilderRegistry = {
      slots: { FieldFrame: CustomFieldFrame as never },
    };

    function TestComponent() {
      const FieldFrame = useSlot('FieldFrame');
      const FieldHeader = useSlot('FieldHeader');
      return (
        <div>
          <FieldFrame>
            <span />
          </FieldFrame>
          <FieldHeader>
            <span />
          </FieldHeader>
        </div>
      );
    }

    const { container } = render(
      <SchemaBuilderRegistryProvider value={registry}>
        <TestComponent />
      </SchemaBuilderRegistryProvider>,
    );

    assert.ok(container.querySelector('[data-testid="custom-frame"]'));
  });

  it('no registry provider falls back to default slots', () => {
    function TestComponent() {
      const FieldBody = useSlot('FieldBody');
      return (
        <FieldBody>
          <span data-testid="body-child" />
        </FieldBody>
      );
    }

    const { container } = render(<TestComponent />);

    // Default slot renders its children (fragment passthrough).
    assert.ok(container.querySelector('[data-testid="body-child"]'));
  });
});
