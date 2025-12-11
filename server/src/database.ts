import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { Pool } from 'pg';

type Provider = 'sqlite' | 'postgres';

const postgresUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  '';

const provider: Provider =
  (process.env.DB_PROVIDER || '').toLowerCase() === 'postgres' || postgresUrl
    ? 'postgres'
    : 'sqlite';

const isVercel = Boolean(process.env.VERCEL);
const defaultDbPath = isVercel
  ? path.join('/tmp', 'schedule.db')
  : path.join(__dirname, '../data/schedule.db');

const dbPath = (() => {
  if (provider === 'postgres') return '';

  const envPath = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : null;
  const targetPath = envPath || defaultDbPath;
  const dir = path.dirname(targetPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return targetPath;
})();

let sqliteDb: sqlite3.Database;
let pgPool: Pool | null = null;

function normalizeSqlForPostgres(sql: string) {
  let index = 0;
  return sql.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });
}

function getSqlite(): sqlite3.Database {
  if (!sqliteDb) {
    sqliteDb = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('データベース接続エラー:', err);
      } else {
        console.log(`SQLiteに接続しました: ${dbPath}`);
      }
    });
  }
  return sqliteDb;
}

function getPostgres(): Pool {
  if (!postgresUrl) {
    throw new Error('Postgresを使用する場合は DATABASE_URL または POSTGRES_URL を設定してください');
  }

  if (!pgPool) {
    pgPool = new Pool({
      connectionString: postgresUrl,
      ssl:
        process.env.PGSSLMODE === 'disable'
          ? false
          : { rejectUnauthorized: false },
    });
    console.log('Postgresに接続します');
  }
  return pgPool;
}

export async function run(sql: string, params: any[] = []): Promise<void> {
  if (provider === 'sqlite') {
    await new Promise<void>((resolve, reject) => {
      const database = getSqlite();
      database.run(sql, params, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    return;
  }

  const pool = getPostgres();
  const text = normalizeSqlForPostgres(sql);
  await pool.query(text, params);
}

export async function get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
  if (provider === 'sqlite') {
    return new Promise((resolve, reject) => {
      const database = getSqlite();
      database.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row as T);
      });
    });
  }

  const pool = getPostgres();
  const text = normalizeSqlForPostgres(sql);
  const result = await pool.query(text, params);
  return (result.rows[0] as T) || undefined;
}

export async function all<T>(sql: string, params: any[] = []): Promise<T[]> {
  if (provider === 'sqlite') {
    return new Promise((resolve, reject) => {
      const database = getSqlite();
      database.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as T[]);
      });
    });
  }

  const pool = getPostgres();
  const text = normalizeSqlForPostgres(sql);
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function initDatabase(): Promise<void> {
  const timestampType = provider === 'postgres' ? 'TIMESTAMPTZ' : 'DATETIME';

  await run(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      created_at ${timestampType} DEFAULT CURRENT_TIMESTAMP,
      expires_at ${timestampType}
    )
  `);

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

  await run(`
    CREATE TABLE IF NOT EXISTS responses (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      date_option_id TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('ok', 'maybe', 'ng')),
      comment TEXT,
      created_at ${timestampType} DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (date_option_id) REFERENCES date_options(id) ON DELETE CASCADE
    )
  `);

  await run(`CREATE INDEX IF NOT EXISTS idx_responses_event ON responses(event_id)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_responses_date_option ON responses(date_option_id)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_date_options_event ON date_options(event_id)`);

  console.log(`データベーステーブルを初期化しました (${provider})`);
}
