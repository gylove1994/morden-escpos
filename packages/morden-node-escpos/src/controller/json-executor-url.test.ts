import type { Printer } from '../printer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Image from '../printer/image';
import { JSONPrintExecutor } from './json-executor';

describe('jSONPrintExecutor remote images', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads a raster image from an http(s) URL', async () => {
    const loadedImage = {} as Image;
    const raster = vi.fn();
    const printer = { raster } as unknown as Printer<[]>;
    vi.spyOn(Image, 'load').mockResolvedValue(loadedImage);

    const executor = new JSONPrintExecutor(printer);
    await executor.executeCommand({
      type: 'raster',
      path: 'https://example.com/logo.png',
      mode: 'dw',
    });

    expect(Image.load).toHaveBeenCalledWith('https://example.com/logo.png');
    expect(raster).toHaveBeenCalledWith(loadedImage, 'dw');
  });

  it('loads a bitmap image from an http(s) URL', async () => {
    const loadedImage = {} as Image;
    const image = vi.fn().mockResolvedValue(undefined);
    const printer = { image } as unknown as Printer<[]>;
    vi.spyOn(Image, 'load').mockResolvedValue(loadedImage);

    const executor = new JSONPrintExecutor(printer);
    await executor.executeCommand({
      type: 'image',
      path: 'http://example.com/logo.bmp',
      density: 'd24',
    });

    expect(Image.load).toHaveBeenCalledWith('http://example.com/logo.bmp');
    expect(image).toHaveBeenCalledWith(loadedImage, 'd24');
  });
});
