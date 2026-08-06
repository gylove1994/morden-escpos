/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { PrinterController } from '../src';

/**
 * 使用模板生成收据示例
 * 展示如何从 JSON 模板文件读取并使用数据填充
 */
async function templateReceipt() {
  try {
    const controller = new PrinterController({
      encoding: 'GB18030',
      width: 48,
    });

    await controller.init();
    console.log('打印机已初始化');

    // 从模板文件读取
    const templatePath = process.argv[2] || join(__dirname, 'receipt-template.json');

    try {
      const templateJson = await fs.readFile(templatePath, 'utf-8');
      console.log(`从文件读取模板: ${templatePath}`);

      // 准备数据
      const data = {
        orderNumber: 'ORD-20240115-001',
        date: new Date().toLocaleString('zh-CN'),
        cashier: '001',
        items: [
          { name: '可口可乐', price: 3.00, quantity: 2, subtotal: 6.00 },
          { name: '薯片', price: 5.50, quantity: 1, subtotal: 5.50 },
          { name: '矿泉水', price: 2.00, quantity: 3, subtotal: 6.00 },
        ],
        total: 17.50,
      };

      // 使用模板引擎渲染并执行
      await controller.executeFromTemplateJSON(templateJson, data);
      await controller.flush();
      await controller.close();

      console.log('模板收据打印完成');
    }
    catch (fileError) {
      console.error(`读取模板文件失败: ${fileError}`);
      console.log('请提供模板 JSON 文件路径作为命令行参数');
      console.log('例如: tsx examples/template-receipt.ts examples/receipt-template.json');
      await controller.close();
    }
  }
  catch (error) {
    console.error('错误:', error);
  }
}

templateReceipt();
