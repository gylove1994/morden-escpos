import type { PrintCommandUnion, PrintJobJSON } from './json-schema';
import { Printer } from '../printer';
import USBAdapter from '../usb';
import { JSONPrintExecutor } from './json-executor';
import { TemplateEngine } from './template-engine';

export interface PrinterControllerOptions {
  encoding: string
  width: number
}

export class PrinterController {
  private printer: Printer<[]>;
  private usbAdapter: USBAdapter;
  private _init = false;
  private executor: JSONPrintExecutor;

  get isInit() {
    return this._init;
  }

  constructor(options: PrinterControllerOptions) {
    this.usbAdapter = new USBAdapter();
    this.printer = new Printer(this.usbAdapter, { encoding: options.encoding, width: options.width });
    this.executor = new JSONPrintExecutor(this.printer);
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.usbAdapter.open((e) => {
        if (e) {
          reject(e);
        }
        this._init = true;
        resolve(this);
      });
    });
  }

  async close() {
    this.usbAdapter.close();
    this._init = false;
    return this;
  }

  /**
   * 执行单个打印命令
   * @param command - 打印命令对象
   */
  async executeCommand(command: PrintCommandUnion): Promise<void> {
    await this.executor.executeCommand(command);
  }

  /**
   * 执行完整的打印任务
   * @param job - 打印任务JSON对象
   */
  async executeJob(job: PrintJobJSON): Promise<void> {
    await this.executor.executeJob(job);
  }

  /**
   * 从JSON字符串执行打印任务
   * @param jsonString - JSON格式的打印任务字符串
   */
  async executeFromJSON(jsonString: string): Promise<void> {
    const job = JSON.parse(jsonString) as PrintJobJSON;
    await this.executeJob(job);
  }

  /**
   * 从模板和数据对象执行打印任务
   * @param template - 打印任务模板（支持 {{variable}} 语法）
   * @param data - 数据对象，用于替换模板中的变量
   */
  async executeFromTemplate(
    template: PrintJobJSON,
    data: Record<string, unknown>,
  ): Promise<void> {
    const engine = new TemplateEngine();
    const job = engine.render(template, data);
    await this.executeJob(job);
  }

  /**
   * 从JSON字符串模板和数据对象执行打印任务
   * @param templateJson - JSON格式的打印任务模板字符串（支持 {{variable}} 语法）
   * @param data - 数据对象，用于替换模板中的变量
   */
  async executeFromTemplateJSON(
    templateJson: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const template = JSON.parse(templateJson) as PrintJobJSON;
    await this.executeFromTemplate(template, data);
  }

  /**
   * 刷新打印缓冲区，发送数据到打印机
   */
  async flush(): Promise<void> {
    await this.printer.flush();
  }

  /**
   * 获取底层的Printer实例，用于直接调用打印机API
   */
  getPrinter(): Printer<[]> {
    return this.printer;
  }
}
