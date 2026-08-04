import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import NumberEditor from '../../../../src/components/SchemaEditor/types/NumberEditor';

describe('numberEditor', () => {
  it('write mode does show constraints', () => {
    const element = React.createElement(NumberEditor, {
      readOnly: false,
      onChange: () => {},
      schema: {
        type: 'number',
      },
    });
    expect(render(element).container.innerHTML).toMatchSnapshot();
  });
  it('read-only mode doesn\'t show constraints', () => {
    const element = React.createElement(NumberEditor, {
      readOnly: true,
      onChange: () => {},
      schema: {
        type: 'number',
      },
    });
    expect(render(element).container.innerHTML).toMatchSnapshot();
  });
});
