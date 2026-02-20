export type StickyNote = {
  id?: number;
  content: string;
  severity?: 'low' | 'medium' | 'high' | string;
  position?: 'left' | 'right' | string;
  color?: string | null;
  created_at?: string;
};

const base = '/api/stickies';

export async function getStickies(): Promise<StickyNote[]> {
  const res = await fetch(base);
  if (!res.ok) throw new Error('Failed to fetch stickies');
  return res.json();
}

export async function createSticky(note: Partial<StickyNote>) {
  const res = await fetch(base, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
  });
  if (!res.ok) throw new Error('Failed to create sticky');
  return res.json();
}

export async function updateSticky(id: number, note: Partial<StickyNote>) {
  const res = await fetch(`${base}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
  });
  if (!res.ok) throw new Error('Failed to update sticky');
  return res.json();
}

export async function deleteSticky(id: number) {
  const res = await fetch(`${base}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete sticky');
  return res.json();
}
