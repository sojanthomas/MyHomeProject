import React, { useEffect, useState, useMemo } from 'react';
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

type SortDir = 'asc' | 'desc';
type AccountCol = keyof Omit<Account, 'id'>;

function SortIcon({ col, sortCol, sortDir }: { col: string; sortCol: string; sortDir: SortDir }) {
  if (col !== sortCol) return <span className="sort-icon">⇅</span>;
  return <span className="sort-icon active">{sortDir === 'asc' ? '▲' : '▼'}</span>;
}

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
  const [filter, setFilter] = useState('');
  const [sortCol, setSortCol] = useState<AccountCol>('account_number');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  function toggleSort(col: AccountCol) {
    if (col === sortCol) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  }

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

  const displayed = useMemo(() => {
    const q = filter.toLowerCase();
    const filtered = q
      ? accounts.filter(a =>
          [a.account_number, a.account_name, String(a.amount), String(a.balance ?? ''), a.maturity_date, a.comments]
            .some(v => (v ?? '').toLowerCase().includes(q))
        )
      : accounts;
    return [...filtered].sort((a, b) => {
      const av = a[sortCol] ?? '';
      const bv = b[sortCol] ?? '';
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [accounts, filter, sortCol, sortDir]);

  return (
    <div className="asset-manager">
      <div className="asset-header">
        <h2>Banking Accounts</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input className="table-filter" placeholder="Filter…" value={filter} onChange={e => setFilter(e.target.value)} />
          <button onClick={() => { setEditing(null); setShowForm(s => !s); }}>{showForm ? 'Close' : 'Add Account'}</button>
        </div>
      </div>

      {showForm && (
        <AccountForm account={editing || undefined} onSave={save} onCancel={() => { setShowForm(false); setEditing(null); }} />
      )}

      <table className="assets-table">
        <thead>
          <tr>
            <th className="sortable" onClick={() => toggleSort('account_number')}>Account # <SortIcon col="account_number" sortCol={sortCol} sortDir={sortDir} /></th>
            <th className="sortable" onClick={() => toggleSort('account_name')}>Account Name <SortIcon col="account_name" sortCol={sortCol} sortDir={sortDir} /></th>
            <th className="sortable" onClick={() => toggleSort('amount')}>Amount <SortIcon col="amount" sortCol={sortCol} sortDir={sortDir} /></th>
            <th className="sortable" onClick={() => toggleSort('balance')}>Balance <SortIcon col="balance" sortCol={sortCol} sortDir={sortDir} /></th>
            <th className="sortable" onClick={() => toggleSort('maturity_date')}>Maturity <SortIcon col="maturity_date" sortCol={sortCol} sortDir={sortDir} /></th>
            <th>Flag</th>
            <th className="sortable" onClick={() => toggleSort('comments')}>Comments <SortIcon col="comments" sortCol={sortCol} sortDir={sortDir} /></th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {displayed.length === 0 && (
            <tr className="empty-row"><td colSpan={8}>{filter ? 'No matching accounts.' : 'No accounts yet. Click "Add Account" to create one.'}</td></tr>
          )}
          {displayed.map((acct) => {
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
