import 'dotenv/config';
import { createApp } from './app';
import { initDatabase } from './database';

const PORT = process.env.PORT || 3001;
const app = createApp();

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`サーバーがポート ${PORT} で起動しました`);
    });
  })
  .catch((error) => {
    console.error('データベースの初期化に失敗しました:', error);
    process.exit(1);
  });
