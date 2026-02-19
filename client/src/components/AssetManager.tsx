import React, { useEffect, useState } from 'react';
import AssetForm from './AssetForm';
import '../App.css';

interface Asset {
  id?: number;
  name: string;
  value: number;
  location?: string;
  purchase_date?: string;
}

export default function AssetManager() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [showForm, setShowForm] = useState(false);

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

  return (
    <div className="asset-manager">
      <div className="asset-header">
        <h2>Home Assets</h2>
        <div>
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
            <th>Name</th>
            <th>Value</th>
            <th>Location</th>
            <th>Purchase Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {assets.length === 0 && (
            <tr className="empty-row"><td colSpan={5}>No assets yet. Click "Add Asset" to create one.</td></tr>
          )}
          {assets.map((asset) => (
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
