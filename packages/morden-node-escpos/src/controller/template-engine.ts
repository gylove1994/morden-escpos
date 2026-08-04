import type { PrintCommandUnion, PrintJobJSON } from './json-schema';
import { TemplateInputValidationError, validateTemplateInputs } from './template-inputs';

/**
 * 模板引擎选项
 */
export interface TemplateEngineOptions {
  /**
   * 当变量不存在时的处理方式
   * - 'keep': 保留原文本（如 {{unknown}} 保持为 {{unknown}}）
   * - 'empty': 替换为空字符串
   */
  missingVariable?: 'keep' | 'empty'
}

/**
 * 模板引擎
 * 支持在 PrintJobJSON 模板中使用 {{variable}} 语法进行变量替换
 */
export class TemplateEngine {
  private options: Required<TemplateEngineOptions>;

  constructor(options: TemplateEngineOptions = {}) {
    this.options = {
      missingVariable: options.missingVariable ?? 'keep',
    };
  }

  /**
   * 渲染模板，将模板中的变量占位符替换为实际值
   * @param template - 打印任务模板
   * @param data - 数据对象
   * @returns 渲染后的打印任务
   */
  render(template: PrintJobJSON, data: Record<string, unknown>): PrintJobJSON {
    if (template.inputs) {
      const validation = validateTemplateInputs(template.inputs, data);
      if (!validation.ok) {
        throw new TemplateInputValidationError(validation.errors);
      }
    }

    const result: PrintJobJSON = {
      commands: template.commands.flatMap(command => this.renderCommands(command, data)),
    };

    if (template.name) {
      result.name = this.renderString(template.name, data);
    }

    if (template.description) {
      result.description = this.renderString(template.description, data);
    }

    if (template.config) {
      result.config = this.renderConfig(template.config, data);
    }

    return result;
  }

  /**
   * 渲染配置对象
   */
  private renderConfig(
    config: NonNullable<PrintJobJSON['config']>,
    data: Record<string, unknown>,
  ): NonNullable<PrintJobJSON['config']> {
    const result: NonNullable<PrintJobJSON['config']> = {
      ...config,
    };

    if (config.encoding) {
      result.encoding = this.renderString(config.encoding, data);
    }

    return result;
  }

  /**
   * 渲染一个命令，并在需要时将其展开为多个命令
   */
  private renderCommands(
    command: PrintCommandUnion,
    data: Record<string, unknown>,
  ): PrintCommandUnion[] {
    if (command.type !== 'tableCustom' || !command.each) {
      return [this.renderCommand(command, data)];
    }

    const rows = this.getValue(command.each, data);
    if (!Array.isArray(rows)) {
      return [this.renderCommand(command, data)];
    }

    const { each: _each, ...rowTemplate } = command;
    return rows.map((row) => {
      const scope = typeof row === 'object' && row !== null && !Array.isArray(row)
        ? { ...data, ...row as Record<string, unknown> }
        : data;
      return this.renderCommand(rowTemplate, scope);
    });
  }

  /**
   * 渲染单个命令
   */
  private renderCommand(
    command: PrintCommandUnion,
    data: Record<string, unknown>,
  ): PrintCommandUnion {
    switch (command.type) {
      case 'text':
        return {
          ...command,
          content: this.renderString(command.content, data),
        };
      case 'pureText':
        return {
          ...command,
          content: this.renderString(command.content, data),
        };
      case 'print':
        return {
          ...command,
          content: this.renderString(command.content, data),
        };
      case 'qrcode':
        return {
          ...command,
          content: this.renderString(command.content, data),
        };
      case 'qrimage':
        return {
          ...command,
          content: this.renderString(command.content, data),
        };
      case 'image':
      case 'raster':
        return {
          ...command,
          path: this.renderString(command.path, data),
        };
      case 'table':
        return {
          ...command,
          data: command.data.map(item =>
            typeof item === 'string' ? this.renderString(item, data) : item,
          ),
        };
      case 'tableCustom':
        return {
          ...command,
          data: command.data.map(item => ({
            ...item,
            text: this.renderString(item.text, data),
          })),
        };
      case 'raw':
        return {
          ...command,
          data: this.renderString(command.data, data),
        };
      case 'encode':
        return {
          ...command,
          encoding: this.renderString(command.encoding, data),
        };
      default:
        // 其他命令类型不需要渲染
        return command;
    }
  }

  /**
   * 渲染字符串中的变量占位符
   * @param template - 模板字符串
   * @param data - 数据对象
   * @returns 渲染后的字符串
   */
  renderString(template: string, data: Record<string, unknown>): string {
    // 匹配 {{variable}} 或 {{variable.path}} 格式
    const regex = /\{\{([^}]+)\}\}/g;

    return template.replace(regex, (match, path) => {
      const value = this.getValue(path.trim(), data);

      if (value === undefined || value === null) {
        return this.options.missingVariable === 'empty' ? '' : match;
      }

      return String(value);
    });
  }

  /**
   * 从数据对象中获取嵌套属性值
   * 支持路径如: "name", "order.id", "items.0.name"
   * @param path - 属性路径
   * @param data - 数据对象
   * @returns 属性值
   */
  getValue(path: string, data: Record<string, unknown>): unknown {
    const parts = path.split('.').filter(Boolean);

    if (parts.length === 0) {
      return undefined;
    }

    let current: unknown = data;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }

      if (typeof current !== 'object') {
        return undefined;
      }

      // 检查是否是数组索引
      const index = Number.parseInt(part, 10);
      if (!Number.isNaN(index) && Array.isArray(current)) {
        current = current[index];
      }
      else if (typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      }
      else {
        return undefined;
      }
    }

    return current;
  }
}
