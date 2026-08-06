/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import { beforeEach, describe, expect, it } from 'vitest';

import { createDefaultDocument } from './default-template';
import { useEditorStore } from './editor-store';
import { CUT_COMPONENT_ID } from './editor-types';
import { createCommand } from './print-job';

describe('editor store history', () => {
  beforeEach(() => {
    useEditorStore.getState().setViewMode('edit');
    useEditorStore.getState().replaceDocument(createDefaultDocument(), false);
  });

  it('adds a command and can undo and redo it', () => {
    const initialCount = useEditorStore.getState().document.commands.length;

    useEditorStore.getState().addCommand(createCommand('text'));
    expect(useEditorStore.getState().document.commands).toHaveLength(initialCount + 1);
    const added = useEditorStore.getState().document.commands.at(-1);
    expect(added?.richValue).toBeDefined();

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().document.commands).toHaveLength(initialCount);

    useEditorStore.getState().redo();
    expect(useEditorStore.getState().document.commands).toHaveLength(initialCount + 1);
  });

  it('blocks document mutations while print preview is active', () => {
    const store = useEditorStore.getState();
    store.addCommand(createCommand('text'));
    const added = useEditorStore.getState().document.commands.at(-1)!;
    store.undo();
    store.redo();
    store.setViewMode('printPreview');
    store.select(added.id);

    const before = structuredClone(useEditorStore.getState().document);
    const replacement = createDefaultDocument();
    replacement.paperWidth = before.paperWidth === 58 ? 80 : 58;

    store.addCommand(createCommand('feed'));
    store.updateCommand(added.id, command =>
      command.type === 'text' || command.type === 'pureText'
        ? { ...command, content: 'changed' }
        : command);
    store.updateFormat(added.id, { width: 2 });
    store.updateRichValue(added.id, [{ type: 'p', children: [{ text: 'changed' }] }]);
    store.removeSelected();
    store.duplicateSelected();
    store.moveCommand(added.id, before.commands[0]!.id);
    store.updateDocument({ paperWidth: replacement.paperWidth });
    store.replaceDocument(replacement);
    store.resetDocument();
    store.undo();
    store.redo();

    expect(useEditorStore.getState().document).toEqual(before);
  });

  it('updates rich text and keeps the plain command content synchronized', () => {
    useEditorStore.getState().addCommand(createCommand('text'));
    const added = useEditorStore.getState().document.commands.at(-1)!;

    useEditorStore.getState().updateRichValue(added.id, [{
      type: 'p',
      children: [
        { text: '粗体', bold: true, width: 2, height: 1 },
        { text: '正文' },
      ],
    }]);

    const updated = useEditorStore.getState().document.commands.find(item => item.id === added.id);
    expect(updated?.command).toMatchObject({ type: 'text', content: '粗体正文' });
    expect(updated?.richValue?.[0]?.children[0]).toMatchObject({ text: '粗体', bold: true, width: 2 });
  });

  it('duplicates and removes selected commands', () => {
    const firstId = useEditorStore.getState().document.commands[0]?.id;
    expect(firstId).toBeTruthy();

    useEditorStore.getState().select(firstId!);
    useEditorStore.getState().duplicateSelected();
    const duplicatedId = useEditorStore.getState().selectedIds[0];
    expect(duplicatedId).not.toBe(firstId);

    useEditorStore.getState().removeSelected();
    expect(useEditorStore.getState().document.commands.some(item => item.id === duplicatedId)).toBe(false);
  });

  it('updates, restores, and duplicates content formats', () => {
    const formatted = useEditorStore.getState().document.commands.find(item => item.format);
    expect(formatted?.format).toBeTruthy();

    useEditorStore.getState().updateFormat(formatted!.id, {
      align: 'RT',
      style: 'I',
      width: 2,
      height: 3,
    });
    expect(useEditorStore.getState().document.commands.find(item => item.id === formatted!.id)?.format).toEqual({
      align: 'RT',
      style: 'I',
      width: 2,
      height: 3,
    });

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().document.commands.find(item => item.id === formatted!.id)?.format).toEqual(formatted!.format);

    useEditorStore.getState().redo();
    useEditorStore.getState().select(formatted!.id);
    useEditorStore.getState().duplicateSelected();
    const duplicatedId = useEditorStore.getState().selectedIds[0];
    expect(useEditorStore.getState().document.commands.find(item => item.id === duplicatedId)?.format).toEqual({
      align: 'RT',
      style: 'I',
      width: 2,
      height: 3,
    });
  });

  it('reorders commands by stable editor id', () => {
    const before = useEditorStore.getState().document.commands;
    const firstId = before[0]!.id;
    const thirdId = before[2]!.id;

    useEditorStore.getState().moveCommand(firstId, thirdId);

    expect(useEditorStore.getState().document.commands[2]?.id).toBe(firstId);
  });

  it('keeps the fixed cut component singleton and undeletable', () => {
    const initialDocument = useEditorStore.getState().document;
    const initialCount = initialDocument.commands.length;

    useEditorStore.getState().addCommand({ type: 'cut', partial: true });
    expect(useEditorStore.getState().document.commands).toHaveLength(initialCount);

    useEditorStore.getState().select(CUT_COMPONENT_ID);
    useEditorStore.getState().duplicateSelected();
    useEditorStore.getState().removeSelected();

    expect(useEditorStore.getState().document.cutMode).toBe('full');
    expect(useEditorStore.getState().selectedIds).toEqual([CUT_COMPONENT_ID]);
    expect(useEditorStore.getState().document.commands).toHaveLength(initialCount);
  });
});
