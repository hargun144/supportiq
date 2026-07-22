import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TicketQueue = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('http://localhost:8000/tickets/?limit=100');
      // Sort by priority_score descending
      const sortedTickets = [...response.data.tickets].sort((a, b) => b.priority_score - a.priority_score);
      setTickets(sortedTickets);

      setLoading(false);
    } catch (err) {
      setError(err.response ? err.response.data.detail : err.message);
      setLoading(false);
    }
  };

  if (loading && tickets.length === 0) {
    return <div className="loading">Loading tickets...</div>;
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  if (tickets.length === 0) {
    return <div className="empty-state">No tickets found</div>;
  }

  return (
    <div className="ticket-queue">
      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Category</th>
              <th>Channel</th>
              <th>Priority Score</th>
              <th>Risk Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(ticket => (
              <tr key={ticket.id} className={getPriorityClass(ticket.priority_score)}>
                <td>{ticket.id}</td>
                <td>{formatCategory(ticket.category)}</td>
                <td>{formatChannel(ticket.channel)}</td>
                <td className="table-cell-monospace">{ticket.priority_score}</td>
                <td className="table-cell-monospace">{ticket.risk_score}</td>
                <td>
                  <span className={`status-badge-table ${getStatusClass(ticket.status)}`}>
                    {formatStatus(ticket.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const getPriorityClass = (score) => {
  if (score <= 2) return 'priority-low';
  if (score === 3) return 'priority-medium';
  return 'priority-high';
};

const getStatusClass = (status) => {
  if (!status) return 'status-badge-table-info';
  const statusLower = status.toLowerCase();
  if (statusLower === 'closed') return 'status-badge-table-success';
  if (statusLower === 'in_progress' || statusLower === 'in progress') return 'status-badge-table-warning';
  if (statusLower === 'open' || statusLower === 'new') return 'status-badge-table-error';
  return 'status-badge-table-info';
};

const formatCategory = (category) => {
  if (!category) return '-';
  return category.replace('-', ' ').toUpperCase();
};

const formatChannel = (channel) => {
  if (!channel) return '-';
  return channel.toUpperCase();
};

const formatStatus = (status) => {
  if (!status) return '-';
  return status.toUpperCase();
};

export default TicketQueue;