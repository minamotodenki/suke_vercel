# Windows Server 2019向けデプロイスクリプト

Write-Host "スケジュール調整アプリのデプロイを開始します..." -ForegroundColor Green

# 1. 依存関係のインストール
Write-Host "依存関係をインストール中..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "依存関係のインストールに失敗しました" -ForegroundColor Red
    exit 1
}

# 2. サーバーのビルド
Write-Host "サーバーをビルド中..." -ForegroundColor Yellow
cd server
npm install
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "サーバーのビルドに失敗しました" -ForegroundColor Red
    exit 1
}
cd ..

# 3. クライアントのビルド
Write-Host "クライアントをビルド中..." -ForegroundColor Yellow
cd client
npm install
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "クライアントのビルドに失敗しました" -ForegroundColor Red
    exit 1
}
cd ..

# 4. データディレクトリの作成
Write-Host "データディレクトリを作成中..." -ForegroundColor Yellow
$dataDir = "server\data"
if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir | Out-Null
}

Write-Host "デプロイが完了しました！" -ForegroundColor Green
Write-Host ""
Write-Host "次のコマンドでアプリケーションを起動できます:" -ForegroundColor Cyan
Write-Host "  npm start" -ForegroundColor White
Write-Host ""
Write-Host "または、PM2を使用する場合:" -ForegroundColor Cyan
Write-Host "  pm2 start server\dist\index.js --name schedule-app" -ForegroundColor White






