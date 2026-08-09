[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md)

# morden-node-escpos

A modern, type-safe ESC/POS printer driver for Node.js and Chromium-based browsers.

[![npm version](https://img.shields.io/npm/v/morden-node-escpos?logo=npm)](https://www.npmjs.com/package/morden-node-escpos)
[![npm downloads](https://img.shields.io/npm/dm/morden-node-escpos)](https://www.npmjs.com/package/morden-node-escpos)
[![node](https://img.shields.io/node/v/morden-node-escpos)](https://www.npmjs.com/package/morden-node-escpos)
[![license](https://img.shields.io/npm/l/morden-node-escpos)](./LICENSE)

## Features

- Complete TypeScript types and ESM/CommonJS package exports.
- Text, tables, barcodes, QR codes, raster/bitmap images, cash drawers, and hardware commands.
- Node.js USB transport plus WebUSB, Web Serial, and Direct Sockets browser transports.
- Multi-byte encodings through `iconv-lite`, including GB18030, GBK, Shift_JIS, and UTF-8.
- Serializable JSON print jobs and a template engine with validated inputs.
- Low-level fluent `Printer` API and higher-level Node.js/browser controllers.

## Install

```bash
npm install morden-node-escpos
# or
pnpm add morden-node-escpos
# or
yarn add morden-node-escpos
```

Node.js 16 or later is required.

## Quick start: Node.js

`USBAdapter` selects the first detected USB printer when no device is supplied.

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

Use `USBAdapter.findPrinter()` to enumerate printers, or pass a USB device or
vendor/product IDs to select one explicitly.

## Quick start: JSON print jobs

JSON jobs are the recommended option for templates that must be stored,
generated dynamically, or shared across systems.

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

The controller also supports `executeFromJSON`, `executeFromTemplate`, and
`executeFromTemplateJSON`. See the
[JSON examples](https://github.com/gylove1994/morden-escpos/tree/main/packages/morden-node-escpos/examples)
and the exported `PrintJobJSON` types for the command schema. Receipt, template,
and JIRA card examples are included in the same directory.

## Browser usage

Browser applications **must** import from the dedicated browser entry point so
the Node.js `usb` dependency is not bundled into the frontend.

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

| Transport | Environment | Important constraint |
| --- | --- | --- |
| WebUSB | Chrome or Edge | HTTPS/localhost; device selection requires a user gesture |
| Web Serial | Chrome or Edge | HTTPS/localhost; the user selects a port and baud rate |
| Direct Sockets | Chrome Isolated Web App | `TcpSocketAdapter` can connect to RAW TCP port 9100 |

A regular browser tab cannot open RAW TCP sockets. Browser image commands only
accept cross-origin-accessible `http(s)` URLs.

## API overview

### `Printer`

The fluent, low-level API. Common method groups include:

- Content: `text`, `pureText`, `println`, `table`, `tableCustom`, `barcode`, `qrcode`.
- Images: `image`, `raster`, `qrimage`.
- Formatting: `align`, `font`, `style`, `size`, `spacing`, `lineSpace`.
- Hardware: `cut`, `cashdraw`, `beep`, `hardware`, `model`.
- Transport lifecycle: `flush`, `close`.

### `PrinterController`

The Node.js USB controller executes typed JSON commands, complete jobs, and
rendered templates. Its `device` option can pin a printer by vendor ID, product
ID, bus number, and device address.

### `BrowserPrinterController`

The browser equivalent accepts any browser `Adapter`, supports an optional
image loader, and executes the same JSON jobs and templates.

### Browser adapters

The `morden-node-escpos/browser` entry exports `WebUSBAdapter`,
`WebSerialAdapter`, and `TcpSocketAdapter`.

## Encodings and printer compatibility

Encoding conversion is provided by
[`iconv-lite`](https://github.com/ashtuchkin/iconv-lite). Common choices:

- Chinese: `GB18030`, `GBK`, `GB2312`
- Japanese: `Shift_JIS`, `EUC-JP`
- Korean: `EUC-KR`
- Unicode: `UTF-8`, `UTF-16`

The driver targets standard ESC/POS printers, including many Epson TM, Star
TSP, Gprinter, and Xprinter models. Printer firmware differs, so verify
advanced commands on the target hardware. The `qsprinter` model profile is
available for compatible devices; the default profile uses generic ESC/POS.

## Linux USB permissions

If a printer is visible but cannot be opened, add a udev rule using its actual
vendor and product IDs:

```udev
SUBSYSTEM=="usb", ATTR{idVendor}=="04b8", ATTR{idProduct}=="0e15", MODE="0666"
```

Then reload the rules:

```bash
sudo udevadm control --reload-rules
sudo udevadm trigger
```

For shared or production systems, prefer a dedicated group and narrower udev
permissions instead of world-writable device access.

## Troubleshooting

- **Garbled text:** select the encoding supported by the printer's active code page, commonly `GB18030` or `GBK` for Chinese.
- **No printer found:** check the cable and permissions, then inspect `USBAdapter.findPrinter()`.
- **Poor image output:** try a different bitmap density (`s8`, `d8`, `s24`, or `d24`) and ensure the source image is sized for the paper width.

## License

[MIT](./LICENSE) © morden-escpos-contributors.

## Related links

- [Monorepo](https://github.com/gylove1994/morden-escpos)
- [Receipt Studio](https://gylove1994.github.io/morden-escpos/)
- [Epson ESC/POS command reference](https://reference.epson-biz.com/modules/ref_escpos/index.php)
- [node-usb documentation](https://github.com/node-usb/node-usb)
