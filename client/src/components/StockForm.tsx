import React, { useEffect, useState } from 'react';

export interface Stock {
  id?: number;
  symbol: string;
  name?: string;
  qty: number;
  current_price: number;
  financial_institution?: string;
  cost: number;
  balance: number;
}

export default function StockForm({ stock, onSave, onCancel }: { stock?: Stock | null; onSave: (s: Stock) => void; onCancel: () => void }) {
  const blank = { symbol: '', name: '', qty: '', current_price: '', financial_institution: '', cost: '', balance: '' };
  const [form, setForm] = useState(blank);

  useEffect(() => {
    if (stock) {
      setForm({
        symbol: stock.symbol || '',
        name: stock.name || '',
        qty: String(stock.qty ?? ''),
        current_price: String(stock.current_price ?? ''),
        financial_institution: stock.financial_institution || '',
        cost: String(stock.cost ?? ''),
        balance: String(stock.balance ?? ''),
      });
    } else {
      setForm(blank);
    }
  }, [stock]);

  const set = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...stock,
      symbol: form.symbol.toUpperCase(),
      name: form.name,
      qty: parseFloat(form.qty || '0'),
      current_price: parseFloat(form.current_price || '0'),
      financial_institution: form.financial_institution,
      cost: parseFloat(form.cost || '0'),
      balance: parseFloat(form.balance || '0'),
    });
  };

  return (
    <form className="asset-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <input name="symbol" value={form.symbol} onChange={set} placeholder="Symbol (e.g. AAPL)" required style={{ textTransform: 'uppercase' }} />
        <input name="name" value={form.name} onChange={set} placeholder="Company name" />
      </div>
      <div className="form-row">
        <input name="qty" value={form.qty} onChange={set} placeholder="Quantity" type="number" step="0.0001" />
        <input name="current_price" value={form.current_price} onChange={set} placeholder="Current price" type="number" step="0.0001" />
      </div>
      <div className="form-row">
        <input name="cost" value={form.cost} onChange={set} placeholder="Cost" type="number" step="0.01" />
        <input name="balance" value={form.balance} onChange={set} placeholder="Balance (market value)" type="number" step="0.01" />
      </div>
      <div className="form-row">
        <input name="financial_institution" value={form.financial_institution} onChange={set} placeholder="Financial institution" />
      </div>
      <div className="form-actions">
        <button type="submit">{stock?.id ? 'Update' : 'Add'} Stock</button>
        <button type="button" className="btn-link" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
