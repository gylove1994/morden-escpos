# Modern Node ESC/POS

一个现代化的 ESC/POS 打印机驱动程序，专为 Node.js 设计，完整的 TypeScript 支持。

## 特性

- 🎯 完整的 TypeScript 类型定义
- 📝 支持文本、表格、条形码、二维码打印
- 🖼️ 支持图片打印（Raster/Bitmap 模式）
- 🔌 USB 打印机支持
- 💪 现代化的 API 设计
- 🌍 多编码支持（GB18030、UTF-8 等）
- 🔧 丰富的文本格式化选项
- 📋 **支持JSON格式配置打印任务**

## 安装

```bash
npm install morden-node-escpos
# 或
pnpm install morden-node-escpos
# 或
yarn add morden-node-escpos
```

## 快速开始

### 基础使用

```typescript
import { Printer, USBAdapter } from 'morden-node-escpos';

// 查找打印机
const devices = USBAdapter.findPrinter();
console.log(devices);

// 连接打印机
const adapter = new USBAdapter(); // 自动连接第一个打印机
// 或指定 VID 和 PID
// const adapter = new USBAdapter(0x04b8, 0x0e15);

const printer = new Printer(adapter, { encoding: 'GB18030', width: 48 });

// 打开连接
adapter.open((error) => {
  if (error) {
    console.error('打开打印机失败:', error);
    return;
  }

  printer
    .align('ct')
    .style('bu')
    .size(2, 2)
    .text('欢迎光临')
    .style('normal')
    .size(1, 1)
    .text('订单号: #12345')
    .drawLine()
    .tableCustom([
      { text: '商品', align: 'left', width: 0.5 },
      { text: '数量', align: 'center', width: 0.2 },
      { text: '价格', align: 'right', width: 0.3 }
    ])
    .tableCustom([
      { text: '可乐', align: 'left', width: 0.5 },
      { text: '2', align: 'center', width: 0.2 },
      { text: '¥6.00', align: 'right', width: 0.3 }
    ])
    .drawLine()
    .text('合计: ¥6.00')
    .newLine()
    .qrcode('https://example.com', 3, 'M', 6)
    .cut()
    .close();
});
```

### 使用 JSON 格式（推荐）

本库支持使用 JSON 格式来配置打印任务，便于序列化、存储和动态生成打印任务。

#### 基础示例

```typescript
import { PrinterController } from 'morden-node-escpos';
import type { PrintJobJSON } from 'morden-node-escpos';

const controller = new PrinterController({
  encoding: 'GBK',
  width: 48,
});

await controller.init();

// 使用 JSON 对象
const printJob: PrintJobJSON = {
  name: '简单打印',
  commands: [
    { type: 'align', value: 'ct' },
    { type: 'text', content: 'Hello World!' },
    { type: 'feed', lines: 2 },
    { type: 'cut' },
  ],
};

await controller.executeJob(printJob);
await controller.flush();
await controller.close();
```

#### 从 JSON 文件读取

```typescript
import { promises as fs } from 'node:fs';

const jsonString = await fs.readFile('print-job.json', 'utf-8');
await controller.executeFromJSON(jsonString);
```

#### 完整打印示例

```json
{
  "name": "订单打印",
  "config": {
    "encoding": "GBK",
    "width": 48
  },
  "commands": [
    { "type": "align", "value": "ct" },
    { "type": "style", "value": "b" },
    { "type": "size", "width": 2, "height": 2 },
    { "type": "text", "content": "欢迎光临" },
    { "type": "size", "width": 1, "height": 1 },
    { "type": "style", "value": "normal" },
    { "type": "drawLine" },
    { "type": "align", "value": "lt" },
    { "type": "text", "content": "订单号: 20231025001" },
    { "type": "tableCustom", "data": [
      { "text": "商品", "align": "left", "width": 0.5 },
      { "text": "数量", "align": "center", "width": 0.25 },
      { "text": "金额", "align": "right", "width": 0.25 }
    ]},
    { "type": "drawLine" },
    { "type": "qrcode", "content": "https://example.com", "version": 3, "level": "l", "size": 6 },
    { "type": "feed", "lines": 2 },
    { "type": "cut" }
  ]
}
```

#### JSON 格式的优势

- ✅ **序列化**: 打印任务可以被序列化为 JSON 字符串
- ✅ **配置化**: 打印格式可以作为配置文件管理
- ✅ **动态生成**: 可以根据业务逻辑动态构建打印任务
- ✅ **跨语言**: 其他语言也能生成打印任务
- ✅ **版本控制**: 打印模板可以纳入版本控制系统

#### JIRA 卡片打印模板

本库提供了 JIRA 卡片打印模板，可以方便地打印任务卡片：

```typescript
import { PrinterController } from 'morden-node-escpos';
import { createJiraCardPrintJob } from './examples/jira-card-example';

const controller = new PrinterController({
  encoding: 'GBK',
  width: 48,
});

await controller.init();

// 使用模板函数创建JIRA卡片打印任务
const printJob = createJiraCardPrintJob({
  type: 'BUG',
  key: 'PROJ-123',
  title: '修复登录页面的验证码显示问题',
  status: '进行中',
  priority: '高',
  assignee: '张三',
  createdDate: '2024-01-15',
  dueDate: '2024-01-20',
  description: '登录页面的验证码图片无法正常显示，用户无法完成登录流程。',
  labels: ['bug', 'frontend', 'urgent'],
  url: 'https://your-jira-instance.atlassian.net/browse/PROJ-123',
});

await controller.executeJob(printJob);
await controller.flush();
await controller.close();
```

或者直接从 JSON 文件读取模板：

```typescript
import { promises as fs } from 'node:fs';

const jsonString = await fs.readFile('jira-card-template.json', 'utf-8');
await controller.executeFromJSON(jsonString);
```

查看完整的 JSON 格式文档：[JSON_FORMAT.md](docs/JSON_FORMAT.md)

示例文件：
- [simple-print.json](examples/simple-print.json) - 简单文本打印
- [print-job-example.json](examples/print-job-example.json) - 完整收据打印
- [use-json-example.ts](examples/use-json-example.ts) - TypeScript 使用示例
- [jira-card-template.json](jira-card-template.json) - JIRA卡片打印模板
- [jira-card-example.ts](examples/jira-card-example.ts) - JIRA卡片打印示例

## API 文档

### Printer

打印机类，提供所有打印相关的方法。

#### 构造函数

```typescript
new Printer(adapter: Adapter, options?: PrinterOptions)
```

**参数:**
- `adapter`: 适配器实例（如 USBAdapter）
- `options`: 可选配置
  - `encoding`: 字符编码，默认 `'GB18030'`
  - `width`: 每行字符数，默认 `48`

#### 文本打印方法

- `text(content: string, encoding?: string)`: 打印文本并换行
- `pureText(content: string, encoding?: string)`: 打印文本不换行
- `println(content: string)`: 打印纯文本并换行
- `newLine()`: 换行
- `drawLine(character?: string)`: 画分隔线

#### 格式化方法

- `align(alignment: 'lt' | 'ct' | 'rt')`: 设置对齐方式（左/中/右）
- `font(family: 'a' | 'b' | 'c')`: 设置字体
- `style(style: StyleString)`: 设置样式（粗体/斜体/下划线）
- `size(width: number, height: number)`: 设置文字大小（1-8）
- `spacing(n?: number)`: 设置字符间距
- `lineSpace(n?: number)`: 设置行间距

#### 表格打印

```typescript
// 简单表格
printer.table(['列1', '列2', '列3']);

// 自定义表格
printer.tableCustom([
  { text: '商品名称', align: 'left', width: 0.5 },
  { text: '数量', align: 'center', width: 0.2 },
  { text: '价格', align: 'right', width: 0.3 }
], { size: [1, 1], encoding: 'GB18030' });
```

#### 条形码

```typescript
printer.barcode(
  123456,
  'CODE128',
  {
    width: 2,
    height: 50,
    position: 'blw', // 位置: 'off' | 'abv' | 'blw' | 'bth'
    font: 'a'
  }
);
```

#### 二维码

```typescript
// 标准二维码
printer.qrcode(
  'https://example.com',
  3, // 版本 (1-40)
  'M', // 纠错级别: 'L' | 'M' | 'Q' | 'H'
  6 // 大小
);

// 二维码图片（更好的兼容性）
await printer.qrimage('https://example.com', {
  type: 'png',
  mode: 'dhdw'
});
```

#### 图片打印

```typescript
import { Image } from 'morden-node-escpos';

const image = new Image(pixelData);

// Bitmap 模式
await printer.image(image, 'd24');

// Raster 模式
printer.raster(image, 'normal');
```

#### 硬件控制

- `cut(partial?: boolean, feed?: number)`: 切纸
- `cashdraw(pin?: 2 | 5)`: 打开钱箱
- `beep(times: number, duration: number)`: 蜂鸣器

#### 其他方法

- `feed(lines?: number)`: 走纸
- `flush()`: 发送缓冲区数据到打印机
- `close()`: 关闭连接

### USBAdapter

USB 适配器类，用于连接 USB 打印机。

#### 静态方法

```typescript
// 查找所有 USB 打印机
USBAdapter.findPrinter(): Device[]

// 获取指定设备
USBAdapter.getDevice(vid: number, pid: number): Promise<Device>
```

#### 实例方法

```typescript
const adapter = new USBAdapter(vid?, pid?);

adapter.open(callback?: (error: Error | null) => void): this
adapter.write(data: Buffer | string, callback?: (error: Error | null) => void): this
adapter.read(callback?: (data: Buffer) => void): void
adapter.close(callback?: (error: Error | null) => void): this
```

## 编码支持

本库使用 `iconv-lite` 进行编码转换，支持以下常用编码：

- **中文**: `GB18030`, `GBK`, `GB2312`
- **日文**: `Shift_JIS`, `EUC-JP`
- **韩文**: `EUC-KR`
- **Unicode**: `UTF-8`, `UTF-16`
- 更多编码请查看 [iconv-lite 文档](https://github.com/ashtuchkin/iconv-lite)

## 打印机兼容性

本库遵循 ESC/POS 标准，兼容大多数热敏打印机，包括但不限于：

- Epson TM 系列
- Star TSP 系列
- 佳博（Gprinter）
- 芯烨（Xprinter）
- 其他遵循 ESC/POS 标准的打印机

### 特定型号支持

```typescript
// 设置打印机型号以使用特定命令
printer.model('qsprinter');
```

目前支持的型号:
- `null` (默认，通用 ESC/POS)
- `'qsprinter'`

## 示例

### 打印收据

```typescript
printer
  .align('ct')
  .text('*** 购物小票 ***')
  .drawLine()
  .align('lt')
  .text(`日期: ${new Date().toLocaleDateString()}`)
  .text('收银员: 001')
  .drawLine()
  .tableCustom([
    { text: '商品', align: 'left', width: 0.4 },
    { text: '单价', align: 'right', width: 0.3 },
    { text: '数量', align: 'right', width: 0.15 },
    { text: '小计', align: 'right', width: 0.15 }
  ])
  .drawLine('-')
  .tableCustom([
    { text: '可口可乐', align: 'left', width: 0.4 },
    { text: '3.00', align: 'right', width: 0.3 },
    { text: '2', align: 'right', width: 0.15 },
    { text: '6.00', align: 'right', width: 0.15 }
  ])
  .drawLine()
  .align('rt')
  .size(2, 2)
  .text('合计: ¥6.00')
  .size(1, 1)
  .align('ct')
  .text('谢谢惠顾，欢迎再次光临！')
  .newLine()
  .cut()
  .close();
```

## 故障排除

### Linux 权限问题

在 Linux 上使用 USB 打印机可能需要添加 udev 规则：

```bash
sudo nano /etc/udev/rules.d/99-escpos.rules
```

添加以下内容（替换为你的 VID 和 PID）：

```
SUBSYSTEM=="usb", ATTR{idVendor}=="04b8", ATTR{idProduct}=="0e15", MODE="0666"
```

然后重新加载规则：

```bash
sudo udevadm control --reload-rules
sudo udevadm trigger
```

### 常见问题

**Q: 打印中文乱码？**
A: 确保使用正确的编码，如 `GB18030` 或 `GBK`

**Q: 找不到打印机？**
A: 检查 USB 连接，使用 `USBAdapter.findPrinter()` 查看可用设备

**Q: 图片打印不清晰？**
A: 尝试使用不同的密度参数 (`s8`, `d8`, `s24`, `d24`)

## License

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！

## 相关链接

- [ESC/POS 命令参考](https://reference.epson-biz.com/modules/ref_escpos/index.php)
- [Node USB 文档](https://github.com/node-usb/node-usb)
