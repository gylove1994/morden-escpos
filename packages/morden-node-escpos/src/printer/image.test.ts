/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { NdArray } from 'ndarray';
import { describe, expect, it } from 'vitest';
import Image from './image';

describe('image', () => {
  describe('创建 Image 实例', () => {
    it('应该从像素数据创建 Image 实例', () => {
      // 创建一个简单的 10x10 像素数据
      const width = 10;
      const height = 10;
      const channels = 4; // RGBA

      // 创建模拟的 ndarray 数据
      const data = new Uint8Array(width * height * channels);
      // 填充一些测试数据
      for (let i = 0; i < data.length; i += channels) {
        data[i] = 255; // R
        data[i + 1] = 0; // G
        data[i + 2] = 0; // B
        data[i + 3] = 255; // A
      }

      // 创建模拟的 ndarray
      const pixels = {
        data,
        shape: [width, height, channels],
        stride: [height * channels, channels, 1],
        offset: 0,
      } as unknown as NdArray<Uint8Array>;

      const image = new Image(pixels);

      expect(image).toBeDefined();
      // Image 类没有公开的 width/height 属性，只有私有的 size getter
      // 验证实例创建成功即可
    });

    it('应该处理灰度图像', () => {
      const width = 5;
      const height = 5;
      const channels = 1; // 灰度

      const data = new Uint8Array(width * height * channels);
      for (let i = 0; i < data.length; i++) {
        data[i] = 128;
      }

      const pixels = {
        data,
        shape: [width, height, channels],
        stride: [height * channels, channels, 1],
        offset: 0,
      } as unknown as NdArray<Uint8Array>;

      const image = new Image(pixels);

      expect(image).toBeDefined();
      // Image 类没有公开的 width/height 属性，只有私有的 size getter
      // 验证实例创建成功即可
    });

    it('应该处理 RGB 图像', () => {
      const width = 5;
      const height = 5;
      const channels = 3; // RGB

      const data = new Uint8Array(width * height * channels);
      for (let i = 0; i < data.length; i += channels) {
        data[i] = 255; // R
        data[i + 1] = 0; // G
        data[i + 2] = 0; // B
      }

      const pixels = {
        data,
        shape: [width, height, channels],
        stride: [height * channels, channels, 1],
        offset: 0,
      } as unknown as NdArray<Uint8Array>;

      const image = new Image(pixels);

      expect(image).toBeDefined();
      // Image 类没有公开的 width/height 属性，只有私有的 size getter
      // 验证实例创建成功即可
    });
  });
});
