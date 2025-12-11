import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../server/src/app';
import { initDatabase } from '../server/src/database';

const app = createApp('/api');
const ready = initDatabase();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ready;

  // Vercelのキャッチオール関数では req.url が '/api' を含まない場合があるため補正する
  if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url}`;
  }

  return app(req as any, res as any);
}
