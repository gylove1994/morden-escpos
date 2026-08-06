/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
'use client';

import type { PrintCommandUnion } from 'morden-node-escpos/schema';

import type { ContentFormat, DocumentSnapshot, EditorCommand, EditorDocument, RichTextValue } from './editor-types';
import { arrayMove } from '@dnd-kit/sortable';

import { create } from 'zustand';
import { defaultContentFormat } from './content-format';
import { createDefaultDocument } from './default-template';
import { CUT_COMPONENT_ID } from './editor-types';
import { plainTextFromValue, richTextFromPlainText } from './rich-text';

const MAX_HISTORY = 50;

export type EditorViewMode = 'edit' | 'printPreview';

function createNodeId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `node-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function cloneDocument(document: EditorDocument): EditorDocument {
  return structuredClone(document);
}

interface EditorState {
  document: EditorDocument
  viewMode: EditorViewMode
  selectedIds: string[]
  past: DocumentSnapshot[]
  future: DocumentSnapshot[]
  hasHydrated: boolean
  select: (id: string, additive?: boolean) => void
  clearSelection: () => void
  addCommand: (command: PrintCommandUnion, index?: number) => void
  updateCommand: (id: string, updater: (command: PrintCommandUnion) => PrintCommandUnion) => void
  updateFormat: (id: string, patch: Partial<ContentFormat>) => void
  updateRichValue: (id: string, value: RichTextValue) => void
  removeSelected: () => void
  duplicateSelected: () => void
  moveCommand: (activeId: string, overId: string) => void
  updateDocument: (patch: Partial<Omit<EditorDocument, 'commands'>>) => void
  updateMetadata: (patch: Pick<Partial<EditorDocument>, 'name' | 'description'>) => void
  replaceDocument: (document: EditorDocument, recordHistory?: boolean) => void
  resetDocument: () => void
  undo: () => void
  redo: () => void
  setViewMode: (mode: EditorViewMode) => void
  setHydrated: (value: boolean) => void
}

function snapshot(state: Pick<EditorState, 'document' | 'selectedIds'>): DocumentSnapshot {
  return {
    document: cloneDocument(state.document),
    selectedIds: [...state.selectedIds],
  };
}

function commit(
  state: EditorState,
  nextDocument: EditorDocument,
  selectedIds = state.selectedIds,
): Partial<EditorState> {
  return {
    document: nextDocument,
    selectedIds,
    past: [...state.past, snapshot(state)].slice(-MAX_HISTORY),
    future: [],
  };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  document: createDefaultDocument(),
  viewMode: 'edit',
  selectedIds: [],
  past: [],
  future: [],
  hasHydrated: false,

  select: (id, additive = false) => {
    set((state) => {
      if (!additive) {
        return { selectedIds: [id] };
      }
      return {
        selectedIds: state.selectedIds.includes(id)
          ? state.selectedIds.filter(selectedId => selectedId !== id)
          : [...state.selectedIds, id],
      };
    });
  },

  clearSelection: () => set({ selectedIds: [] }),

  addCommand: (command, index) => {
    set((state) => {
      if (state.viewMode === 'printPreview' || command.type === 'cut' || command.type === 'starFullCut') {
        return state;
      }
      const id = createNodeId();
      const commands = [...state.document.commands];
      const insertionIndex = index ?? commands.length;
      const editorCommand: EditorCommand = {
        id,
        command: structuredClone(command),
      };
      const format = defaultContentFormat(command);
      if (format) {
        editorCommand.format = format;
      }
      if (command.type === 'text' || command.type === 'pureText') {
        editorCommand.richValue = richTextFromPlainText(command.content, format);
      }
      commands.splice(insertionIndex, 0, editorCommand);
      return commit(state, { ...state.document, commands }, [id]);
    });
  },

  updateCommand: (id, updater) => {
    set((state) => {
      if (state.viewMode === 'printPreview') {
        return state;
      }
      const commands = state.document.commands.map(item =>
        item.id === id
          ? { ...item, command: updater(structuredClone(item.command)) }
          : item,
      );
      return commit(state, { ...state.document, commands });
    });
  },

  updateFormat: (id, patch) => {
    set((state) => {
      if (state.viewMode === 'printPreview') {
        return state;
      }
      const commands = state.document.commands.map(item =>
        item.id === id && item.format
          ? { ...item, format: { ...item.format, ...structuredClone(patch) } }
          : item,
      );
      return commit(state, { ...state.document, commands });
    });
  },

  updateRichValue: (id, value) => {
    set((state) => {
      if (state.viewMode === 'printPreview') {
        return state;
      }
      const commands = state.document.commands.map((item) => {
        if (item.id !== id || (item.command.type !== 'text' && item.command.type !== 'pureText')) {
          return item;
        }
        const richValue = structuredClone(value);
        return {
          ...item,
          command: {
            ...item.command,
            content: plainTextFromValue(richValue),
          },
          richValue,
        };
      });
      return commit(state, { ...state.document, commands });
    });
  },

  removeSelected: () => {
    set((state) => {
      if (
        state.viewMode === 'printPreview'
        || state.selectedIds.length === 0
        || state.selectedIds.every(id => id === CUT_COMPONENT_ID)
      ) {
        return state;
      }
      const selected = new Set(state.selectedIds);
      const commands = state.document.commands.filter(item => !selected.has(item.id));
      return commit(state, { ...state.document, commands }, []);
    });
  },

  duplicateSelected: () => {
    set((state) => {
      if (
        state.viewMode === 'printPreview'
        || state.selectedIds.length === 0
        || state.selectedIds.every(id => id === CUT_COMPONENT_ID)
      ) {
        return state;
      }
      const selected = new Set(state.selectedIds);
      const duplicatedIds: string[] = [];
      const commands = state.document.commands.flatMap((item) => {
        if (!selected.has(item.id)) {
          return [item];
        }
        const id = createNodeId();
        duplicatedIds.push(id);
        const duplicate: EditorCommand = {
          id,
          command: structuredClone(item.command),
        };
        if (item.format) {
          duplicate.format = structuredClone(item.format);
        }
        if (item.richValue) {
          duplicate.richValue = structuredClone(item.richValue);
        }
        return [item, duplicate];
      });
      return commit(state, { ...state.document, commands }, duplicatedIds);
    });
  },

  moveCommand: (activeId, overId) => {
    set((state) => {
      if (state.viewMode === 'printPreview') {
        return state;
      }
      const oldIndex = state.document.commands.findIndex(item => item.id === activeId);
      const newIndex = state.document.commands.findIndex(item => item.id === overId);
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
        return state;
      }
      const commands = arrayMove(state.document.commands, oldIndex, newIndex);
      return commit(state, { ...state.document, commands });
    });
  },

  updateDocument: (patch) => {
    set(state => state.viewMode === 'printPreview'
      ? state
      : commit(state, { ...state.document, ...patch }));
  },

  updateMetadata: patch => set(state => commit(state, { ...state.document, ...patch })),

  replaceDocument: (document, recordHistory = true) => {
    set((state) => {
      if (state.viewMode === 'printPreview') {
        return state;
      }
      return recordHistory
        ? commit(state, cloneDocument(document), [])
        : {
            document: cloneDocument(document),
            selectedIds: [],
            past: [],
            future: [],
          };
    });
  },

  resetDocument: () => {
    set(state => state.viewMode === 'printPreview'
      ? state
      : commit(state, createDefaultDocument(), []));
  },

  undo: () => {
    const state = get();
    if (state.viewMode === 'printPreview') {
      return;
    }
    const previous = state.past.at(-1);
    if (!previous) {
      return;
    }
    set({
      document: cloneDocument(previous.document),
      selectedIds: [...previous.selectedIds],
      past: state.past.slice(0, -1),
      future: [snapshot(state), ...state.future].slice(0, MAX_HISTORY),
    });
  },

  redo: () => {
    const state = get();
    if (state.viewMode === 'printPreview') {
      return;
    }
    const next = state.future[0];
    if (!next) {
      return;
    }
    set({
      document: cloneDocument(next.document),
      selectedIds: [...next.selectedIds],
      past: [...state.past, snapshot(state)].slice(-MAX_HISTORY),
      future: state.future.slice(1),
    });
  },

  setViewMode: viewMode => set({
    viewMode,
    ...(viewMode === 'printPreview' ? { selectedIds: [] } : {}),
  }),
  setHydrated: value => set({ hasHydrated: value }),
}));
