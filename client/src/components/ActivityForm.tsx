import React, { useEffect, useState } from 'react';

interface Activity {
  id?: number;
  activity: string;
  activity_datetime: string;
  description?: string;
  comments?: string;
  priority?: string;
  assigned_to?: string;
}

export default function ActivityForm({ activity, onSave, onCancel }: { activity?: Activity | null; onSave: (a: Activity) => void; onCancel: () => void; }) {
  const [form, setForm] = useState({
    activity: '',
    activity_datetime: '',
    description: '',
    comments: '',
    priority: 'Normal',
    assigned_to: '',
  });

  useEffect(() => {
    if (activity) {
      setForm({
        activity: activity.activity || '',
        activity_datetime: activity.activity_datetime ? activity.activity_datetime.replace('Z','') : '',
        description: activity.description || '',
        comments: activity.comments || '',
        priority: activity.priority || 'Normal',
        assigned_to: activity.assigned_to || '',
      });
    } else {
      setForm({ activity: '', activity_datetime: '', description: '', comments: '', priority: 'Normal', assigned_to: '' });
    }
  }, [activity]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...activity,
      activity: form.activity,
      activity_datetime: form.activity_datetime,
      description: form.description,
      comments: form.comments,
      priority: form.priority,
      assigned_to: form.assigned_to,
    });
  };

  return (
    <form className="asset-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <input name="activity" value={form.activity} onChange={handleChange} placeholder="Activity" required />
        <input name="activity_datetime" value={form.activity_datetime} onChange={handleChange} placeholder="Date & time" type="datetime-local" required />
      </div>
      <div className="form-row">
        <select name="priority" value={form.priority} onChange={handleChange}>
          <option>Low</option>
          <option>Normal</option>
          <option>High</option>
        </select>
        <input name="assigned_to" value={form.assigned_to} onChange={handleChange} placeholder="Assigned to" />
      </div>
      <div className="form-row">
        <input name="description" value={form.description} onChange={handleChange} placeholder="Description" />
      </div>
      <div className="form-row">
        <textarea name="comments" value={form.comments} onChange={handleChange} placeholder="Comments" style={{ minHeight: 56 }} />
      </div>
      <div className="form-actions">
        <button type="submit">{activity ? 'Update' : 'Add'} Activity</button>
        <button type="button" className="btn-link" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
