import { useEffect, useState, useCallback } from 'react';
import './WorldNews.css';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  severityLabel: string;
}

type Filter = 'all' | 'critical' | 'high' | 'medium' | 'low';

const SEVERITY_ICON: Record<string, string> = {
  critical: '🚨',
  high:     '⚠️',
  medium:   '📌',
  low:      '📰',
};

const CATEGORY_ICON: Record<string, string> = {
  'Conflict & War':  '⚔️',
  'Politics':        '🏛️',
  'Disaster':        '🌪️',
  'Health':          '🏥',
  'Economy':         '💹',
  'Science & Tech':  '🔬',
  'Environment':     '🌍',
  'Sports':          '🏆',
  'General':         '🌐',
};

const REFRESH_SEC = 90;

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      + ' · '
      + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

export default function WorldNews() {
  const [news, setNews]             = useState<NewsItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [filter, setFilter]         = useState<Filter>('all');
  const [countdown, setCountdown]   = useState(REFRESH_SEC);
  const [lastUpdated, setLastUpdated] = useState('');

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/news/world');
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

  useEffect(() => { fetchNews(); }, [fetchNews]);

  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { fetchNews(); return REFRESH_SEC; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [fetchNews]);

  const filtered = filter === 'all' ? news : news.filter(n => n.severity === filter);

  const counts = {
    all:      news.length,
    critical: news.filter(n => n.severity === 'critical').length,
    high:     news.filter(n => n.severity === 'high').length,
    medium:   news.filter(n => n.severity === 'medium').length,
    low:      news.filter(n => n.severity === 'low').length,
  };

  return (
    <div className="wn-panel">
      {/* Header */}
      <div className="wn-header">
        <div className="wn-header-left">
          <h2 className="wn-heading">🌍 World News</h2>
          {lastUpdated && <span className="wn-updated">Updated {lastUpdated}</span>}
        </div>
        <div className="wn-header-right">
          <span className="wn-countdown" title="Next auto-refresh">🔄 {countdown}s</span>
          <button className="wn-refresh-btn" onClick={fetchNews} disabled={loading}>Refresh</button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="wn-filters">
        {(['all', 'critical', 'high', 'medium', 'low'] as Filter[]).map(f => (
          <button
            key={f}
            className={`wn-chip${filter === f ? ' active' : ''} chip-${f}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? '📋' : SEVERITY_ICON[f]}&nbsp;
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="wn-chip-count">{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && news.length === 0 ? (
        <div className="wn-loading">
          <div className="wn-spinner" />
          Fetching latest world news…
        </div>
      ) : error ? (
        <div className="wn-error">⚠️ {error}</div>
      ) : filtered.length === 0 ? (
        <div className="wn-empty">No {filter} severity news found.</div>
      ) : (
        <div className="wn-list">
          {filtered.map(item => (
            <a
              key={item.id}
              className={`wn-card wn-card--${item.severity}`}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="wn-card-icon">{SEVERITY_ICON[item.severity]}</div>
              <div className="wn-card-body">
                <div className="wn-card-title">{item.title}</div>
                {item.description && (
                  <div className="wn-card-desc">{item.description}</div>
                )}
                <div className="wn-card-meta">
                  <span className="wn-card-source">{item.source}</span>
                  <span className="wn-dot">·</span>
                  <span className="wn-card-time">{formatDate(item.pubDate)}</span>
                  <span className="wn-category-badge">
                    {CATEGORY_ICON[item.category] || '🌐'} {item.category}
                  </span>
                  <span className={`wn-severity-badge wn-sev--${item.severity}`}>
                    {item.severityLabel}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
