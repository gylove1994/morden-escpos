/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
export interface VariableRange {
  end: number
  start: number
  path: string
  defined: boolean
}

const VARIABLE_PATTERN = /\{\{([^}]+)\}\}/g;

export function findVariableRanges(
  text: string,
  definedPaths: ReadonlySet<string> = new Set(),
): VariableRange[] {
  VARIABLE_PATTERN.lastIndex = 0;

  return [...text.matchAll(VARIABLE_PATTERN)].map((match) => {
    const path = match[1]?.trim() ?? '';
    const normalizedPath = path
      .split('.')
      .map(segment => /^\d+$/.test(segment) ? '*' : segment)
      .join('.');
    return {
      start: match.index,
      end: match.index + match[0].length,
      path,
      defined: definedPaths.has(normalizedPath),
    };
  });
}
