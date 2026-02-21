import { useEffect, useState, useCallback } from 'react';
import './SalesDeals.css';

interface DealItem {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  category: string;
  categoryIcon: string;
  deal: 'hot' | 'great' | 'good' | 'regular';
  dealLabel: string;
  discount: string;
}

type Filter = 'all' | 'hot' | 'great' | 'good' | 'regular';
type CategoryFilter = 'all' | string;

const DEAL_ICON: Record<string, string> = {
  hot:     '🔥',
  great:   '⭐',
  good:    '✅',
  regular: '🏷️',
};

const REFRESH_SEC = 120;

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      + ' · '
      + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

export default function SalesDeals() {
  const [deals, setDeals]           = useState<DealItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [filter, setFilter]         = useState<Filter>('all');
  const [catFilter, setCatFilter]   = useState<CategoryFilter>('all');
  const [countdown, setCountdown]   = useState(REFRESH_SEC);
  const [lastUpdated, setLastUpdated] = useState('');

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/news/deals');
      if (!res.ok) throw new Error('Failed to fetch deals');
      const data = await res.json();
      setDeals(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setCountdown(REFRESH_SEC);
    }
  }, []);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { fetchDeals(); return REFRESH_SEC; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [fetchDeals]);

  // Unique categories from data
  const categories = ['all', ...Array.from(new Set(deals.map(d => d.category))).sort()];

  const filtered = deals.filter(d => {
    const matchDeal = filter === 'all' || d.deal === filter;
    const matchCat  = catFilter === 'all' || d.category === catFilter;
    return matchDeal && matchCat;
  });

  const counts: Record<string, number> = {
    all:     deals.length,
    hot:     deals.filter(d => d.deal === 'hot').length,
    great:   deals.filter(d => d.deal === 'great').length,
    good:    deals.filter(d => d.deal === 'good').length,
    regular: deals.filter(d => d.deal === 'regular').length,
  };

  return (
    <div className="sd-panel">
      {/* Header */}
      <div className="sd-header">
        <div className="sd-header-left">
          <h2 className="sd-heading">🛍️ Sales &amp; Deals</h2>
          {lastUpdated && <span className="sd-updated">Updated {lastUpdated}</span>}
        </div>
        <div className="sd-header-right">
          <span className="sd-countdown" title="Next auto-refresh">🔄 {countdown}s</span>
          <button className="sd-refresh-btn" onClick={fetchDeals} disabled={loading}>Refresh</button>
        </div>
      </div>

      {/* Deal quality filter chips */}
      <div className="sd-filters">
        {(['all', 'hot', 'great', 'good', 'regular'] as Filter[]).map(f => (
          <button
            key={f}
            className={`sd-chip${filter === f ? ' active' : ''} sd-chip--${f}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? '📋' : DEAL_ICON[f]}&nbsp;
            {f === 'all' ? 'All Deals' : f === 'hot' ? 'Hot' : f === 'great' ? 'Great' : f === 'good' ? 'Good' : 'Regular'}
            <span className="sd-chip-count">{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* Category filter row */}
      {categories.length > 2 && (
        <div className="sd-cat-filters">
          {categories.map(cat => (
            <button
              key={cat}
              className={`sd-cat-chip${catFilter === cat ? ' active' : ''}`}
              onClick={() => setCatFilter(cat)}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading && deals.length === 0 ? (
        <div className="sd-loading"><div className="sd-spinner" />Fetching latest deals &amp; sales…</div>
      ) : error ? (
        <div className="sd-error">⚠️ {error}</div>
      ) : filtered.length === 0 ? (
        <div className="sd-empty">No deals found for selected filters.</div>
      ) : (
        <div className="sd-list">
          {filtered.map(item => (
            <a
              key={item.id}
              className={`sd-card sd-card--${item.deal}`}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="sd-card-icon">{item.categoryIcon}</div>
              <div className="sd-card-body">
                <div className="sd-card-title">{item.title}</div>
                {item.description && (
                  <div className="sd-card-desc">{item.description}</div>
                )}
                <div className="sd-card-meta">
                  <span className="sd-card-source">{item.source}</span>
                  <span className="sd-dot">·</span>
                  <span className="sd-card-time">{formatDate(item.pubDate)}</span>
                  <span className="sd-cat-badge">{item.category}</span>
                  {item.discount && <span className="sd-discount">{item.discount}</span>}
                  <span className={`sd-deal-badge sd-deal--${item.deal}`}>
                    {DEAL_ICON[item.deal]} {item.dealLabel}
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
