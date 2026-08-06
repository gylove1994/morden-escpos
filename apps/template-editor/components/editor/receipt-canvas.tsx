/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
'use client';

/* eslint-disable react/no-array-index-key -- Plate text nodes do not expose stable ids. */

import type { CSSProperties, MouseEvent } from 'react';

import type { CutMode } from '../../lib/editor-types';
import type { PreviewGroup, PreviewItem } from '../../lib/preview';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { GripVertical, QrCode, Settings2 } from 'lucide-react';
import { useEditorStore } from '../../lib/editor-store';
import { CUT_COMPONENT_ID } from '../../lib/editor-types';
import { buildPreview, groupPreviewItems } from '../../lib/preview';

function previewTextStyle(item: PreviewItem): CSSProperties {
  return {
    fontSize: `${Math.min(13 * item.style.height, 30)}px`,
    fontStretch: item.style.width > 1 ? 'expanded' : 'normal',
    fontWeight: item.style.bold ? 700 : 400,
    fontStyle: item.style.italic ? 'italic' : 'normal',
    textDecoration: item.style.underline ? 'underline' : 'none',
    textAlign: item.style.align,
    lineHeight: 1.35,
  };
}

function PreviewContent({ item, charactersPerLine }: { item: PreviewItem, charactersPerLine: number }) {
  if (item.kind === 'text') {
    if (item.richValue) {
      return (
        <div style={{ textAlign: item.style.align }}>
          {item.richValue.map((paragraph, paragraphIndex) => (
            <div key={paragraphIndex} className="min-h-[1.35em] wrap-break-word whitespace-pre-wrap">
              {paragraph.children.map((leaf, leafIndex) => (
                <span
                  key={leafIndex}
                  style={{
                    fontSize: `${Math.min(13 * (leaf.height ?? 1), 30)}px`,
                    fontStretch: (leaf.width ?? 1) > 1 ? 'expanded' : 'normal',
                    fontWeight: leaf.bold ? 700 : 400,
                    fontStyle: leaf.italic ? 'italic' : 'normal',
                    textDecoration: leaf.underline ? 'underline' : 'none',
                    lineHeight: 1.35,
                  }}
                >
                  {leaf.text}
                </span>
              ))}
            </div>
          ))}
        </div>
      );
    }
    return <div className="wrap-break-word whitespace-pre-wrap" style={previewTextStyle(item)}>{item.content || '\u00A0'}</div>;
  }

  if (item.kind === 'divider') {
    const character = (item.content || '-').slice(0, 1);
    const cells = Array.from({ length: charactersPerLine }, (_, position) => ({
      character,
      id: `${item.id}-divider-cell-${position}`,
    }));

    return (
      <div
        className="grid w-full font-mono text-xs leading-5"
        style={{ gridTemplateColumns: `repeat(${charactersPerLine}, minmax(0, 1fr))` }}
        aria-label={`${charactersPerLine} 个 ${character} 字符组成的分隔线`}
      >
        {cells.map(cell => <span key={cell.id} className="text-center" aria-hidden="true">{cell.character}</span>)}
      </div>
    );
  }

  if (item.kind === 'table') {
    const total = item.columns?.reduce((sum, column) => sum + column.width, 0) || 1;
    return (
      <div className="flex w-full gap-1 text-xs leading-5" style={previewTextStyle(item)}>
        {item.columns?.map(column => (
          <span
            key={column.id}
            className="min-w-0 wrap-break-word"
            style={{
              flexBasis: `${(column.width / total) * 100}%`,
              textAlign: column.align,
              fontWeight: column.font?.bold ? 700 : undefined,
              fontStyle: column.font?.italic ? 'italic' : undefined,
              textDecoration: column.font?.underline ? 'underline' : undefined,
            }}
          >
            {column.text}
          </span>
        ))}
      </div>
    );
  }

  if (item.kind === 'qrcode') {
    return (
      <div className="flex flex-col items-center gap-1 py-2" style={{ alignItems: item.style.align === 'left' ? 'flex-start' : item.style.align === 'right' ? 'flex-end' : 'center' }}>
        <span className="grid size-24 place-items-center border-8 border-receipt-ink bg-receipt-paper">
          <QrCode className="size-16" strokeWidth={1.25} aria-hidden="true" />
        </span>
        <span className="max-w-full truncate text-[9px] text-receipt-ink/60">{item.content}</span>
      </div>
    );
  }

  if (item.kind === 'image') {
    return (
      <div
        className="flex py-2"
        style={{
          justifyContent: item.style.align === 'left'
            ? 'flex-start'
            : item.style.align === 'right'
              ? 'flex-end'
              : 'center',
        }}
      >
        <img
          src={item.content}
          alt={item.content ? `打印图片：${item.content}` : '打印图片地址为空'}
          className="max-h-48 max-w-full object-contain text-[10px] text-receipt-ink/55"
        />
      </div>
    );
  }

  if (item.kind === 'space') {
    const lines = Math.max(1, Number(item.content) || 1);
    return <div style={{ height: `${lines * 12}px` }} aria-label={`${lines} 行空白`} />;
  }

  if (item.kind === 'cut') {
    return (
      <div className="relative my-2 border-t border-dashed border-receipt-ink/45 text-center">
        <span className="relative -top-2 bg-receipt-paper px-2 text-[9px] text-receipt-ink/55">{item.content}</span>
      </div>
    );
  }

  if (item.kind === 'state') {
    return (
      <div className="flex items-center gap-1.5 rounded border border-dashed border-receipt-ink/20 bg-receipt-ink/4 px-2 py-1 text-[10px] text-receipt-ink/55">
        <Settings2 className="size-3" aria-hidden="true" />
        <span>
          {item.content}
          {' '}
          状态
        </span>
      </div>
    );
  }

  return (
    <div className="rounded border border-dashed px-2 py-1 text-[10px] text-receipt-ink/55">
      {item.commandType}
      {' '}
      暂无可视化预览
    </div>
  );
}

function CutIndicator({ mode, selected }: { mode: CutMode, selected: boolean }) {
  const select = useEditorStore(state => state.select);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`选择切纸组件，当前为${mode === 'partial' ? '半切' : mode === 'full' ? '全切' : '不切'}`}
      aria-pressed={selected}
      className={`relative mx-3 mt-5 rounded-sm border-t border-dashed border-receipt-ink/45 text-center outline-none ${
        selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-receipt-paper' : 'hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring'
      }`}
      onClick={event => select(CUT_COMPONENT_ID, event.metaKey || event.ctrlKey || event.shiftKey)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          select(CUT_COMPONENT_ID, event.metaKey || event.ctrlKey || event.shiftKey);
        }
      }}
    >
      <span className="relative -top-2 bg-receipt-paper px-2 text-[9px] text-receipt-ink/55">
        切纸 ·
        {' '}
        {mode === 'partial' ? '半切' : mode === 'full' ? '全切' : '不切'}
      </span>
    </div>
  );
}

function SortableReceiptNode({
  group,
  selected,
  charactersPerLine,
}: {
  group: PreviewGroup
  selected: boolean
  charactersPerLine: number
}) {
  const item = group.items[0];
  const select = useEditorStore(state => state.select);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { source: 'canvas' },
  });

  function handleSelect(event: MouseEvent<HTMLDivElement>) {
    select(item.id, event.metaKey || event.ctrlKey || event.shiftKey);
  }

  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      aria-label={`选择 ${item.commandType} 命令`}
      aria-pressed={selected}
      className={`group/node relative rounded-sm px-3 py-1.5 text-receipt-ink outline-none transition-[box-shadow,background-color] ${
        selected
          ? 'bg-primary/8 ring-2 ring-primary ring-offset-1 ring-offset-receipt-paper'
          : 'hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring'
      }`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
      onClick={handleSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          select(item.id, event.metaKey || event.ctrlKey || event.shiftKey);
        }
      }}
    >
      <button
        type="button"
        className="absolute top-1/2 -left-7 flex size-7 -translate-y-1/2 touch-none items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity group-hover/node:opacity-100 focus:opacity-100"
        aria-label={`拖动 ${item.commandType} 命令`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden="true" />
      </button>
      {group.items.map(previewItem => (
        <PreviewContent
          key={previewItem.instanceId}
          item={previewItem}
          charactersPerLine={charactersPerLine}
        />
      ))}
    </div>
  );
}

export function ReceiptCanvas() {
  const document = useEditorStore(state => state.document);
  const selectedIds = useEditorStore(state => state.selectedIds);
  const clearSelection = useEditorStore(state => state.clearSelection);
  const preview = buildPreview(document);
  const previewGroups = groupPreviewItems(preview.items);
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-drop-zone' });
  const width = document.paperWidth === 58 ? 384 : 512;
  const charactersPerLine = document.paperWidth === 58 ? 32 : 48;

  return (
    <main className="relative flex h-full flex-col overflow-hidden bg-muted/55" aria-label="模版编辑画布">
      {preview.dataError
        ? (
            <div role="alert" className="mx-4 mt-3 rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2 text-xs text-destructive">
              {preview.dataError}
              {' '}
              预览暂时保留变量占位符。
            </div>
          )
        : null}
      <div className="flex-1 overflow-auto p-8 md:p-12" onClick={event => event.target === event.currentTarget && clearSelection()}>
        <div
          ref={setNodeRef}
          className={`receipt-shadow mx-auto min-h-170 max-w-full bg-receipt-paper py-8 pr-7 pl-10 transition-shadow ${isOver ? 'ring-4 ring-primary/25' : ''}`}
          style={{ width }}
        >
          <SortableContext items={document.commands.map(item => item.id)} strategy={verticalListSortingStrategy}>
            {previewGroups.length > 0
              ? previewGroups.map(group => (
                  <SortableReceiptNode
                    key={group.id}
                    group={group}
                    selected={selectedIds.includes(group.id)}
                    charactersPerLine={charactersPerLine}
                  />
                ))
              : (
                  <div className="grid min-h-56 place-items-center rounded-lg border border-dashed border-receipt-ink/25 px-6 text-center text-xs leading-5 text-receipt-ink/50">
                    从左侧点击组件，或将组件拖到这里
                  </div>
                )}
          </SortableContext>
          <CutIndicator mode={document.cutMode} selected={selectedIds.includes(CUT_COMPONENT_ID)} />
        </div>
      </div>
    </main>
  );
}
