import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AtRiskPanel = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAtRiskTickets();
  }, []);

  const fetchAtRiskTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('http://localhost:8000/tickets/at-risk?threshold=4');
      setTickets(response.data);

      setLoading(false);
    } catch (err) {
      setError(err.response ? err.response.data.detail : err.message);
      setLoading(false);
    }
  };

  if (loading && tickets.length === 0) {
    return <div className="loading">Loading at-risk tickets...</div>;
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  if (tickets.length === 0) {
    return <div className="empty-state">No at-risk tickets found</div>;
  }

  return (
    <div className="at-risk-panel card">
      <div className="card-header">
        <h2 className="card-title">At-Risk Tickets</h2>
        <span className="status-badge status-badge-warning">
          Risk Score ≥ 4
        </span>
      </div>
      <div className="card-content">
        <div className="tickets-list">
          {tickets.map(ticket => (
            <div
              key={ticket.id}
              className="ticket-card card at-risk"
              style={{ borderLeft: '4px solid var(--red-500)' }}
            >
              <div className="ticket-header">
                <h4>Ticket #{ticket.id}</h4>
                <span className="status-badge status-badge-error">
                  Risk: {ticket.risk_score}/5
                </span>
              </div>
              <div className="ticket-content">
                <p className="ticket-message">
                  {ticket.message_text ?
                    ticket.message_text.length > 100
                      ? ticket.message_text.substring(0, 100) + '...'
                      : ticket.message_text
                    : 'No message available'}
                </p>
                <div className="ticket-meta">
                  <span className="table-cell-monospace">
                    Category: {ticket.category ? ticket.category.replace('-', ' ').toUpperCase() : '-'}
                  </span>
                  <span className="table-cell-monospace">
                    Channel: {ticket.channel ? ticket.channel.toUpperCase() : '-'}
                  </span>
                  <span className="table-cell-monospace">
                    Status: {ticket.status ? ticket.status.toUpperCase() : '-'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AtRiskPanel;