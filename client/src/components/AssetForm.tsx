import React, { useEffect, useState } from 'react';

export default function AssetForm({ asset, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    value: '',
    location: '',
    purchase_date: '',
  });

  useEffect(() => {
    if (asset) setForm(asset);
    else setForm({ name: '', value: '', location: '', purchase_date: '' });
  }, [asset]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, value: parseFloat(form.value), id: asset?.id });
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
      <input name="name" value={form.name} onChange={handleChange} placeholder="Name" required />
      <input name="value" value={form.value} onChange={handleChange} placeholder="Value" type="number" required />
      <input name="location" value={form.location} onChange={handleChange} placeholder="Location" />
      <input name="purchase_date" value={form.purchase_date} onChange={handleChange} placeholder="YYYY-MM-DD" type="date" />
      <button type="submit">{asset ? 'Update' : 'Add'} Asset</button>
      {asset && <button type="button" onClick={onCancel}>Cancel</button>}
    </form>
  );
}
