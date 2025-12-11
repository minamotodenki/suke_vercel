import express from 'express';
import cors from 'cors';
import path from 'path';
import { eventRoutes } from './routes/events';
import { responseRoutes } from './routes/responses';

export function createApp(basePath = '/api') {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(`${basePath}/events`, eventRoutes);
  app.use(`${basePath}/responses`, responseRoutes);

  // サーバー単体で動かすときのみフロントを配信（Vercelでは無効にする）
  const isVercel = Boolean(process.env.VERCEL);
  const serveClient =
    !isVercel &&
    process.env.NODE_ENV === 'production' &&
    process.env.SERVE_CLIENT !== 'false';

  if (serveClient) {
    const buildPath = path.join(__dirname, '../../client/build');
    app.use(express.static(buildPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(buildPath, 'index.html'));
    });
  }

  return app;
}
