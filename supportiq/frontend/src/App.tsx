import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { AgentDashboard } from './pages/AgentDashboard';
import { TicketDetailPage } from './pages/TicketDetailPage';
import { Customer360Page } from './pages/Customer360Page';
import { UnifiedInbox } from './pages/UnifiedInbox';
import { AnalyticsDashboard } from './pages/AnalyticsDashboard';
import { LandingPage } from './pages/LandingPage';
import { ticketsApi } from './services/api';

const MainAppContent: React.FC = () => {
  const { user, token, loading } = useAuth();
  const [authView, setAuthView] = useState<'landing' | 'login'>('landing');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [slaNotification, setSlaNotification] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">Initializing SupportIQ Operations Platform...</p>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    if (authView === 'landing') {
      return <LandingPage onNavigateLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onNavigateLanding={() => setAuthView('landing')} />;
  }


  const handleRunSLAAudit = async () => {
    try {
      const result = await ticketsApi.checkSLA(24);
      setSlaNotification(`SLA Audit Complete: ${result.escalated_count} overdue tickets escalated.`);
      setTimeout(() => setSlaNotification(null), 5000);
    } catch (err) {
      console.error('SLA audit error:', err);
    }
  };

  const handleSelectTicket = (ticketId: number) => {
    setSelectedTicketId(ticketId);
    setActiveTab('detail');
  };

  const handleViewCustomer360 = (customerId: number) => {
    setSelectedCustomerId(customerId);
    setActiveTab('customers');
  };

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={(tab) => {
        setActiveTab(tab);
      }}
      onCheckSLA={handleRunSLAAudit}
    >
      {slaNotification && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center justify-between shadow-lg">
          <span>{slaNotification}</span>
          <button onClick={() => setSlaNotification(null)} className="text-amber-400 hover:text-white">✕</button>
        </div>
      )}

      {activeTab === 'dashboard' && (
        <AgentDashboard onSelectTicket={handleSelectTicket} />
      )}

      {activeTab === 'detail' && selectedTicketId && (
        <TicketDetailPage
          ticketId={selectedTicketId}
          onBack={() => setActiveTab('dashboard')}
          onViewCustomer360={handleViewCustomer360}
        />
      )}

      {activeTab === 'inbox' && (
        <UnifiedInbox onSelectTicket={handleSelectTicket} />
      )}

      {activeTab === 'analytics' && (
        <AnalyticsDashboard onSelectTicket={handleSelectTicket} />
      )}

      {activeTab === 'customers' && (
        <Customer360Page
          initialCustomerId={selectedCustomerId}
          onSelectTicket={handleSelectTicket}
        />
      )}
    </Layout>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
