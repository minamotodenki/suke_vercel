import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import apiClient from '../api/client';
import { EventWithResponses, Response } from '../types/event';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { parseServerDate } from '../utils/date';

function ViewEvent() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventWithResponses | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');

  useEffect(() => {
    if (id) {
      loadEvent();
      setShareUrl(`${window.location.origin}/event/${id}/respond`);
    }
  }, [id]);

  const loadEvent = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/events/${id}`);
      setEvent(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'イベントの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    setCopyError('');

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // 非セキュア環境用フォールバック
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('クリップボードへのコピーに失敗しました', err);
      setCopyError('コピーに失敗しました。手動でURLを選択してください。');
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

  // 参加者ごとの回答をまとめる
  const getRespondersData = () => {
    if (!event) return [];

    const responderMap: { [name: string]: { [dateOptionId: string]: Response } } = {};

    event.responses.forEach(r => {
      if (!responderMap[r.name]) {
        responderMap[r.name] = {};
      }
      // 最新の回答を使用
      const current = responderMap[r.name][r.date_option_id];
      const incomingDate = parseServerDate(r.created_at);
      const existingDate = current ? parseServerDate(current.created_at) : null;

      if (!current || incomingDate > (existingDate || incomingDate)) {
        responderMap[r.name][r.date_option_id] = r;
      }
    });

    return Object.entries(responderMap).map(([name, responses]) => ({
      name,
      responses,
    }));
  };

  // 各日程の集計
  const getStatusCount = (dateOptionId: string, status: 'ok' | 'maybe' | 'ng') => {
    const responders = getRespondersData();
    return responders.filter(r => r.responses[dateOptionId]?.status === status).length;
  };

  const getStatusIcon = (status: 'ok' | 'maybe' | 'ng' | undefined) => {
    switch (status) {
      case 'ok':
        return <span className="status-icon status-icon-ok">○</span>;
      case 'maybe':
        return <span className="status-icon status-icon-maybe">△</span>;
      case 'ng':
        return <span className="status-icon status-icon-ng">×</span>;
      default:
        return <span className="status-icon status-icon-none">-</span>;
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="loading">読み込み中...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="card">
        <div className="alert alert-error">{error || 'イベントが見つかりません'}</div>
      </div>
    );
  }

  const responders = getRespondersData();

  return (
    <div>
      <div className="card event-header-card">
        <div className="event-header-main">
          <h2>{event.title}</h2>
          {event.description && (
            <p className="event-description">{event.description}</p>
          )}
        </div>
        {shareUrl && (
          <div className="event-header-qr">
            <QRCodeSVG value={shareUrl} size={112} />
            <span className="event-qr-caption">共有URLをQRで表示</span>
          </div>
        )}
      </div>

      <div className="card">
        <div className="section-header">
          <h3>日程候補</h3>
          <span className="responder-count">{responders.length}人が回答</span>
        </div>

        <div className="schedule-table-wrapper">
          <table className="schedule-table">
            <thead>
              <tr>
                <th className="date-column">日程</th>
                <th className="count-column">○</th>
                <th className="count-column">△</th>
                <th className="count-column">×</th>
                {responders.map(responder => (
                  <th key={responder.name} className="responder-column">
                    <Link
                      to={`/event/${id}/respond?name=${encodeURIComponent(responder.name)}`}
                      className="responder-name-link"
                      title={`${responder.name}の回答を編集`}
                    >
                      {responder.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {event.date_options.map(option => {
                const allOk = responders.length > 0 &&
                  responders.every(responder => responder.responses[option.id]?.status === 'ok');
                return (
                  <tr key={option.id} className={`date-option-row ${allOk ? 'all-ok' : ''}`}>
                    <td className="date-cell">
                      <div className="date-text">
                        {formatDate(option.date)} {formatTime(option.time_start, option.time_end)}
                      </div>
                    </td>
                    <td className="count-cell count-ok">
                      {getStatusCount(option.id, 'ok')}人
                    </td>
                    <td className="count-cell count-maybe">
                      {getStatusCount(option.id, 'maybe')}人
                    </td>
                    <td className="count-cell count-ng">
                      {getStatusCount(option.id, 'ng')}人
                    </td>
                    {responders.map(responder => (
                      <td key={responder.name} className="response-cell">
                        {getStatusIcon(responder.responses[option.id]?.status)}
                      </td>
                    ))}
                  </tr>
                );
              })}
              <tr className="comment-row">
                <td className="date-cell">コメント</td>
                <td className="count-cell"></td>
                <td className="count-cell"></td>
                <td className="count-cell"></td>
                {responders.map(responder => {
                  const comments = Object.values(responder.responses)
                    .filter(r => r.comment)
                    .map(r => r.comment);
                  return (
                    <td key={responder.name} className="comment-cell">
                      {comments.length > 0 ? comments[0] : '-'}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="respond-button-wrapper">
          <Link to={`/event/${id}/respond`} className="btn-respond">
            出欠を<br />入力する
          </Link>
        </div>
      </div>

      <div className="card">
        <h3>共有URL</h3>
        <p className="share-description">このURLをメンバーに共有してください</p>
        <div className="share-link-input">
          <input type="text" value={shareUrl} readOnly />
          <button className="btn btn-secondary" onClick={copyToClipboard}>
            {copied ? 'コピー済み' : 'コピー'}
          </button>
        </div>
        {copyError && <div className="alert alert-error mt-sm">{copyError}</div>}
      </div>
    </div>
  );
}

export default ViewEvent;
