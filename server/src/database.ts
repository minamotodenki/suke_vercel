import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';

const isVercel = Boolean(process.env.VERCEL);
const defaultDbPath = isVercel
  ? path.join('/tmp', 'schedule.db')
  : path.join(__dirname, '../data/schedule.db');

const dbPath = (() => {
  const envPath = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : null;
  const targetPath = envPath || defaultDbPath;
  const dir = path.dirname(targetPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return targetPath;
})();

let db: sqlite3.Database;

function getDatabase(): sqlite3.Database {
  if (!db) {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('データベース接続エラー:', err);
      } else {
        console.log(`データベースに接続しました: ${dbPath}`);
      }
    });
  }
  return db;
}

export function run(sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.run(sql, params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T);
    });
  });
}

export function all<T>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}

export async function initDatabase(): Promise<void> {
  // イベントテーブル
  await run(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME
    )
  `);

  // 日程候補テーブル
  await run(`
    CREATE TABLE IF NOT EXISTS date_options (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      date TEXT NOT NULL,
      time_start TEXT,
      time_end TEXT,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )
  `);

  // 回答テーブル
  await run(`
    CREATE TABLE IF NOT EXISTS responses (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      date_option_id TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('ok', 'maybe', 'ng')),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (date_option_id) REFERENCES date_options(id) ON DELETE CASCADE
    )
  `);

  // インデックス作成
  await run(`CREATE INDEX IF NOT EXISTS idx_responses_event ON responses(event_id)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_responses_date_option ON responses(date_option_id)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_date_options_event ON date_options(event_id)`);

  console.log('データベーステーブルを初期化しました');
}
