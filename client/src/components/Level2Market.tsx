import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Level2Market.css';

// ── Types ──────────────────────────────────────────────────────────────────
interface OrderLevel {
  price: number;
  size: number;
  orders: number;
}

interface Indicators {
  rsi: number;
  vwap: number;
  sma20: number;
  sma9: number;
}

interface Signal {
  action: string;
  confidence: string;
  color: string;
  score: number;
  reasons: string[];
}

interface Candle {
  t: number;
  c: number;
  v: number;
}

interface L2Data {
  symbol: string;
  name: string;
  price: number;
  bid: number;
  ask: number;
  spread: number;
  spreadPct: number;
  change: number;
  changePct: number;
  volume: number;
  avgVolume: number;
  dayLow: number;
  dayHigh: number;
  open: number;
  prevClose: number;
  week52Low: number;
  week52High: number;
  marketCap: number;
  bids: OrderLevel[];
  asks: OrderLevel[];
  totalBidVol: number;
  totalAskVol: number;
  indicators: Indicators;
  signal: Signal;
  candles: Candle[];
  updatedAt: string;
}

interface PlacedOrder {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  price: number;
  qty: number;
  type: 'MARKET' | 'LIMIT';
  status: 'PENDING' | 'FILLED' | 'CANCELLED';
  placedAt: string;
}

const DEFAULT_WATCHLIST = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA'];
const REFRESH_SEC = 30;

function fmt(n: number, decimals = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function fmtMktCap(n: number) {
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6)  return '$' + (n / 1e6).toFixed(2) + 'M';
  return '$' + n.toLocaleString();
}
function fmtVol(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return String(n);
}

// Simple SVG sparkline for candle closes
function Sparkline({ candles }: { candles: Candle[] }) {
  if (candles.length < 2) return null;
  const closes = candles.map(c => c.c);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const W = 280, H = 56;
  const pts = closes.map((c, i) => {
    const x = (i / (closes.length - 1)) * W;
    const y = H - ((c - min) / range) * H;
    return `${x},${y}`;
  }).join(' ');
  const last = closes[closes.length - 1];
  const first = closes[0];
  const color = last >= first ? '#22c55e' : '#ef4444';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="l2-sparkline" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export default function Level2Market() {
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('l2_watchlist') || 'null') || DEFAULT_WATCHLIST; }
    catch { return DEFAULT_WATCHLIST; }
  });
  const [selected, setSelected] = useState<string>(watchlist[0] || 'AAPL');
  const [data, setData] = useState<L2Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(REFRESH_SEC);
  const [addInput, setAddInput] = useState('');
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [orders, setOrders] = useState<PlacedOrder[]>(() => {
    try { return JSON.parse(localStorage.getItem('l2_orders') || '[]'); }
    catch { return []; }
  });
  const [orderQty, setOrderQty] = useState('10');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [orderPrice, setOrderPrice] = useState('');
  const [orderTab, setOrderTab] = useState<'book' | 'orders'>('book');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchL2 = useCallback(async (sym: string) => {
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`/api/market/level2/${sym}`);
      const json = await r.json();
      if (!r.ok) { setError(json.error || 'Failed to load data'); setData(null); }
      else setData(json);
    } catch {
      setError('Network error — check connection');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh
  useEffect(() => {
    fetchL2(selected);
    setCountdown(REFRESH_SEC);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { fetchL2(selected); return REFRESH_SEC; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [selected, fetchL2]);

  // Persist watchlist + orders
  useEffect(() => { localStorage.setItem('l2_watchlist', JSON.stringify(watchlist)); }, [watchlist]);
  useEffect(() => { localStorage.setItem('l2_orders', JSON.stringify(orders)); }, [orders]);

  const addToWatchlist = async () => {
    const sym = addInput.toUpperCase().trim();
    if (!sym) return;
    if (watchlist.includes(sym)) { setAddError('Already in watchlist'); return; }
    setAddLoading(true); setAddError('');
    try {
      const r = await fetch(`/api/market/quote/${sym}`);
      if (!r.ok) { setAddError('Symbol not found'); return; }
      setWatchlist(prev => [...prev, sym]);
      setSelected(sym);
      setAddInput('');
    } catch {
      setAddError('Network error');
    } finally {
      setAddLoading(false);
    }
  };

  const removeFromWatchlist = (sym: string) => {
    const next = watchlist.filter(s => s !== sym);
    setWatchlist(next);
    if (selected === sym) setSelected(next[0] || '');
  };

  const placeOrder = (side: 'BUY' | 'SELL') => {
    if (!data) return;
    const qty = parseInt(orderQty);
    if (!qty || qty <= 0) return;
    const price = orderType === 'LIMIT' ? parseFloat(orderPrice) : (side === 'BUY' ? data.ask : data.bid);
    if (!price) return;
    const order: PlacedOrder = {
      id: Date.now().toString(36),
      symbol: data.symbol,
      side,
      price,
      qty,
      type: orderType,
      status: orderType === 'MARKET' ? 'FILLED' : 'PENDING',
      placedAt: new Date().toISOString(),
    };
    setOrders(prev => [order, ...prev]);
    setOrderTab('orders');
  };

  const cancelOrder = (id: string) => {
    setOrders(prev => prev.map(o => o.id === id && o.status === 'PENDING' ? { ...o, status: 'CANCELLED' } : o));
  };

  const clearOrders = () => setOrders([]);

  // ── Render ──────────────────────────────────────────────────────────────
  const maxBidVol = data ? Math.max(...data.bids.map(b => b.size), 1) : 1;
  const maxAskVol = data ? Math.max(...data.asks.map(a => a.size), 1) : 1;

  return (
    <div className="l2-wrapper">
      {/* Header / Watchlist */}
      <div className="l2-header">
        <div className="l2-title-row">
          <h2 className="l2-title">📊 Level 2 Market Data</h2>
          <span className="l2-refresh-badge">↻ {countdown}s</span>
          <button className="l2-refresh-btn" onClick={() => { fetchL2(selected); setCountdown(REFRESH_SEC); }}>Refresh Now</button>
        </div>

        <div className="l2-watchlist-row">
          {watchlist.map(sym => (
            <div key={sym} className={`l2-chip ${sym === selected ? 'active' : ''}`}>
              <span onClick={() => setSelected(sym)}>{sym}</span>
              {watchlist.length > 1 &&
                <button className="l2-chip-remove" onClick={() => removeFromWatchlist(sym)}>×</button>
              }
            </div>
          ))}
          <div className="l2-add-row">
            <input
              className="l2-add-input"
              value={addInput}
              onChange={e => { setAddInput(e.target.value.toUpperCase()); setAddError(''); }}
              onKeyDown={e => e.key === 'Enter' && addToWatchlist()}
              placeholder="Add symbol…"
              maxLength={10}
            />
            <button className="l2-add-btn" onClick={addToWatchlist} disabled={addLoading}>
              {addLoading ? '…' : '+'}
            </button>
            {addError && <span className="l2-add-error">{addError}</span>}
          </div>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && <div className="l2-loading"><div className="l2-spinner" /><span>Fetching Level 2 data…</span></div>}
      {error && <div className="l2-error">⚠ {error}</div>}

      {/* Main Content */}
      {data && !loading && (
        <div className="l2-body">

          {/* ── Price Panel ── */}
          <div className="l2-price-panel">
            <div className="l2-price-left">
              <div className="l2-sym-name">{data.name}</div>
              <div className="l2-sym-ticker">{data.symbol}</div>
              <div className="l2-price">${fmt(data.price)}</div>
              <div className={`l2-change ${data.changePct >= 0 ? 'pos' : 'neg'}`}>
                {data.changePct >= 0 ? '▲' : '▼'} {fmt(Math.abs(data.change))} ({fmt(Math.abs(data.changePct))}%)
              </div>
            </div>
            <div className="l2-price-right">
              <Sparkline candles={data.candles} />
              <div className="l2-meta-grid">
                <span>Bid</span><strong className="green">${fmt(data.bid)}</strong>
                <span>Ask</span><strong className="red">${fmt(data.ask)}</strong>
                <span>Spread</span><strong>{fmt(data.spread)} ({data.spreadPct}%)</strong>
                <span>Open</span><strong>${fmt(data.open)}</strong>
                <span>Day Lo/Hi</span><strong>${fmt(data.dayLow)} – ${fmt(data.dayHigh)}</strong>
                <span>52W Lo/Hi</span><strong>${fmt(data.week52Low)} – ${fmt(data.week52High)}</strong>
                <span>Volume</span><strong>{fmtVol(data.volume)}</strong>
                <span>Avg Vol</span><strong>{fmtVol(data.avgVolume)}</strong>
                <span>Mkt Cap</span><strong>{fmtMktCap(data.marketCap)}</strong>
              </div>
            </div>
          </div>

          {/* ── Signal Panel ── */}
          <div className={`l2-signal-panel ${data.signal.color}`}>
            <div className="l2-signal-main">
              <span className="l2-signal-action">{data.signal.action}</span>
              <span className="l2-signal-conf">{data.signal.confidence} Confidence</span>
              <span className="l2-signal-score">Score: {data.signal.score > 0 ? '+' : ''}{data.signal.score}</span>
            </div>
            <div className="l2-signal-reasons">
              {data.signal.reasons.map((r, i) => <span key={i} className="l2-reason-pill">{r}</span>)}
            </div>
            <div className="l2-indicators">
              <div className="l2-ind">
                <span>RSI(14)</span>
                <strong style={{ color: data.indicators.rsi > 70 ? '#ef4444' : data.indicators.rsi < 30 ? '#22c55e' : '#94a3b8' }}>
                  {data.indicators.rsi}
                </strong>
              </div>
              <div className="l2-ind">
                <span>VWAP</span>
                <strong style={{ color: data.price > data.indicators.vwap ? '#22c55e' : '#ef4444' }}>
                  ${fmt(data.indicators.vwap)}
                </strong>
              </div>
              <div className="l2-ind">
                <span>SMA9</span>
                <strong style={{ color: data.price > data.indicators.sma9 ? '#22c55e' : '#ef4444' }}>
                  ${fmt(data.indicators.sma9)}
                </strong>
              </div>
              <div className="l2-ind">
                <span>SMA20</span>
                <strong style={{ color: data.price > data.indicators.sma20 ? '#22c55e' : '#ef4444' }}>
                  ${fmt(data.indicators.sma20)}
                </strong>
              </div>
              <div className="l2-ind">
                <span>Bid Vol</span>
                <strong className="green">{fmtVol(data.totalBidVol)}</strong>
              </div>
              <div className="l2-ind">
                <span>Ask Vol</span>
                <strong className="red">{fmtVol(data.totalAskVol)}</strong>
              </div>
            </div>
            {/* Bid/Ask pressure bar */}
            <div className="l2-pressure-bar">
              <span className="green">Bids {Math.round(data.totalBidVol / (data.totalBidVol + data.totalAskVol) * 100)}%</span>
              <div className="l2-bar-track">
                <div
                  className="l2-bar-fill"
                  style={{ width: `${data.totalBidVol / (data.totalBidVol + data.totalAskVol) * 100}%` }}
                />
              </div>
              <span className="red">{Math.round(data.totalAskVol / (data.totalBidVol + data.totalAskVol) * 100)}% Asks</span>
            </div>
          </div>

          {/* ── Order Entry ── */}
          <div className="l2-order-entry">
            <h4 className="l2-oe-title">Place Order — {data.symbol}</h4>
            <div className="l2-oe-row">
              <label>Type</label>
              <select value={orderType} onChange={e => setOrderType(e.target.value as 'MARKET' | 'LIMIT')} className="l2-oe-select">
                <option value="MARKET">Market</option>
                <option value="LIMIT">Limit</option>
              </select>
              <label>Qty</label>
              <input className="l2-oe-input" type="number" min="1" value={orderQty} onChange={e => setOrderQty(e.target.value)} />
              {orderType === 'LIMIT' && (
                <>
                  <label>Limit $</label>
                  <input className="l2-oe-input" type="number" step="0.01" placeholder={fmt(data.price)} value={orderPrice}
                    onChange={e => setOrderPrice(e.target.value)} />
                </>
              )}
            </div>
            <div className="l2-oe-btns">
              <button className="l2-buy-btn" onClick={() => placeOrder('BUY')}>
                BUY @ {orderType === 'MARKET' ? `$${fmt(data.ask)} (Ask)` : `$${orderPrice || fmt(data.ask)}`}
              </button>
              <button className="l2-sell-btn" onClick={() => placeOrder('SELL')}>
                SELL @ {orderType === 'MARKET' ? `$${fmt(data.bid)} (Bid)` : `$${orderPrice || fmt(data.bid)}`}
              </button>
            </div>
          </div>

          {/* ── Tabs: Order Book / Orders ── */}
          <div className="l2-tabs">
            <button className={`l2-tab ${orderTab === 'book' ? 'active' : ''}`} onClick={() => setOrderTab('book')}>Order Book</button>
            <button className={`l2-tab ${orderTab === 'orders' ? 'active' : ''}`} onClick={() => setOrderTab('orders')}>
              My Orders {orders.length > 0 && <span className="l2-badge">{orders.length}</span>}
            </button>
          </div>

          {/* ── Order Book ── */}
          {orderTab === 'book' && (
            <div className="l2-book">
              <div className="l2-book-side bids">
                <div className="l2-book-header">
                  <span>Orders</span><span>Size</span><span>Bid Price</span>
                </div>
                {data.bids.map((b, i) => (
                  <div key={i} className="l2-book-row bid-row">
                    <div className="l2-depth-bar bid-depth" style={{ width: `${b.size / maxBidVol * 100}%` }} />
                    <span className="l2-cell">{b.orders}</span>
                    <span className="l2-cell">{b.size.toLocaleString()}</span>
                    <span className="l2-cell green bid-price">${fmt(b.price)}</span>
                  </div>
                ))}
              </div>

              <div className="l2-book-spread">
                <span>Spread</span>
                <strong>${fmt(data.spread)}</strong>
                <span>{data.spreadPct}%</span>
              </div>

              <div className="l2-book-side asks">
                <div className="l2-book-header">
                  <span>Ask Price</span><span>Size</span><span>Orders</span>
                </div>
                {data.asks.map((a, i) => (
                  <div key={i} className="l2-book-row ask-row">
                    <div className="l2-depth-bar ask-depth" style={{ width: `${a.size / maxAskVol * 100}%` }} />
                    <span className="l2-cell red ask-price">${fmt(a.price)}</span>
                    <span className="l2-cell">{a.size.toLocaleString()}</span>
                    <span className="l2-cell">{a.orders}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── My Orders ── */}
          {orderTab === 'orders' && (
            <div className="l2-orders-panel">
              <div className="l2-orders-header">
                <span>{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
                {orders.length > 0 && <button className="l2-clear-btn" onClick={clearOrders}>Clear All</button>}
              </div>
              {orders.length === 0 && <div className="l2-orders-empty">No orders placed yet.</div>}
              <div className="l2-orders-list">
                {orders.map(o => (
                  <div key={o.id} className={`l2-order-row ${o.side.toLowerCase()} ${o.status.toLowerCase()}`}>
                    <span className={`l2-order-side ${o.side === 'BUY' ? 'green' : 'red'}`}>{o.side}</span>
                    <span className="l2-order-sym">{o.symbol}</span>
                    <span className="l2-order-qty">{o.qty} shares</span>
                    <span className="l2-order-price">${fmt(o.price)}</span>
                    <span className="l2-order-type">{o.type}</span>
                    <span className={`l2-order-status ${o.status.toLowerCase()}`}>{o.status}</span>
                    <span className="l2-order-time">{new Date(o.placedAt).toLocaleTimeString()}</span>
                    {o.status === 'PENDING' &&
                      <button className="l2-cancel-btn" onClick={() => cancelOrder(o.id)}>Cancel</button>
                    }
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="l2-footer">
            Data via Yahoo Finance (public API) · Updated {new Date(data.updatedAt).toLocaleTimeString()} · <em>Not financial advice. Simulated order book depth.</em>
          </div>
        </div>
      )}
    </div>
  );
}
