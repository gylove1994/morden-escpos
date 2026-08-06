/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import { Printer, USBAdapter } from '../src';

/**
 * 表格打印示例
 * 展示简单表格和自定义表格的使用
 */
async function tablePrint() {
  try {
    const devices = USBAdapter.findPrinter();
    if (devices.length === 0) {
      console.error('未找到打印机');
      return;
    }

    const adapter = new USBAdapter();
    const printer = new Printer(adapter, {
      encoding: 'GB18030',
      width: 48,
    });

    adapter.open((error) => {
      if (error) {
        console.error('打开打印机失败:', error);
        return;
      }

      printer
        .align('ct')
        .style('b')
        .text('表格打印示例')
        .style('normal')
        .newLine()
        .drawLine()
        // 简单表格
        .align('lt')
        .text('简单表格:')
        .table(['商品', '价格', '库存'])
        .drawLine('-')
        .table(['苹果', '¥5.00', '100'])
        .table(['香蕉', '¥3.50', '80'])
        .table(['橙子', '¥4.20', '120'])
        .newLine()
        .drawLine()
        // 自定义表格
        .text('自定义表格:')
        .tableCustom([
          { text: '商品名称', align: 'left', width: 0.5 },
          { text: '数量', align: 'center', width: 0.2 },
          { text: '价格', align: 'right', width: 0.3 },
        ])
        .drawLine('-')
        .tableCustom([
          { text: '可乐', align: 'left', width: 0.5 },
          { text: '2', align: 'center', width: 0.2 },
          { text: '¥6.00', align: 'right', width: 0.3 },
        ])
        .tableCustom([
          { text: '薯片', align: 'left', width: 0.5 },
          { text: '1', align: 'center', width: 0.2 },
          { text: '¥5.50', align: 'right', width: 0.3 },
        ])
        .tableCustom([
          { text: '矿泉水', align: 'left', width: 0.5 },
          { text: '3', align: 'center', width: 0.2 },
          { text: '¥6.00', align: 'right', width: 0.3 },
        ])
        .newLine()
        .drawLine()
        // 带样式的表格
        .text('带样式的表格:')
        .tableCustom([
          { text: '商品', align: 'left', width: 0.5, style: 'b' },
          { text: '数量', align: 'center', width: 0.2, style: 'b' },
          { text: '价格', align: 'right', width: 0.3, style: 'b' },
        ])
        .drawLine('-')
        .tableCustom([
          { text: '商品A', align: 'left', width: 0.5 },
          { text: '10', align: 'center', width: 0.2 },
          { text: '¥100.00', align: 'right', width: 0.3 },
        ])
        .newLine()
        .cut()
        .close();

      console.log('表格打印完成');
    });
  }
  catch (error) {
    console.error('错误:', error);
  }
}

tablePrint();
