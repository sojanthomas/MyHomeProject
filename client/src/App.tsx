import { useState } from 'react';
import './App.css';
import AssetManager from './components/AssetManager';
import AccountManager from './components/AccountManager';
import ActivityManager from './components/ActivityManager';
import StickyNotes from './components/StickyNotes';

type View = 'assets' | 'accounts' | 'activities';

const NAV_ITEMS: { id: View; label: string }[] = [
  { id: 'assets',     label: 'Home Assets' },
  { id: 'accounts',   label: 'Banking Accounts' },
  { id: 'activities', label: 'Activity Scheduler' },
];

function App() {
  const [view, setView] = useState<View>('assets');

  return (
    <div className="App">
      <StickyNotes />

      <div className="app-layout">
        {/* Main content — only the active view */}
        <main className="app-content">
          <h1 className="app-title">Home Asset Management</h1>
          {view === 'assets'     && <AssetManager />}
          {view === 'accounts'   && <AccountManager />}
          {view === 'activities' && <ActivityManager />}
        </main>

        {/* Right-side navigation */}
        <nav className="side-nav">
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
        </nav>
      </div>
    </div>
  );
}

export default App;
