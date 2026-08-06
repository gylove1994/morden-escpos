/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import { Printer, USBAdapter } from '../src';

/**
 * 基础打印功能演示
 * 展示文本、对齐、样式、大小等基本功能
 */
async function basicUsage() {
  try {
    // 查找打印机
    const devices = USBAdapter.findPrinter();
    console.log('找到的打印机:', devices.length);

    if (devices.length === 0) {
      console.error('未找到打印机，请确保打印机已连接');
      return;
    }

    // 连接打印机
    const adapter = new USBAdapter();
    const printer = new Printer(adapter, {
      encoding: 'GB18030',
      width: 48,
    });

    // 打开连接
    adapter.open((error) => {
      if (error) {
        console.error('打开打印机失败:', error);
        return;
      }

      console.log('开始打印...');

      printer
        // 居中对齐
        .align('ct')
        // 设置样式：粗体+下划线
        .style('bu')
        // 设置大小：2x2
        .size(2, 2)
        .text('欢迎使用')
        // 恢复默认样式
        .style('normal')
        .size(1, 1)
        .newLine()
        // 左对齐
        .align('lt')
        .text('这是一段普通文本')
        .text('支持中文打印')
        .newLine()
        // 画分隔线
        .drawLine()
        // 右对齐
        .align('rt')
        .text('右对齐文本')
        .newLine()
        // 设置字符间距
        .spacing(2)
        .text('字符间距加大')
        .spacing(0)
        .newLine()
        // 设置行间距
        .lineSpace(2)
        .text('行间距加大')
        .lineSpace(0)
        .newLine()
        // 不同字体
        .font('a')
        .text('字体 A')
        .font('b')
        .text('字体 B')
        .font('c')
        .text('字体 C')
        .newLine()
        // 切纸
        .cut()
        .close();

      console.log('打印完成');
    });
  }
  catch (error) {
    console.error('错误:', error);
  }
}

// 运行示例
basicUsage();
