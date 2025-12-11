# PM2とは？Windows Server 2019での使用方法

## PM2とは

**PM2（Process Manager 2）**は、Node.jsアプリケーションを本番環境で実行・管理するためのプロセスマネージャーです。

### PM2の主な機能

1. **自動再起動**
   - アプリケーションがクラッシュした場合、自動的に再起動します
   - サーバー再起動時にも自動的にアプリを起動できます

2. **ログ管理**
   - アプリケーションのログを自動的に記録・保存
   - ログの確認が簡単

3. **パフォーマンス監視**
   - CPU使用率、メモリ使用量を監視
   - リアルタイムで状態を確認可能

4. **クラスターモード**
   - 複数のインスタンスを起動して負荷分散が可能

5. **ゼロダウンタイム再起動**
   - アプリケーションを停止せずに更新可能

## なぜPM2が推奨されるのか

### 通常の実行方法との比較

**通常の実行方法（`node server/dist/index.js`）:**
- ❌ ターミナルを閉じるとアプリが停止する
- ❌ エラーでクラッシュすると停止したまま
- ❌ サーバー再起動時に手動で起動が必要
- ❌ ログ管理が難しい

**PM2を使用した場合:**
- ✅ バックグラウンドで実行される（ターミナルを閉じても動作）
- ✅ クラッシュ時に自動再起動
- ✅ サーバー再起動時に自動起動（設定後）
- ✅ ログが自動保存される
- ✅ 状態監視が簡単

## Windows Server 2019でのインストールと使用方法

### 1. PM2のインストール

```powershell
npm install -g pm2
```

### 2. アプリケーションの起動

```powershell
pm2 start server\dist\index.js --name schedule-app
```

### 3. 状態の確認

```powershell
# 実行中のプロセス一覧
pm2 list

# 詳細情報
pm2 show schedule-app

# ログの確認
pm2 logs schedule-app

# リアルタイム監視
pm2 monit
```

### 4. アプリケーションの管理

```powershell
# 停止
pm2 stop schedule-app

# 再起動
pm2 restart schedule-app

# 削除
pm2 delete schedule-app

# すべてのプロセスを再起動
pm2 restart all
```

### 5. 設定の保存

```powershell
# 現在のプロセスリストを保存
pm2 save

# Windows起動時に自動起動するように設定
pm2 startup
```

`pm2 startup`を実行すると、Windowsのスタートアップスクリプトが作成されます。

### 6. PM2設定ファイルの作成（推奨）

`ecosystem.config.js`ファイルを作成すると、より詳細な設定が可能です：

```javascript
module.exports = {
  apps: [{
    name: 'schedule-app',
    script: './server/dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
```

設定ファイルを使用する場合：

```powershell
pm2 start ecosystem.config.js
```

## Windowsサービスとして実行する方法（代替手段）

PM2の代わりに、Windowsの標準サービスとして実行することもできます。

### node-windowsを使用する方法

```powershell
npm install -g node-windows
```

その後、サービス化スクリプトを作成します。

### NSSM（Non-Sucking Service Manager）を使用する方法

1. NSSMをダウンロード: https://nssm.cc/download
2. サービスとして登録:

```powershell
nssm install ScheduleApp "C:\Program Files\nodejs\node.exe" "C:\path\to\server\dist\index.js"
nssm start ScheduleApp
```

## PM2 vs Windowsサービス

| 機能 | PM2 | Windowsサービス |
|------|-----|----------------|
| インストールの簡単さ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| ログ管理 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 監視機能 | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Windows統合 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 設定の柔軟性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

## 推奨される使用方法

**開発環境・小規模運用**: PM2を使用
- 設定が簡単
- ログ管理が便利
- 監視機能が充実

**大規模運用・企業環境**: Windowsサービス（NSSMまたはnode-windows）
- Windows標準のサービス管理ツールと統合
- セキュリティポリシーに準拠しやすい

## トラブルシューティング

### PM2が起動しない場合

```powershell
# PM2のバージョン確認
pm2 --version

# プロセスの確認
pm2 list

# ログの確認
pm2 logs
```

### Windows起動時に自動起動しない場合

```powershell
# startup設定を再実行
pm2 unstartup
pm2 startup
pm2 save
```

## まとめ

PM2は、Node.jsアプリケーションを本番環境で安定して運用するための強力なツールです。特に、自動再起動やログ管理の機能により、運用の負担を大幅に軽減できます。Windows Server 2019でも問題なく動作します。

