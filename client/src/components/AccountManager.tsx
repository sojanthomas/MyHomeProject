import React, { useEffect, useState } from 'react';
import AccountForm from './AccountForm';

interface Account {
  id?: number;
  account_name?: string;
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

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts');
      const data = await res.json();
      setAccounts(data);
    } catch (err) {
      console.error('Failed to fetch accounts', err);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const save = async (acct: Account) => {
    try {
      if (acct.id) {
        await fetch(`/api/accounts/${acct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(acct),
        });
      } else {
        await fetch('/api/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(acct),
        });
      }
      setShowForm(false);
      setEditing(null);
      fetchAccounts();
    } catch (err) {
      console.error('Failed to save account', err);
    }
  };

  const remove = async (id?: number) => {
    if (!id) return;
    try {
      await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      fetchAccounts();
    } catch (err) {
      console.error('Failed to delete account', err);
    }
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
            <th>Account Name</th>
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
            <tr className="empty-row"><td colSpan={8}>No accounts yet. Click "Add Account" to create one.</td></tr>
          )}
          {accounts.map((acct) => {
            const days = daysUntil(acct.maturity_date);
            const maturingSoon = days <= 30 && days >= 0;
            return (
              <tr key={acct.id}>
                <td className="asset-name">{acct.account_number}</td>
                <td className="asset-name">{acct.account_name || '-'}</td>
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
