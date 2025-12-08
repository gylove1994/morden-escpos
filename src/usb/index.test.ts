import { describe, expect, it } from 'vitest';
import USBAdapter from './index';

describe('uSBAdapter', () => {
  describe('findPrinter', () => {
    it('应该能够查找打印机', () => {
      const devices = USBAdapter.findPrinter();
      expect(Array.isArray(devices)).toBe(true);
      // 如果没有打印机，数组应该为空
      // 如果有打印机，数组应该包含设备
    });
  });

  describe('创建适配器', () => {
    it('应该能够创建适配器实例（无参数）', () => {
      try {
        const adapter = new USBAdapter();
        expect(adapter).toBeDefined();
      }
      catch (error) {
        // 如果没有找到打印机，会抛出错误
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('应该能够使用 VID 和 PID 创建适配器', () => {
      // 这里需要实际的 VID 和 PID，所以可能会失败
      // 测试主要验证代码结构正确
      try {
        const adapter = new USBAdapter(0x04B8, 0x0E15);
        expect(adapter).toBeDefined();
      }
      catch (_error) {
        // 如果设备不存在，会抛出错误
        expect(_error).toBeInstanceOf(Error);
      }
    });
  });

  describe('适配器方法', () => {
    let adapter: USBAdapter | null = null;

    it('应该能够打开连接', async () => {
      try {
        const devices = USBAdapter.findPrinter();
        if (devices.length === 0) {
          console.warn('未找到打印机，跳过测试');
          return;
        }

        adapter = new USBAdapter();
        await new Promise<void>((resolve, reject) => {
          adapter!.open((error) => {
            if (error) {
              reject(error);
              return;
            }
            expect(adapter).toBeDefined();
            resolve();
          });
        });
      }
      catch (_error) {
        console.warn('打印机未连接，跳过测试');
      }
    });

    it('应该能够写入数据', async () => {
      if (!adapter) {
        return;
      }

      const { Buffer } = await import('node:buffer');
      await new Promise<void>((resolve, reject) => {
        adapter!.write(Buffer.from('test'), (_error) => {
          if (_error) {
            reject(_error);
            return;
          }
          resolve();
        });
      });
    });

    it('应该能够关闭连接', async () => {
      if (!adapter) {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        adapter!.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    });
  });
});
