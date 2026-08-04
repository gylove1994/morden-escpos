import type { PrintCommandUnion } from 'morden-node-escpos/schema';

import type { ContentFormat, RichTextLeaf, RichTextParagraph, RichTextValue } from './editor-types';

type StyleValue = Extract<PrintCommandUnion, { type: 'style' }>['value'];

export interface RichTextEncodingResult {
  commands: PrintCommandUnion[]
  endFormat: Pick<ContentFormat, 'style' | 'width' | 'height'>
}

function clampSize(value: number | undefined): number {
  return Math.max(1, Math.min(8, value ?? 1));
}

function styleFlags(style: StyleValue): Pick<RichTextLeaf, 'bold' | 'italic' | 'underline'> {
  const flags: Pick<RichTextLeaf, 'bold' | 'italic' | 'underline'> = {};
  if (typeof style === 'object') {
    if (style.bold) {
      flags.bold = true;
    }
    if (style.italic) {
      flags.italic = true;
    }
    if (style.underline) {
      flags.underline = true;
    }
    return flags;
  }

  const normalized = style.toUpperCase();
  if (normalized.includes('B')) {
    flags.bold = true;
  }
  if (normalized.includes('I')) {
    flags.italic = true;
  }
  if (normalized.includes('U')) {
    flags.underline = true;
  }
  return flags;
}

function styleFromLeaf(leaf: RichTextLeaf): StyleValue {
  const value = `${leaf.bold ? 'B' : ''}${leaf.italic ? 'I' : ''}${leaf.underline ? 'U' : ''}`;
  return (value || 'NORMAL') as StyleValue;
}

function stylesEqual(left: StyleValue, right: StyleValue): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function marksEqual(left: RichTextLeaf, right: RichTextLeaf): boolean {
  return Boolean(left.bold) === Boolean(right.bold)
    && Boolean(left.italic) === Boolean(right.italic)
    && Boolean(left.underline) === Boolean(right.underline)
    && clampSize(left.width) === clampSize(right.width)
    && clampSize(left.height) === clampSize(right.height);
}

export function emptyRichTextValue(): RichTextValue {
  return [{ type: 'p', children: [{ text: '' }] }];
}

export function richTextFromPlainText(
  content: string,
  format: Pick<ContentFormat, 'style' | 'width' | 'height'> = {
    style: 'NORMAL',
    width: 1,
    height: 1,
  },
): RichTextValue {
  return content.split('\n').map(text => ({
    type: 'p',
    children: [{
      text,
      ...styleFlags(format.style),
      width: clampSize(format.width),
      height: clampSize(format.height),
    }],
  }));
}

export function plainTextFromValue(value: RichTextValue): string {
  return value
    .map(paragraph => paragraph.children.map(leaf => leaf.text).join(''))
    .join('\n');
}

export function leafFromFormat(text: string, format: Pick<ContentFormat, 'style' | 'width' | 'height'>): RichTextLeaf {
  return {
    text,
    ...styleFlags(format.style),
    width: clampSize(format.width),
    height: clampSize(format.height),
  };
}

export function appendLeaf(paragraph: RichTextParagraph, leaf: RichTextLeaf): void {
  const previous = paragraph.children.at(-1);
  if (previous && marksEqual(previous, leaf)) {
    previous.text += leaf.text;
    return;
  }
  paragraph.children.push(leaf);
}

export function encodeRichText(
  value: RichTextValue,
  trailingLineFeed: boolean,
  initialFormat: Pick<ContentFormat, 'style' | 'width' | 'height'>,
): RichTextEncodingResult {
  const commands: PrintCommandUnion[] = [];
  const current = {
    style: structuredClone(initialFormat.style),
    width: clampSize(initialFormat.width),
    height: clampSize(initialFormat.height),
  };

  const paragraphs = value.length > 0 ? value : emptyRichTextValue();
  paragraphs.forEach((paragraph, paragraphIndex) => {
    const leaves = paragraph.children.filter(leaf => leaf.text.length > 0);
    const addLineFeed = paragraphIndex < paragraphs.length - 1 || trailingLineFeed;

    if (leaves.length === 0) {
      if (addLineFeed) {
        commands.push({ type: 'newLine' });
      }
      return;
    }

    leaves.forEach((leaf, leafIndex) => {
      const style = styleFromLeaf(leaf);
      const width = clampSize(leaf.width);
      const height = clampSize(leaf.height);

      if (!stylesEqual(current.style, style)) {
        commands.push({ type: 'style', value: style });
        current.style = structuredClone(style);
      }
      if (current.width !== width || current.height !== height) {
        commands.push({ type: 'size', width, height });
        current.width = width;
        current.height = height;
      }

      const isLastLeaf = leafIndex === leaves.length - 1;
      commands.push({
        type: isLastLeaf && addLineFeed ? 'text' : 'pureText',
        content: leaf.text,
      });
    });
  });

  return { commands, endFormat: current };
}
