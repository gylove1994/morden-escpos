/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { PrintCommandUnion } from 'morden-node-escpos/schema';

import type { ContentFormat, EditorCommand, RichTextParagraph, RichTextValue } from './editor-types';

import { appendLeaf, encodeRichText, leafFromFormat, plainTextFromValue } from './rich-text';

const CONTENT_COMMAND_TYPES = new Set<PrintCommandUnion['type']>([
  'text',
  'pureText',
  'print',
  'qrcode',
  'qrimage',
  'image',
  'raster',
  'table',
  'tableCustom',
]);

export const DEFAULT_CONTENT_FORMAT: ContentFormat = {
  align: 'LT',
  style: 'NORMAL',
  width: 1,
  height: 1,
};

function cloneFormat(format: ContentFormat): ContentFormat {
  return structuredClone(format);
}

function normalizeAlign(value: string): ContentFormat['align'] {
  const normalized = value.toUpperCase();
  if (normalized === 'CT' || normalized === 'RT') {
    return normalized;
  }
  return 'LT';
}

function stylesEqual(left: ContentFormat['style'], right: ContentFormat['style']): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function isContentCommand(command: PrintCommandUnion): boolean {
  return CONTENT_COMMAND_TYPES.has(command.type);
}

export function defaultContentFormat(command: PrintCommandUnion): ContentFormat | undefined {
  return isContentCommand(command) ? cloneFormat(DEFAULT_CONTENT_FORMAT) : undefined;
}

export function decodePrintCommands(
  commands: PrintCommandUnion[],
  idFactory: (index: number) => string,
): EditorCommand[] {
  const format = cloneFormat(DEFAULT_CONTENT_FORMAT);
  const editorCommands: EditorCommand[] = [];
  let richBuffer: {
    align: ContentFormat['align']
    initialFormat: Pick<ContentFormat, 'style' | 'width' | 'height'>
    paragraphs: RichTextValue
    trailingLineFeed: boolean
  } | undefined;

  function flushRichBuffer(): void {
    if (!richBuffer) {
      return;
    }
    const richValue = richBuffer.paragraphs.length > 0
      ? richBuffer.paragraphs
      : [{ type: 'p', children: [{ text: '' }] } satisfies RichTextParagraph];
    const content = plainTextFromValue(richValue);
    editorCommands.push({
      id: idFactory(editorCommands.length),
      command: {
        type: richBuffer.trailingLineFeed ? 'text' : 'pureText',
        content,
      },
      format: {
        align: richBuffer.align,
        style: structuredClone(richBuffer.initialFormat.style),
        width: richBuffer.initialFormat.width,
        height: richBuffer.initialFormat.height,
      },
      richValue,
    });
    richBuffer = undefined;
  }

  function ensureRichBuffer(): NonNullable<typeof richBuffer> {
    richBuffer ??= {
      align: format.align,
      initialFormat: {
        style: structuredClone(format.style),
        width: format.width,
        height: format.height,
      },
      paragraphs: [{ type: 'p', children: [] }],
      trailingLineFeed: false,
    };
    return richBuffer;
  }

  function currentParagraph(buffer: NonNullable<typeof richBuffer>): RichTextParagraph {
    if (buffer.trailingLineFeed) {
      buffer.paragraphs.push({ type: 'p', children: [] });
      buffer.trailingLineFeed = false;
    }
    return buffer.paragraphs.at(-1)!;
  }

  function appendText(content: string): void {
    const buffer = ensureRichBuffer();
    const parts = content.split('\n');
    parts.forEach((part, index) => {
      appendLeaf(currentParagraph(buffer), leafFromFormat(part, format));
      if (index < parts.length - 1) {
        buffer.trailingLineFeed = true;
      }
    });
  }

  for (const command of commands) {
    if (command.type === 'align') {
      flushRichBuffer();
      format.align = normalizeAlign(command.value);
      continue;
    }
    if (command.type === 'style') {
      format.style = structuredClone(command.value);
      continue;
    }
    if (command.type === 'size') {
      format.width = command.width;
      format.height = command.height;
      continue;
    }

    if (command.type === 'text' || command.type === 'pureText') {
      appendText(command.content);
      if (command.type === 'text') {
        ensureRichBuffer().trailingLineFeed = true;
      }
      continue;
    }

    if (command.type === 'newLine') {
      if (richBuffer) {
        if (richBuffer.trailingLineFeed) {
          richBuffer.paragraphs.push({ type: 'p', children: [] });
        }
        richBuffer.trailingLineFeed = true;
      }
      else {
        editorCommands.push({
          id: idFactory(editorCommands.length),
          command: { type: 'feed', lines: 1 },
        });
      }
      continue;
    }

    flushRichBuffer();
    const editorCommand: EditorCommand = {
      id: idFactory(editorCommands.length),
      command: structuredClone(command),
    };
    if (isContentCommand(command)) {
      editorCommand.format = cloneFormat(format);
    }
    editorCommands.push(editorCommand);
  }

  flushRichBuffer();
  return editorCommands;
}

export function encodePrintCommands(editorCommands: EditorCommand[]): PrintCommandUnion[] {
  const current = cloneFormat(DEFAULT_CONTENT_FORMAT);
  const commands: PrintCommandUnion[] = [];

  for (const editorCommand of editorCommands) {
    const format = editorCommand.format;
    if (format) {
      if (current.align !== format.align) {
        commands.push({ type: 'align', value: format.align });
        current.align = format.align;
      }
      if (!stylesEqual(current.style, format.style)) {
        commands.push({ type: 'style', value: structuredClone(format.style) });
        current.style = structuredClone(format.style);
      }
      if (current.width !== format.width || current.height !== format.height) {
        commands.push({ type: 'size', width: format.width, height: format.height });
        current.width = format.width;
        current.height = format.height;
      }
    }

    if (editorCommand.richValue) {
      const encoded = encodeRichText(
        editorCommand.richValue,
        editorCommand.command.type !== 'pureText',
        current,
      );
      commands.push(...encoded.commands);
      current.style = structuredClone(encoded.endFormat.style);
      current.width = encoded.endFormat.width;
      current.height = encoded.endFormat.height;
      continue;
    }

    commands.push(structuredClone(editorCommand.command));
  }

  return commands;
}
