/**
 * Copyright (c) 2025 Ophir LOJKINE
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { SchemaFieldsEditor } from '../../../src/index';

describe('schemaFieldsEditor', () => {
  it('write mode does show constraints', () => {
    const element = React.createElement(SchemaFieldsEditor, {
      readOnly: false,
      onChange: () => {},
      value: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
        },
      },
    });
    expect(render(element).container.innerHTML).toMatchSnapshot();
  });
  it('read-only mode doesn\'t show constraints', () => {
    const element = React.createElement(SchemaFieldsEditor, {
      readOnly: true,
      onChange: () => {},
      value: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
        },
      },
    });
    expect(render(element).container.innerHTML).toMatchSnapshot();
  });
});
