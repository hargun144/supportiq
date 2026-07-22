import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TicketForm from './TicketForm';
import TicketQueue from './TicketQueue';
import AtRiskPanel from './AtRiskPanel';
import AgentLoadView from './AgentLoadView';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_tickets: 0,
    open_tickets: 0,
    at_risk_tickets: 0,
    avg_priority_score: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('http://localhost:8000/tickets/?limit=100');
      const tickets = response.data.tickets;

      const total_tickets = tickets.length;
      const open_tickets = tickets.filter(t => t.status !== 'closed').length;
      const at_risk_tickets = tickets.filter(t => t.risk_score >= 4).length;
      const avg_priority_score = tickets.length > 0
        ? tickets.reduce((sum, t) => sum + t.priority_score, 0) / tickets.length
        : 0;

      setStats({
        total_tickets,
        open_tickets,
        at_risk_tickets,
        avg_priority_score: Math.round(avg_priority_score * 10) / 10
      });

      setLoading(false);
    } catch (err) {
      setError(err.response ? err.response.data.detail : err.message);
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await axios.post('http://localhost:8000/tickets/classify-all');
      await fetchStats();
    } catch (err) {
      setError(err.response ? err.response.data.detail : err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTicketCreated = () => {
    fetchStats();
  };

  if (loading && stats.total_tickets === 0) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>SupportIQ Dashboard</h1>
        <div className="dashboard-actions">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`btn btn-${refreshing ? 'secondary' : 'primary'} refresh-btn`}
          >
            {refreshing ? 'Refreshing...' : 'Run Classification'}
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Tickets</h3>
            <p className="stat-value">{stats.total_tickets}</p>
          </div>
          <div className="stat-card">
            <h3>Open Tickets</h3>
            <p className="stat-value">{stats.open_tickets}</p>
          </div>
          <div className="stat-card">
            <h3>At-Risk Tickets</h3>
            <p className="stat-value">{stats.at_risk_tickets}</p>
          </div>
          <div className="stat-card">
            <h3>Avg Priority Score</h3>
            <p className="stat-value">{stats.avg_priority_score}</p>
          </div>
        </div>

        {/* Ticket Form */}
        <section className="dashboard-section">
          <h2>Create New Ticket</h2>
          <TicketForm onSubmit={handleTicketCreated} />
        </section>

        {/* Ticket Queue */}
        <section className="dashboard-section">
          <h2>Ticket Queue</h2>
          <TicketQueue />
        </section>

        {/* Two-column layout for At-Risk and Agent Views */}
        <div className="dashboard-columns">
          <section className="dashboard-section at-risk-section">
            <h2>At-Risk Tickets</h2>
            <AtRiskPanel />
          </section>

          <section className="dashboard-section agent-section">
            <h2>Agent Workload</h2>
            <AgentLoadView />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;