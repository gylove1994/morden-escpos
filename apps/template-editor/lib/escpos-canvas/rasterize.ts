import type { PrintCommandUnion, PrintJobJSON, StyleCommand } from 'morden-node-escpos/schema';

import type { PaperWidth } from '../editor-types';
import type { RasterImageData } from './image-loader';
import { loadRemoteImageData } from './image-loader';
import { charLength, formatTable, formatTableCustom, normalizeCurrencySymbol } from './layout';
import { DOTS_PER_COLUMN, FONT_HEIGHT, getPaperMetrics, RECEIPT_VERTICAL_PADDING } from './metrics';
import { createQRMatrix } from './qr';

type Align = 'left' | 'center' | 'right';

export interface RasterTextStyle {
  bold: boolean
  italic: boolean
  underline: boolean
  width: number
  height: number
}

export interface TextRasterOperation {
  kind: 'text'
  text: string
  x: number
  y: number
  cellWidth: number
  lineHeight: number
  style: RasterTextStyle
}

export interface QRRasterOperation {
  kind: 'qr'
  x: number
  y: number
  moduleSize: number
  modules: boolean[][]
}

export interface CutRasterOperation {
  kind: 'cut'
  y: number
  label: string
}

export interface BitmapRasterOperation {
  kind: 'bitmap'
  x: number
  y: number
  width: number
  height: number
  source: RasterImageData
}

export interface UnsupportedRasterOperation {
  kind: 'unsupported'
  y: number
  label: string
}

export type RasterOperation
  = | TextRasterOperation
    | QRRasterOperation
    | BitmapRasterOperation
    | CutRasterOperation
    | UnsupportedRasterOperation;

export interface ReceiptRaster {
  width: number
  height: number
  operations: RasterOperation[]
}

interface PendingGlyph {
  character: string
  width: number
  style: RasterTextStyle
}

interface RenderState {
  align: Align
  style: RasterTextStyle
  encoding: string
  lineSpace: number
  marginLeft: number
  marginRight: number
}

const INITIAL_STYLE: RasterTextStyle = {
  bold: false,
  italic: false,
  underline: false,
  width: 1,
  height: 1,
};

function normalizeAlign(value: string): Align {
  const normalized = value.toUpperCase();
  if (normalized === 'CT' || normalized === 'CENTER') {
    return 'center';
  }
  if (normalized === 'RT' || normalized === 'RIGHT') {
    return 'right';
  }
  return 'left';
}

function styleFromCommand(command: StyleCommand): RasterTextStyle {
  if (typeof command.value === 'object') {
    return {
      bold: command.value.bold,
      italic: command.value.italic,
      underline: Boolean(command.value.underline),
      width: 1,
      height: 1,
    };
  }

  const value = command.value.toUpperCase();
  return {
    bold: value.includes('B'),
    italic: value.includes('I'),
    underline: value.includes('U'),
    width: 1,
    height: 1,
  };
}

function paperWidthFromJob(job: PrintJobJSON): PaperWidth {
  return (job.config?.width ?? 32) > 32 ? 80 : 58;
}

export async function buildReceiptRaster(
  job: PrintJobJSON,
  imageLoader: (url: string) => Promise<RasterImageData> = loadRemoteImageData,
): Promise<ReceiptRaster> {
  const metrics = getPaperMetrics(paperWidthFromJob(job));
  const operations: RasterOperation[] = [];
  const state: RenderState = {
    align: 'left',
    style: { ...INITIAL_STYLE },
    encoding: job.config?.encoding ?? 'GB18030',
    lineSpace: FONT_HEIGHT,
    marginLeft: 0,
    marginRight: 0,
  };
  let cursorY = RECEIPT_VERTICAL_PADDING;
  let pendingGlyphs: PendingGlyph[] = [];
  let pendingWidth = 0;
  const imageLoads = new Map<string, Promise<RasterImageData>>();

  for (const command of job.commands) {
    if ((command.type === 'image' || command.type === 'raster') && !imageLoads.has(command.path)) {
      imageLoads.set(command.path, imageLoader(command.path));
    }
  }

  const printableWidth = () =>
    Math.max(DOTS_PER_COLUMN, metrics.dots - state.marginLeft - state.marginRight);

  const flushLine = (force = false) => {
    if (pendingGlyphs.length === 0) {
      if (force) {
        cursorY += state.lineSpace;
      }
      return;
    }

    const availableWidth = printableWidth();
    const offset = state.align === 'center'
      ? Math.max(0, Math.floor((availableWidth - pendingWidth) / 2))
      : state.align === 'right'
        ? Math.max(0, availableWidth - pendingWidth)
        : 0;
    let cursorX = state.marginLeft + offset;
    let lineHeight = state.lineSpace;

    for (const glyph of pendingGlyphs) {
      const glyphHeight = FONT_HEIGHT * glyph.style.height;
      lineHeight = Math.max(lineHeight, glyphHeight);
      operations.push({
        kind: 'text',
        text: glyph.character,
        x: cursorX,
        y: cursorY,
        cellWidth: glyph.width,
        lineHeight: glyphHeight,
        style: { ...glyph.style },
      });
      cursorX += glyph.width;
    }

    cursorY += lineHeight;
    pendingGlyphs = [];
    pendingWidth = 0;
  };

  const appendText = (rawText: string, addLineFeed: boolean, style = state.style) => {
    const text = normalizeCurrencySymbol(rawText, state.encoding);

    for (const character of text) {
      if (character === '\n') {
        flushLine(true);
        continue;
      }
      if (character === '\r') {
        continue;
      }

      const glyphWidth = charLength(character) * DOTS_PER_COLUMN * style.width;
      if (pendingWidth > 0 && pendingWidth + glyphWidth > printableWidth()) {
        flushLine();
      }
      pendingGlyphs.push({
        character,
        width: glyphWidth,
        style: { ...style },
      });
      pendingWidth += glyphWidth;
    }

    if (addLineFeed) {
      flushLine(true);
    }
  };

  const appendUnsupported = (command: PrintCommandUnion, label = `${command.type} 未模拟`) => {
    flushLine();
    operations.push({
      kind: 'unsupported',
      y: cursorY,
      label,
    });
    cursorY += FONT_HEIGHT;
  };

  for (const command of job.commands) {
    switch (command.type) {
      case 'align':
        flushLine();
        state.align = normalizeAlign(command.value);
        break;
      case 'style': {
        const nextStyle = styleFromCommand(command);
        state.style = {
          ...state.style,
          bold: nextStyle.bold,
          italic: nextStyle.italic,
          underline: nextStyle.underline,
        };
        break;
      }
      case 'size':
        state.style = {
          ...state.style,
          width: Math.max(1, command.width),
          height: Math.max(1, command.height),
        };
        break;
      case 'emphasize':
        state.style = { ...state.style, bold: true };
        break;
      case 'cancelEmphasize':
        state.style = { ...state.style, bold: false };
        break;
      case 'encode':
        state.encoding = command.encoding;
        break;
      case 'lineSpace':
        state.lineSpace = command.value === undefined || command.value === null
          ? FONT_HEIGHT
          : Math.max(FONT_HEIGHT, command.value);
        break;
      case 'marginLeft':
        flushLine();
        state.marginLeft = Math.max(0, command.size);
        break;
      case 'marginRight':
        flushLine();
        state.marginRight = Math.max(0, command.size);
        break;
      case 'text':
        appendText(command.content, true);
        break;
      case 'pureText':
      case 'print':
        appendText(command.content, false);
        break;
      case 'newLine':
        flushLine(true);
        break;
      case 'feed': {
        const lines = Math.max(1, command.lines ?? 1);
        flushLine(true);
        cursorY += (lines - 1) * state.lineSpace;
        break;
      }
      case 'drawLine':
        appendText((command.character ?? '-').slice(0, 1).repeat(metrics.columns), true);
        break;
      case 'table':
        appendText(formatTable(command.data, metrics.columns), true);
        break;
      case 'tableCustom': {
        const width = Math.max(1, command.options?.size[0] ?? 1);
        const height = Math.max(1, command.options?.size[1] ?? 1);
        const tableStyle = { ...state.style, width, height };
        for (const line of formatTableCustom(command, metrics.columns)) {
          appendText(line, true, tableStyle);
        }
        break;
      }
      case 'qrcode':
      case 'qrimage': {
        flushLine();
        const qr = createQRMatrix(
          command.content,
          command.type === 'qrcode'
            ? (command.level ?? 'M').toUpperCase() as 'L' | 'M' | 'Q' | 'H'
            : 'M',
          command.type === 'qrcode' ? command.version : undefined,
        );
        const requestedModuleSize = command.type === 'qrcode' ? command.size ?? 5 : 5;
        const moduleSize = Math.max(1, Math.min(requestedModuleSize, Math.floor(printableWidth() / (qr.size + 8))));
        const qrWidth = (qr.size + 8) * moduleSize;
        const offset = state.align === 'center'
          ? Math.floor((printableWidth() - qrWidth) / 2)
          : state.align === 'right'
            ? printableWidth() - qrWidth
            : 0;
        operations.push({
          kind: 'qr',
          x: state.marginLeft + Math.max(0, offset) + 4 * moduleSize,
          y: cursorY + 4 * moduleSize,
          moduleSize,
          modules: qr.modules,
        });
        cursorY += qrWidth;
        break;
      }
      case 'image':
      case 'raster': {
        flushLine();
        try {
          const source = await imageLoads.get(command.path);
          if (!source || source.width <= 0 || source.height <= 0) {
            throw new Error('图片尺寸无效。');
          }

          const normalizedMode = command.type === 'raster'
            ? (command.mode ?? 'normal').toLowerCase()
            : 'normal';
          const widthMultiplier = ['dw', 'dwdh', 'dhdw', 'dwh', 'dhw'].includes(normalizedMode) ? 2 : 1;
          const heightMultiplier = ['dh', 'dwdh', 'dhdw', 'dwh', 'dhw'].includes(normalizedMode) ? 2 : 1;
          const availableWidth = printableWidth();
          const scale = Math.min(1, availableWidth / (source.width * widthMultiplier));
          const width = Math.max(1, Math.floor(source.width * widthMultiplier * scale));
          const height = Math.max(1, Math.floor(source.height * heightMultiplier * scale));
          const offset = state.align === 'center'
            ? Math.floor((availableWidth - width) / 2)
            : state.align === 'right'
              ? availableWidth - width
              : 0;
          operations.push({
            kind: 'bitmap',
            x: state.marginLeft + Math.max(0, offset),
            y: cursorY,
            width,
            height,
            source,
          });
          cursorY += height;
        }
        catch {
          appendUnsupported(command, '图片加载失败');
        }
        break;
      }
      case 'cut':
      case 'starFullCut':
        flushLine();
        cursorY += 8;
        operations.push({
          kind: 'cut',
          y: cursorY,
          label: command.type === 'cut' && command.partial ? '半切' : '全切',
        });
        cursorY += FONT_HEIGHT;
        break;
      case 'font':
      case 'spacing':
      case 'marginBottom':
      case 'color':
      case 'reverseColors':
      case 'characterCodeTable':
      case 'model':
      case 'control':
      case 'hardware':
      case 'cashdraw':
      case 'beep':
        break;
      case 'barcode':
      case 'raw':
        appendUnsupported(command);
        break;
    }
  }

  flushLine();

  return {
    width: metrics.dots,
    height: Math.max(cursorY + RECEIPT_VERTICAL_PADDING, FONT_HEIGHT * 4),
    operations,
  };
}
