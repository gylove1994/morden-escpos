/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { PrintCommandUnion } from 'morden-node-escpos/schema';

import type { ContentFormat, EditorCommand, EditorDocument, RichTextValue } from './editor-types';

import { TemplateEngine } from 'morden-node-escpos/template';
import { parseSampleData, toPrintJob } from './print-job';
import { plainTextFromValue } from './rich-text';

export interface PreviewStyle {
  align: 'left' | 'center' | 'right'
  bold: boolean
  italic: boolean
  underline: boolean
  width: number
  height: number
}

export interface PreviewItem {
  id: string
  instanceId: string
  kind: 'text' | 'divider' | 'table' | 'qrcode' | 'image' | 'space' | 'cut' | 'state' | 'unsupported'
  content?: string
  richValue?: RichTextValue
  columns?: Array<{
    id: string
    text: string
    align: 'left' | 'center' | 'right'
    width: number
    font?: Pick<PreviewStyle, 'bold' | 'italic' | 'underline'>
  }>
  style: PreviewStyle
  commandType: PrintCommandUnion['type']
}

export interface PreviewResult {
  items: PreviewItem[]
  dataError?: string
}

export interface PreviewGroup {
  id: string
  items: [PreviewItem, ...PreviewItem[]]
}

const initialStyle: PreviewStyle = {
  align: 'left',
  bold: false,
  italic: false,
  underline: false,
  width: 1,
  height: 1,
};

function normalizeAlign(value: unknown): PreviewStyle['align'] {
  const normalized = String(value).toUpperCase();
  if (normalized === 'CT' || normalized === 'CENTER') {
    return 'center';
  }
  if (normalized === 'RT' || normalized === 'RIGHT') {
    return 'right';
  }
  return 'left';
}

function fontFromStyle(style: ContentFormat['style']): Pick<PreviewStyle, 'bold' | 'italic' | 'underline'> {
  if (typeof style === 'object') {
    return {
      bold: style.bold,
      italic: style.italic,
      underline: Boolean(style.underline),
    };
  }
  const value = style.toUpperCase();
  return {
    bold: value.includes('B'),
    italic: value.includes('I'),
    underline: value.includes('U'),
  };
}

function previewStyle(item: EditorCommand, command: PrintCommandUnion): PreviewStyle {
  const format = item.format;
  const style = format
    ? {
        align: normalizeAlign(format.align),
        ...fontFromStyle(format.style),
        width: format.width,
        height: format.height,
      }
    : { ...initialStyle };

  if (command.type === 'tableCustom' && command.options?.size) {
    style.width = command.options.size[0];
    style.height = command.options.size[1];
  }

  return style;
}

function renderCommand(
  item: EditorCommand,
  command: PrintCommandUnion,
  style: PreviewStyle,
  instance = 0,
): PreviewItem {
  const base = {
    id: item.id,
    instanceId: `${item.id}-preview-${instance}`,
    style: { ...style },
    commandType: command.type,
  };

  switch (command.type) {
    case 'text':
    case 'pureText':
    case 'print':
      return { ...base, kind: 'text', content: command.content };
    case 'drawLine':
      return { ...base, kind: 'divider', content: command.character ?? '-' };
    case 'table':
      return {
        ...base,
        kind: 'table',
        columns: command.data.map((value, index) => ({
          id: `${item.id}-column-${index}`,
          text: String(value),
          align: 'left',
          width: 1,
        })),
      };
    case 'tableCustom':
      return {
        ...base,
        kind: 'table',
        columns: command.data.map((column, index) => {
          const previewColumn: NonNullable<PreviewItem['columns']>[number] = {
            id: `${item.id}-column-${index}`,
            text: column.text,
            align: normalizeAlign(column.align),
            width: 'cols' in column ? column.cols : column.width,
          };
          if (column.style) {
            previewColumn.font = fontFromStyle(column.style);
          }
          return previewColumn;
        }),
      };
    case 'qrcode':
    case 'qrimage':
      return { ...base, kind: 'qrcode', content: command.content };
    case 'image':
    case 'raster':
      return { ...base, kind: 'image', content: command.path };
    case 'newLine':
      return { ...base, kind: 'space', content: '1' };
    case 'feed':
      return { ...base, kind: 'space', content: String(command.lines ?? 1) };
    case 'cut':
    case 'starFullCut':
      return { ...base, kind: 'cut', content: command.type === 'cut' && command.partial ? '半切' : '全切' };
    case 'align':
    case 'style':
    case 'size':
    case 'font':
    case 'spacing':
    case 'lineSpace':
    case 'marginLeft':
    case 'marginRight':
    case 'marginBottom':
    case 'color':
    case 'reverseColors':
    case 'encode':
    case 'characterCodeTable':
    case 'model':
    case 'emphasize':
    case 'cancelEmphasize':
      return { ...base, kind: 'state', content: command.type };
    default:
      return { ...base, kind: 'unsupported', content: command.type };
  }
}

export function buildPreview(document: EditorDocument): PreviewResult {
  const sample = parseSampleData(document.sampleDataText);
  if (!sample.data) {
    return {
      items: document.commands.map((item) => {
        if (item.richValue) {
          return {
            ...renderCommand(item, item.command, previewStyle(item, item.command)),
            content: plainTextFromValue(item.richValue),
            richValue: structuredClone(item.richValue),
          };
        }
        return renderCommand(item, item.command, previewStyle(item, item.command));
      }),
      dataError: sample.error ?? '示例数据无法解析。',
    };
  }

  const engine = new TemplateEngine();
  const items: PreviewItem[] = [];

  for (const editorItem of document.commands) {
    if (editorItem.richValue) {
      const richValue = editorItem.richValue.map(paragraph => ({
        ...paragraph,
        children: paragraph.children.map((leaf) => {
          const [rendered] = engine.render({
            commands: [{ type: 'pureText', content: leaf.text }],
          }, sample.data!).commands;
          return {
            ...leaf,
            text: rendered?.type === 'pureText' ? rendered.content : leaf.text,
          };
        }),
      }));
      items.push({
        ...renderCommand(editorItem, editorItem.command, previewStyle(editorItem, editorItem.command)),
        content: plainTextFromValue(richValue),
        richValue,
      });
      continue;
    }

    const renderedCommands = engine.render({ commands: [editorItem.command] }, sample.data).commands;
    for (let index = 0; index < renderedCommands.length; index += 1) {
      const command = renderedCommands[index];
      if (!command) {
        continue;
      }
      items.push(renderCommand(editorItem, command, previewStyle(editorItem, command), index));
    }
  }

  return { items };
}

export function groupPreviewItems(items: PreviewItem[]): PreviewGroup[] {
  const groups: PreviewGroup[] = [];

  for (const item of items) {
    const previousGroup = groups.at(-1);
    if (previousGroup?.id === item.id) {
      previousGroup.items.push(item);
    }
    else {
      groups.push({ id: item.id, items: [item] });
    }
  }

  return groups;
}

export function extractVariables(document: EditorDocument): string[] {
  const text = JSON.stringify(toPrintJob(document));
  const matches = text.matchAll(/\{\{([^}]+)\}\}/g);
  return [...new Set([...matches].map(match => match[1]?.trim()).filter(Boolean) as string[])];
}
