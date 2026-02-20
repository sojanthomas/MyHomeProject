import { useState } from 'react';
import '../login.css';

interface Props {
  onBack: () => void;
}

export default function ForgotPasswordPage({ onBack }: Props) {
  const [username, setUsername]       = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm]         = useState('');
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [loading, setLoading]         = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (newPassword !== confirm) { setError('Passwords do not match'); return; }
    if (newPassword.length < 6)  { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setSuccess('Password updated! You can now sign in.');
      setUsername(''); setNewPassword(''); setConfirm('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🔑</div>
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">Enter your username and choose a new password</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error   && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}
          <div className="auth-field">
            <label htmlFor="fp-username">Username</label>
            <input id="fp-username" type="text" placeholder="Enter your username" value={username}
              onChange={e => setUsername(e.target.value)} autoFocus required />
          </div>
          <div className="auth-field">
            <label htmlFor="fp-password">New Password</label>
            <input id="fp-password" type="password" placeholder="At least 6 characters" value={newPassword}
              onChange={e => setNewPassword(e.target.value)} required />
          </div>
          <div className="auth-field">
            <label htmlFor="fp-confirm">Confirm New Password</label>
            <input id="fp-confirm" type="password" placeholder="Repeat new password" value={confirm}
              onChange={e => setConfirm(e.target.value)} required />
          </div>
          <button className="auth-btn-primary" type="submit" disabled={loading}>
            {loading ? 'Updating…' : 'Reset Password'}
          </button>
        </form>

        <div className="auth-links">
          <button className="auth-link" onClick={onBack}>← Back to sign in</button>
        </div>
      </div>
    </div>
  );
}
