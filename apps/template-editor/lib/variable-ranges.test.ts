/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import { describe, expect, it } from 'vitest';

import { findVariableRanges } from './variable-ranges';

describe('findVariableRanges', () => {
  it('finds a simple variable', () => {
    expect(findVariableRanges('Hello {{name}}', new Set(['name']))).toEqual([
      { start: 6, end: 14, path: 'name', defined: true },
    ]);
  });

  it('finds dotted paths and multiple variables', () => {
    expect(findVariableRanges(
      '{{user.name}} / {{items.0.price}}',
      new Set(['user.name', 'items.*.price']),
    )).toEqual([
      { start: 0, end: 13, path: 'user.name', defined: true },
      { start: 16, end: 33, path: 'items.0.price', defined: true },
    ]);
  });

  it('marks paths absent from the schema as undefined', () => {
    expect(findVariableRanges('{{known}} {{unknown}}', new Set(['known']))).toEqual([
      { start: 0, end: 9, path: 'known', defined: true },
      { start: 10, end: 21, path: 'unknown', defined: false },
    ]);
  });

  it('returns no ranges when variables are absent', () => {
    expect(findVariableRanges('plain text')).toEqual([]);
  });

  it('ignores an unclosed variable', () => {
    expect(findVariableRanges('Hello {{name')).toEqual([]);
  });

  it('does not retain regex state between calls', () => {
    expect(findVariableRanges('{{first}}')).toEqual([
      { start: 0, end: 9, path: 'first', defined: false },
    ]);
    expect(findVariableRanges('{{second}}')).toEqual([
      { start: 0, end: 10, path: 'second', defined: false },
    ]);
  });
});
