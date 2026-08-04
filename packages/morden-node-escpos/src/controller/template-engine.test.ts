import type { PrintJobJSON } from './json-schema';
import { describe, expect, it } from 'vitest';
import { TemplateEngine } from './template-engine';

describe('templateEngine', () => {
  let engine: TemplateEngine;

  beforeAll(() => {
    engine = new TemplateEngine();
  });

  describe('字符串渲染', () => {
    it('应该替换简单变量', () => {
      const template = 'Hello {{name}}!';
      const data = { name: 'World' };
      const result = engine.renderString(template, data);
      expect(result).toBe('Hello World!');
    });

    it('应该替换多个变量', () => {
      const template = '{{greeting}} {{name}}, welcome to {{place}}!';
      const data = {
        greeting: 'Hello',
        name: 'Alice',
        place: 'Wonderland',
      };
      const result = engine.renderString(template, data);
      expect(result).toBe('Hello Alice, welcome to Wonderland!');
    });

    it('应该处理嵌套路径', () => {
      const template = 'User: {{user.name}}, Email: {{user.email}}';
      const data = {
        user: {
          name: 'John',
          email: 'john@example.com',
        },
      };
      const result = engine.renderString(template, data);
      expect(result).toBe('User: John, Email: john@example.com');
    });

    it('应该处理数组索引', () => {
      const template = 'First: {{items.0}}, Second: {{items.1}}';
      const data = {
        items: ['apple', 'banana', 'orange'],
      };
      const result = engine.renderString(template, data);
      expect(result).toBe('First: apple, Second: banana');
    });

    it('应该处理深层嵌套', () => {
      const template = '{{order.customer.name}} - {{order.items.0.name}}';
      const data = {
        order: {
          customer: {
            name: 'Alice',
          },
          items: [
            { name: 'Product A' },
          ],
        },
      };
      const result = engine.renderString(template, data);
      expect(result).toBe('Alice - Product A');
    });

    it('应该处理缺失变量（默认保留）', () => {
      const template = 'Hello {{name}}, {{missing}}';
      const data = { name: 'World' };
      const result = engine.renderString(template, data);
      expect(result).toBe('Hello World, {{missing}}');
    });

    it('应该处理缺失变量（替换为空）', () => {
      const engineEmpty = new TemplateEngine({ missingVariable: 'empty' });
      const template = 'Hello {{name}}, {{missing}}';
      const data = { name: 'World' };
      const result = engineEmpty.renderString(template, data);
      expect(result).toBe('Hello World, ');
    });

    it('应该处理 null 和 undefined', () => {
      const template = 'Value: {{value}}, Null: {{nullValue}}';
      const data = {
        value: 'test',
        nullValue: null,
      };
      const result = engine.renderString(template, data);
      expect(result).toBe('Value: test, Null: {{nullValue}}');
    });
  });

  describe('命令渲染', () => {
    it('应该渲染文本命令', () => {
      const template: PrintJobJSON = {
        commands: [
          { type: 'text', content: 'Hello {{name}}!' },
        ],
      };
      const data = { name: 'World' };
      const result = engine.render(template, data);
      expect(result.commands[0]?.type).toBe('text');
      if (result.commands[0]?.type === 'text') {
        expect(result.commands[0].content).toBe('Hello World!');
      }
    });

    it('应该渲染表格命令', () => {
      const template: PrintJobJSON = {
        commands: [
          {
            type: 'tableCustom',
            data: [
              { text: '{{item.name}}', align: 'left', width: 0.5 },
              { text: '{{item.price}}', align: 'right', width: 0.5 },
            ],
          },
        ],
      };
      const data = {
        item: {
          name: 'Apple',
          price: '5.00',
        },
      };
      const result = engine.render(template, data);
      expect(result.commands[0]?.type).toBe('tableCustom');
      if (result.commands[0]?.type === 'tableCustom') {
        expect(result.commands[0].data[0]?.text).toBe('Apple');
        expect(result.commands[0].data[1]?.text).toBe('5.00');
      }
    });

    it('应该渲染二维码命令', () => {
      const template: PrintJobJSON = {
        commands: [
          { type: 'qrcode', content: '{{url}}', version: 3, level: 'M', size: 6 },
        ],
      };
      const data = { url: 'https://example.com' };
      const result = engine.render(template, data);
      expect(result.commands[0]?.type).toBe('qrcode');
      if (result.commands[0]?.type === 'qrcode') {
        expect(result.commands[0].content).toBe('https://example.com');
      }
    });

    it('应该保留不需要渲染的命令', () => {
      const template: PrintJobJSON = {
        commands: [
          { type: 'align', value: 'ct' },
          { type: 'cut' },
        ],
      };
      const data = {};
      const result = engine.render(template, data);
      expect(result.commands.length).toBe(2);
      expect(result.commands[0]?.type).toBe('align');
      expect(result.commands[1]?.type).toBe('cut');
    });
  });

  describe('配置渲染', () => {
    it('应该渲染配置中的变量', () => {
      const template: PrintJobJSON = {
        name: '{{jobName}}',
        config: {
          encoding: '{{encoding}}',
          width: 48,
        },
        commands: [],
      };
      const data = {
        jobName: 'Test Job',
        encoding: 'GB18030',
      };
      const result = engine.render(template, data);
      expect(result.name).toBe('Test Job');
      expect(result.config?.encoding).toBe('GB18030');
      expect(result.config?.width).toBe(48);
    });
  });

  describe('完整任务渲染', () => {
    it('应该渲染完整的打印任务', () => {
      const template: PrintJobJSON = {
        name: '{{orderType}}打印',
        description: '订单号: {{orderNumber}}',
        config: {
          encoding: '{{encoding}}',
          width: 48,
        },
        commands: [
          { type: 'align', value: 'ct' },
          { type: 'text', content: '{{title}}' },
          { type: 'text', content: '订单号: {{orderNumber}}' },
          {
            type: 'tableCustom',
            data: [
              { text: '{{item.name}}', align: 'left', width: 0.5 },
              { text: '{{item.price}}', align: 'right', width: 0.5 },
            ],
          },
          { type: 'cut' },
        ],
      };
      const data = {
        orderType: '订单',
        orderNumber: 'ORD-001',
        encoding: 'GB18030',
        title: '购物小票',
        item: {
          name: '商品A',
          price: '10.00',
        },
      };
      const result = engine.render(template, data);

      expect(result.name).toBe('订单打印');
      expect(result.description).toBe('订单号: ORD-001');
      expect(result.config?.encoding).toBe('GB18030');
      expect(result.commands.length).toBe(5);
    });
  });
});
