/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { PrinterController } from '../src';

/**
 * 从 JSON 文件读取并打印示例
 * 展示如何从 JSON 文件读取打印任务并执行
 */
async function jsonFromFile() {
  try {
    const controller = new PrinterController({
      encoding: 'GB18030',
      width: 48,
    });

    await controller.init();
    console.log('打印机已初始化');

    // 从 JSON 文件读取打印任务
    const jsonFilePath = process.argv[2] || join(__dirname, 'simple-print.json');

    try {
      const jsonString = await fs.readFile(jsonFilePath, 'utf-8');
      console.log(`从文件读取: ${jsonFilePath}`);

      await controller.executeFromJSON(jsonString);
      await controller.flush();
      await controller.close();

      console.log('打印完成');
    }
    catch (fileError) {
      console.error(`读取文件失败: ${fileError}`);
      console.log('请提供 JSON 文件路径作为命令行参数');
      console.log('例如: tsx examples/json-from-file.ts examples/simple-print.json');
      await controller.close();
    }
  }
  catch (error) {
    console.error('错误:', error);
  }
}

jsonFromFile();
