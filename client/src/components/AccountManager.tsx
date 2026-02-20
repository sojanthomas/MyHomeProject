import React, { useEffect, useState } from 'react';
import AccountForm from './AccountForm';

interface Account {
  id?: number;
  account_number: string;
  amount: number;
  maturity_date?: string;
  balance?: number;
  comments?: string;
}

const STORAGE_KEY = 'accounts';

function daysUntil(date?: string) {
  if (!date) return Infinity;
  const d = new Date(date);
  const diff = d.getTime() - new Date().setHours(0,0,0,0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function AccountManager() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [editing, setEditing] = useState<Account | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setAccounts(JSON.parse(raw));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  }, [accounts]);

  const save = (acct: Account) => {
    if (acct.id) {
      setAccounts(a => a.map(x => x.id === acct.id ? { ...x, ...acct } : x));
    } else {
      const id = Date.now();
      setAccounts(a => [{ ...acct, id }, ...a]);
    }
    setShowForm(false);
    setEditing(null);
  };

  const remove = (id?: number) => {
    if (!id) return;
    setAccounts(a => a.filter(x => x.id !== id));
  };

  return (
    <div className="asset-manager">
      <div className="asset-header">
        <h2>Banking Accounts</h2>
        <div>
          <button onClick={() => { setEditing(null); setShowForm(s => !s); }}>{showForm ? 'Close' : 'Add Account'}</button>
        </div>
      </div>

      {showForm && (
        <AccountForm account={editing || undefined} onSave={save} onCancel={() => { setShowForm(false); setEditing(null); }} />
      )}

      <table className="assets-table">
        <thead>
          <tr>
            <th>Account #</th>
            <th>Amount</th>
            <th>Balance</th>
            <th>Maturity</th>
            <th>Flag</th>
            <th>Comments</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {accounts.length === 0 && (
            <tr className="empty-row"><td colSpan={7}>No accounts yet. Click "Add Account" to create one.</td></tr>
          )}
          {accounts.map((acct) => {
            const days = daysUntil(acct.maturity_date);
            const maturingSoon = days <= 30 && days >= 0;
            return (
              <tr key={acct.id}>
                <td className="asset-name">{acct.account_number}</td>
                <td className="asset-value">{new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(acct.amount))}</td>
                <td>{acct.balance != null ? new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(acct.balance)) : '-'}</td>
                <td className="asset-date">{acct.maturity_date ? new Date(acct.maturity_date).toLocaleDateString() : '-'}</td>
                <td>
                  <span className={`account-flag ${maturingSoon ? 'flag-red' : 'flag-green'}`}></span>
                </td>
                <td>{acct.comments}</td>
                <td>
                  <button className="btn-link" onClick={() => { setEditing(acct); setShowForm(true); }}>Edit</button>
                  <button className="btn-danger" onClick={() => remove(acct.id)}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
