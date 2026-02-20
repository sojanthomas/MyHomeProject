import React, { useEffect, useState, useMemo } from 'react';
import AssetForm from './AssetForm';
import '../App.css';

interface Asset {
  id?: number;
  name: string;
  value: number;
  location?: string;
  purchase_date?: string;
}

type SortDir = 'asc' | 'desc';
type AssetCol = keyof Omit<Asset, 'id'>;

function SortIcon({ col, sortCol, sortDir }: { col: string; sortCol: string; sortDir: SortDir }) {
  if (col !== sortCol) return <span className="sort-icon">⇅</span>;
  return <span className="sort-icon active">{sortDir === 'asc' ? '▲' : '▼'}</span>;
}

export default function AssetManager() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');
  const [sortCol, setSortCol] = useState<AssetCol>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  function toggleSort(col: AssetCol) {
    if (col === sortCol) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  }

  const fetchAssets = async () => {
    const res = await fetch('/api/assets');
    setAssets(await res.json());
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleSave = async (asset: Asset) => {
    if (asset.id) {
      await fetch(`/api/assets/${asset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asset),
      });
    } else {
      await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asset),
      });
    }
    setEditing(null);
    fetchAssets();
  };

  const handleEdit = (asset: Asset) => setEditing(asset);
  const handleDelete = async (id: number) => {
    await fetch(`/api/assets/${id}`, { method: 'DELETE' });
    fetchAssets();
  };

  const displayed = useMemo(() => {
    const q = filter.toLowerCase();
    const filtered = q
      ? assets.filter(a =>
          [a.name, a.location, String(a.value), a.purchase_date]
            .some(v => (v ?? '').toLowerCase().includes(q))
        )
      : assets;
    return [...filtered].sort((a, b) => {
      const av = a[sortCol] ?? '';
      const bv = b[sortCol] ?? '';
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [assets, filter, sortCol, sortDir]);

  return (
    <div className="asset-manager">
      <div className="asset-header">
        <h2>Home Assets</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input className="table-filter" placeholder="Filter…" value={filter} onChange={e => setFilter(e.target.value)} />
          <button onClick={() => { setEditing(null); setShowForm(s => !s); }}>
            {showForm ? 'Close' : 'Add Asset'}
          </button>
        </div>
      </div>
      {showForm && (
        <AssetForm asset={editing} onSave={handleSave} onCancel={() => { setEditing(null); setShowForm(false); }} />
      )}
      <table className="assets-table">
        <thead>
          <tr>
            <th className="sortable" onClick={() => toggleSort('name')}>Name <SortIcon col="name" sortCol={sortCol} sortDir={sortDir} /></th>
            <th className="sortable" onClick={() => toggleSort('value')}>Value <SortIcon col="value" sortCol={sortCol} sortDir={sortDir} /></th>
            <th className="sortable" onClick={() => toggleSort('location')}>Location <SortIcon col="location" sortCol={sortCol} sortDir={sortDir} /></th>
            <th className="sortable" onClick={() => toggleSort('purchase_date')}>Purchase Date <SortIcon col="purchase_date" sortCol={sortCol} sortDir={sortDir} /></th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {displayed.length === 0 && (
            <tr className="empty-row"><td colSpan={5}>{filter ? 'No matching assets.' : 'No assets yet. Click "Add Asset" to create one.'}</td></tr>
          )}
          {displayed.map((asset) => (
            <tr key={asset.id}>
              <td className="asset-name">{asset.name}</td>
              <td className="asset-value">{new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(asset.value))}</td>
              <td className="asset-location">{asset.location}</td>
              <td className="asset-date">{asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : ''}</td>
              <td>
                <button className="btn-link" onClick={() => { handleEdit(asset); setShowForm(true); }}>Edit</button>
                <button className="btn-danger" onClick={() => handleDelete(asset.id!)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
