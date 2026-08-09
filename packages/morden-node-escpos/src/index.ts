/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
export type { Adapter } from './adapter';
// 导出控制器
export { PrinterController } from './controller';

export type { PrinterControllerOptions } from './controller';
export { JSONPrintExecutor } from './controller/json-executor';

// 导出JSON Schema和执行器
export type {
  AlignCommand,
  BarcodeCommand,
  BasePrintCommand,
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
  TemplateInputSchema,
  TemplateInputType,
  TextCommand,
} from './controller/json-schema';
export { TemplateEngine } from './controller/template-engine';
export type { TemplateEngineOptions } from './controller/template-engine';
export {
  extractDefinedPaths,
  getSchemaAtPath,
  isPathDefined,
  TemplateInputValidationError,
  validateTemplateInputs,
} from './controller/template-inputs';
export type { TemplateInputValidationResult } from './controller/template-inputs';
export { MemoryAdapter } from './memory-adapter';
// 导出适配器
export { default as DevicePathAdapter } from './device-path';
export { default as NetworkAdapter } from './network';
// 导出打印机核心
export { command, Image, Printer } from './printer';
export type {
  Alignment,
  BarcodeFont,
  BarcodeOptions,
  BarcodePosition,
  BarcodeType,
  BitmapDensity,
  CustomTableItem,
  CustomTableOptions,
  FeedControlSequence,
  FontFamily,
  HardwareCommand,
  PrinterModel,
  PrinterOptions,
  QrImageOptions,
  QRLevel,
  RasterMode,
  StyleString,
  TableAlignment,
} from './printer';

export {
  renderPrintJobToBytes,
  renderTemplateToBytes,
} from './render-bytes';
export type { RenderBytesOptions } from './render-bytes';
export { default as SerialAdapter } from './serial';
export type { SerialPortFactory, SerialPortLike } from './serial';
export { default as USBAdapter } from './usb';
