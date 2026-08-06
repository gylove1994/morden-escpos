/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import USBAdapter from '../usb';
import { Printer } from './index';

describe('printer', () => {
  let adapter: USBAdapter;
  let printer: Printer<[]>;
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

  describe('初始化', () => {
    it('应该创建 Printer 实例', () => {
      if (!printerAvailable) {
        return;
      }
      expect(printer).toBeDefined();
      expect(printer.buffer).toBeDefined();
    });
  });

  describe('文本打印', () => {
    it('应该打印文本', async () => {
      if (!printerAvailable) {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        adapter.open((_error) => {
          if (_error) {
            reject(_error);
            return;
          }

          printer.text('测试文本');
          expect(printer.buffer.length).toBeGreaterThan(0);
          resolve();
        });
      });
    });

    it('应该打印纯文本', async () => {
      if (!printerAvailable) {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        adapter.open((_error) => {
          if (_error) {
            reject(_error);
            return;
          }

          printer.pureText('纯文本');
          expect(printer.buffer.length).toBeGreaterThan(0);
          resolve();
        });
      });
    });

    it('应该打印并换行', async () => {
      if (!printerAvailable) {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        adapter.open((_error) => {
          if (_error) {
            reject(_error);
            return;
          }

          printer.println('打印并换行');
          expect(printer.buffer.length).toBeGreaterThan(0);
          resolve();
        });
      });
    });

    it('应该换行', async () => {
      if (!printerAvailable) {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        adapter.open((_error) => {
          if (_error) {
            reject(_error);
            return;
          }

          const beforeLength = printer.buffer.length;
          printer.newLine();
          expect(printer.buffer.length).toBeGreaterThan(beforeLength);
          resolve();
        });
      });
    });
  });

  describe('格式化', () => {
    it('应该设置对齐方式', async () => {
      if (!printerAvailable) {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        adapter.open((_error) => {
          if (_error) {
            reject(_error);
            return;
          }

          printer.align('ct');
          printer.align('lt');
          printer.align('rt');
          expect(printer.buffer.length).toBeGreaterThan(0);
          resolve();
        });
      });
    });

    it('应该设置样式', async () => {
      if (!printerAvailable) {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        adapter.open((_error) => {
          if (_error) {
            reject(_error);
            return;
          }

          printer.style('b');
          printer.style('i');
          printer.style('u');
          printer.style('normal');
          expect(printer.buffer.length).toBeGreaterThan(0);
          resolve();
        });
      });
    });

    it('应该设置文字大小', async () => {
      if (!printerAvailable) {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        adapter.open((_error) => {
          if (_error) {
            reject(_error);
            return;
          }

          printer.size(2, 2);
          printer.size(1, 1);
          expect(printer.buffer.length).toBeGreaterThan(0);
          resolve();
        });
      });
    });

    it('应该设置字体', async () => {
      if (!printerAvailable) {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        adapter.open((_error) => {
          if (_error) {
            reject(_error);
            return;
          }

          printer.font('a');
          printer.font('b');
          printer.font('c');
          expect(printer.buffer.length).toBeGreaterThan(0);
          resolve();
        });
      });
    });

    it('应该设置字符间距', async () => {
      if (!printerAvailable) {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        adapter.open((_error) => {
          if (_error) {
            reject(_error);
            return;
          }

          printer.spacing(2);
          printer.spacing(0);
          expect(printer.buffer.length).toBeGreaterThan(0);
          resolve();
        });
      });
    });

    it('应该设置行间距', async () => {
      if (!printerAvailable) {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        adapter.open((_error) => {
          if (_error) {
            reject(_error);
            return;
          }

          printer.lineSpace(2);
          printer.lineSpace(0);
          expect(printer.buffer.length).toBeGreaterThan(0);
          resolve();
        });
      });
    });
  });

  describe('表格打印', () => {
    it('应该打印简单表格', async () => {
      if (!printerAvailable) {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        adapter.open((_error) => {
          if (_error) {
            reject(_error);
            return;
          }

          printer.table(['列1', '列2', '列3']);
          expect(printer.buffer.length).toBeGreaterThan(0);
          resolve();
        });
      });
    });

    it('应该打印自定义表格', async () => {
      if (!printerAvailable) {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        adapter.open((_error) => {
          if (_error) {
            reject(_error);
            return;
          }

          printer.tableCustom([
            { text: '商品', align: 'left', width: 0.5 },
            { text: '数量', align: 'center', width: 0.2 },
            { text: '价格', align: 'right', width: 0.3 },
          ]);
          expect(printer.buffer.length).toBeGreaterThan(0);
          resolve();
        });
      });
    });
  });

  describe('条形码和二维码', () => {
    it('应该打印条形码', async () => {
      if (!printerAvailable) {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        adapter.open((_error) => {
          if (_error) {
            reject(_error);
            return;
          }

          printer.barcode(123456789, 'CODE128', {
            width: 2,
            height: 50,
            position: 'blw',
            font: 'a',
          });
          expect(printer.buffer.length).toBeGreaterThan(0);
          resolve();
        });
      });
    });

    it('应该打印二维码', async () => {
      if (!printerAvailable) {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        adapter.open((_error) => {
          if (_error) {
            reject(_error);
            return;
          }

          printer.qrcode('https://example.com', 3, 'M', 6);
          expect(printer.buffer.length).toBeGreaterThan(0);
          resolve();
        });
      });
    });
  });

  describe('其他功能', () => {
    it('应该画分隔线', async () => {
      if (!printerAvailable) {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        adapter.open((_error) => {
          if (_error) {
            reject(_error);
            return;
          }

          printer.drawLine();
          printer.drawLine('-');
          printer.drawLine('=');
          expect(printer.buffer.length).toBeGreaterThan(0);
          resolve();
        });
      });
    });

    it('应该进纸', async () => {
      if (!printerAvailable) {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        adapter.open((_error) => {
          if (_error) {
            reject(_error);
            return;
          }

          printer.feed();
          printer.feed(3);
          expect(printer.buffer.length).toBeGreaterThan(0);
          resolve();
        });
      });
    });

    it('应该设置边距', async () => {
      if (!printerAvailable) {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        adapter.open((_error) => {
          if (_error) {
            reject(_error);
            return;
          }

          printer.marginLeft(5);
          printer.marginRight(5);
          printer.marginBottom(5);
          expect(printer.buffer.length).toBeGreaterThan(0);
          resolve();
        });
      });
    });
  });

  describe('硬件控制', () => {
    it('应该执行切纸命令', async () => {
      if (!printerAvailable) {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        adapter.open((_error) => {
          if (_error) {
            reject(_error);
            return;
          }

          printer.cut();
          printer.cut(true);
          printer.cut(false, 3);
          expect(printer.buffer.length).toBeGreaterThan(0);
          resolve();
        });
      });
    });
  });

  describe('链式调用', () => {
    it('应该支持链式调用', async () => {
      if (!printerAvailable) {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        adapter.open((_error) => {
          if (_error) {
            reject(_error);
            return;
          }

          const result = printer
            .align('ct')
            .style('b')
            .size(2, 2)
            .text('测试')
            .style('normal')
            .size(1, 1);

          expect(result).toBe(printer);
          expect(printer.buffer.length).toBeGreaterThan(0);
          resolve();
        });
      });
    });
  });
});
