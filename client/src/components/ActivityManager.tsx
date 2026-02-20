import React, { useEffect, useState, useMemo } from 'react';
import ActivityForm from './ActivityForm';

interface Activity {
  id?: number;
  activity: string;
  activity_datetime: string;
  description?: string;
  comments?: string;
  priority?: string;
  assigned_to?: string;
}

type SortDir = 'asc' | 'desc';
type ActivityCol = keyof Omit<Activity, 'id'>;

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

export default function ActivityManager() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');
  const [sortCol, setSortCol] = useState<ActivityCol>('activity_datetime');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function toggleSort(col: ActivityCol) {
    if (col === sortCol) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  }

  const fetchActivities = async () => {
    const res = await fetch('/api/activities');
    setActivities(await res.json());
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const save = async (a: Activity) => {
    if (a.id) {
      await fetch(`/api/activities/${a.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(a),
      });
    } else {
      await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(a),
      });
    }
    setShowForm(false);
    setEditing(null);
    fetchActivities();
  };

  const remove = async (id?: number) => {
    if (!id) return;
    await fetch(`/api/activities/${id}`, { method: 'DELETE' });
    fetchActivities();
  };

  const displayed = useMemo(() => {
    const q = filter.toLowerCase();
    const filtered = q
      ? activities.filter(a =>
          [a.activity, a.activity_datetime, a.priority, a.assigned_to, a.comments, a.description]
            .some(v => (v ?? '').toLowerCase().includes(q))
        )
      : activities;
    return [...filtered].sort((a, b) => {
      const av = a[sortCol] ?? '';
      const bv = b[sortCol] ?? '';
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [activities, filter, sortCol, sortDir]);

  return (
    <div className="asset-manager activity-manager">
      <div className="asset-header">
        <h2>Activity Scheduler</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input className="table-filter" placeholder="Filter…" value={filter} onChange={e => setFilter(e.target.value)} />
          <button onClick={() => { setEditing(null); setShowForm(s => !s); }}>{showForm ? 'Close' : 'Schedule Activity'}</button>
        </div>
      </div>

      {showForm && (
        <ActivityForm activity={editing || undefined} onSave={save} onCancel={() => { setShowForm(false); setEditing(null); }} />
      )}

      <table className="assets-table">
        <thead>
          <tr>
            <th className="sortable" onClick={() => toggleSort('activity_datetime')}>Date / Time <SortIcon col="activity_datetime" sortCol={sortCol} sortDir={sortDir} /></th>
            <th className="sortable" onClick={() => toggleSort('activity')}>Activity <SortIcon col="activity" sortCol={sortCol} sortDir={sortDir} /></th>
            <th className="sortable" onClick={() => toggleSort('priority')}>Priority <SortIcon col="priority" sortCol={sortCol} sortDir={sortDir} /></th>
            <th className="sortable" onClick={() => toggleSort('assigned_to')}>Assigned <SortIcon col="assigned_to" sortCol={sortCol} sortDir={sortDir} /></th>
            <th className="sortable" onClick={() => toggleSort('comments')}>Comments <SortIcon col="comments" sortCol={sortCol} sortDir={sortDir} /></th>
            <th>Flag</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {displayed.length === 0 && (
            <tr className="empty-row"><td colSpan={7}>{filter ? 'No matching activities.' : 'No activities scheduled.'}</td></tr>
          )}
          {displayed.map(act => {
            const days = daysUntil(act.activity_datetime);
            const soon = days <= 7 && days >= 0;
            return (
              <tr key={act.id}>
                <td className="asset-date">{act.activity_datetime ? new Date(act.activity_datetime).toLocaleString() : '-'}</td>
                <td className="asset-name">{act.activity}</td>
                <td>{act.priority}</td>
                <td>{act.assigned_to}</td>
                <td>{act.comments}</td>
                <td><span className={`account-flag ${soon ? 'flag-red' : 'flag-green'}`}></span></td>
                <td>
                  <button className="btn-link" onClick={() => { setEditing(act); setShowForm(true); }}>Edit</button>
                  <button className="btn-danger" onClick={() => remove(act.id)}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
