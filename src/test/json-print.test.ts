import type { PrintJobJSON } from '../controller/json-schema';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrinterController } from '../controller';

describe('jSON 格式打印集成测试', () => {
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

  describe('jSON 格式打印任务', () => {
    it('应该执行简单的 JSON 打印任务', async () => {
      if (!printerAvailable) {
        return;
      }

      const printJob: PrintJobJSON = {
        name: '简单 JSON 打印',
        commands: [
          { type: 'align', value: 'ct' },
          { type: 'text', content: 'Hello World!' },
          { type: 'cut' },
        ],
      };

      await controller.executeJob(printJob);
      await controller.flush();

      expect(controller.isInit).toBe(true);
    });

    it('应该执行包含配置的 JSON 打印任务', async () => {
      if (!printerAvailable) {
        return;
      }

      const printJob: PrintJobJSON = {
        name: '带配置的 JSON 打印',
        config: {
          encoding: 'GB18030',
          width: 48,
        },
        commands: [
          { type: 'align', value: 'ct' },
          { type: 'text', content: '配置测试' },
          { type: 'cut' },
        ],
      };

      await controller.executeJob(printJob);
      await controller.flush();

      expect(controller.isInit).toBe(true);
    });

    it('应该从 JSON 字符串执行打印任务', async () => {
      if (!printerAvailable) {
        return;
      }

      const jsonString = JSON.stringify({
        name: 'JSON 字符串打印',
        commands: [
          { type: 'align', value: 'ct' },
          { type: 'text', content: '从 JSON 字符串打印' },
          { type: 'cut' },
        ],
      });

      await controller.executeFromJSON(jsonString);
      await controller.flush();

      expect(controller.isInit).toBe(true);
    });

    it('应该执行完整的收据 JSON 打印任务', async () => {
      if (!printerAvailable) {
        return;
      }

      const printJob: PrintJobJSON = {
        name: '收据打印',
        commands: [
          { type: 'align', value: 'ct' },
          { type: 'style', value: 'b' },
          { type: 'size', width: 2, height: 2 },
          { type: 'text', content: '*** 购物小票 ***' },
          { type: 'size', width: 1, height: 1 },
          { type: 'style', value: 'normal' },
          { type: 'newLine' },
          { type: 'drawLine' },
          { type: 'align', value: 'lt' },
          { type: 'text', content: '订单号: ORD-001' },
          { type: 'text', content: '日期: 2024-01-15' },
          { type: 'drawLine' },
          {
            type: 'tableCustom',
            data: [
              { text: '商品', align: 'left', width: 0.4 },
              { text: '单价', align: 'right', width: 0.2 },
              { text: '数量', align: 'right', width: 0.15 },
              { text: '小计', align: 'right', width: 0.25 },
            ],
          },
          { type: 'drawLine', character: '-' },
          {
            type: 'tableCustom',
            data: [
              { text: '商品A', align: 'left', width: 0.4 },
              { text: '¥10.00', align: 'right', width: 0.2 },
              { text: '2', align: 'right', width: 0.15 },
              { text: '¥20.00', align: 'right', width: 0.25 },
            ],
          },
          { type: 'drawLine' },
          { type: 'align', value: 'rt' },
          { type: 'size', width: 2, height: 2 },
          { type: 'text', content: '合计: ¥20.00' },
          { type: 'size', width: 1, height: 1 },
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
