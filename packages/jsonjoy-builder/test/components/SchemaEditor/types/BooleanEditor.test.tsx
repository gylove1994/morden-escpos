/**
 * Copyright (c) 2025 Ophir LOJKINE
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import BooleanEditor from '../../../../src/components/SchemaEditor/types/BooleanEditor';

describe('booleanEditor', () => {
  it('write mode does show constraints', () => {
    const element = React.createElement(BooleanEditor, {
      readOnly: false,
      onChange: () => {},
      schema: {
        type: 'boolean',
      },
    });
    expect(render(element).container.innerHTML).toMatchSnapshot();
  });
  it('read-only mode doesn\'t show constraints', () => {
    const element = React.createElement(BooleanEditor, {
      readOnly: true,
      onChange: () => {},
      schema: {
        type: 'boolean',
      },
    });
    expect(render(element).container.innerHTML).toMatchSnapshot();
  });
});
