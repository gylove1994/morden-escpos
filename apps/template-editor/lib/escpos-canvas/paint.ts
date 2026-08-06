/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { ReceiptRaster, TextRasterOperation } from './rasterize';

import { FONT_HEIGHT } from './metrics';

const FONT_STACK = '"Sarasa Mono SC", "Noto Sans Mono CJK SC", "Noto Sans CJK SC", "Microsoft YaHei", monospace';

function paintText(context: CanvasRenderingContext2D, operation: TextRasterOperation) {
  const fontStyle = operation.style.italic ? 'italic' : 'normal';
  const fontWeight = operation.style.bold ? '700' : '400';
  context.save();
  context.font = `${fontStyle} ${fontWeight} 20px ${FONT_STACK}`;
  context.textBaseline = 'alphabetic';
  context.fillStyle = '#111';

  const measuredWidth = Math.max(1, context.measureText(operation.text).width);
  const horizontalScale = Math.max(0.1, (operation.cellWidth - 1) / measuredWidth);
  const verticalScale = operation.style.height;
  context.translate(operation.x, operation.y);
  context.scale(horizontalScale, verticalScale);
  context.fillText(operation.text, 0, 20);

  if (operation.style.underline) {
    context.fillRect(0, 22, measuredWidth, 1);
  }
  context.restore();
}

function convertToMonochrome(context: CanvasRenderingContext2D, width: number, height: number) {
  const image = context.getImageData(0, 0, width, height);
  const pixels = image.data;

  for (let index = 0; index < pixels.length; index += 4) {
    const luminance = (pixels[index]! * 299 + pixels[index + 1]! * 587 + pixels[index + 2]! * 114) / 1000;
    const value = luminance < 190 ? 24 : 255;
    pixels[index] = value;
    pixels[index + 1] = value;
    pixels[index + 2] = value;
    pixels[index + 3] = 255;
  }

  context.putImageData(image, 0, 0);
}

export function paintReceiptRaster(canvas: HTMLCanvasElement, raster: ReceiptRaster): void {
  canvas.width = raster.width;
  canvas.height = raster.height;
  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  context.imageSmoothingEnabled = false;
  context.fillStyle = '#fff';
  context.fillRect(0, 0, raster.width, raster.height);

  for (const operation of raster.operations) {
    if (operation.kind === 'text') {
      paintText(context, operation);
      continue;
    }

    if (operation.kind === 'qr') {
      context.fillStyle = '#111';
      for (let row = 0; row < operation.modules.length; row += 1) {
        const modules = operation.modules[row]!;
        for (let column = 0; column < modules.length; column += 1) {
          if (modules[column]) {
            context.fillRect(
              operation.x + column * operation.moduleSize,
              operation.y + row * operation.moduleSize,
              operation.moduleSize,
              operation.moduleSize,
            );
          }
        }
      }
      continue;
    }

    if (operation.kind === 'bitmap') {
      const sourceCanvas = document.createElement('canvas');
      sourceCanvas.width = operation.source.width;
      sourceCanvas.height = operation.source.height;
      const sourceContext = sourceCanvas.getContext('2d');
      if (sourceContext) {
        const imageData = sourceContext.createImageData(operation.source.width, operation.source.height);
        imageData.data.set(operation.source.data);
        sourceContext.putImageData(imageData, 0, 0);
        context.drawImage(
          sourceCanvas,
          operation.x,
          operation.y,
          operation.width,
          operation.height,
        );
      }
      continue;
    }

    if (operation.kind === 'cut') {
      context.save();
      context.strokeStyle = '#777';
      context.setLineDash([6, 5]);
      context.beginPath();
      context.moveTo(0, operation.y + 0.5);
      context.lineTo(raster.width, operation.y + 0.5);
      context.stroke();
      context.restore();
      context.fillStyle = '#555';
      context.font = `12px ${FONT_STACK}`;
      const labelWidth = context.measureText(operation.label).width;
      context.fillStyle = '#fff';
      context.fillRect((raster.width - labelWidth) / 2 - 5, operation.y - 9, labelWidth + 10, 16);
      context.fillStyle = '#555';
      context.fillText(operation.label, (raster.width - labelWidth) / 2, operation.y + 3);
      continue;
    }

    context.fillStyle = '#777';
    context.font = `12px ${FONT_STACK}`;
    context.fillText(`[${operation.label}]`, 8, operation.y + Math.floor(FONT_HEIGHT * 0.75));
  }

  try {
    convertToMonochrome(context, raster.width, raster.height);
  }
  catch {
    // 受限浏览器禁止读取 canvas 像素时，保留已绘制的黑白预览。
  }
}
