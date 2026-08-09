/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
'use client';

import type { LucideIcon } from 'lucide-react';

import { useDraggable } from '@dnd-kit/core';
import {
  ImageIcon,
  Minus,
  MoveDown,
  QrCode,
  Rows3,
  Table2,
  TextCursorInput,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useEditorStore } from '../../lib/editor-store';
import { createCommand } from '../../lib/print-job';

interface PaletteItem {
  type: string
  label: string
  description: string
  icon: LucideIcon
}

function DraggablePaletteItem({ item, disabled }: { item: PaletteItem, disabled: boolean }) {
  const defaults = useTranslations('CommandDefaults');
  const addCommand = useEditorStore(state => state.addCommand);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette:${item.type}`,
    data: { source: 'palette', type: item.type },
    disabled,
  });
  const Icon = item.icon;

  return (
    <button
      ref={setNodeRef}
      type="button"
      disabled={disabled}
      className="group flex min-h-14 w-full touch-none items-center gap-3 rounded-lg border bg-card px-3 py-2 text-left transition-[border-color,background-color,box-shadow] hover:border-primary/35 hover:bg-accent/60 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:bg-card disabled:hover:shadow-none"
      style={{
        opacity: isDragging ? 0.5 : 1,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      }}
      onClick={() => addCommand(createCommand(item.type, {
        text: defaults('text'),
        inlineText: defaults('inlineText'),
        product: defaults('product'),
        quantity: defaults('quantity'),
        amount: defaults('amount'),
      }))}
      {...listeners}
      {...attributes}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{item.label}</span>
        <span className="block truncate text-xs text-muted-foreground">{item.description}</span>
      </span>
    </button>
  );
}

export function CommandPalette() {
  const t = useTranslations('Palette');
  const isReadOnly = useEditorStore(state => state.viewMode === 'printPreview');
  const paletteGroups: Array<{ title: string, items: PaletteItem[] }> = [
    {
      title: t('content'),
      items: [
        { type: 'text', label: t('text'), description: t('textDescription'), icon: TextCursorInput },
        { type: 'raster', label: t('image'), description: t('imageDescription'), icon: ImageIcon },
        { type: 'qrcode', label: t('qrcode'), description: t('qrcodeDescription'), icon: QrCode },
        { type: 'table', label: t('table'), description: t('tableDescription'), icon: Rows3 },
        { type: 'tableCustom', label: t('customTable'), description: t('customTableDescription'), icon: Table2 },
      ],
    },
    {
      title: t('structure'),
      items: [
        { type: 'drawLine', label: t('divider'), description: t('dividerDescription'), icon: Minus },
        { type: 'feed', label: t('feed'), description: t('feedDescription'), icon: MoveDown },
      ],
    },
  ];

  return (
    <aside className="flex h-full flex-col bg-background" aria-label={t('ariaLabel')}>
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">{t('title')}</h2>
          {isReadOnly
            ? <span className="text-[10px] font-medium text-muted-foreground">{t('previewReadOnly')}</span>
            : null}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {isReadOnly ? t('readOnlyHint') : t('hint')}
        </p>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto p-3">
        {paletteGroups.map(group => (
          <section key={group.title}>
            <h3 className="mb-2 px-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              {group.title}
            </h3>
            <div className="space-y-2">
              {group.items.map(item => <DraggablePaletteItem key={item.type} item={item} disabled={isReadOnly} />)}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
