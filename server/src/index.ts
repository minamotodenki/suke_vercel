import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { initDatabase } from './database';
import { eventRoutes } from './routes/events';
import { responseRoutes } from './routes/responses';

const app = express();
const PORT = process.env.PORT || 3001;

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// APIルート
app.use('/api/events', eventRoutes);
app.use('/api/responses', responseRoutes);

// 本番環境ではReactアプリを配信
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/build/index.html'));
  });
}

// データベース初期化
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`サーバーがポート ${PORT} で起動しました`);
  });
}).catch((error) => {
  console.error('データベースの初期化に失敗しました:', error);
  process.exit(1);
});

