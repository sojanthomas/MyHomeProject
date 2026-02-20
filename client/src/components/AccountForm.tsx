import React, { useEffect, useState } from 'react';

interface Account {
  id?: number;
  account_name?: string;
  account_number: string;
  amount: number;
  maturity_date?: string;
  balance?: number;
  comments?: string;
}

export default function AccountForm({ account, onSave, onCancel }: { account?: Account | null; onSave: (a: Account) => void; onCancel: () => void; }) {
  const [form, setForm] = useState({
    account_name: '',
    account_number: '',
    amount: '',
    maturity_date: '',
    balance: '',
    comments: '',
  });

  useEffect(() => {
    if (account) {
      setForm({
        account_name: account.account_name || '',
        account_number: account.account_number || '',
        amount: String(account.amount ?? ''),
        maturity_date: account.maturity_date ? account.maturity_date.split('T')[0] : '',
        balance: String(account.balance ?? ''),
        comments: account.comments || '',
      });
    } else {
      setForm({ account_name: '', account_number: '', amount: '', maturity_date: '', balance: '', comments: '' });
    }
  }, [account]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...account,
      account_name: form.account_name,
      account_number: form.account_number,
      amount: parseFloat(form.amount || '0'),
      maturity_date: form.maturity_date || undefined,
      balance: parseFloat(form.balance || '0'),
      comments: form.comments,
    });
  };

  return (
    <form className="asset-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <input name="account_name" value={form.account_name} onChange={handleChange} placeholder="Account name" />
        <input name="account_number" value={form.account_number} onChange={handleChange} placeholder="Account number" required />
      </div>
      <div className="form-row">
        <input name="maturity_date" value={form.maturity_date} onChange={handleChange} placeholder="Maturity date" type="date" />
        <input name="balance" value={form.balance} onChange={handleChange} placeholder="Balance" type="number" step="0.01" />
      </div>
      <div className="form-row">
        <textarea name="comments" value={form.comments} onChange={handleChange} placeholder="Comments" style={{ minHeight: 56 }} />
      </div>
      <div className="form-actions">
        <button type="submit">{account ? 'Update' : 'Add'} Account</button>
        <button type="button" className="btn-link" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
