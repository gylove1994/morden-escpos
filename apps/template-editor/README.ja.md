[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md)

# Receipt Studio

ESC/POS レシートテンプレートを設計、プレビュー、印刷するためのブラウザーエディターです。

[![ライブデモ](https://img.shields.io/badge/demo-open_Receipt_Studio-2563eb)](https://gylove1994.github.io/morden-escpos/)
[![デプロイ](https://github.com/gylove1994/morden-escpos/actions/workflows/deploy-template-editor-pages.yml/badge.svg)](https://github.com/gylove1994/morden-escpos/actions/workflows/deploy-template-editor-pages.yml)
[![ライセンス](https://img.shields.io/badge/license-MIT-blue)](../../LICENSE)

Receipt Studio は完全にブラウザー内で動作します。本番ビルドは Next.js の静的エクスポートを使用するため、デプロイしたエディターに Node.js サーバーは不要です。

## ライブデモ

[Receipt Studio](https://gylove1994.github.io/morden-escpos/) を開くか、言語を直接選択してください。

- [English](https://gylove1994.github.io/morden-escpos/en/)
- [简体中文](https://gylove1994.github.io/morden-escpos/zh/)
- [日本語](https://gylove1994.github.io/morden-escpos/ja/)

`/` にアクセスすると、保存済み言語、ブラウザー言語の順に判定し、最後に中国語へフォールバックします。
ツールバーの言語セレクターは、ロケール付き URL を更新して設定をローカルに保存します。

## 機能

- ESC/POS レシートテンプレートのビジュアル編集とライブプレビュー。
- JSON ソース編集、テンプレート入力 Schema、入力検証。
- ブラウザー環境が対応している場合、ローカルの USB/シリアルプリンターや LAN プリンターへ直接印刷。
- 英語、簡体字中国語、日本語のインターフェース。
- GitHub Pages や任意の静的ホストへ配置できる完全な静的出力。

## 開発

リポジトリのルートから実行します。

```bash
pnpm install
pnpm dev
```

Receipt Studio のみをビルドします。

```bash
pnpm --filter @workspace/template-editor build
```

静的ファイルは `apps/template-editor/out/` に生成されます。

GitHub Pages のリポジトリベースパスを有効にしてビルドします。

```bash
GITHUB_PAGES=true pnpm --filter @workspace/template-editor build
```

`main` への push は
[`deploy-template-editor-pages.yml`](../../.github/workflows/deploy-template-editor-pages.yml)
によってデプロイされます。

## ブラウザー印刷

| 接続 | ブラウザー/環境 | 要件と制限 |
| --- | --- | --- |
| USB | WebUSB 対応の Chrome または Edge | HTTPS または localhost。ユーザーがデバイスを選択して許可する必要あり |
| シリアル | Web Serial 対応の Chrome または Edge | HTTPS または localhost。ユーザーがポートとボーレートを選択 |
| ネットワーク RAW 9100 | Direct Sockets 対応の Chrome Isolated Web App | 通常のブラウザータブでは RAW TCP ソケットを開けない |

ブラウザーは印刷データを選択したプリンターへ直接送信するため、印刷中継サーバーは不要です。画像コマンドは、クロスオリジンでアクセス可能な `http(s)` URL のみ受け付けます。

ブラウザー API とプリンターファームウェアの対応状況は異なります。本番で使用するブラウザー、OS、プリンターモデルで一連の処理をテストしてください。

## 関連ドキュメント

- [morden-node-escpos ドライバー](../../packages/morden-node-escpos/README.ja.md)
- [Monorepo 概要](../../README.ja.md)

## ライセンス

Receipt Studio はリポジトリの **mit-drivers** コンテキストに属し、[MIT](../../LICENSE) でライセンスされています。
リポジトリ全体のライセンス境界は[コンテキストマップ](../../CONTEXT-MAP.md)を参照してください。
