import { useEffect, useState, useCallback } from 'react';
import './StockNews.css';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  score: number;
  label: string;
  level: 'high-positive' | 'positive' | 'neutral' | 'negative' | 'high-negative';
  direction: 'up' | 'down' | 'neutral';
}

type Filter = 'all' | 'up' | 'down' | 'neutral';

const DIRECTION_ICON: Record<string, string> = {
  up: '📈',
  down: '📉',
  neutral: '➡️',
};

const REFRESH_SEC = 60;

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      + ' · '
      + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

export default function StockNews() {
  const [news, setNews]         = useState<NewsItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [filter, setFilter]     = useState<Filter>('all');
  const [countdown, setCountdown] = useState(REFRESH_SEC);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/news/market');
      if (!res.ok) throw new Error('Failed to fetch news');
      const data = await res.json();
      setNews(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setCountdown(REFRESH_SEC);
    }
  }, []);

  // Initial fetch
  useEffect(() => { fetchNews(); }, [fetchNews]);

  // Auto-refresh countdown
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { fetchNews(); return REFRESH_SEC; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [fetchNews]);

  const filtered = filter === 'all' ? news : news.filter(n => n.direction === filter);

  const counts = {
    all: news.length,
    up: news.filter(n => n.direction === 'up').length,
    down: news.filter(n => n.direction === 'down').length,
    neutral: news.filter(n => n.direction === 'neutral').length,
  };

  return (
    <div className="news-panel">
      {/* Header */}
      <div className="news-header">
        <div className="news-header-left">
          <h2 className="news-heading">📰 Market News</h2>
          {lastUpdated && <span className="news-updated">Updated {lastUpdated}</span>}
        </div>
        <div className="news-header-right">
          <span className="news-countdown" title="Next auto-refresh">
            🔄 {countdown}s
          </span>
          <button className="news-refresh-btn" onClick={fetchNews} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="news-filters">
        {(['all', 'up', 'down', 'neutral'] as Filter[]).map(f => (
          <button
            key={f}
            className={`news-chip${filter === f ? ' active' : ''} chip-${f}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? '📋' : f === 'up' ? '📈' : f === 'down' ? '📉' : '➡️'}
            &nbsp;
            {f === 'all' ? 'All' : f === 'up' ? 'Bullish' : f === 'down' ? 'Bearish' : 'Neutral'}
            <span className="chip-count">{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && news.length === 0 ? (
        <div className="news-loading">
          <div className="news-spinner" />
          Fetching latest market news…
        </div>
      ) : error ? (
        <div className="news-error">⚠️ {error}</div>
      ) : filtered.length === 0 ? (
        <div className="news-empty">No {filter} news found.</div>
      ) : (
        <div className="news-list">
          {filtered.map(item => (
            <a
              key={item.id}
              className={`news-card news-card--${item.level}`}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="news-card-icon">{DIRECTION_ICON[item.direction]}</div>
              <div className="news-card-body">
                <div className="news-card-title">{item.title}</div>
                {item.description && (
                  <div className="news-card-desc">{item.description}</div>
                )}
                <div className="news-card-meta">
                  <span className="news-card-source">{item.source}</span>
                  <span className="news-card-dot">·</span>
                  <span className="news-card-time">{formatDate(item.pubDate)}</span>
                  <span className={`news-badge news-badge--${item.level}`}>{item.label}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
