import { TemplateEngine } from 'morden-node-escpos/template';
import { describe, expect, it, vi } from 'vitest';

import { defaultPrintJob, defaultSampleData } from '../default-template';
import { buildReceiptRaster } from './rasterize';

describe('esc/pos receipt raster', () => {
  it('renders the default 80mm Jira template with text and a real QR matrix', async () => {
    const renderedJob = new TemplateEngine().render(defaultPrintJob, defaultSampleData);
    const raster = await buildReceiptRaster(renderedJob);
    const textOperations = raster.operations.filter(operation => operation.kind === 'text');
    const qrOperation = raster.operations.find(operation => operation.kind === 'qr');

    expect(raster.width).toBe(576);
    expect(raster.height).toBeGreaterThan(200);
    expect(textOperations.some(operation => operation.text === 'B')).toBe(true);
    expect(textOperations.some(operation => operation.style.width === 2 && operation.style.height === 2)).toBe(true);
    expect(qrOperation?.modules.length).toBeGreaterThan(20);
    expect(qrOperation?.modules.some(row => row.some(Boolean))).toBe(true);
  });

  it('uses 576 dots for an 80mm, 48-column printer', async () => {
    const raster = await buildReceiptRaster({
      config: { width: 48, encoding: 'GB18030', model: null },
      commands: [{ type: 'text', content: '80mm' }],
    });

    expect(raster.width).toBe(576);
  });

  it('doubles the printed line height for size(2, 2)', async () => {
    const normal = await buildReceiptRaster({
      commands: [{ type: 'text', content: 'A' }],
    });
    const doubled = await buildReceiptRaster({
      commands: [
        { type: 'size', width: 2, height: 2 },
        { type: 'text', content: 'A' },
      ],
    });

    const normalText = normal.operations.find(operation => operation.kind === 'text');
    const doubledText = doubled.operations.find(operation => operation.kind === 'text');

    expect(doubledText?.lineHeight).toBe((normalText?.lineHeight ?? 0) * 2);
  });

  it('renders feed(1) with the same line-feed semantics as newLine', async () => {
    const newLineRaster = await buildReceiptRaster({
      commands: [
        { type: 'pureText', content: 'A' },
        { type: 'newLine' },
      ],
    });
    const feedRaster = await buildReceiptRaster({
      commands: [
        { type: 'pureText', content: 'A' },
        { type: 'feed', lines: 1 },
      ],
    });

    expect(feedRaster).toEqual(newLineRaster);
  });

  it('loads, aligns, scales, and renders a remote raster image', async () => {
    const imageLoader = vi.fn().mockResolvedValue({
      width: 400,
      height: 100,
      data: new Uint8ClampedArray(400 * 100 * 4),
    });
    const raster = await buildReceiptRaster({
      commands: [
        { type: 'align', value: 'CT' },
        { type: 'raster', path: 'https://example.com/logo.png', mode: 'dw' },
      ],
    }, imageLoader);
    const bitmap = raster.operations.find(operation => operation.kind === 'bitmap');

    expect(imageLoader).toHaveBeenCalledWith('https://example.com/logo.png');
    expect(bitmap).toMatchObject({
      kind: 'bitmap',
      x: 0,
      width: 384,
      height: 48,
    });
  });

  it('keeps the receipt preview usable when an image cannot be loaded', async () => {
    const raster = await buildReceiptRaster({
      commands: [
        { type: 'raster', path: 'https://example.com/missing.png' },
        { type: 'text', content: '正文' },
      ],
    }, async () => {
      throw new Error('network failure');
    });

    expect(raster.operations).toContainEqual(expect.objectContaining({
      kind: 'unsupported',
      label: '图片加载失败',
    }));
    expect(raster.operations.some(operation => operation.kind === 'text')).toBe(true);
  });
});
