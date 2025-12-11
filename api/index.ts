import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../server/src/app';
import { initDatabase } from '../server/src/database';

const app = createApp('/api');
const ready = initDatabase();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ready;
  return app(req as any, res as any);
}
