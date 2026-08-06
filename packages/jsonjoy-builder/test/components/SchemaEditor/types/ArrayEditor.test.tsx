/**
 * Copyright (c) 2025 Ophir LOJKINE
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import ArrayEditor from '../../../../src/components/SchemaEditor/types/ArrayEditor';

describe('arrayEditor', () => {
  it('write mode does show constraints', () => {
    const element = React.createElement(ArrayEditor, {
      readOnly: false,
      onChange: () => {},
      depth: 0,
      validationNode: undefined,
      schema: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    });
    expect(render(element).container.innerHTML).toMatchSnapshot();
  });
  it('read-only mode doesn\'t show constraints', () => {
    const element = React.createElement(ArrayEditor, {
      readOnly: true,
      onChange: () => {},
      depth: 0,
      validationNode: undefined,
      schema: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    });
    expect(render(element).container.innerHTML).toMatchSnapshot();
  });
});
