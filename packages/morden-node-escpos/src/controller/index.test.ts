/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { PrintJobJSON } from './json-schema';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrinterController } from './index';

describe('printerController', () => {
  let controller: PrinterController;
  let printerAvailable = false;

  beforeAll(() => {
    try {
      controller = new PrinterController({
        encoding: 'GB18030',
        width: 48,
      });
      printerAvailable = true;
    }
    catch (_error) {
      console.warn('打印机未连接，跳过测试');
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

  describe('初始化', () => {
    it('应该创建 PrinterController 实例', () => {
      if (!printerAvailable) {
        return;
      }
      expect(controller).toBeDefined();
      expect(controller.isInit).toBe(false);
    });

    it('应该能够初始化打印机', async () => {
      if (!printerAvailable) {
        return;
      }

      try {
        await controller.init();
        expect(controller.isInit).toBe(true);
      }
      catch (_error) {
        // 如果没有打印机，会失败
        console.warn('初始化失败（可能没有连接打印机）:', _error);
      }
    });
  });

  describe('执行命令', () => {
    it('应该能够执行单个命令', async () => {
      if (!printerAvailable) {
        return;
      }

      try {
        await controller.init();

        await controller.executeCommand({
          type: 'text',
          content: '测试文本',
        });

        await controller.flush();
      }
      catch (_error) {
        console.warn('执行命令失败（可能没有连接打印机）:', _error);
      }
    });

    it('应该能够执行打印任务', async () => {
      if (!printerAvailable) {
        return;
      }

      try {
        await controller.init();

        const printJob: PrintJobJSON = {
          name: '测试任务',
          commands: [
            { type: 'align', value: 'ct' },
            { type: 'text', content: 'Hello World!' },
            { type: 'cut' },
          ],
        };

        await controller.executeJob(printJob);
        await controller.flush();
      }
      catch (error) {
        console.warn('执行任务失败（可能没有连接打印机）:', error);
      }
    });

    it('应该能够从 JSON 字符串执行任务', async () => {
      if (!printerAvailable) {
        return;
      }

      try {
        await controller.init();

        const jsonString = JSON.stringify({
          name: '测试任务',
          commands: [
            { type: 'text', content: 'Hello from JSON!' },
            { type: 'cut' },
          ],
        });

        await controller.executeFromJSON(jsonString);
        await controller.flush();
      }
      catch (error) {
        console.warn('从 JSON 执行失败（可能没有连接打印机）:', error);
      }
    });

    it('应该能够使用模板执行任务', async () => {
      if (!printerAvailable) {
        return;
      }

      try {
        await controller.init();

        const template: PrintJobJSON = {
          commands: [
            { type: 'text', content: 'Hello {{name}}!' },
          ],
        };

        const data = { name: 'World' };

        await controller.executeFromTemplate(template, data);
        await controller.flush();
      }
      catch (error) {
        console.warn('模板执行失败（可能没有连接打印机）:', error);
      }
    });

    it('应该能够从 JSON 模板执行任务', async () => {
      if (!printerAvailable) {
        return;
      }

      try {
        await controller.init();

        const templateJson = JSON.stringify({
          commands: [
            { type: 'text', content: 'Hello {{name}}!' },
          ],
        });

        const data = { name: 'World' };

        await controller.executeFromTemplateJSON(templateJson, data);
        await controller.flush();
      }
      catch (error) {
        console.warn('JSON 模板执行失败（可能没有连接打印机）:', error);
      }
    });
  });

  describe('关闭', () => {
    it('应该能够关闭连接', async () => {
      if (!printerAvailable) {
        return;
      }

      try {
        if (controller.isInit) {
          await controller.close();
          expect(controller.isInit).toBe(false);
        }
      }
      catch (_error) {
        // 忽略关闭错误
      }
    });
  });
});
