/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import ndarray from 'ndarray';

import Image from '../printer/image';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

async function decodeBlob(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(blob);
  }

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const image = new globalThis.Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('浏览器无法解码打印图片。'));
    };
    image.src = objectUrl;
  });
}

export async function loadBrowserImage(path: string): Promise<Image> {
  if (!/^https?:\/\//i.test(path)) {
    throw new Error('浏览器打印仅支持 http(s) 图片地址。');
  }

  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`图片请求失败（HTTP ${response.status}）。`);
  }
  const blob = await response.blob();
  if (blob.size > MAX_IMAGE_BYTES) {
    throw new Error('打印图片不能超过 5MB。');
  }

  const source = await decodeBlob(blob);
  const width = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const height = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('浏览器无法创建图片画布。');
  }
  context.drawImage(source, 0, 0);
  const pixels = context.getImageData(0, 0, width, height).data;
  if ('close' in source && typeof source.close === 'function') {
    source.close();
  }

  return new Image(ndarray(
    new Uint8Array(pixels),
    [width, height, 4],
    [4, width * 4, 1],
  ));
}
