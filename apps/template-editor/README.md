[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md)

# Receipt Studio

A browser-based editor for designing, previewing, and printing ESC/POS receipt templates.

[![Live demo](https://img.shields.io/badge/demo-open_Receipt_Studio-2563eb)](https://gylove1994.github.io/morden-escpos/)
[![Deploy](https://github.com/gylove1994/morden-escpos/actions/workflows/deploy-template-editor-pages.yml/badge.svg)](https://github.com/gylove1994/morden-escpos/actions/workflows/deploy-template-editor-pages.yml)
[![License](https://img.shields.io/badge/license-MIT-blue)](../../LICENSE)

Receipt Studio runs entirely in the browser. Production builds use Next.js
static export, so the deployed editor does not require a Node.js server.

## Live demo

Open [Receipt Studio](https://gylove1994.github.io/morden-escpos/), or go
directly to a locale:

- [English](https://gylove1994.github.io/morden-escpos/en/)
- [简体中文](https://gylove1994.github.io/morden-escpos/zh/)
- [日本語](https://gylove1994.github.io/morden-escpos/ja/)

Visiting `/` redirects in the browser to the saved language, then the browser
language, and finally Chinese. The toolbar language selector updates the
locale-prefixed URL and stores the preference locally.

## Features

- Visual ESC/POS receipt template editing and live preview.
- JSON source editing, template input schemas, and input validation.
- Direct browser printing to local USB/serial printers or LAN printers where
  the browser environment permits it.
- English, Simplified Chinese, and Japanese interfaces.
- Fully static production output suitable for GitHub Pages or any static host.

## Development

From the repository root:

```bash
pnpm install
pnpm dev
```

Build only Receipt Studio:

```bash
pnpm --filter @workspace/template-editor build
```

Static files are generated in `apps/template-editor/out/`.

To build with the repository base path used by GitHub Pages:

```bash
GITHUB_PAGES=true pnpm --filter @workspace/template-editor build
```

Pushes to `main` are deployed by
[`deploy-template-editor-pages.yml`](../../.github/workflows/deploy-template-editor-pages.yml).

## Browser printing

| Connection | Browser/environment | Requirements and limitations |
| --- | --- | --- |
| USB | Chrome or Edge with WebUSB | HTTPS or localhost; the user must select and authorize a device |
| Serial | Chrome or Edge with Web Serial | HTTPS or localhost; the user selects a port and baud rate |
| Network RAW 9100 | Chrome Isolated Web App with Direct Sockets | A regular browser tab cannot open a raw TCP socket |

The browser sends print data directly to the selected printer; no print relay
server is required. Image commands accept only cross-origin-accessible
`http(s)` URLs.

Browser APIs and printer firmware support vary. Test the complete workflow with
the browser, operating system, and printer model used in production.

## Related documentation

- [morden-node-escpos driver](../../packages/morden-node-escpos/README.md)
- [Monorepo overview](../../README.md)

## License

Receipt Studio is part of the repository's **mit-drivers** context and is
licensed under [MIT](../../LICENSE). See the
[context map](../../CONTEXT-MAP.md) for the repository-wide license boundary.
