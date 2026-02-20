import { useState } from 'react';
import '../login.css';

interface Props {
  onSuccess: (token: string, username: string) => void;
  onBack: () => void;
}

export default function RegisterPage({ onSuccess, onBack }: Props) {
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      onSuccess(data.token, data.username);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🏠</div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Set up your Home Asset Management account</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          <div className="auth-field">
            <label htmlFor="reg-username">Username <span className="auth-required">*</span></label>
            <input id="reg-username" type="text" placeholder="Choose a username" value={username}
              onChange={e => setUsername(e.target.value)} autoFocus required />
          </div>
          <div className="auth-field">
            <label htmlFor="reg-email">Email <span className="auth-optional">(optional)</span></label>
            <input id="reg-email" type="email" placeholder="your@email.com" value={email}
              onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="auth-field">
            <label htmlFor="reg-password">Password <span className="auth-required">*</span></label>
            <input id="reg-password" type="password" placeholder="At least 6 characters" value={password}
              onChange={e => setPassword(e.target.value)} required />
          </div>
          <div className="auth-field">
            <label htmlFor="reg-confirm">Confirm Password <span className="auth-required">*</span></label>
            <input id="reg-confirm" type="password" placeholder="Repeat your password" value={confirm}
              onChange={e => setConfirm(e.target.value)} required />
          </div>
          <button className="auth-btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className="auth-links">
          <button className="auth-link" onClick={onBack}>← Back to sign in</button>
        </div>
      </div>
    </div>
  );
}
