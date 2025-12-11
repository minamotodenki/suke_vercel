import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { get, all, run } from '../database';
import { Event, DateOption, EventWithOptions, EventWithResponses, Response as EventResponse } from '../models/Event';

const router = Router();

// イベント作成
router.post('/', async (req, res) => {
  try {
    const { title, description, date_options, expires_at } = req.body;

    if (!title || !date_options || !Array.isArray(date_options) || date_options.length === 0) {
      return res.status(400).json({ error: 'タイトルと日程候補は必須です' });
    }

    const eventId = uuidv4();
    const now = new Date().toISOString();

    // イベント作成
    await run(
      'INSERT INTO events (id, title, description, expires_at) VALUES (?, ?, ?, ?)',
      [eventId, title, description || null, expires_at || null]
    );

    // 日程候補の追加
    for (const option of date_options) {
      const optionId = uuidv4();
      await run(
        'INSERT INTO date_options (id, event_id, date, time_start, time_end) VALUES (?, ?, ?, ?, ?)',
        [optionId, eventId, option.date, option.time_start || null, option.time_end || null]
      );
    }

    res.json({ id: eventId, message: 'イベントが作成されました' });
  } catch (error) {
    console.error('イベント作成エラー:', error);
    res.status(500).json({ error: 'イベントの作成に失敗しました' });
  }
});

// イベント一覧（最近作成したものから）
router.get('/', async (_req, res) => {
  try {
    const events = await all<Event>(
      'SELECT id, title, description, created_at, expires_at FROM events ORDER BY created_at DESC LIMIT 50'
    );
    res.json(events);
  } catch (error) {
    console.error('イベント一覧取得エラー:', error);
    res.status(500).json({ error: 'イベント一覧の取得に失敗しました' });
  }
});

// イベント取得（回答含む）
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // イベント情報取得
    const event = await get<Event>('SELECT * FROM events WHERE id = ?', [id]);
    if (!event) {
      return res.status(404).json({ error: 'イベントが見つかりません' });
    }

    // 日程候補取得
    const dateOptions = await all<DateOption>(
      'SELECT * FROM date_options WHERE event_id = ? ORDER BY date, time_start',
      [id]
    );

    // 回答取得
    const responses = await all<EventResponse>(
      'SELECT * FROM responses WHERE event_id = ? ORDER BY created_at',
      [id]
    );

    const result: EventWithResponses = {
      ...event,
      date_options: dateOptions,
      responses: responses
    };

    res.json(result);
  } catch (error) {
    console.error('イベント取得エラー:', error);
    res.status(500).json({ error: 'イベントの取得に失敗しました' });
  }
});

// イベント取得（回答なし、回答用）
router.get('/:id/form', async (req, res) => {
  try {
    const { id } = req.params;

    const event = await get<Event>('SELECT * FROM events WHERE id = ?', [id]);
    if (!event) {
      return res.status(404).json({ error: 'イベントが見つかりません' });
    }

    const dateOptions = await all<DateOption>(
      'SELECT * FROM date_options WHERE event_id = ? ORDER BY date, time_start',
      [id]
    );

    const result: EventWithOptions = {
      ...event,
      date_options: dateOptions
    };

    res.json(result);
  } catch (error) {
    console.error('イベント取得エラー:', error);
    res.status(500).json({ error: 'イベントの取得に失敗しました' });
  }
});

// 日程候補の追加（既存イベントに追記）
router.post('/:id/date-options', async (req, res) => {
  try {
    const { id } = req.params;
    const { date_options } = req.body;

    if (!Array.isArray(date_options) || date_options.length === 0) {
      return res.status(400).json({ error: '追加する日程候補を指定してください' });
    }

    const event = await get<Event>('SELECT * FROM events WHERE id = ?', [id]);
    if (!event) {
      return res.status(404).json({ error: 'イベントが見つかりません' });
    }

    const addedOptions: DateOption[] = [];

    for (const option of date_options) {
      if (!option?.date) {
        return res.status(400).json({ error: '日付は必須です' });
      }

      const timeStart = option.time_start || null;
      const timeEnd = option.time_end || null;

      // 既存と重複する日程はスキップ
      const existing = await get<DateOption>(
        'SELECT * FROM date_options WHERE event_id = ? AND date = ? AND COALESCE(time_start, "") = COALESCE(?, "") AND COALESCE(time_end, "") = COALESCE(?, "")',
        [id, option.date, timeStart, timeEnd]
      );

      if (existing) {
        continue;
      }

      const optionId = uuidv4();
      await run(
        'INSERT INTO date_options (id, event_id, date, time_start, time_end) VALUES (?, ?, ?, ?, ?)',
        [optionId, id, option.date, timeStart, timeEnd]
      );

      addedOptions.push({
        id: optionId,
        event_id: id,
        date: option.date,
        time_start: option.time_start,
        time_end: option.time_end
      });
    }

    res.json({ added: addedOptions, message: '日程候補を追加しました' });
  } catch (error) {
    console.error('日程候補追加エラー:', error);
    res.status(500).json({ error: '日程候補の追加に失敗しました' });
  }
});

export { router as eventRoutes };





