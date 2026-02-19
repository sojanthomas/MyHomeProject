import React, { useEffect, useState } from 'react';

export default function AssetForm({ asset, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    value: '',
    location: '',
    purchase_date: '',
  });

  useEffect(() => {
    if (asset) setForm({
      name: asset.name || '',
      value: String(asset.value ?? ''),
      location: asset.location || '',
      purchase_date: asset.purchase_date ? asset.purchase_date.split('T')[0] : '',
    });
    else setForm({ name: '', value: '', location: '', purchase_date: '' });
  }, [asset]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, value: parseFloat(form.value || '0'), id: asset?.id });
  };

  return (
    <form className="asset-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" required />
        <input name="value" value={form.value} onChange={handleChange} placeholder="Value" type="number" required />
      </div>
      <div className="form-row">
        <input name="location" value={form.location} onChange={handleChange} placeholder="Location" />
        <input name="purchase_date" value={form.purchase_date} onChange={handleChange} placeholder="YYYY-MM-DD" type="date" />
      </div>
      <div className="form-actions">
        <button type="submit">{asset ? 'Update' : 'Add'} Asset</button>
        <button type="button" className="btn-link" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
