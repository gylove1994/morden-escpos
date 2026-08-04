import type {
  Alignment,
  BarcodeOptions,
  BarcodeType,
  BitmapDensity,
  CustomTableItem,
  CustomTableOptions,
  FeedControlSequence,
  FontFamily,
  HardwareCommand,
  QRLevel,
  RasterMode,
  StyleString,
} from '../printer';

/**
 * 打印命令的基础接口
 */
export interface BasePrintCommand {
  type: string
}

/**
 * 文本命令 - 打印带换行的文本
 */
export interface TextCommand extends BasePrintCommand {
  type: 'text'
  content: string
  encoding?: string
}

/**
 * 纯文本命令 - 打印不带换行的文本
 */
export interface PureTextCommand extends BasePrintCommand {
  type: 'pureText'
  content: string
  encoding?: string
}

/**
 * 打印命令 - 打印原始内容
 */
export interface PrintContentCommand extends BasePrintCommand {
  type: 'print'
  content: string
}

/**
 * 换行命令
 */
export interface NewLineCommand extends BasePrintCommand {
  type: 'newLine'
}

/**
 * 对齐命令
 */
export interface AlignCommand extends BasePrintCommand {
  type: 'align'
  value: Alignment
}

/**
 * 字体样式命令
 */
export interface StyleCommand extends BasePrintCommand {
  type: 'style'
  value: StyleString | {
    bold: boolean
    italic: boolean
    underline: boolean | 0 | 1 | 2
  }
}

/**
 * 字体大小命令
 */
export interface SizeCommand extends BasePrintCommand {
  type: 'size'
  width: number
  height: number
}

/**
 * 字体家族命令
 */
export interface FontCommand extends BasePrintCommand {
  type: 'font'
  family: FontFamily
}

/**
 * 条形码命令
 */
export interface BarcodeCommand extends BasePrintCommand {
  type: 'barcode'
  code: number
  barcodeType: BarcodeType
  options: BarcodeOptions
}

/**
 * 二维码命令
 */
export interface QRCodeCommand extends BasePrintCommand {
  type: 'qrcode'
  content: string
  version?: number
  level?: QRLevel
  size?: number
}

/**
 * 二维码图片命令
 */
export interface QRImageCommand extends BasePrintCommand {
  type: 'qrimage'
  content: string
  mode?: RasterMode
  imageType?: 'png' | 'svg'
}

/**
 * 图片命令
 */
export interface ImageCommand extends BasePrintCommand {
  type: 'image'
  path: string
  density?: BitmapDensity
}

/**
 * 光栅图片命令
 */
export interface RasterCommand extends BasePrintCommand {
  type: 'raster'
  path: string
  mode?: RasterMode
}

/**
 * 切纸命令
 */
export interface CutCommand extends BasePrintCommand {
  type: 'cut'
  partial?: boolean
  feed?: number
}

/**
 * 进纸命令
 */
export interface FeedCommand extends BasePrintCommand {
  type: 'feed'
  lines?: number
}

/**
 * 控制序列命令
 */
export interface ControlCommand extends BasePrintCommand {
  type: 'control'
  value: FeedControlSequence
}

/**
 * 硬件命令
 */
export interface HardwareControlCommand extends BasePrintCommand {
  type: 'hardware'
  value: HardwareCommand
}

/**
 * 左边距命令
 */
export interface MarginLeftCommand extends BasePrintCommand {
  type: 'marginLeft'
  size: number
}

/**
 * 右边距命令
 */
export interface MarginRightCommand extends BasePrintCommand {
  type: 'marginRight'
  size: number
}

/**
 * 底边距命令
 */
export interface MarginBottomCommand extends BasePrintCommand {
  type: 'marginBottom'
  size: number
}

/**
 * 画线命令
 */
export interface DrawLineCommand extends BasePrintCommand {
  type: 'drawLine'
  character?: string
}

/**
 * 表格命令
 */
export interface TableCommand extends BasePrintCommand {
  type: 'table'
  data: (string | number)[]
  encoding?: string
}

/**
 * 自定义表格命令
 */
export interface TableCustomCommand extends BasePrintCommand {
  type: 'tableCustom'
  data: CustomTableItem[]
  each?: string
  options?: CustomTableOptions
}

/**
 * 字符间距命令
 */
export interface SpacingCommand extends BasePrintCommand {
  type: 'spacing'
  value?: number | null
}

/**
 * 行间距命令
 */
export interface LineSpaceCommand extends BasePrintCommand {
  type: 'lineSpace'
  value?: number | null
}

/**
 * 钱箱命令
 */
export interface CashDrawCommand extends BasePrintCommand {
  type: 'cashdraw'
  pin?: 2 | 5
}

/**
 * 蜂鸣器命令
 */
export interface BeepCommand extends BasePrintCommand {
  type: 'beep'
  times: number
  duration: number
}

/**
 * 颜色命令
 */
export interface ColorCommand extends BasePrintCommand {
  type: 'color'
  value: 0 | 1
}

/**
 * 反色命令
 */
export interface ReverseColorsCommand extends BasePrintCommand {
  type: 'reverseColors'
  reverse: boolean
}

/**
 * 原始命令
 */
export interface RawCommand extends BasePrintCommand {
  type: 'raw'
  data: string
}

/**
 * 编码设置命令
 */
export interface EncodeCommand extends BasePrintCommand {
  type: 'encode'
  encoding: string
}

/**
 * 字符代码表命令
 */
export interface CharacterCodeTableCommand extends BasePrintCommand {
  type: 'characterCodeTable'
  codeTable: number
}

/**
 * 打印机模型命令
 */
export interface ModelCommand extends BasePrintCommand {
  type: 'model'
  value: 'qsprinter' | null
}

/**
 * STAR打印机全切命令
 */
export interface StarFullCutCommand extends BasePrintCommand {
  type: 'starFullCut'
}

/**
 * STAR打印机强调打印命令
 */
export interface EmphasizeCommand extends BasePrintCommand {
  type: 'emphasize'
}

/**
 * STAR打印机取消强调打印命令
 */
export interface CancelEmphasizeCommand extends BasePrintCommand {
  type: 'cancelEmphasize'
}

/**
 * 所有支持的打印命令类型
 */
export type PrintCommandUnion
  = | TextCommand
    | PureTextCommand
    | PrintContentCommand
    | NewLineCommand
    | AlignCommand
    | StyleCommand
    | SizeCommand
    | FontCommand
    | BarcodeCommand
    | QRCodeCommand
    | QRImageCommand
    | ImageCommand
    | RasterCommand
    | CutCommand
    | FeedCommand
    | ControlCommand
    | HardwareControlCommand
    | MarginLeftCommand
    | MarginRightCommand
    | MarginBottomCommand
    | DrawLineCommand
    | TableCommand
    | TableCustomCommand
    | SpacingCommand
    | LineSpaceCommand
    | CashDrawCommand
    | BeepCommand
    | ColorCommand
    | ReverseColorsCommand
    | RawCommand
    | EncodeCommand
    | CharacterCodeTableCommand
    | ModelCommand
    | StarFullCutCommand
    | EmphasizeCommand
    | CancelEmphasizeCommand;

export type TemplateInputType = 'array' | 'boolean' | 'integer' | 'null' | 'number' | 'object' | 'string';

/**
 * 模板输入使用的 JSON Schema 子集。
 *
 * 索引签名允许编辑器保留 title、description、format 等标准关键字；
 * 核心校验器只解释其支持的关键字。
 */
export interface TemplateInputSchema {
  type?: TemplateInputType | TemplateInputType[]
  properties?: Record<string, TemplateInputSchema>
  required?: string[]
  items?: TemplateInputSchema | TemplateInputSchema[]
  enum?: unknown[]
  additionalProperties?: boolean | TemplateInputSchema
  [keyword: string]: unknown
}

/**
 * 打印任务JSON格式
 */
export interface PrintJobJSON {
  /**
   * 打印任务名称（可选）
   */
  name?: string
  /**
   * 打印任务描述（可选）
   */
  description?: string
  /**
   * 打印机配置（可选）
   */
  config?: {
    encoding?: string
    width?: number
    model?: 'qsprinter' | null
  }
  /**
   * 模板渲染数据的输入定义（可选）
   */
  inputs?: TemplateInputSchema
  /**
   * 打印命令列表
   */
  commands: PrintCommandUnion[]
}
