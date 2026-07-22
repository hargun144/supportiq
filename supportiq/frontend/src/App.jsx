import React from 'react';
import Dashboard from './components/Dashboard';
import './App.css';
import './design-system.css';

function App() {
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">SI</div>
          <div className="sidebar-logo-text">SupportIQ</div>
        </div>
        <nav className="sidebar-nav">
          <button className="nav-item active">
            Overview
          </button>
          <button className="nav-item">
            Tickets
          </button>
          <button className="nav-item">
            At-Risk
          </button>
          <button className="nav-item">
            Agents
          </button>
          <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--slate-700)' }}>
            <button className="nav-item" style={{ width: '100%', textAlign: 'left' }}>
              New Ticket
            </button>
          </div>
        </nav>
      </aside>
      <main className="main-content">
        <Dashboard />
      </main>
    </div>
  );
}

export default App;