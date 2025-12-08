import type { PrintJobJSON } from '../controller/json-schema';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrinterController } from '../controller';

describe('printerController 集成测试', () => {
  let controller: PrinterController;
  let printerAvailable = false;

  beforeAll(async () => {
    try {
      controller = new PrinterController({
        encoding: 'GB18030',
        width: 48,
      });
      await controller.init();
      printerAvailable = true;
    }
    catch (_error) {
      console.warn('打印机未连接，跳过集成测试');
      printerAvailable = false;
    }
  });

  afterAll(async () => {
    if (printerAvailable && controller) {
      try {
        await controller.close();
      }
      catch (_error) {
        // 忽略关闭错误
      }
    }
  });

  describe('完整打印流程', () => {
    it('应该完成完整的打印任务流程', async () => {
      if (!printerAvailable) {
        return;
      }

      const printJob: PrintJobJSON = {
        name: '完整流程测试',
        commands: [
          { type: 'align', value: 'ct' },
          { type: 'style', value: 'b' },
          { type: 'size', width: 2, height: 2 },
          { type: 'text', content: '集成测试' },
          { type: 'size', width: 1, height: 1 },
          { type: 'style', value: 'normal' },
          { type: 'newLine' },
          { type: 'drawLine' },
          { type: 'align', value: 'lt' },
          { type: 'text', content: '这是一个完整的打印流程测试' },
          { type: 'newLine' },
          { type: 'cut' },
        ],
      };

      await controller.executeJob(printJob);
      await controller.flush();

      expect(controller.isInit).toBe(true);
    });

    it('应该支持链式操作', async () => {
      if (!printerAvailable) {
        return;
      }

      await controller.executeCommand({ type: 'align', value: 'ct' });
      await controller.executeCommand({ type: 'text', content: '链式操作测试' });
      await controller.executeCommand({ type: 'cut' });
      await controller.flush();

      expect(controller.isInit).toBe(true);
    });
  });

  describe('复杂打印任务', () => {
    it('应该执行包含表格的打印任务', async () => {
      if (!printerAvailable) {
        return;
      }

      const printJob: PrintJobJSON = {
        name: '表格打印测试',
        commands: [
          { type: 'align', value: 'ct' },
          { type: 'text', content: '表格测试' },
          { type: 'drawLine' },
          {
            type: 'tableCustom',
            data: [
              { text: '商品', align: 'left', width: 0.5 },
              { text: '价格', align: 'right', width: 0.5 },
            ],
          },
          { type: 'drawLine' },
          {
            type: 'tableCustom',
            data: [
              { text: '商品A', align: 'left', width: 0.5 },
              { text: '¥10.00', align: 'right', width: 0.5 },
            ],
          },
          { type: 'newLine' },
          { type: 'cut' },
        ],
      };

      await controller.executeJob(printJob);
      await controller.flush();

      expect(controller.isInit).toBe(true);
    });

    it('应该执行包含条形码的打印任务', async () => {
      if (!printerAvailable) {
        return;
      }

      const printJob: PrintJobJSON = {
        name: '条形码打印测试',
        commands: [
          { type: 'align', value: 'ct' },
          { type: 'text', content: '条形码测试' },
          { type: 'newLine' },
          {
            type: 'barcode',
            code: 123456789,
            barcodeType: 'CODE128',
            options: {
              width: 2,
              height: 50,
              position: 'blw',
              font: 'a',
            },
          },
          { type: 'newLine' },
          { type: 'cut' },
        ],
      };

      await controller.executeJob(printJob);
      await controller.flush();

      expect(controller.isInit).toBe(true);
    });

    it('应该执行包含二维码的打印任务', async () => {
      if (!printerAvailable) {
        return;
      }

      const printJob: PrintJobJSON = {
        name: '二维码打印测试',
        commands: [
          { type: 'align', value: 'ct' },
          { type: 'text', content: '二维码测试' },
          { type: 'newLine' },
          {
            type: 'qrcode',
            content: 'https://example.com',
            version: 3,
            level: 'M',
            size: 6,
          },
          { type: 'newLine' },
          { type: 'cut' },
        ],
      };

      await controller.executeJob(printJob);
      await controller.flush();

      expect(controller.isInit).toBe(true);
    });
  });
});
