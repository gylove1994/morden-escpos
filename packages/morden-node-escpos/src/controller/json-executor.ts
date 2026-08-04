import type { NdArray } from 'ndarray';
import type { Printer } from '../printer';
import type {
  AlignCommand,
  BarcodeCommand,
  BeepCommand,
  CancelEmphasizeCommand,
  CashDrawCommand,
  CharacterCodeTableCommand,
  ColorCommand,
  ControlCommand,
  CutCommand,
  DrawLineCommand,
  EmphasizeCommand,
  EncodeCommand,
  FeedCommand,
  FontCommand,
  HardwareControlCommand,
  ImageCommand,
  LineSpaceCommand,
  MarginBottomCommand,
  MarginLeftCommand,
  MarginRightCommand,
  ModelCommand,
  NewLineCommand,
  PrintCommandUnion,
  PrintContentCommand,
  PrintJobJSON,
  PureTextCommand,
  QRCodeCommand,
  QRImageCommand,
  RasterCommand,
  RawCommand,
  ReverseColorsCommand,
  SizeCommand,
  SpacingCommand,
  StarFullCutCommand,
  StyleCommand,
  TableCommand,
  TableCustomCommand,
  TextCommand,
} from './json-schema';
import { promises as fs } from 'node:fs';
import getPixels from 'get-pixels';
import Image from '../printer/image';

/**
 * JSON打印命令执行器
 * 将JSON格式的打印命令转换为实际的打印机API调用
 */
export class JSONPrintExecutor {
  private printer: Printer<[]>;

  constructor(printer: Printer<[]>) {
    this.printer = printer;
  }

  /**
   * 执行单个打印命令
   */
  async executeCommand(command: PrintCommandUnion): Promise<void> {
    switch (command.type) {
      case 'text':
        this.executeTextCommand(command);
        break;
      case 'pureText':
        this.executePureTextCommand(command);
        break;
      case 'print':
        this.executePrintCommand(command);
        break;
      case 'newLine':
        this.executeNewLineCommand(command);
        break;
      case 'align':
        this.executeAlignCommand(command);
        break;
      case 'style':
        this.executeStyleCommand(command);
        break;
      case 'size':
        this.executeSizeCommand(command);
        break;
      case 'font':
        this.executeFontCommand(command);
        break;
      case 'barcode':
        this.executeBarcodeCommand(command);
        break;
      case 'qrcode':
        this.executeQRCodeCommand(command);
        break;
      case 'qrimage':
        await this.executeQRImageCommand(command);
        break;
      case 'image':
        await this.executeImageCommand(command);
        break;
      case 'raster':
        await this.executeRasterCommand(command);
        break;
      case 'cut':
        this.executeCutCommand(command);
        break;
      case 'feed':
        this.executeFeedCommand(command);
        break;
      case 'control':
        this.executeControlCommand(command);
        break;
      case 'hardware':
        this.executeHardwareCommand(command);
        break;
      case 'marginLeft':
        this.executeMarginLeftCommand(command);
        break;
      case 'marginRight':
        this.executeMarginRightCommand(command);
        break;
      case 'marginBottom':
        this.executeMarginBottomCommand(command);
        break;
      case 'drawLine':
        this.executeDrawLineCommand(command);
        break;
      case 'table':
        this.executeTableCommand(command);
        break;
      case 'tableCustom':
        this.executeTableCustomCommand(command);
        break;
      case 'spacing':
        this.executeSpacingCommand(command);
        break;
      case 'lineSpace':
        this.executeLineSpaceCommand(command);
        break;
      case 'cashdraw':
        this.executeCashDrawCommand(command);
        break;
      case 'beep':
        this.executeBeepCommand(command);
        break;
      case 'color':
        this.executeColorCommand(command);
        break;
      case 'reverseColors':
        this.executeReverseColorsCommand(command);
        break;
      case 'raw':
        this.executeRawCommand(command);
        break;
      case 'encode':
        this.executeEncodeCommand(command);
        break;
      case 'characterCodeTable':
        this.executeCharacterCodeTableCommand(command);
        break;
      case 'model':
        this.executeModelCommand(command);
        break;
      case 'starFullCut':
        this.executeStarFullCutCommand(command);
        break;
      case 'emphasize':
        this.executeEmphasizeCommand(command);
        break;
      case 'cancelEmphasize':
        this.executeCancelEmphasizeCommand(command);
        break;
      default: {
        // 使用 never 类型检查确保所有命令都被处理
        const _exhaustive: never = command;
        throw new Error(`Unknown command type: ${(_exhaustive as PrintCommandUnion).type}`);
      }
    }
  }

  /**
   * 执行完整的打印任务
   */
  async executeJob(job: PrintJobJSON): Promise<void> {
    // 应用配置
    if (job.config) {
      if (job.config.encoding) {
        this.printer.encode(job.config.encoding);
      }
      if (job.config.model !== undefined) {
        this.printer.model(job.config.model);
      }
    }

    // 执行所有命令
    for (const command of job.commands) {
      await this.executeCommand(command);
    }
  }

  // ========== 命令执行方法 ==========

  private executeTextCommand(command: TextCommand): void {
    this.printer.text(command.content, command.encoding);
  }

  private executePureTextCommand(command: PureTextCommand): void {
    this.printer.pureText(command.content, command.encoding);
  }

  private executePrintCommand(command: PrintContentCommand): void {
    this.printer.print(command.content);
  }

  private executeNewLineCommand(_command: NewLineCommand): void {
    this.printer.newLine();
  }

  private executeAlignCommand(command: AlignCommand): void {
    this.printer.align(command.value);
  }

  private executeStyleCommand(command: StyleCommand): void {
    if (typeof command.value === 'string') {
      this.printer.style(command.value);
    }
    else {
      this.printer.style(
        command.value.bold,
        command.value.italic,
        command.value.underline,
      );
    }
  }

  private executeSizeCommand(command: SizeCommand): void {
    this.printer.size(command.width, command.height);
  }

  private executeFontCommand(command: FontCommand): void {
    this.printer.font(command.family);
  }

  private executeBarcodeCommand(command: BarcodeCommand): void {
    this.printer.barcode(command.code, command.barcodeType, command.options);
  }

  private executeQRCodeCommand(command: QRCodeCommand): void {
    this.printer.qrcode(command.content, command.version, command.level, command.size);
  }

  private async executeQRImageCommand(command: QRImageCommand): Promise<void> {
    await this.printer.qrimage(command.content, {
      type: command.imageType ?? 'png',
      mode: command.mode ?? 'dhdw',
    });
  }

  private async loadImage(path: string): Promise<Image> {
    if (/^https?:\/\//i.test(path)) {
      return Image.load(path);
    }

    const imageBuffer = await fs.readFile(path);
    const pixels = await new Promise<NdArray<Uint8Array>>((resolve, reject) => {
      getPixels(imageBuffer, path, (err, loadedPixels) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(loadedPixels as NdArray<Uint8Array>);
        }
      });
    });

    return new Image(pixels);
  }

  private async executeImageCommand(command: ImageCommand): Promise<void> {
    const image = await this.loadImage(command.path);
    await this.printer.image(image, command.density);
  }

  private async executeRasterCommand(command: RasterCommand): Promise<void> {
    const image = await this.loadImage(command.path);
    this.printer.raster(image, command.mode);
  }

  private executeCutCommand(command: CutCommand): void {
    this.printer.cut(command.partial, command.feed);
  }

  private executeFeedCommand(command: FeedCommand): void {
    this.printer.feed(command.lines);
  }

  private executeControlCommand(command: ControlCommand): void {
    this.printer.control(command.value);
  }

  private executeHardwareCommand(command: HardwareControlCommand): void {
    this.printer.hardware(command.value);
  }

  private executeMarginLeftCommand(command: MarginLeftCommand): void {
    this.printer.marginLeft(command.size);
  }

  private executeMarginRightCommand(command: MarginRightCommand): void {
    this.printer.marginRight(command.size);
  }

  private executeMarginBottomCommand(command: MarginBottomCommand): void {
    this.printer.marginBottom(command.size);
  }

  private executeDrawLineCommand(command: DrawLineCommand): void {
    this.printer.drawLine(command.character);
  }

  private executeTableCommand(command: TableCommand): void {
    this.printer.table(command.data, command.encoding);
  }

  private executeTableCustomCommand(command: TableCustomCommand): void {
    this.printer.tableCustom(command.data, command.options);
  }

  private executeSpacingCommand(command: SpacingCommand): void {
    this.printer.spacing(command.value);
  }

  private executeLineSpaceCommand(command: LineSpaceCommand): void {
    this.printer.lineSpace(command.value);
  }

  private executeCashDrawCommand(command: CashDrawCommand): void {
    this.printer.cashdraw(command.pin);
  }

  private executeBeepCommand(command: BeepCommand): void {
    this.printer.beep(command.times, command.duration);
  }

  private executeColorCommand(command: ColorCommand): void {
    this.printer.color(command.value);
  }

  private executeReverseColorsCommand(command: ReverseColorsCommand): void {
    this.printer.setReverseColors(command.reverse);
  }

  private executeRawCommand(command: RawCommand): void {
    this.printer.raw(command.data);
  }

  private executeEncodeCommand(command: EncodeCommand): void {
    this.printer.encode(command.encoding);
  }

  private executeCharacterCodeTableCommand(command: CharacterCodeTableCommand): void {
    this.printer.setCharacterCodeTable(command.codeTable);
  }

  private executeModelCommand(command: ModelCommand): void {
    this.printer.model(command.value);
  }

  private executeStarFullCutCommand(_command: StarFullCutCommand): void {
    this.printer.starFullCut();
  }

  private executeEmphasizeCommand(_command: EmphasizeCommand): void {
    this.printer.emphasize();
  }

  private executeCancelEmphasizeCommand(_command: CancelEmphasizeCommand): void {
    this.printer.cancelEmphasize();
  }
}
