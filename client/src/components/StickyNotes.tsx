import React, { useEffect, useState } from 'react';
import { getStickies, createSticky, updateSticky, deleteSticky, StickyNote } from '../api/stickyNotes';

const severityColors: Record<string, string> = {
  low: '#fff9b1',
  medium: '#ffd59e',
  high: '#ffb4b4',
};

export default function StickyNotes() {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [content, setContent] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('low');
  const [position, setPosition] = useState<'left' | 'right'>('left');
  const [color, setColor] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await getStickies();
      setNotes(data || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e?: React.FormEvent) {
    e?.preventDefault();
    if (!content.trim()) return;
    const payload = { content, severity, position, color: color || null };
    const created = await createSticky(payload);
    setNotes(prev => [created, ...prev]);
    setContent('');
    setColor('');
  }

  async function handleSave(note: StickyNote) {
    if (!note.id) return;
    await updateSticky(note.id, note);
    setNotes(prev => prev.map(n => (n.id === note.id ? note : n)));
  }

  async function handleDelete(id?: number) {
    if (!id) return;
    await deleteSticky(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  }

  function renderNote(note: StickyNote) {
    const bg = note.color || severityColors[note.severity || 'low'] || '#fff9b1';
    return (
      <StickyCard
        key={note.id}
        note={note}
        bg={bg}
        onSave={handleSave}
        onDelete={() => handleDelete(note.id)}
      />
    );
  }

  return (
    <div className="sticky-bar">
      {/* Add-note form */}
      <form className="sticky-add-form" onSubmit={handleAdd}>
        <textarea placeholder="New note…" value={content} onChange={e => setContent(e.target.value)} />
        <div className="sticky-controls">
          <select value={severity} onChange={e => setSeverity(e.target.value as any)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <input type="color" value={color || '#fff9b1'} onChange={e => setColor(e.target.value)} title="Choose color" />
          <button type="submit">Add</button>
        </div>
      </form>

      {/* All notes in a horizontal row */}
      <div className="sticky-notes-row">
        {loading ? <span className="sticky-loading">Loading…</span> : notes.map(renderNote)}
      </div>
    </div>
  );
}

function StickyCard({ note, bg, onSave, onDelete }: { note: StickyNote; bg: string; onSave: (n: StickyNote) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState<StickyNote>(note);

  useEffect(() => setLocal(note), [note]);

  return (
    <div className="sticky-note" style={{ background: bg }}>
      {editing ? (
        <>
          <textarea value={local.content} onChange={e => setLocal({ ...local, content: e.target.value })} />
          <div className="note-actions">
            <input type="color" value={local.color || '#ffffff'} onChange={e => setLocal({ ...local, color: e.target.value })} />
            <select value={local.severity} onChange={e => setLocal({ ...local, severity: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <select value={local.position} onChange={e => setLocal({ ...local, position: e.target.value })}>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
            <button onClick={() => { onSave(local); setEditing(false); }}>Save</button>
            <button onClick={() => { setLocal(note); setEditing(false); }}>Cancel</button>
          </div>
        </>
      ) : (
        <>
          <div className="note-content">{note.content}</div>
          <div className="note-footer">
            <small>{note.severity}</small>
            <div>
              <button onClick={() => setEditing(true)}>Edit</button>
              <button onClick={onDelete}>Del</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
