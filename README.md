# スケジュール調整アプリ

調整さん風のスケジュール調整・出欠管理Webアプリケーションです。

## 機能

- ログイン不要でイベント作成
- 日程候補の設定
- 出欠回答の収集（参加/検討中/不参加）
- 回答状況の可視化
- URL共有による簡単な回答依頼

## 技術スタック

- **バックエンド**: Node.js + Express + TypeScript
- **フロントエンド**: React + TypeScript + Vite
- **データベース**: SQLite（開発用）

## セットアップ

### 必要な環境

- Node.js 18以上
- npm または yarn

### インストール

1. 依存関係のインストール

```bash
npm install
cd server
npm install
cd ../client
npm install
cd ..
```

2. 開発サーバーの起動

```bash
npm run dev
```

これで以下が起動します：
- バックエンド: http://localhost:3001
- フロントエンド: http://localhost:3000

## ビルド

本番環境用のビルド：

```bash
npm run build
```

## Vercelへのデプロイ

`vercel.json` でフロントエンド（Viteビルド）と API（Nodeサーバーレス関数）をまとめてデプロイできるようにしています。

1. Vercelで新規プロジェクトを作成し、リポジトリのルートを指定（追加の設定は不要）。
2. 環境変数
   - `SERVE_CLIENT=false` : API関数で静的ファイルを配信しないようにする（静的配信はVercel側が担当）。
   - `DB_PATH=/tmp/schedule.db`（省略可）: Vercelでは `/tmp` のみ書き込み可能。SQLiteはインスタンスのライフサイクルで消えるため、永続化したい場合は外部DB（Vercel Postgres / KV など）に移行してください。
   - `NODE_ENV=production`（Vercelで自動設定）
3. エンドポイント
   - API: `/api/...`（例: `/api/events`）
   - フロント: `https://<project>.vercel.app` — SPAルーティングは `vercel.json` で `index.html` へリライト済み
4. ローカル動作確認
   - `vercel dev` もしくは従来どおり `npm run dev`

## 自己ホスト（Windows Server 2019など）

### 1. Node.jsのインストール

Windows Server 2019にNode.jsをインストールします。

### 2. アプリケーションの配置

ビルドしたアプリケーションをサーバーに配置します。

### 3. IISでの設定（推奨）

1. IISにNode.js用のリバースプロキシを設定
2. `web.config`を使用してNode.jsアプリをホスト

### 4. 環境変数の設定

`.env`ファイルを作成：
ルートディレクトリに配置
```
PORT=3001
NODE_ENV=production
DB_PATH=C:\path\to\data\schedule.db
```

### 5. サービスとして実行（推奨）

PM2やnode-windowsを使用してWindowsサービスとして実行：

```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

PM2で停止・削除する場合:

```bash
pm2 stop schedule-app   # 一時停止
pm2 delete schedule-app # 登録から外す
```

**PM2について詳しく知りたい場合**: [PM2ガイド](docs/PM2_GUIDE.md)を参照してください。

**Windowsサービスとして実行する方法**: [Windowsサービスガイド](docs/WINDOWS_SERVICE_GUIDE.md)を参照してください。

## データベース

デフォルトではSQLiteを使用します。
- ローカル/自己ホスト: `server/data/schedule.db`（`DB_PATH` で変更可能）
- Vercel: `/tmp/schedule.db` に自動配置（揮発的）。永続化する場合は外部DBを利用してください。

## ライセンス

MIT
