import { useState } from 'react';
import './App.css';
import AssetManager from './components/AssetManager';
import AccountManager from './components/AccountManager';
import ActivityManager from './components/ActivityManager';
import StockManager from './components/StockManager';
import BudgetTracker from './budget/BudgetTracker';
import StickyNotes from './components/StickyNotes';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';

type View = 'assets' | 'accounts' | 'activities' | 'stocks' | 'budget';
type AuthScreen = 'login' | 'register' | 'forgot';

const NAV_ITEMS: { id: View; label: string }[] = [
  { id: 'assets',     label: 'Home Assets' },
  { id: 'accounts',   label: 'Banking Accounts' },
  { id: 'activities', label: 'Activity Scheduler' },
  { id: 'stocks',     label: 'Stocks Portfolio' },
  { id: 'budget',     label: 'Budget Tracker' },
];

function getStoredAuth(): { token: string; username: string } | null {
  try {
    const token = localStorage.getItem('auth_token');
    const username = localStorage.getItem('auth_username');
    if (token && username) return { token, username };
  } catch { /* ignore */ }
  return null;
}

function App() {
  const [auth, setAuth] = useState<{ token: string; username: string } | null>(getStoredAuth);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const [view, setView] = useState<View>('assets');

  function handleLogin(token: string, username: string) {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_username', username);
    setAuth({ token, username });
  }

  function handleLogout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_username');
    setAuth(null);
    setAuthScreen('login');
  }

  // ── Auth screens ──────────────────────────────────────────
  if (!auth) {
    if (authScreen === 'register')
      return <RegisterPage onSuccess={handleLogin} onBack={() => setAuthScreen('login')} />;
    if (authScreen === 'forgot')
      return <ForgotPasswordPage onBack={() => setAuthScreen('login')} />;
    return (
      <LoginPage
        onLogin={handleLogin}
        onRegister={() => setAuthScreen('register')}
        onForgot={() => setAuthScreen('forgot')}
      />
    );
  }

  // ── Main app ──────────────────────────────────────────────
  return (
    <div className="App">
      <StickyNotes />

      <div className="app-layout">
        <main className="app-content">
          <h1 className="app-title">Home Asset Management</h1>
          {view === 'assets'     && <AssetManager />}
          {view === 'accounts'   && <AccountManager />}
          {view === 'activities' && <ActivityManager />}
          {view === 'stocks'     && <StockManager />}
          {view === 'budget'     && <BudgetTracker />}
        </main>

        <nav className="side-nav">
          <div className="side-nav-user">👤 {auth.username}</div>
          <p className="side-nav-heading">Menu</p>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`side-nav-item${view === item.id ? ' active' : ''}`}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
          <button className="side-nav-logout" onClick={handleLogout}>Sign Out</button>
        </nav>
      </div>
    </div>
  );
}

export default App;
