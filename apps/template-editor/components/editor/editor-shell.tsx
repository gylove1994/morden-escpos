/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
'use client';

import type { DragEndEvent } from '@dnd-kit/core';

import type { EditorDocument } from '../../lib/editor-types';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@workspace/ui/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/ui/tabs';
import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useEditorStore } from '../../lib/editor-store';
import { createCommand, toPrintJob, validatePrintJob } from '../../lib/print-job';
import { CanvasPanel } from './canvas-panel';
import { CommandPalette } from './command-palette';
import { EditorToolbar } from './editor-toolbar';
import { PropertyPanel } from './property-panel';

const STORAGE_KEY = 'receipt-studio:draft:v1';

function isSavedDocument(value: unknown): value is EditorDocument {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<EditorDocument>;
  if (
    typeof candidate.name !== 'string'
    || typeof candidate.description !== 'string'
    || (candidate.paperWidth !== 58 && candidate.paperWidth !== 80)
    || typeof candidate.encoding !== 'string'
    || typeof candidate.sampleDataText !== 'string'
    || !Array.isArray(candidate.commands)
  ) {
    return false;
  }
  return candidate.commands.every(item =>
    typeof item === 'object'
    && item !== null
    && typeof item.id === 'string'
    && typeof item.command === 'object'
    && item.command !== null,
  );
}

function normalizeSavedDocument(document: EditorDocument): EditorDocument {
  const legacyCut = document.commands.findLast(item =>
    item.command.type === 'cut' || item.command.type === 'starFullCut',
  );
  const cutMode = document.cutMode === 'full' || document.cutMode === 'partial' || document.cutMode === 'none'
    ? document.cutMode
    : legacyCut?.command.type === 'cut' && legacyCut.command.partial
      ? 'partial'
      : legacyCut
        ? 'full'
        : 'none';

  return {
    ...document,
    cutMode,
    commands: document.commands.filter(item =>
      item.command.type !== 'cut' && item.command.type !== 'starFullCut',
    ),
  };
}

function useDraftPersistence() {
  const replaceDocument = useEditorStore(state => state.replaceDocument);
  const setHydrated = useEditorStore(state => state.setHydrated);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const payload: unknown = JSON.parse(raw);
        const candidate = typeof payload === 'object' && payload !== null
          ? (payload as { version?: unknown, document?: unknown })
          : null;
        if (candidate?.version === 1 && isSavedDocument(candidate.document)) {
          const document = normalizeSavedDocument(candidate.document);
          const validation = validatePrintJob(toPrintJob(document));
          if (validation.job) {
            replaceDocument(document, false);
          }
        }
      }
    }
    catch {
      // 无法读取草稿时继续使用内置模板。
    }
    setHydrated(true);

    const unsubscribe = useEditorStore.subscribe((state, previous) => {
      if (!state.hasHydrated || state.document === previous.document) {
        return;
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          version: 1,
          document: state.document,
        }));
      }
      catch {
        // localStorage 可能在隐私模式或配额耗尽时抛错。
      }
    });

    return unsubscribe;
  }, [replaceDocument, setHydrated]);
}

function useEditorShortcuts() {
  const isReadOnly = useEditorStore(state => state.viewMode === 'printPreview');
  const undo = useEditorStore(state => state.undo);
  const redo = useEditorStore(state => state.redo);
  const removeSelected = useEditorStore(state => state.removeSelected);
  const duplicateSelected = useEditorStore(state => state.duplicateSelected);
  const clearSelection = useEditorStore(state => state.clearSelection);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isReadOnly) {
        return;
      }
      const target = event.target as HTMLElement | null;
      const isFormField = target?.matches('input, textarea, select, [contenteditable="true"]') ?? false;
      const modifier = event.metaKey || event.ctrlKey;

      if (modifier && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        }
        else {
          undo();
        }
        return;
      }
      if (modifier && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
        return;
      }
      if (modifier && event.key.toLowerCase() === 'd' && !isFormField) {
        event.preventDefault();
        duplicateSelected();
        return;
      }
      if (!isFormField && (event.key === 'Delete' || event.key === 'Backspace')) {
        event.preventDefault();
        removeSelected();
        return;
      }
      if (event.key === 'Escape') {
        clearSelection();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [clearSelection, duplicateSelected, isReadOnly, redo, removeSelected, undo]);
}

function DesktopEditor() {
  return (
    <div className="hidden min-h-0 flex-1 lg:flex">
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel defaultSize="20%" minSize="16%" maxSize="28%">
          <CommandPalette />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="56%" minSize="38%">
          <CanvasPanel />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="24%" minSize="20%" maxSize="34%">
          <PropertyPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function MobileEditor() {
  const t = useTranslations('Shell');
  const [activeTab, setActiveTab] = useState('canvas');

  useEffect(() => useEditorStore.subscribe((state, previousState) => {
    if (state.selectedIds !== previousState.selectedIds && state.selectedIds.length > 0) {
      setActiveTab('properties');
    }
  }), []);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="min-h-0 flex-1 flex-col gap-0 lg:hidden">
      <TabsList className="m-2 grid w-[calc(100%-1rem)] grid-cols-3">
        <TabsTrigger value="library">{t('library')}</TabsTrigger>
        <TabsTrigger value="canvas">{t('canvas')}</TabsTrigger>
        <TabsTrigger value="properties">{t('properties')}</TabsTrigger>
      </TabsList>
      <TabsContent value="library" className="min-h-0 overflow-hidden"><CommandPalette /></TabsContent>
      <TabsContent value="canvas" className="min-h-0 overflow-hidden"><CanvasPanel /></TabsContent>
      <TabsContent value="properties" className="min-h-0 overflow-hidden"><PropertyPanel /></TabsContent>
    </Tabs>
  );
}

export function EditorShell() {
  const defaults = useTranslations('CommandDefaults');
  useDraftPersistence();
  useEditorShortcuts();
  const addCommand = useEditorStore(state => state.addCommand);
  const moveCommand = useEditorStore(state => state.moveCommand);
  const isReadOnly = useEditorStore(state => state.viewMode === 'printPreview');
  const commands = useEditorStore(state => state.document.commands);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    if (isReadOnly) {
      return;
    }
    const { active, over } = event;
    if (!over) {
      return;
    }

    if (active.data.current?.source === 'palette') {
      const type = active.data.current.type;
      if (typeof type !== 'string' || String(over.id).startsWith('palette:')) {
        return;
      }
      const overIndex = commands.findIndex(item => item.id === over.id);
      addCommand(createCommand(type, {
        text: defaults('text'),
        inlineText: defaults('inlineText'),
        product: defaults('product'),
        quantity: defaults('quantity'),
        amount: defaults('amount'),
      }), overIndex >= 0 ? overIndex : undefined);
      return;
    }

    if (active.id !== over.id && over.id !== 'canvas-drop-zone') {
      moveCommand(String(active.id), String(over.id));
    }
  }

  return (
    <TooltipProvider>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex h-dvh min-h-160 flex-col overflow-hidden bg-background">
          <EditorToolbar />
          <DesktopEditor />
          <MobileEditor />
        </div>
      </DndContext>
    </TooltipProvider>
  );
}
