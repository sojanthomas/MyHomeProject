import './App.css';
import AssetManager from './components/AssetManager';
import AccountManager from './components/AccountManager';
import ActivityManager from './components/ActivityManager';
import StickyNotes from './components/StickyNotes';

function App() {
  return (
    <div className="App">
      <StickyNotes />
      <h1>Home Asset Management</h1>
      <div className="main-grid">
        <div className="left-column">
          <AssetManager />
          <AccountManager />
        </div>
        <aside className="right-column">
        </aside>
      </div>
        {/* Place Activity Scheduler after main content (bottom) */}
        <div style={{ marginTop: '1rem' }}>
          <ActivityManager />
        </div>
    </div>
  );
}

export default App;
