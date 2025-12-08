import type { PrintJobJSON } from '../controller/json-schema';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrinterController } from '../controller';

describe('模板打印集成测试', () => {
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

  describe('模板打印任务', () => {
    it('应该使用模板执行打印任务', async () => {
      if (!printerAvailable) {
        return;
      }

      const template: PrintJobJSON = {
        name: '{{orderType}}打印',
        commands: [
          { type: 'align', value: 'ct' },
          { type: 'text', content: '{{title}}' },
          { type: 'text', content: '订单号: {{orderNumber}}' },
          { type: 'cut' },
        ],
      };

      const data = {
        orderType: '订单',
        title: '测试标题',
        orderNumber: 'ORD-001',
      };

      await controller.executeFromTemplate(template, data);
      await controller.flush();

      expect(controller.isInit).toBe(true);
    });

    it('应该从 JSON 模板字符串执行打印任务', async () => {
      if (!printerAvailable) {
        return;
      }

      const templateJson = JSON.stringify({
        commands: [
          { type: 'align', value: 'ct' },
          { type: 'text', content: '{{title}}' },
          { type: 'text', content: '订单号: {{orderNumber}}' },
          { type: 'cut' },
        ],
      });

      const data = {
        title: 'JSON 模板测试',
        orderNumber: 'ORD-002',
      };

      await controller.executeFromTemplateJSON(templateJson, data);
      await controller.flush();

      expect(controller.isInit).toBe(true);
    });

    it('应该使用模板执行收据打印任务', async () => {
      if (!printerAvailable) {
        return;
      }

      const template: PrintJobJSON = {
        name: '收据打印',
        commands: [
          { type: 'align', value: 'ct' },
          { type: 'style', value: 'b' },
          { type: 'text', content: '{{title}}' },
          { type: 'style', value: 'normal' },
          { type: 'newLine' },
          { type: 'drawLine' },
          { type: 'align', value: 'lt' },
          { type: 'text', content: '订单号: {{orderNumber}}' },
          { type: 'text', content: '日期: {{date}}' },
          { type: 'drawLine' },
          {
            type: 'tableCustom',
            data: [
              { text: '商品', align: 'left', width: 0.5 },
              { text: '价格', align: 'right', width: 0.5 },
            ],
          },
          { type: 'drawLine', character: '-' },
          {
            type: 'tableCustom',
            data: [
              { text: '{{item.name}}', align: 'left', width: 0.5 },
              { text: '¥{{item.price}}', align: 'right', width: 0.5 },
            ],
          },
          { type: 'drawLine' },
          { type: 'align', value: 'rt' },
          { type: 'text', content: '合计: ¥{{total}}' },
          { type: 'newLine' },
          { type: 'cut' },
        ],
      };

      const data = {
        title: '*** 购物小票 ***',
        orderNumber: 'ORD-003',
        date: '2024-01-15',
        item: {
          name: '商品A',
          price: '10.00',
        },
        total: '10.00',
      };

      await controller.executeFromTemplate(template, data);
      await controller.flush();

      expect(controller.isInit).toBe(true);
    });

    it('应该处理嵌套数据的模板', async () => {
      if (!printerAvailable) {
        return;
      }

      const template: PrintJobJSON = {
        commands: [
          { type: 'text', content: '客户: {{customer.name}}' },
          { type: 'text', content: '电话: {{customer.phone}}' },
          { type: 'text', content: '商品: {{items.0.name}}' },
          { type: 'cut' },
        ],
      };

      const data = {
        customer: {
          name: '张三',
          phone: '13800138000',
        },
        items: [
          { name: '商品A' },
        ],
      };

      await controller.executeFromTemplate(template, data);
      await controller.flush();

      expect(controller.isInit).toBe(true);
    });
  });
});
