import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import StringEditor from '../../../../src/components/SchemaEditor/types/StringEditor';

describe('stringEditor', () => {
  it('write mode does show constraints', () => {
    const element = React.createElement(StringEditor, {
      readOnly: false,
      onChange: () => {},
      validationNode: undefined,
      schema: {
        type: 'number',
      },
    });
    expect(render(element).container.innerHTML).toMatchSnapshot();
  });
  it('read-only mode doesn\'t show constraints', () => {
    const element = React.createElement(StringEditor, {
      readOnly: true,
      onChange: () => {},
      validationNode: undefined,
      schema: {
        type: 'number',
      },
    });
    expect(render(element).container.innerHTML).toMatchSnapshot();
  });
});
