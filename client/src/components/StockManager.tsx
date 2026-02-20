import React, { useEffect, useState, useMemo } from 'react';
import StockForm, { Stock } from './StockForm';

type SortDir = 'asc' | 'desc';
type StockCol = keyof Omit<Stock, 'id'>;

function SortIcon({ col, sortCol, sortDir }: { col: string; sortCol: string; sortDir: SortDir }) {
  if (col !== sortCol) return <span className="sort-icon">⇅</span>;
  return <span className="sort-icon active">{sortDir === 'asc' ? '▲' : '▼'}</span>;
}

const fmt = (n: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(n));

export default function StockManager() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [editing, setEditing] = useState<Stock | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');
  const [sortCol, setSortCol] = useState<StockCol>('symbol');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const fetchStocks = async () => {
    const res = await fetch('/api/stocks');
    setStocks(await res.json());
  };

  useEffect(() => { fetchStocks(); }, []);

  function toggleSort(col: StockCol) {
    if (col === sortCol) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  }

  const save = async (s: Stock) => {
    if (s.id) {
      await fetch(`/api/stocks/${s.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) });
    } else {
      await fetch('/api/stocks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) });
    }
    setShowForm(false);
    setEditing(null);
    fetchStocks();
  };

  const remove = async (id?: number) => {
    if (!id) return;
    await fetch(`/api/stocks/${id}`, { method: 'DELETE' });
    fetchStocks();
  };

  const displayed = useMemo(() => {
    const q = filter.toLowerCase();
    const filtered = q
      ? stocks.filter(s =>
          [s.symbol, s.name, s.financial_institution, String(s.qty), String(s.current_price), String(s.cost), String(s.balance)]
            .some(v => (v ?? '').toLowerCase().includes(q))
        )
      : stocks;
    return [...filtered].sort((a, b) => {
      const av = a[sortCol] ?? '';
      const bv = b[sortCol] ?? '';
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [stocks, filter, sortCol, sortDir]);

  const totalCost    = stocks.reduce((s, r) => s + Number(r.cost), 0);
  const totalBalance = stocks.reduce((s, r) => s + Number(r.balance), 0);
  const totalGain    = totalBalance - totalCost;

  return (
    <div className="asset-manager">
      <div className="asset-header">
        <h2>Stocks Portfolio</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input className="table-filter" placeholder="Filter…" value={filter} onChange={e => setFilter(e.target.value)} />
          <button onClick={() => { setEditing(null); setShowForm(s => !s); }}>{showForm ? 'Close' : 'Add Stock'}</button>
        </div>
      </div>

      {showForm && <StockForm stock={editing} onSave={save} onCancel={() => { setShowForm(false); setEditing(null); }} />}

      <table className="assets-table">
        <thead>
          <tr>
            <th className="sortable" onClick={() => toggleSort('symbol')}>Symbol <SortIcon col="symbol" sortCol={sortCol} sortDir={sortDir} /></th>
            <th className="sortable" onClick={() => toggleSort('name')}>Name <SortIcon col="name" sortCol={sortCol} sortDir={sortDir} /></th>
            <th className="sortable" onClick={() => toggleSort('qty')}>Qty <SortIcon col="qty" sortCol={sortCol} sortDir={sortDir} /></th>
            <th className="sortable" onClick={() => toggleSort('current_price')}>Price <SortIcon col="current_price" sortCol={sortCol} sortDir={sortDir} /></th>
            <th className="sortable" onClick={() => toggleSort('financial_institution')}>Institution <SortIcon col="financial_institution" sortCol={sortCol} sortDir={sortDir} /></th>
            <th className="sortable" onClick={() => toggleSort('cost')}>Cost <SortIcon col="cost" sortCol={sortCol} sortDir={sortDir} /></th>
            <th className="sortable" onClick={() => toggleSort('balance')}>Balance <SortIcon col="balance" sortCol={sortCol} sortDir={sortDir} /></th>
            <th>G/L</th>
            <th>Flag</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {displayed.length === 0 && (
            <tr className="empty-row"><td colSpan={10}>{filter ? 'No matching stocks.' : 'No stocks yet. Click "Add Stock" to create one.'}</td></tr>
          )}
          {displayed.map(s => {
            const gain = Number(s.balance) - Number(s.cost);
            const isGain = gain >= 0;
            return (
              <tr key={s.id}>
                <td className="stock-symbol asset-name">{s.symbol}</td>
                <td>{s.name || '-'}</td>
                <td>{Number(s.qty).toLocaleString()}</td>
                <td className="asset-value">{fmt(s.current_price)}</td>
                <td>{s.financial_institution || '-'}</td>
                <td className="asset-value">{fmt(s.cost)}</td>
                <td className="asset-value">{fmt(s.balance)}</td>
                <td className={isGain ? 'gain-positive' : 'gain-negative'}>{isGain ? '+' : ''}{fmt(gain)}</td>
                <td><span className={`account-flag ${isGain ? 'flag-green' : 'flag-red'}`}></span></td>
                <td>
                  <button className="btn-link" onClick={() => { setEditing(s); setShowForm(true); }}>Edit</button>
                  <button className="btn-danger" onClick={() => remove(s.id)}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
        {stocks.length > 0 && (
          <tfoot>
            <tr className="stock-totals">
              <td colSpan={5}><strong>Totals</strong></td>
              <td><strong>{fmt(totalCost)}</strong></td>
              <td><strong>{fmt(totalBalance)}</strong></td>
              <td className={totalGain >= 0 ? 'gain-positive' : 'gain-negative'}>
                <strong>{totalGain >= 0 ? '+' : ''}{fmt(totalGain)}</strong>
              </td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
