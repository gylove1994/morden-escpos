[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md)

# morden-node-escpos

Node.js と Chromium 系ブラウザー向けの、モダンで型安全な ESC/POS プリンタードライバーです。

[![npm version](https://img.shields.io/npm/v/morden-node-escpos?logo=npm)](https://www.npmjs.com/package/morden-node-escpos)
[![npm downloads](https://img.shields.io/npm/dm/morden-node-escpos)](https://www.npmjs.com/package/morden-node-escpos)
[![node](https://img.shields.io/node/v/morden-node-escpos)](https://www.npmjs.com/package/morden-node-escpos)
[![license](https://img.shields.io/npm/l/morden-node-escpos)](./LICENSE)

## 機能

- 完全な TypeScript 型と ESM/CommonJS パッケージエクスポート。
- テキスト、表、バーコード、QR コード、Raster/Bitmap 画像、キャッシュドロアー、ハードウェアコマンド。
- Node.js USB と、WebUSB、Web Serial、Direct Sockets のブラウザートランスポート。
- `iconv-lite` による GB18030、GBK、Shift_JIS、UTF-8 などのマルチバイトエンコーディング。
- シリアライズ可能な JSON 印刷ジョブと、入力検証に対応したテンプレートエンジン。
- 低レベルの Fluent `Printer` API と、高レベルの Node.js/ブラウザーコントローラー。

## インストール

```bash
npm install morden-node-escpos
# or
pnpm add morden-node-escpos
# or
yarn add morden-node-escpos
```

Node.js 16 以降が必要です。

## クイックスタート：Node.js

デバイスを指定しない場合、`USBAdapter` は検出した最初の USB プリンターを選択します。

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

`USBAdapter.findPrinter()` でプリンターを列挙できます。USB デバイスまたはベンダー/製品 ID を渡して明示的に選択することもできます。

## クイックスタート：JSON 印刷ジョブ

保存、動的生成、システム間共有が必要なテンプレートには JSON 印刷ジョブを推奨します。

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

コントローラーは `executeFromJSON`、`executeFromTemplate`、
`executeFromTemplateJSON` にも対応しています。コマンドスキーマは
[JSON サンプル](https://github.com/gylove1994/morden-escpos/tree/main/packages/morden-node-escpos/examples)
とエクスポートされた `PrintJobJSON` 型を参照してください。同じディレクトリにレシート、テンプレート、JIRA カードのサンプルがあります。

## ブラウザーでの使用

Node.js の `usb` 依存関係がフロントエンドへバンドルされないように、ブラウザーアプリは専用エントリーポイントから**必ず**インポートしてください。

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

| トランスポート | 環境 | 重要な制約 |
| --- | --- | --- |
| WebUSB | Chrome または Edge | HTTPS/localhost。デバイス選択にはユーザー操作が必要 |
| Web Serial | Chrome または Edge | HTTPS/localhost。ユーザーがポートとボーレートを選択 |
| Direct Sockets | Chrome Isolated Web App | `TcpSocketAdapter` で RAW TCP ポート 9100 に接続可能 |

通常のブラウザータブから RAW TCP ソケットを開くことはできません。ブラウザーの画像コマンドは、クロスオリジンでアクセス可能な `http(s)` URL のみ受け付けます。

## API 概要

### `Printer`

低レベルの Fluent API です。主なメソッドグループ：

- コンテンツ：`text`、`pureText`、`println`、`table`、`tableCustom`、`barcode`、`qrcode`。
- 画像：`image`、`raster`、`qrimage`。
- 書式：`align`、`font`、`style`、`size`、`spacing`、`lineSpace`。
- ハードウェア：`cut`、`cashdraw`、`beep`、`hardware`、`model`。
- トランスポートのライフサイクル：`flush`、`close`。

### `PrinterController`

型付き JSON コマンド、完全なジョブ、レンダリング済みテンプレートを実行する Node.js USB コントローラーです。`device` オプションでは、ベンダー ID、製品 ID、バス番号、デバイスアドレスでプリンターを固定できます。

### `BrowserPrinterController`

ブラウザー版は任意のブラウザー `Adapter` と任意の画像ローダーを受け取り、同じ JSON ジョブとテンプレートを実行します。

### ブラウザーアダプター

`morden-node-escpos/browser` エントリーは `WebUSBAdapter`、`WebSerialAdapter`、`TcpSocketAdapter` をエクスポートします。

## エンコーディングとプリンター互換性

エンコーディング変換は [`iconv-lite`](https://github.com/ashtuchkin/iconv-lite) が提供します。主な選択肢：

- 中国語：`GB18030`、`GBK`、`GB2312`
- 日本語：`Shift_JIS`、`EUC-JP`
- 韓国語：`EUC-KR`
- Unicode：`UTF-8`、`UTF-16`

このドライバーは、多くの Epson TM、Star TSP、Gprinter、Xprinter を含む標準 ESC/POS
プリンターを対象としています。ファームウェアごとの差異があるため、高度なコマンドは対象ハードウェアで検証してください。
対応デバイスでは `qsprinter` モデルプロファイルを利用でき、デフォルトでは汎用 ESC/POS を使用します。

## Linux USB 権限

プリンターを検出できても開けない場合は、実際のベンダー ID と製品 ID を使って udev ルールを追加します。

```udev
SUBSYSTEM=="usb", ATTR{idVendor}=="04b8", ATTR{idProduct}=="0e15", MODE="0666"
```

ルールを再読み込みします。

```bash
sudo udevadm control --reload-rules
sudo udevadm trigger
```

共有環境や本番環境では、全ユーザーに書き込みを許可せず、専用グループとより厳密な udev 権限を推奨します。

## トラブルシューティング

- **文字化けする：** プリンターの現在のコードページが対応するエンコーディングを選択してください。中国語では通常 `GB18030` または `GBK` を使用します。
- **プリンターが見つからない：** ケーブルと権限を確認し、`USBAdapter.findPrinter()` の結果を調べてください。
- **画像品質が悪い：** 別の Bitmap 密度（`s8`、`d8`、`s24`、`d24`）を試し、画像が用紙幅に合っていることを確認してください。

## ライセンス

[MIT](./LICENSE) © morden-escpos-contributors.

## 関連リンク

- [Monorepo](https://github.com/gylove1994/morden-escpos)
- [Receipt Studio](https://gylove1994.github.io/morden-escpos/)
- [Epson ESC/POS コマンドリファレンス](https://reference.epson-biz.com/modules/ref_escpos/index.php)
- [node-usb ドキュメント](https://github.com/node-usb/node-usb)
