[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md)

# Modern ESC/POS

面向 Node.js 和浏览器的现代化、类型安全的 ESC/POS 工具集。

[![npm version](https://img.shields.io/npm/v/morden-node-escpos?logo=npm)](https://www.npmjs.com/package/morden-node-escpos)
[![Lint](https://github.com/gylove1994/morden-escpos/actions/workflows/lint.yml/badge.svg)](https://github.com/gylove1994/morden-escpos/actions/workflows/lint.yml)
[![在线体验](https://img.shields.io/badge/demo-Receipt_Studio-2563eb)](https://gylove1994.github.io/morden-escpos/)
[![许可证](https://img.shields.io/badge/license-MIT_%2F_BUSL--1.1-blue)](./LICENSE)

本 monorepo 汇集了可发布的 ESC/POS 打印机驱动、可复用 UI 包，以及基于浏览器的
小票模板编辑器 **Receipt Studio**。

## 主要内容

- TypeScript 优先的 Node.js 驱动，支持文本、表格、条形码、二维码、图片、钱箱和打印机硬件命令。
- Node.js USB 支持，以及通过 `morden-node-escpos/browser` 提供的 WebUSB、Web Serial 和 Direct Sockets 传输层。
- 可序列化的 JSON 打印任务、可复用模板及经过校验的模板输入。
- 支持多语言的静态 Receipt Studio，可预览模板并直接向本地或局域网打印机打印。

## 体验 Receipt Studio

打开[在线编辑器](https://gylove1994.github.io/morden-escpos/)，或直接选择语言：

- [English](https://gylove1994.github.io/morden-escpos/en/)
- [简体中文](https://gylove1994.github.io/morden-escpos/zh/)
- [日本語](https://gylove1994.github.io/morden-escpos/ja/)

## 工作区

| 路径 | 包 | 用途 |
| --- | --- | --- |
| [`packages/morden-node-escpos`](./packages/morden-node-escpos/README.zh-CN.md) | [`morden-node-escpos`](https://www.npmjs.com/package/morden-node-escpos) | 可发布的 Node.js 与浏览器 ESC/POS 驱动 |
| [`apps/template-editor`](./apps/template-editor/README.zh-CN.md) | Receipt Studio | 静态导出的浏览器模板编辑器 |
| `packages/ui` | `@workspace/ui` | 共享应用 UI 组件 |
| [`packages/jsonjoy-builder`](./packages/jsonjoy-builder/README.md) | `jsonjoy-builder` | 基于上游项目修改的可视化 JSON Schema 编辑器 |

## 开发

环境要求：Node.js 22 或更高版本，以及 pnpm 10.x。

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
pnpm typecheck
```

使用 `pnpm dev` 在本地运行 Receipt Studio。各包的专用命令请参阅对应 README。

## 文档与社区

- [打印机驱动文档](./packages/morden-node-escpos/README.zh-CN.md)
- [Receipt Studio 文档](./apps/template-editor/README.zh-CN.md)
- [贡献指南](./CONTRIBUTING.md)
- [行为准则](./CODE_OF_CONDUCT.md)
- [安全策略](./SECURITY.md)

## 许可证

本仓库按路径使用不同许可证。驱动、编辑器和共享工具路径采用 MIT；SaaS 专用路径采用
BUSL-1.1，并在各自的 Change Date 后转换为 AGPL-3.0-or-later。权威说明请参阅
[上下文映射](./CONTEXT-MAP.md)和[许可证声明](./LICENSE)。
