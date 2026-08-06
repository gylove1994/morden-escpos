/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { PrintJobJSON } from '../src';
import { PrinterController } from '../src';

/**
 * 模板引擎使用示例
 * 展示如何使用模板引擎进行变量替换
 */
async function templateEngine() {
  try {
    const controller = new PrinterController({
      encoding: 'GB18030',
      width: 48,
    });

    await controller.init();
    console.log('打印机已初始化');

    // 定义模板，使用 {{variable}} 语法
    const template: PrintJobJSON = {
      name: '{{orderType}}打印',
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
        { type: 'text', content: '客户: {{customer.name}}' },
        { type: 'text', content: '电话: {{customer.phone}}' },
        { type: 'drawLine' },
        {
          type: 'tableCustom',
          data: [
            { text: '商品', align: 'left', width: 0.5 },
            { text: '数量', align: 'center', width: 0.2 },
            { text: '价格', align: 'right', width: 0.3 },
          ],
        },
        { type: 'drawLine', character: '-' },
        {
          type: 'tableCustom',
          data: [
            { text: '{{items.0.name}}', align: 'left', width: 0.5 },
            { text: '{{items.0.quantity}}', align: 'center', width: 0.2 },
            { text: '¥{{items.0.price}}', align: 'right', width: 0.3 },
          ],
        },
        { type: 'drawLine' },
        { type: 'align', value: 'rt' },
        { type: 'text', content: '合计: ¥{{total}}' },
        { type: 'newLine' },
        { type: 'cut' },
      ],
    };

    // 准备数据
    const data = {
      orderType: '订单',
      title: '*** 购物小票 ***',
      orderNumber: 'ORD-20240115-001',
      date: new Date().toLocaleString('zh-CN'),
      customer: {
        name: '张三',
        phone: '13800138000',
      },
      items: [
        { name: '可口可乐', quantity: 2, price: '6.00' },
      ],
      total: '6.00',
    };

    // 使用模板引擎渲染并执行
    await controller.executeFromTemplate(template, data);
    await controller.flush();
    await controller.close();

    console.log('模板打印完成');
  }
  catch (error) {
    console.error('错误:', error);
  }
}

templateEngine();
