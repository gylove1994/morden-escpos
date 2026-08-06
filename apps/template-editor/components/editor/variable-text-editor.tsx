/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
'use client';

import { extractDefinedPaths, getSchemaAtPath } from 'morden-node-escpos/template-inputs';
import { Plate, PlateContent, usePlateEditor } from 'platejs/react';
import { useEffect, useMemo, useRef } from 'react';

import { useEditorStore } from '../../lib/editor-store';
import { plainTextFromValue, richTextFromPlainText } from '../../lib/rich-text';
import { createVariablePlugin } from './variable-plugin';

interface VariableTextEditorProps {
  contentKey: string
  ariaLabel: string
  id: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
  placeholder?: string
  scopePath?: string | undefined
}

export function VariableTextEditor({
  contentKey,
  ariaLabel,
  id,
  value,
  onChange,
  multiline = false,
  placeholder,
  scopePath,
}: VariableTextEditorProps) {
  const inputSchema = useEditorStore(state => state.document.inputSchema);
  const definedPaths = useMemo(() => {
    const paths = extractDefinedPaths(inputSchema);
    if (!scopePath) {
      return paths;
    }
    const scopeSchema = getSchemaAtPath(inputSchema, scopePath);
    const itemSchema = Array.isArray(scopeSchema?.items) ? scopeSchema.items[0] : scopeSchema?.items;
    for (const relativePath of extractDefinedPaths(itemSchema)) {
      paths.add(relativePath);
    }
    return paths;
  }, [inputSchema, scopePath]);
  const definedPathsRef = useRef(definedPaths);
  definedPathsRef.current = definedPaths;
  const valueRef = useRef(value);
  valueRef.current = value;

  const editor = usePlateEditor({
    plugins: [createVariablePlugin(() => definedPathsRef.current)],
    value: richTextFromPlainText(value),
  }, []);

  useEffect(() => {
    editor.tf.setValue(richTextFromPlainText(valueRef.current));
    // Sync only when the bound field changes; ignore local typing updates.
  }, [contentKey, editor]);

  useEffect(() => {
    editor.api.redecorate();
  }, [definedPaths, editor]);

  return (
    <Plate
      editor={editor}
      onChange={({ value: nextValue }) => onChange(plainTextFromValue(nextValue))}
    >
      <PlateContent
        aria-label={ariaLabel}
        id={id}
        className={multiline
          ? 'min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_p]:min-h-5'
          : 'min-h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_p]:min-h-7 [&_p]:leading-7'}
        placeholder={placeholder ?? ''}
        onKeyDown={(event) => {
          if (!multiline && event.key === 'Enter') {
            event.preventDefault();
          }
        }}
      />
    </Plate>
  );
}
