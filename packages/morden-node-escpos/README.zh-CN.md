[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md)

# morden-node-escpos

面向 Node.js 和 Chromium 系浏览器的现代化、类型安全的 ESC/POS 打印机驱动。

[![npm version](https://img.shields.io/npm/v/morden-node-escpos?logo=npm)](https://www.npmjs.com/package/morden-node-escpos)
[![npm downloads](https://img.shields.io/npm/dm/morden-node-escpos)](https://www.npmjs.com/package/morden-node-escpos)
[![node](https://img.shields.io/node/v/morden-node-escpos)](https://www.npmjs.com/package/morden-node-escpos)
[![license](https://img.shields.io/npm/l/morden-node-escpos)](./LICENSE)

## 特性

- 完整的 TypeScript 类型以及 ESM/CommonJS 包导出。
- 支持文本、表格、条形码、二维码、Raster/Bitmap 图片、钱箱和硬件命令。
- 支持 Node.js USB，以及浏览器端 WebUSB、Web Serial 和 Direct Sockets 传输层。
- 通过 `iconv-lite` 支持 GB18030、GBK、Shift_JIS、UTF-8 等多字节编码。
- 可序列化的 JSON 打印任务，以及支持输入校验的模板引擎。
- 提供底层链式 `Printer` API 和上层 Node.js/浏览器控制器。

## 安装

```bash
npm install morden-node-escpos
# or
pnpm add morden-node-escpos
# or
yarn add morden-node-escpos
```

需要 Node.js 16 或更高版本。

## 快速开始：Node.js

未指定设备时，`USBAdapter` 会选择检测到的第一台 USB 打印机。

```ts
import { Printer, USBAdapter } from 'morden-node-escpos';

const adapter = new USBAdapter();
const printer = new Printer(adapter, {
  encoding: 'GB18030',
  width: 48,
});

adapter.open((error) => {
  if (error) {
    console.error('Failed to open printer:', error);
    return;
  }

  printer
    .align('ct')
    .style('b')
    .size(2, 2)
    .text('Hello!')
    .size(1, 1)
    .style('normal')
    .qrcode('https://example.com', 3, 'M', 6)
    .cut()
    .close();
});
```

可使用 `USBAdapter.findPrinter()` 枚举打印机，也可传入 USB 设备或厂商/产品 ID
来明确选择设备。

## 快速开始：JSON 打印任务

对于需要存储、动态生成或跨系统共享的模板，推荐使用 JSON 打印任务。

```ts
import {
  PrinterController,
  type PrintJobJSON,
} from 'morden-node-escpos';

const controller = new PrinterController({
  encoding: 'GB18030',
  width: 48,
});

const job: PrintJobJSON = {
  name: 'Simple receipt',
  commands: [
    { type: 'align', value: 'ct' },
    { type: 'text', content: 'Hello, ESC/POS!' },
    { type: 'feed', lines: 2 },
    { type: 'cut' },
  ],
};

await controller.init();
await controller.executeJob(job);
await controller.flush();
await controller.close();
```

控制器还支持 `executeFromJSON`、`executeFromTemplate` 和
`executeFromTemplateJSON`。命令结构请参阅
[JSON 示例](https://github.com/gylove1994/morden-escpos/tree/main/packages/morden-node-escpos/examples)
及导出的 `PrintJobJSON` 类型。同一目录还提供小票、模板和 JIRA 卡片示例。

## 浏览器用法

浏览器应用**必须**从专用入口导入，以免将 Node.js 的 `usb` 依赖打入前端包。

```ts
import {
  BrowserPrinterController,
  loadBrowserImage,
  WebUSBAdapter,
} from 'morden-node-escpos/browser';

const device = await WebUSBAdapter.requestDevice();
const controller = new BrowserPrinterController({
  adapter: new WebUSBAdapter(device),
  encoding: 'GB18030',
  width: 32,
  imageLoader: loadBrowserImage,
});

await controller.init();
await controller.executeJob({
  commands: [
    { type: 'text', content: 'Printed from the browser' },
    { type: 'cut' },
  ],
});
await controller.flush();
await controller.close();
```

| 传输方式 | 运行环境 | 重要限制 |
| --- | --- | --- |
| WebUSB | Chrome 或 Edge | HTTPS/localhost；选择设备需要用户手势 |
| Web Serial | Chrome 或 Edge | HTTPS/localhost；用户需要选择串口和波特率 |
| Direct Sockets | Chrome Isolated Web App | `TcpSocketAdapter` 可连接 RAW TCP 9100 端口 |

普通浏览器标签页无法打开 RAW TCP Socket。浏览器图片命令仅接受允许跨域访问的
`http(s)` URL。

## API 概览

### `Printer`

底层链式 API，常用方法分组如下：

- 内容：`text`、`pureText`、`println`、`table`、`tableCustom`、`barcode`、`qrcode`。
- 图片：`image`、`raster`、`qrimage`。
- 格式：`align`、`font`、`style`、`size`、`spacing`、`lineSpace`。
- 硬件：`cut`、`cashdraw`、`beep`、`hardware`、`model`。
- 传输生命周期：`flush`、`close`。

### `PrinterController`

Node.js USB 控制器可执行类型化 JSON 命令、完整任务及渲染后的模板。其 `device`
选项可通过厂商 ID、产品 ID、总线号和设备地址锁定打印机。

### `BrowserPrinterController`

浏览器控制器接受任意浏览器 `Adapter`，支持可选图片加载器，并执行相同的 JSON
任务和模板。

### 浏览器适配器

`morden-node-escpos/browser` 入口导出 `WebUSBAdapter`、
`WebSerialAdapter` 和 `TcpSocketAdapter`。

## 编码与打印机兼容性

编码转换由 [`iconv-lite`](https://github.com/ashtuchkin/iconv-lite) 提供。常用选项：

- 中文：`GB18030`、`GBK`、`GB2312`
- 日文：`Shift_JIS`、`EUC-JP`
- 韩文：`EUC-KR`
- Unicode：`UTF-8`、`UTF-16`

本驱动面向标准 ESC/POS 打印机，包括许多 Epson TM、Star TSP、佳博和芯烨型号。
打印机固件存在差异，请在目标硬件上验证高级命令。兼容设备可使用 `qsprinter`
型号配置；默认配置使用通用 ESC/POS。

## Linux USB 权限

如果能发现打印机但无法打开，请使用设备实际的厂商和产品 ID 添加 udev 规则：

```udev
SUBSYSTEM=="usb", ATTR{idVendor}=="04b8", ATTR{idProduct}=="0e15", MODE="0666"
```

然后重新加载规则：

```bash
sudo udevadm control --reload-rules
sudo udevadm trigger
```

对于共享或生产环境，建议使用专用用户组和更严格的 udev 权限，而不是允许所有用户写入设备。

## 故障排除

- **文字乱码：** 选择打印机当前代码页支持的编码；中文通常使用 `GB18030` 或 `GBK`。
- **找不到打印机：** 检查连接线和权限，然后查看 `USBAdapter.findPrinter()` 的结果。
- **图片效果较差：** 尝试其他 Bitmap 密度（`s8`、`d8`、`s24` 或 `d24`），并确保源图片适配纸张宽度。

## 许可证

[MIT](./LICENSE) © morden-escpos-contributors。

## 相关链接

- [Monorepo](https://github.com/gylove1994/morden-escpos)
- [Receipt Studio](https://gylove1994.github.io/morden-escpos/)
- [Epson ESC/POS 命令参考](https://reference.epson-biz.com/modules/ref_escpos/index.php)
- [node-usb 文档](https://github.com/node-usb/node-usb)
