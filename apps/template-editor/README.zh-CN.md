[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md)

# Receipt Studio

用于设计、预览和打印 ESC/POS 小票模板的浏览器编辑器。

[![在线体验](https://img.shields.io/badge/demo-open_Receipt_Studio-2563eb)](https://gylove1994.github.io/morden-escpos/)
[![部署](https://github.com/gylove1994/morden-escpos/actions/workflows/deploy-template-editor-pages.yml/badge.svg)](https://github.com/gylove1994/morden-escpos/actions/workflows/deploy-template-editor-pages.yml)
[![许可证](https://img.shields.io/badge/license-MIT-blue)](../../LICENSE)

Receipt Studio 完全在浏览器中运行。生产构建使用 Next.js 静态导出，因此部署后的编辑器无需 Node.js 服务器。

## 在线体验

打开 [Receipt Studio](https://gylove1994.github.io/morden-escpos/)，或直接进入对应语言：

- [English](https://gylove1994.github.io/morden-escpos/en/)
- [简体中文](https://gylove1994.github.io/morden-escpos/zh/)
- [日本語](https://gylove1994.github.io/morden-escpos/ja/)

访问 `/` 时，浏览器会依次根据已保存语言、浏览器语言进行跳转，最终回退到中文。
工具栏语言选择器会更新带语言前缀的 URL，并在本地保存偏好。

## 特性

- 可视化编辑 ESC/POS 小票模板并实时预览。
- JSON 源码编辑、模板输入 Schema 和输入校验。
- 在浏览器环境允许时，直接向本地 USB/串口打印机或局域网打印机打印。
- 提供英语、简体中文和日语界面。
- 生成完全静态的生产文件，可部署到 GitHub Pages 或任意静态主机。

## 开发

在仓库根目录运行：

```bash
pnpm install
pnpm dev
```

仅构建 Receipt Studio：

```bash
pnpm --filter @workspace/template-editor build
```

静态文件会生成到 `apps/template-editor/out/`。

使用 GitHub Pages 仓库基础路径构建：

```bash
GITHUB_PAGES=true pnpm --filter @workspace/template-editor build
```

推送到 `main` 后，由
[`deploy-template-editor-pages.yml`](../../.github/workflows/deploy-template-editor-pages.yml)
完成部署。

## 浏览器打印

| 连接方式 | 浏览器/环境 | 要求与限制 |
| --- | --- | --- |
| USB | 支持 WebUSB 的 Chrome 或 Edge | HTTPS 或 localhost；用户必须选择并授权设备 |
| 串口 | 支持 Web Serial 的 Chrome 或 Edge | HTTPS 或 localhost；用户需要选择串口和波特率 |
| 网络 RAW 9100 | 支持 Direct Sockets 的 Chrome Isolated Web App | 普通浏览器标签页无法打开 RAW TCP Socket |

浏览器会将打印数据直接发送到所选打印机，无需打印中继服务器。图片命令仅接受允许跨域访问的 `http(s)` URL。

浏览器 API 和打印机固件的支持情况不同。请使用生产环境中的浏览器、操作系统和打印机型号测试完整流程。

## 相关文档

- [morden-node-escpos 驱动](../../packages/morden-node-escpos/README.zh-CN.md)
- [Monorepo 概览](../../README.zh-CN.md)

## 许可证

Receipt Studio 属于仓库的 **mit-drivers** 上下文，采用 [MIT](../../LICENSE) 许可证。
仓库整体的许可证边界请参阅[上下文映射](../../CONTEXT-MAP.md)。
