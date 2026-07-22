import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AgentLoadView = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('http://localhost:8000/agents/');
      setAgents(response.data);

      setLoading(false);
    } catch (err) {
      setError(err.response ? err.response.data.detail : err.message);
      setLoading(false);
    }
  };

  if (loading && agents.length === 0) {
    return <div className="loading">Loading agent data...</div>;
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  if (agents.length === 0) {
    return <div className="empty-state">No agents found</div>;
  }

  return (
    <div className="agent-load-view card">
      <div className="card-header">
        <h2 className="card-title">Agent Workload</h2>
      </div>
      <div className="card-content">
        <div className="agents-list">
          {agents.map(agent => (
            <div key={agent.id} className="agent-card card">
              <div className="agent-header">
                <h3 className="agent-name">{agent.name}</h3>
                <span className="agent-specialty badge badge-info">
                  {agent.specialty}
                </span>
              </div>
              <div className="agent-load-info">
                <div className="load-label">Current Load:</div>
                <div className="load-bar-container">
                  <div
                    className="load-bar-fill"
                    style={{ width: `${Math.min((agent.current_load || 0) * 20, 100)}%` }}
                  ></div>
                </div>
                <div className="load-value">
                  {agent.current_load || 0}/5
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgentLoadView;