/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
'use client';

import type { PlateLeafProps } from 'platejs/react';

import { createPlatePlugin, PlateLeaf } from 'platejs/react';

import { findVariableRanges } from '../../lib/variable-ranges';

function VariableLeaf({ children, leaf, ...props }: PlateLeafProps) {
  return (
    <PlateLeaf
      {...props}
      leaf={leaf}
      className={leaf.variableDefined ? 'text-blue-600' : 'text-red-600'}
    >
      {children}
    </PlateLeaf>
  );
}

export function createVariablePlugin(getDefinedPaths: () => ReadonlySet<string>) {
  return createPlatePlugin({
    key: 'variable',
    node: { isLeaf: true },
    decorate: ({ entry: [node, path] }) => {
      if (!('text' in node) || typeof node.text !== 'string') {
        return undefined;
      }

      return findVariableRanges(node.text, getDefinedPaths()).map(({ defined, end, start }) => ({
        anchor: { path, offset: start },
        focus: { path, offset: end },
        variable: true,
        variableDefined: defined,
      }));
    },
  }).withComponent(VariableLeaf);
}
