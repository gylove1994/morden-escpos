'use client';

import type { PlateLeafProps } from 'platejs/react';
import type { RichTextValue } from '../../lib/editor-types';

import { BoldPlugin, ItalicPlugin, UnderlinePlugin } from '@platejs/basic-nodes/react';
import { Button } from '@workspace/ui/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/ui/select';
import { Bold, Italic, Underline } from 'lucide-react';
import { extractDefinedPaths } from 'morden-node-escpos/template-inputs';

import {
  createPlatePlugin,
  Plate,
  PlateContent,
  PlateLeaf,
  usePlateEditor,
} from 'platejs/react';
import { useEffect, useMemo, useRef } from 'react';
import { useEditorStore } from '../../lib/editor-store';
import { createVariablePlugin } from './variable-plugin';

interface TextRichEditorProps {
  contentKey: string
  value: RichTextValue
  onChange: (value: RichTextValue) => void
}

const SIZE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

function WidthLeaf({ children, leaf, ...props }: PlateLeafProps) {
  return (
    <PlateLeaf
      {...props}
      leaf={leaf}
      style={{ fontStretch: Number(leaf.width ?? 1) > 1 ? 'expanded' : 'normal' }}
    >
      {children}
    </PlateLeaf>
  );
}

function HeightLeaf({ children, leaf, ...props }: PlateLeafProps) {
  return (
    <PlateLeaf
      {...props}
      leaf={leaf}
      style={{ fontSize: `${Math.min(Number(leaf.height ?? 1), 8)}em` }}
    >
      {children}
    </PlateLeaf>
  );
}

const WidthPlugin = createPlatePlugin({
  key: 'width',
  node: { isLeaf: true },
}).withComponent(WidthLeaf);

const HeightPlugin = createPlatePlugin({
  key: 'height',
  node: { isLeaf: true },
}).withComponent(HeightLeaf);

export function TextRichEditor({ contentKey, value, onChange }: TextRichEditorProps) {
  const inputSchema = useEditorStore(state => state.document.inputSchema);
  const definedPaths = useMemo(() => extractDefinedPaths(inputSchema), [inputSchema]);
  const definedPathsRef = useRef(definedPaths);
  definedPathsRef.current = definedPaths;
  const valueRef = useRef(value);
  valueRef.current = value;

  const editor = usePlateEditor({
    plugins: [
      BoldPlugin,
      ItalicPlugin,
      UnderlinePlugin,
      WidthPlugin,
      HeightPlugin,
      createVariablePlugin(() => definedPathsRef.current),
    ],
    value,
  }, []);

  useEffect(() => {
    editor.tf.setValue(valueRef.current);
    // Sync only when the selected command changes; ignore local typing updates.
  }, [contentKey, editor]);

  useEffect(() => {
    editor.api.redecorate();
  }, [definedPaths, editor]);

  function toggleMark(mark: 'bold' | 'italic' | 'underline') {
    editor.tf.toggleMark(mark);
    editor.tf.focus();
  }

  function setSize(mark: 'width' | 'height', size: string) {
    editor.tf.addMarks({ [mark]: Number(size) });
    editor.tf.focus();
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 p-1.5">
        <Button type="button" variant="ghost" size="icon-sm" aria-label="粗体" onMouseDown={event => event.preventDefault()} onClick={() => toggleMark('bold')}>
          <Bold aria-hidden="true" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="斜体" onMouseDown={event => event.preventDefault()} onClick={() => toggleMark('italic')}>
          <Italic aria-hidden="true" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="下划线" onMouseDown={event => event.preventDefault()} onClick={() => toggleMark('underline')}>
          <Underline aria-hidden="true" />
        </Button>
        <div className="mx-1 h-5 w-px bg-border" />
        <Select defaultValue="1" onValueChange={next => setSize('width', next)}>
          <SelectTrigger className="h-7 w-21 text-xs" aria-label="宽度倍数">
            <SelectValue placeholder="宽度" />
          </SelectTrigger>
          <SelectContent>
            {SIZE_OPTIONS.map(size => <SelectItem key={size} value={String(size)}>{`${size}× 宽`}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select defaultValue="1" onValueChange={next => setSize('height', next)}>
          <SelectTrigger className="h-7 w-21 text-xs" aria-label="高度倍数">
            <SelectValue placeholder="高度" />
          </SelectTrigger>
          <SelectContent>
            {SIZE_OPTIONS.map(size => <SelectItem key={size} value={String(size)}>{`${size}× 高`}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Plate
        editor={editor}
        onChange={({ value: nextValue }) => onChange(nextValue as RichTextValue)}
      >
        <PlateContent
          className="min-h-32 px-3 py-2 text-sm leading-6 outline-none [&_p]:min-h-6"
          aria-label="富文本内容"
          placeholder="输入文本，支持 {{key}} 模板变量"
        />
      </Plate>
    </div>
  );
}
