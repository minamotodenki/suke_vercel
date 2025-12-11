# Windowsサービスとして実行する方法（PM2の代替）

PM2の代わりに、Windows標準のサービスとしてアプリケーションを実行する方法を説明します。

## 方法1: NSSM（Non-Sucking Service Manager）を使用

NSSMは、任意のプログラムをWindowsサービスとして実行できるツールです。

### 1. NSSMのダウンロードとインストール

1. https://nssm.cc/download からNSSMをダウンロード
2. 適切なフォルダ（例: `C:\nssm`）に解凍

### 2. サービスとして登録

PowerShellを**管理者として実行**し、以下を実行：

```powershell
# NSSMのパスに移動（例）
cd C:\nssm\win64

# サービスとして登録
.\nssm.exe install ScheduleApp "C:\Program Files\nodejs\node.exe" "C:\path\to\suke\server\dist\index.js"

# 作業ディレクトリの設定
.\nssm.exe set ScheduleApp AppDirectory "C:\path\to\suke\server"

# 環境変数の設定（必要に応じて）
.\nssm.exe set ScheduleApp AppEnvironmentExtra "NODE_ENV=production" "PORT=3001"

# サービスの開始
.\nssm.exe start ScheduleApp
```

### 3. サービスの管理

```powershell
# サービス開始
.\nssm.exe start ScheduleApp

# サービス停止
.\nssm.exe stop ScheduleApp

# サービス削除
.\nssm.exe remove ScheduleApp confirm
```

または、Windowsの「サービス」管理ツール（`services.msc`）からも管理できます。

## 方法2: node-windowsを使用

node-windowsは、Node.jsアプリケーションをWindowsサービスとして実行するためのnpmパッケージです。

### 1. node-windowsのインストール

```powershell
npm install -g node-windows
```

### 2. サービス化スクリプトの作成

`install-service.js`を作成：

```javascript
const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
  name: 'Schedule App',
  description: 'スケジュール調整アプリケーション',
  script: path.join(__dirname, 'server', 'dist', 'index.js'),
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ],
  env: [
    {
      name: 'NODE_ENV',
      value: 'production'
    },
    {
      name: 'PORT',
      value: '3001'
    }
  ]
});

svc.on('install', () => {
  console.log('サービスがインストールされました');
  svc.start();
});

svc.on('start', () => {
  console.log('サービスが開始されました');
});

svc.install();
```

### 3. サービスのインストール

PowerShellを**管理者として実行**：

```powershell
node install-service.js
```

### 4. サービスのアンインストール

`uninstall-service.js`を作成：

```javascript
const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
  name: 'Schedule App',
  script: path.join(__dirname, 'server', 'dist', 'index.js')
});

svc.on('uninstall', () => {
  console.log('サービスがアンインストールされました');
});

svc.uninstall();
```

## 方法3: Windows Task Schedulerを使用

Windows標準のタスクスケジューラを使用する方法です。

### 1. バッチファイルの作成

`start-app.bat`を作成：

```batch
@echo off
cd /d C:\path\to\suke\server
node dist\index.js
```

### 2. タスクスケジューラで設定

1. 「タスクスケジューラ」を開く（`taskschd.msc`）
2. 「基本タスクの作成」を選択
3. 以下のように設定：
   - **名前**: Schedule App
   - **トリガー**: コンピューターの起動時
   - **操作**: プログラムの開始
   - **プログラム**: `C:\path\to\start-app.bat`
   - **開始位置**: `C:\path\to\suke\server`

## 各方法の比較

| 方法 | メリット | デメリット |
|------|---------|-----------|
| **NSSM** | 設定が簡単、GUIあり | 外部ツールが必要 |
| **node-windows** | Node.jsから直接制御可能 | npmパッケージが必要 |
| **Task Scheduler** | Windows標準機能 | クラッシュ時の自動再起動が難しい |

## 推奨

- **簡単さ重視**: NSSM
- **Node.js統合重視**: node-windows
- **標準機能のみ使用**: Task Scheduler

## 注意事項

- いずれの方法でも、PowerShellを**管理者として実行**する必要があります
- サービスとして実行する場合、環境変数は明示的に設定する必要があります
- ログファイルのパスは絶対パスで指定することを推奨します

