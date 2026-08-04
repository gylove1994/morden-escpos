import type { PrintCommandUnion } from './json-schema';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Printer } from '../printer';
import USBAdapter from '../usb';
import { JSONPrintExecutor } from './json-executor';

describe('jSONPrintExecutor', () => {
  let adapter: USBAdapter;
  let printer: Printer<[]>;
  let executor: JSONPrintExecutor;
  let printerAvailable = false;

  beforeAll(() => {
    try {
      const devices = USBAdapter.findPrinter();
      if (devices.length > 0) {
        adapter = new USBAdapter();
        printer = new Printer(adapter, {
          encoding: 'GB18030',
          width: 48,
        });
        executor = new JSONPrintExecutor(printer);
        printerAvailable = true;
      }
    }
    catch (_error) {
      console.warn('打印机未连接，跳过测试');
      printerAvailable = false;
    }
  });

  afterAll(async () => {
    if (printerAvailable && adapter) {
      try {
        adapter.close();
      }
      catch (_error) {
        // 忽略关闭错误
      }
    }
  });

  describe('文本命令', () => {
    it('应该执行文本命令', async () => {
      if (!printerAvailable) {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        adapter.open((_error) => {
          if (_error) {
            reject(_error);
            return;
          }
          resolve();
        });
      });

      const command: PrintCommandUnion = {
        type: 'text',
        content: '测试文本',
      };

      await executor.executeCommand(command);
      expect(printer.buffer.length).toBeGreaterThan(0);
    });

    it('应该执行纯文本命令', async () => {
      if (!printerAvailable) {
        return;
      }

      adapter.open((_error) => {
        if (_error) {
          throw _error;
        }
      });

      const command: PrintCommandUnion = {
        type: 'pureText',
        content: '纯文本',
      };

      await executor.executeCommand(command);
      expect(printer.buffer.length).toBeGreaterThan(0);
    });
  });

  describe('格式化命令', () => {
    it('应该执行对齐命令', async () => {
      if (!printerAvailable) {
        return;
      }

      adapter.open((_error) => {
        if (_error) {
          throw _error;
        }
      });

      const commands: PrintCommandUnion[] = [
        { type: 'align', value: 'ct' },
        { type: 'align', value: 'lt' },
        { type: 'align', value: 'rt' },
      ];

      for (const command of commands) {
        await executor.executeCommand(command);
      }

      expect(printer.buffer.length).toBeGreaterThan(0);
    });

    it('应该执行样式命令', async () => {
      if (!printerAvailable) {
        return;
      }

      adapter.open((_error) => {
        if (_error) {
          throw _error;
        }
      });

      const commands: PrintCommandUnion[] = [
        { type: 'style', value: 'b' },
        { type: 'style', value: 'i' },
        { type: 'style', value: 'u' },
        { type: 'style', value: 'normal' },
      ];

      for (const command of commands) {
        await executor.executeCommand(command);
      }

      expect(printer.buffer.length).toBeGreaterThan(0);
    });

    it('应该执行大小命令', async () => {
      if (!printerAvailable) {
        return;
      }

      adapter.open((_error) => {
        if (_error) {
          throw _error;
        }
      });

      const command: PrintCommandUnion = {
        type: 'size',
        width: 2,
        height: 2,
      };

      await executor.executeCommand(command);
      expect(printer.buffer.length).toBeGreaterThan(0);
    });

    it('应该执行字体命令', async () => {
      if (!printerAvailable) {
        return;
      }

      adapter.open((_error) => {
        if (_error) {
          throw _error;
        }
      });

      const commands: PrintCommandUnion[] = [
        { type: 'font', family: 'a' },
        { type: 'font', family: 'b' },
        { type: 'font', family: 'c' },
      ];

      for (const command of commands) {
        await executor.executeCommand(command);
      }

      expect(printer.buffer.length).toBeGreaterThan(0);
    });
  });

  describe('表格命令', () => {
    it('应该执行表格命令', async () => {
      if (!printerAvailable) {
        return;
      }

      adapter.open((_error) => {
        if (_error) {
          throw _error;
        }
      });

      const command: PrintCommandUnion = {
        type: 'table',
        data: ['列1', '列2', '列3'],
      };

      await executor.executeCommand(command);
      expect(printer.buffer.length).toBeGreaterThan(0);
    });

    it('应该执行自定义表格命令', async () => {
      if (!printerAvailable) {
        return;
      }

      adapter.open((_error) => {
        if (_error) {
          throw _error;
        }
      });

      const command: PrintCommandUnion = {
        type: 'tableCustom',
        data: [
          { text: '商品', align: 'left', width: 0.5 },
          { text: '价格', align: 'right', width: 0.5 },
        ],
      };

      await executor.executeCommand(command);
      expect(printer.buffer.length).toBeGreaterThan(0);
    });
  });

  describe('条形码和二维码命令', () => {
    it('应该执行条形码命令', async () => {
      if (!printerAvailable) {
        return;
      }

      adapter.open((_error) => {
        if (_error) {
          throw _error;
        }
      });

      const command: PrintCommandUnion = {
        type: 'barcode',
        code: 123456789,
        barcodeType: 'CODE128',
        options: {
          width: 2,
          height: 50,
          position: 'blw',
          font: 'a',
        },
      };

      await executor.executeCommand(command);
      expect(printer.buffer.length).toBeGreaterThan(0);
    });

    it('应该执行二维码命令', async () => {
      if (!printerAvailable) {
        return;
      }

      adapter.open((_error) => {
        if (_error) {
          throw _error;
        }
      });

      const command: PrintCommandUnion = {
        type: 'qrcode',
        content: 'https://example.com',
        version: 3,
        level: 'M',
        size: 6,
      };

      await executor.executeCommand(command);
      expect(printer.buffer.length).toBeGreaterThan(0);
    });
  });

  describe('其他命令', () => {
    it('应该执行换行命令', async () => {
      if (!printerAvailable) {
        return;
      }

      adapter.open((_error) => {
        if (_error) {
          throw _error;
        }
      });

      const command: PrintCommandUnion = {
        type: 'newLine',
      };

      await executor.executeCommand(command);
      expect(printer.buffer.length).toBeGreaterThan(0);
    });

    it('应该执行画线命令', async () => {
      if (!printerAvailable) {
        return;
      }

      adapter.open((_error) => {
        if (_error) {
          throw _error;
        }
      });

      const commands: PrintCommandUnion[] = [
        { type: 'drawLine' },
        { type: 'drawLine', character: '-' },
      ];

      for (const command of commands) {
        await executor.executeCommand(command);
      }

      expect(printer.buffer.length).toBeGreaterThan(0);
    });

    it('应该执行进纸命令', async () => {
      if (!printerAvailable) {
        return;
      }

      adapter.open((_error) => {
        if (_error) {
          throw _error;
        }
      });

      const command: PrintCommandUnion = {
        type: 'feed',
        lines: 2,
      };

      await executor.executeCommand(command);
      expect(printer.buffer.length).toBeGreaterThan(0);
    });

    it('应该执行切纸命令', async () => {
      if (!printerAvailable) {
        return;
      }

      adapter.open((_error) => {
        if (_error) {
          throw _error;
        }
      });

      const commands: PrintCommandUnion[] = [
        { type: 'cut' },
        { type: 'cut', partial: true },
        { type: 'cut', partial: false, feed: 3 },
      ];

      for (const command of commands) {
        await executor.executeCommand(command);
      }

      expect(printer.buffer.length).toBeGreaterThan(0);
    });
  });
});
