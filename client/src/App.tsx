import './App.css';
import AssetManager from './components/AssetManager';
import AccountManager from './components/AccountManager';
import ActivityManager from './components/ActivityManager';

function App() {
  return (
    <div className="App">
      <h1>Home Asset Management</h1>
      <div className="main-grid">
        <div className="left-column">
          <AssetManager />
          <AccountManager />
        </div>
        <aside className="right-column">
          <ActivityManager />
        </aside>
      </div>
    </div>
  );
}

export default App;
