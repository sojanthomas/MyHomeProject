import React, { useEffect, useState } from 'react';
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

  return (
    <div className="asset-manager activity-manager">
      <div className="asset-header">
        <h2>Activity Scheduler</h2>
        <div>
          <button onClick={() => { setEditing(null); setShowForm(s => !s); }}>{showForm ? 'Close' : 'Schedule Activity'}</button>
        </div>
      </div>

      {showForm && (
        <ActivityForm activity={editing || undefined} onSave={save} onCancel={() => { setShowForm(false); setEditing(null); }} />
      )}

      <table className="assets-table">
        <thead>
          <tr>
            <th>Date / Time</th>
            <th>Activity</th>
            <th>Priority</th>
            <th>Assigned</th>
            <th>Comments</th>
            <th>Flag</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {activities.length === 0 && (
            <tr className="empty-row"><td colSpan={7}>No activities scheduled.</td></tr>
          )}
          {activities.map(act => {
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
