import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { CreateEventRequest, Event } from '../types/event';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';

interface DateOption {
  id: string;
  date: Date;
  time: string;
  slot?: 'am' | 'pm';
}

const generateOptionId = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const sortDateOptions = (options: DateOption[]) => {
  return [...options].sort((a, b) => {
    const dateDiff = a.date.getTime() - b.date.getTime();
    if (dateDiff !== 0) return dateDiff;

    if (a.slot && b.slot && a.slot !== b.slot) {
      return a.slot === 'am' ? -1 : 1;
    }

    return (a.time || '').localeCompare(b.time || '');
  });
};

function CreateEvent() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateOptions, setDateOptions] = useState<DateOption[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [addTime, setAddTime] = useState(true);
  const [defaultAmEnabled, setDefaultAmEnabled] = useState(true);
  const [defaultPmEnabled, setDefaultPmEnabled] = useState(true);
  const [defaultAmTime, setDefaultAmTime] = useState('09:00');
  const [defaultPmTime, setDefaultPmTime] = useState('13:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingEvents, setExistingEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    loadExistingEvents();
  }, []);

  // カレンダーの日付を生成
  const generateCalendarDays = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });

    // 月初めの曜日に合わせて空白を追加
    const startDayOfWeek = getDay(start);
    const blanks = Array(startDayOfWeek).fill(null);

    return [...blanks, ...days];
  };

  const loadExistingEvents = async () => {
    setLoadingEvents(true);
    try {
      const response = await apiClient.get<Event[]>('/events');
      setExistingEvents(response.data);
    } catch (err) {
      // 一覧取得失敗は致命的でないのでログのみ
      console.error('イベント一覧取得失敗', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleDateClick = (date: Date) => {
    setDateOptions((prev) => {
      const hasDay = prev.some(opt => isSameDay(opt.date, date));
      if (hasDay) {
        // 既存の日をクリックしたらその日の候補を全て削除
        return prev.filter(opt => !isSameDay(opt.date, date));
      }

      const slotsToCreate: ('am' | 'pm')[] = [];
      if (defaultAmEnabled) slotsToCreate.push('am');
      if (defaultPmEnabled) slotsToCreate.push('pm');
      if (slotsToCreate.length === 0) slotsToCreate.push('am'); // 念のため午前だけをデフォルト追加

      const newOptions = slotsToCreate.map((slot) => ({
        id: generateOptionId(),
        date,
        time: addTime ? (slot === 'pm' ? defaultPmTime : defaultAmTime) : '',
        slot,
      }));

      return sortDateOptions([...prev, ...newOptions]);
    });
  };

  const toggleSlot = (date: Date, slot: 'am' | 'pm', enabled: boolean) => {
    setDateOptions((prev) => {
      const existing = prev.find(opt => isSameDay(opt.date, date) && opt.slot === slot);

      if (enabled) {
        if (existing) return prev;
        const newOption: DateOption = {
          id: generateOptionId(),
          date,
          time: addTime ? (slot === 'pm' ? defaultPmTime : defaultAmTime) : '',
          slot,
        };
        return sortDateOptions([...prev, newOption]);
      }

      if (!existing) return prev;
      return prev.filter(opt => opt.id !== existing.id);
    });
  };

  const isDateSelected = (date: Date) => {
    return dateOptions.some(opt => isSameDay(opt.date, date));
  };

  const removeDate = (date: Date) => {
    setDateOptions(prev => prev.filter(opt => !isSameDay(opt.date, date)));
  };

  const updateTime = (id: string, time: string) => {
    setDateOptions(prev =>
      sortDateOptions(
        prev.map(opt => opt.id === id ? { ...opt, time } : opt)
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('イベント名を入力してください');
      return;
    }

    if (dateOptions.length === 0) {
      setError('少なくとも1つの日程候補を選択してください');
      return;
    }

    setLoading(true);

    try {
      const request: CreateEventRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        date_options: dateOptions.map(opt => ({
          date: format(opt.date, 'yyyy-MM-dd'),
          time_start: addTime && opt.time ? opt.time : undefined,
          time_end: undefined,
        })),
      };

      const response = await apiClient.post('/events', request);
      navigate(`/event/${response.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'イベントの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  const groupedDateOptions = Object.values(
    dateOptions.reduce((acc, opt) => {
      const key = format(opt.date, 'yyyy-MM-dd');
      if (!acc[key]) {
        acc[key] = { date: opt.date, slots: {} as { am?: DateOption; pm?: DateOption } };
      }
      if (opt.slot === 'am' || opt.slot === 'pm') {
        acc[key].slots[opt.slot] = opt;
      }
      return acc;
    }, {} as Record<string, { date: Date; slots: { am?: DateOption; pm?: DateOption } }>)
  ).sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div>
      <div className="card">
        <h2>出欠表をつくる</h2>
      </div>

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="create-form-layout">
          {/* 左側: イベント情報 */}
          <div className="create-form-left">
            <div className="card">
              <h3>STEP1 イベント名</h3>
              <div className="form-group">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="イベント名を入力"
                  required
                />
              </div>

              <h3 className="mt-lg">メモ</h3>
              <div className="form-group">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="例）飲み会の日程調整しましょう！出欠〆切は○日など"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* 中央: 日程候補リスト */}
          <div className="create-form-center">
            <div className="card">
              <h3>STEP2 日程候補</h3>
              <p className="text-secondary mb-md" style={{ fontSize: '13px' }}>
                カレンダーをクリックして日付を追加し、午前/午後のチェックボックスで枠を切り替えられます。選択済みの日付をもう一度クリックすると丸ごと削除されます。
              </p>

              <div className="date-list">
                {dateOptions.length === 0 ? (
                  <div className="date-list-empty">
                    右のカレンダーから日付を選択してください
                  </div>
                ) : (
                  groupedDateOptions.map(({ date, slots }) => (
                    <div key={format(date, 'yyyy-MM-dd')} className="date-list-item">
                      <span className="date-list-date">
                        {format(date, 'M/d（E）', { locale: ja })}
                      </span>
                      <div className="slot-options">
                        {(['am', 'pm'] as const).map((slot) => {
                          const opt = slots[slot];
                          return (
                            <div key={slot} className="slot-row">
                              <label className="slot-checkbox">
                                <input
                                  type="checkbox"
                                  checked={!!opt}
                                  onChange={(e) => toggleSlot(date, slot, e.target.checked)}
                                />
                                {slot === 'am' ? '午前' : '午後'}
                              </label>
                              {addTime && opt && (
                                <input
                                  type="time"
                                  value={opt.time}
                                  onChange={(e) => updateTime(opt.id, e.target.value)}
                                  className="date-list-time"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        className="date-list-remove"
                        onClick={() => removeDate(date)}
                        title="この日付を削除"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 右側: カレンダー */}
          <div className="create-form-right">
            <div className="card">
              <div className="time-option">
                <div className="time-option-head">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={addTime}
                      onChange={(e) => setAddTime(e.target.checked)}
                    />
                    日付の後に時刻を追加する
                  </label>
                  <p className="time-option-note">
                    日付をクリックするとチェック済みの枠が追加されます。日付を再クリックするとその日を削除します。
                  </p>
                </div>
                {addTime && (
                  <div className="time-defaults">
                    <label className="time-default-row">
                      <span className="time-default-checkbox">
                        <input
                          type="checkbox"
                          checked={defaultAmEnabled}
                          onChange={(e) => setDefaultAmEnabled(e.target.checked)}
                        />
                        午前
                      </span>
                      <input
                        type="time"
                        value={defaultAmTime}
                        onChange={(e) => setDefaultAmTime(e.target.value)}
                        className="default-time-input"
                      />
                    </label>
                    <label className="time-default-row">
                      <span className="time-default-checkbox">
                        <input
                          type="checkbox"
                          checked={defaultPmEnabled}
                          onChange={(e) => setDefaultPmEnabled(e.target.checked)}
                        />
                        午後
                      </span>
                      <input
                        type="time"
                        value={defaultPmTime}
                        onChange={(e) => setDefaultPmTime(e.target.value)}
                        className="default-time-input"
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="calendar">
                <div className="calendar-header">
                  <button
                    type="button"
                    className="calendar-nav"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    &lt;
                  </button>
                  <span className="calendar-title">
                    {format(currentMonth, 'yyyy年M月', { locale: ja })}
                  </span>
                  <button
                    type="button"
                    className="calendar-nav"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    &gt;
                  </button>
                </div>

                <div className="calendar-weekdays">
                  {weekDays.map((day, i) => (
                    <div
                      key={day}
                      className={`calendar-weekday ${i === 0 ? 'sunday' : ''} ${i === 6 ? 'saturday' : ''}`}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="calendar-days">
                  {calendarDays.map((day, index) => (
                    <div key={index} className="calendar-cell">
                      {day && (
                        <button
                          type="button"
                          className={`calendar-day ${isDateSelected(day) ? 'selected' : ''} ${getDay(day) === 0 ? 'sunday' : ''} ${getDay(day) === 6 ? 'saturday' : ''}`}
                          onClick={() => handleDateClick(day)}
                        >
                          {format(day, 'd')}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="create-submit">
          <button
            type="submit"
            className="btn-create"
            disabled={loading}
          >
            {loading ? '作成中...' : '出欠表をつくる'}
          </button>
        </div>
      </form>

      <div className="card">
        <div className="section-header">
          <h3>過去に作成した出欠表</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={loadExistingEvents} disabled={loadingEvents}>
            {loadingEvents ? '更新中...' : '最新を取得'}
          </button>
        </div>
        {loadingEvents && <div className="text-secondary">読み込み中...</div>}
        {!loadingEvents && existingEvents.length === 0 && (
          <div className="text-secondary">まだ作成した出欠表はありません</div>
        )}
        {!loadingEvents && existingEvents.length > 0 && (
          <div className="existing-event-list">
            {existingEvents.slice(0, 10).map((evt) => (
              <Link key={evt.id} to={`/event/${evt.id}`} className="existing-event-item">
                <div className="existing-event-title">{evt.title}</div>
                <div className="existing-event-meta">
                  作成日: {format(new Date(evt.created_at), 'yyyy/MM/dd HH:mm', { locale: ja })}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateEvent;





