/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { PrintJobJSON } from '../src';
import { PrinterController } from '../src';

/**
 * JSON 格式基础使用示例
 * 展示如何使用 JSON 格式配置打印任务
 */
async function jsonBasic() {
  try {
    const controller = new PrinterController({
      encoding: 'GB18030',
      width: 48,
    });

    await controller.init();
    console.log('打印机已初始化');

    // 使用 JSON 对象定义打印任务
    const printJob: PrintJobJSON = {
      name: '简单打印',
      commands: [
        { type: 'align', value: 'ct' },
        { type: 'style', value: 'b' },
        { type: 'size', width: 2, height: 2 },
        { type: 'text', content: 'Hello World!' },
        { type: 'size', width: 1, height: 1 },
        { type: 'style', value: 'normal' },
        { type: 'feed', lines: 2 },
        { type: 'cut' },
      ],
    };

    await controller.executeJob(printJob);
    await controller.flush();
    await controller.close();

    console.log('打印完成');
  }
  catch (error) {
    console.error('错误:', error);
  }
}

jsonBasic();
