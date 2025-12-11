import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { run, all } from '../database';
import { Response } from '../models/Event';

const router = Router();

// 回答登録
router.post('/', async (req, res) => {
  try {
    const { event_id, name, responses } = req.body;

    if (!event_id || !name || !responses || !Array.isArray(responses)) {
      return res.status(400).json({ error: 'イベントID、名前、回答は必須です' });
    }

    // 既存の回答を削除（同じ名前の人の回答を更新）
    await run(
      'DELETE FROM responses WHERE event_id = ? AND name = ?',
      [event_id, name]
    );

    // 新しい回答を登録
    for (const response of responses) {
      const { date_option_id, status, comment } = response;
      if (!date_option_id || !status) {
        continue;
      }

      const responseId = uuidv4();
      await run(
        'INSERT INTO responses (id, event_id, date_option_id, name, status, comment) VALUES (?, ?, ?, ?, ?, ?)',
        [responseId, event_id, date_option_id, name, status, comment || null]
      );
    }

    res.json({ message: '回答を登録しました' });
  } catch (error) {
    console.error('回答登録エラー:', error);
    res.status(500).json({ error: '回答の登録に失敗しました' });
  }
});

// イベントの回答一覧取得
router.get('/event/:event_id', async (req, res) => {
  try {
    const { event_id } = req.params;
    const responses = await all<Response>(
      'SELECT * FROM responses WHERE event_id = ? ORDER BY created_at',
      [event_id]
    );
    res.json(responses);
  } catch (error) {
    console.error('回答取得エラー:', error);
    res.status(500).json({ error: '回答の取得に失敗しました' });
  }
});

export { router as responseRoutes };






