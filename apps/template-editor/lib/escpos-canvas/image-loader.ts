/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
export interface RasterImageData {
  width: number
  height: number
  data: Uint8ClampedArray
}

const MAX_PREVIEW_IMAGE_BYTES = 2 * 1024 * 1024;

async function decodeBlob(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(blob);
  }

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('浏览器无法解码图片。'));
    };
    image.src = objectUrl;
  });
}

export async function loadRemoteImageData(url: string): Promise<RasterImageData> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`图片请求失败（HTTP ${response.status}）。`);
  }

  const blob = await response.blob();
  if (blob.size > MAX_PREVIEW_IMAGE_BYTES) {
    throw new Error('图片超过 2MB 预览限制。');
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
  const imageData = context.getImageData(0, 0, width, height);
  if ('close' in source && typeof source.close === 'function') {
    source.close();
  }

  return {
    width,
    height,
    data: imageData.data,
  };
}
