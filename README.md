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

## Windows Server 2019へのデプロイ

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

デフォルトではSQLiteを使用します。本番環境ではSQL Serverへの移行を推奨します。

## ライセンス

MIT
