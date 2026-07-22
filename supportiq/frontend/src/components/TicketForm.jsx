import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TicketForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    message_text: '',
    channel: '',
    customer_id: ''
  });

  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [errorCustomers, setErrorCustomers] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      setErrorCustomers(null);

      const response = await axios.get('http://localhost:8000/customers/');
      setCustomers(response.data);
      console.log('Customers array from response:', response.data);

      if (response.data.length > 0) {
        console.log('First customer:', response.data[0]);
        console.log('First customer keys:', Object.keys(response.data[0]));
      }

      setLoadingCustomers(false);
    } catch (err) {
      setErrorCustomers(err.response ? err.response.data.detail : err.message);
      setLoadingCustomers(false);
    }
  };

  const channels = ['email', 'chat', 'phone', 'social'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.message_text.trim() || !formData.channel || !formData.customer_id) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      await axios.post('http://localhost:8000/tickets/', {
        customer_id: parseInt(formData.customer_id),
        channel: formData.channel,
        message_text: formData.message_text
      });

      setSuccess(true);
      setFormData({
        message_text: '',
        channel: '',
        customer_id: ''
      });

      if (onSubmit) onSubmit();

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err.response ? err.response.data.detail : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <div className="card-header">
        <h3 className="card-title">Create New Support Ticket</h3>
      </div>
      <div className="card-content">
        {errorCustomers && <div className="alert alert-error">Error loading customers: {errorCustomers}</div>}
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">Ticket created successfully!</div>}

        <div className="form-group">
          <label htmlFor="message" className="form-label">Message:</label>
          <textarea
            id="message"
            name="message_text"
            value={formData.message_text}
            onChange={handleChange}
            rows="4"
            placeholder="Enter the customer message or issue description..."
            required
            className="form-textarea"
          />
        </div>

        <div className="form-group">
          <label htmlFor="channel" className="form-label">Channel:</label>
          <select
            id="channel"
            name="channel"
            value={formData.channel}
            onChange={handleChange}
            required
            className="form-select"
          >
            <option value="">Select a channel</option>
            {channels.map(channel => (
              <option key={channel} value={channel}>
                {channel.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="customer_id" className="form-label">Customer:</label>
          <select
            id="customer_id"
            name="customer_id"
            value={formData.customer_id}
            onChange={handleChange}
            required
            disabled={loadingCustomers}
            className="form-select"
          >
            <option value="">Select a customer</option>
            {loadingCustomers ? (
              <option>Loading...</option>
            ) : errorCustomers ? (
              <option>Error loading customers</option>
            ) : (
              customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))
            )}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading ? 'Submitting...' : 'Create Ticket'}
        </button>
      </div>
    </form>
  );
};

export default TicketForm;