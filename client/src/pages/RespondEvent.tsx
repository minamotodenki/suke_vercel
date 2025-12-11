import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import { EventWithResponses, DateOption, Response } from '../types/event';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { parseServerDate } from '../utils/date';

function RespondEvent() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventWithResponses | null>(null);
  const [name, setName] = useState('');
  const [responses, setResponses] = useState<{ [key: string]: 'ok' | 'maybe' | 'ng' }>({});
  const [comment, setComment] = useState('');
  const [existingNames, setExistingNames] = useState<string[]>([]);
  const [selectedExistingName, setSelectedExistingName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const prefillName = searchParams.get('name') || '';

  useEffect(() => {
    if (id) {
      loadEvent(prefillName);
    }
  }, [id, prefillName]);

  const buildDefaultResponses = (options: DateOption[]) => {
    const initialResponses: { [key: string]: 'ok' | 'maybe' | 'ng' } = {};
    options.forEach((option: DateOption) => {
      initialResponses[option.id] = 'ok';
    });
    return initialResponses;
  };

  const applyExistingResponses = (targetName: string, eventData: EventWithResponses) => {
    const matching = eventData.responses.filter((r: Response) => r.name === targetName);
    if (matching.length === 0) {
      return false;
    }

    const latestByDate: { [key: string]: Response } = {};
    matching.forEach((r) => {
      const existing = latestByDate[r.date_option_id];
      if (!existing || parseServerDate(r.created_at) > parseServerDate(existing.created_at)) {
        latestByDate[r.date_option_id] = r;
      }
    });

    const nextResponses = buildDefaultResponses(eventData.date_options);
    eventData.date_options.forEach((option) => {
      if (latestByDate[option.id]) {
        nextResponses[option.id] = latestByDate[option.id].status;
      }
    });

    const latestComment = matching
      .filter((r) => r.comment)
      .sort((a, b) => parseServerDate(b.created_at).getTime() - parseServerDate(a.created_at).getTime())[0]?.comment || '';

    setName(targetName);
    setSelectedExistingName(targetName);
    setResponses(nextResponses);
    setComment(latestComment);

    return true;
  };

  const loadEvent = async (nameToPrefill?: string) => {
    try {
      const response = await apiClient.get(`/events/${id}`);
      const eventData: EventWithResponses = response.data;
      setEvent(eventData);
      setResponses(buildDefaultResponses(eventData.date_options));
      setExistingNames([...new Set(eventData.responses.map((r: Response) => r.name))]);

      if (nameToPrefill) {
        const applied = applyExistingResponses(nameToPrefill, eventData);
        if (!applied) {
          setName(nameToPrefill);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'イベントの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (dateOptionId: string, status: 'ok' | 'maybe' | 'ng') => {
    setResponses({ ...responses, [dateOptionId]: status });
  };

  const handleExistingResponderSelect = (selectedName: string) => {
    if (!event) return;
    if (!selectedName) {
      setSelectedExistingName('');
      setName('');
      setComment('');
      setResponses(buildDefaultResponses(event.date_options));
      return;
    }

    const applied = applyExistingResponses(selectedName, event);
    if (!applied) {
      setSelectedExistingName(selectedName);
      setName(selectedName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('名前を入力してください');
      return;
    }

    setSubmitting(true);

    try {
      const responseData = Object.keys(responses).map(dateOptionId => ({
        date_option_id: dateOptionId,
        status: responses[dateOptionId],
        comment: comment.trim() || undefined,
      }));

      await apiClient.post('/responses', {
        event_id: id,
        name: name.trim(),
        responses: responseData,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate(`/event/${id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || '回答の送信に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'M/d（E）', { locale: ja });
  };

  const formatTime = (timeStart?: string, timeEnd?: string) => {
    if (timeStart && timeEnd) {
      return `${timeStart}〜`;
    }
    if (timeStart) {
      return `${timeStart}〜`;
    }
    return '';
  };

  if (loading) {
    return (
      <div className="card">
        <div className="loading">読み込み中...</div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="card">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="card">
        <div className="alert alert-success">
          回答を送信しました。結果ページに移動します...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h2>{event?.title}</h2>
        {event?.description && (
          <p className="event-description">{event.description}</p>
        )}
      </div>

      <div className="card">
        <h3>出欠を入力</h3>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>お名前</label>
            {existingNames.length > 0 && (
              <div className="existing-responder">
                <select
                  value={selectedExistingName}
                  onChange={(e) => handleExistingResponderSelect(e.target.value)}
                >
                  <option value="">新しく入力する</option>
                  {existingNames.map((existingName) => (
                    <option key={existingName} value={existingName}>
                      {existingName}さんの回答を編集
                    </option>
                  ))}
                </select>
                <span className="existing-responder-note">
                  自分の名前を選ぶと前回の回答が読み込まれ、上書きできます
                </span>
              </div>
            )}
            <input
              type="text"
              value={name}
              onChange={(e) => {
                const nextName = e.target.value;
                if (selectedExistingName && nextName !== selectedExistingName) {
                  setSelectedExistingName('');
                }
                setName(nextName);
              }}
              placeholder="名前を入力してください"
              required
            />
            {selectedExistingName && (
              <p className="existing-responder-note mt-sm">
                {selectedExistingName}さんの前回の回答を編集中です
              </p>
            )}
          </div>

          <div className="form-group">
            <label>日程候補</label>
            <p className="text-secondary mb-md" style={{ fontSize: '13px' }}>
              各日程の○△×をクリックして出欠を選択してください
            </p>

            <table className="respond-table">
              <thead>
                <tr>
                  <th className="respond-date-column">日程</th>
                  <th className="respond-option-column">○</th>
                  <th className="respond-option-column">△</th>
                  <th className="respond-option-column">×</th>
                </tr>
              </thead>
              <tbody>
                {event?.date_options.map(option => (
                  <tr key={option.id}>
                    <td className="respond-date-cell">
                      {formatDate(option.date)} {formatTime(option.time_start, option.time_end)}
                    </td>
                    <td className="respond-option-cell">
                      <button
                        type="button"
                        className={`respond-btn respond-btn-ok ${responses[option.id] === 'ok' ? 'active' : ''}`}
                        onClick={() => handleResponseChange(option.id, 'ok')}
                      >
                        ○
                      </button>
                    </td>
                    <td className="respond-option-cell">
                      <button
                        type="button"
                        className={`respond-btn respond-btn-maybe ${responses[option.id] === 'maybe' ? 'active' : ''}`}
                        onClick={() => handleResponseChange(option.id, 'maybe')}
                      >
                        △
                      </button>
                    </td>
                    <td className="respond-option-cell">
                      <button
                        type="button"
                        className={`respond-btn respond-btn-ng ${responses[option.id] === 'ng' ? 'active' : ''}`}
                        onClick={() => handleResponseChange(option.id, 'ng')}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="form-group">
            <label>コメント（任意）</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="補足コメントがあれば入力してください"
              rows={3}
            />
          </div>

          <div className="flex gap-sm">
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={submitting}
              style={{ flex: 1 }}
            >
              {submitting ? '送信中...' : '回答を送信'}
            </button>
            <Link to={`/event/${id}`} className="btn btn-secondary btn-lg">
              戻る
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RespondEvent;




