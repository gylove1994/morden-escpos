[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md)

# Modern ESC/POS

Modern, type-safe ESC/POS tooling for Node.js and the browser.

[![npm version](https://img.shields.io/npm/v/morden-node-escpos?logo=npm)](https://www.npmjs.com/package/morden-node-escpos)
[![Lint](https://github.com/gylove1994/morden-escpos/actions/workflows/lint.yml/badge.svg)](https://github.com/gylove1994/morden-escpos/actions/workflows/lint.yml)
[![Live demo](https://img.shields.io/badge/demo-Receipt_Studio-2563eb)](https://gylove1994.github.io/morden-escpos/)
[![License](https://img.shields.io/badge/license-MIT_%2F_BUSL--1.1-blue)](./LICENSE)

This monorepo brings together a publishable ESC/POS printer driver, reusable UI
packages, and **Receipt Studio**, a browser-based receipt template editor.

## What you get

- A TypeScript-first Node.js driver for text, tables, barcodes, QR codes, images,
  cash drawers, and printer hardware commands.
- USB support on Node.js and dedicated WebUSB, Web Serial, and Direct Sockets
  transports through `morden-node-escpos/browser`.
- Serializable JSON print jobs, reusable templates, and validated template
  inputs.
- A static, multilingual Receipt Studio that previews templates and prints
  directly to local or LAN-connected printers.

## Try Receipt Studio

Open the [live editor](https://gylove1994.github.io/morden-escpos/), or choose a
language directly:

- [English](https://gylove1994.github.io/morden-escpos/en/)
- [简体中文](https://gylove1994.github.io/morden-escpos/zh/)
- [日本語](https://gylove1994.github.io/morden-escpos/ja/)

## Workspace

| Path | Package | Purpose |
| --- | --- | --- |
| [`packages/morden-node-escpos`](./packages/morden-node-escpos/README.md) | [`morden-node-escpos`](https://www.npmjs.com/package/morden-node-escpos) | Publishable Node.js and browser ESC/POS driver |
| [`apps/template-editor`](./apps/template-editor/README.md) | Receipt Studio | Statically exported browser template editor |
| `packages/ui` | `@workspace/ui` | Shared application UI components |
| [`packages/jsonjoy-builder`](./packages/jsonjoy-builder/README.md) | `jsonjoy-builder` | Upstream-derived visual JSON Schema editor |

## Development

Requirements: Node.js 22 or later and pnpm 10.x.

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
pnpm typecheck
```

Run Receipt Studio locally with `pnpm dev`. Package-specific commands are
documented in each package README.

## Documentation and community

- [Printer driver documentation](./packages/morden-node-escpos/README.md)
- [Receipt Studio documentation](./apps/template-editor/README.md)
- [Contributing guide](./CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security policy](./SECURITY.md)

## License

This repository uses licenses by path. Driver, editor, and shared tooling paths
are licensed under MIT; SaaS-only paths are licensed under BUSL-1.1 and convert
to AGPL-3.0-or-later after their Change Date. See the authoritative
[context map](./CONTEXT-MAP.md) and [license notice](./LICENSE).
