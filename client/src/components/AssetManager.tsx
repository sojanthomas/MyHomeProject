import React, { useEffect, useState } from 'react';
import AssetForm from './AssetForm';

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
    <div>
      <h2>Home Assets</h2>
      <AssetForm asset={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
      <table>
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
          {assets.map((asset) => (
            <tr key={asset.id}>
              <td>{asset.name}</td>
              <td>{asset.value}</td>
              <td>{asset.location}</td>
              <td>{asset.purchase_date}</td>
              <td>
                <button onClick={() => handleEdit(asset)}>Edit</button>
                <button onClick={() => handleDelete(asset.id!)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
