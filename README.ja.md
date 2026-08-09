[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md)

# Modern ESC/POS

Node.js とブラウザー向けの、モダンで型安全な ESC/POS ツール群です。

[![npm version](https://img.shields.io/npm/v/morden-node-escpos?logo=npm)](https://www.npmjs.com/package/morden-node-escpos)
[![Lint](https://github.com/gylove1994/morden-escpos/actions/workflows/lint.yml/badge.svg)](https://github.com/gylove1994/morden-escpos/actions/workflows/lint.yml)
[![ライブデモ](https://img.shields.io/badge/demo-Receipt_Studio-2563eb)](https://gylove1994.github.io/morden-escpos/)
[![ライセンス](https://img.shields.io/badge/license-MIT_%2F_BUSL--1.1-blue)](./LICENSE)

この monorepo は、公開可能な ESC/POS プリンタードライバー、再利用可能な UI
パッケージ、ブラウザーベースのレシートテンプレートエディター
**Receipt Studio** をまとめています。

## 提供する機能

- テキスト、表、バーコード、QR コード、画像、キャッシュドロアー、ハードウェアコマンドに対応した TypeScript ファーストの Node.js ドライバー。
- Node.js の USB 対応と、`morden-node-escpos/browser` が提供する WebUSB、Web Serial、Direct Sockets トランスポート。
- シリアライズ可能な JSON 印刷ジョブ、再利用可能なテンプレート、検証済みテンプレート入力。
- テンプレートをプレビューし、ローカルまたは LAN 接続プリンターへ直接印刷できる、多言語対応の静的 Receipt Studio。

## Receipt Studio を試す

[ライブエディター](https://gylove1994.github.io/morden-escpos/)を開くか、言語を直接選択してください。

- [English](https://gylove1994.github.io/morden-escpos/en/)
- [简体中文](https://gylove1994.github.io/morden-escpos/zh/)
- [日本語](https://gylove1994.github.io/morden-escpos/ja/)

## ワークスペース

| パス | パッケージ | 用途 |
| --- | --- | --- |
| [`packages/morden-node-escpos`](./packages/morden-node-escpos/README.ja.md) | [`morden-node-escpos`](https://www.npmjs.com/package/morden-node-escpos) | 公開可能な Node.js / ブラウザー向け ESC/POS ドライバー |
| [`apps/template-editor`](./apps/template-editor/README.ja.md) | Receipt Studio | 静的エクスポート対応のブラウザーテンプレートエディター |
| `packages/ui` | `@workspace/ui` | 共有アプリケーション UI コンポーネント |
| [`packages/jsonjoy-builder`](./packages/jsonjoy-builder/README.md) | `jsonjoy-builder` | 上流プロジェクトを基に変更したビジュアル JSON Schema エディター |

## 開発

要件：Node.js 22 以降、pnpm 10.x。

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
pnpm typecheck
```

`pnpm dev` で Receipt Studio をローカル実行できます。パッケージ固有のコマンドは、各 README を参照してください。

## ドキュメントとコミュニティ

- [プリンタードライバーのドキュメント](./packages/morden-node-escpos/README.ja.md)
- [Receipt Studio のドキュメント](./apps/template-editor/README.ja.md)
- [コントリビューションガイド](./CONTRIBUTING.md)
- [行動規範](./CODE_OF_CONDUCT.md)
- [セキュリティポリシー](./SECURITY.md)

## ライセンス

このリポジトリでは、パスごとに異なるライセンスを適用します。ドライバー、エディター、共有ツールのパスは MIT、
SaaS 専用パスは BUSL-1.1 で、各 Change Date 後に AGPL-3.0-or-later へ移行します。
正式な対応関係は[コンテキストマップ](./CONTEXT-MAP.md)と[ライセンス通知](./LICENSE)を参照してください。
