import axios from 'axios';
import {
  Ticket,
  TicketPage,
  DashboardStats,
  Customer360Context,
  GenerateResponseOutput,
  PredictiveRiskResult,
  Customer,
  Agent,
  User,
  TicketStatus
} from '../types';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('supportiq_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// API Methods
export const authApi = {
  login: async (data: any) => {
    const res = await api.post('/auth/login', data);
    return res.data;
  },
  register: async (data: any) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

export const ticketsApi = {
  getTickets: async (params?: any): Promise<TicketPage> => {
    const res = await api.get('/tickets', { params });
    return res.data;
  },
  getTicket: async (id: number): Promise<Ticket> => {
    const res = await api.get(`/tickets/${id}`);
    return res.data;
  },
  createTicket: async (data: { customer_id: number; channel: string; message_text: string }): Promise<Ticket> => {
    const res = await api.post('/tickets', data);
    return res.data;
  },
  updateStatus: async (id: number, status: TicketStatus): Promise<Ticket> => {
    const res = await api.patch(`/tickets/${id}`, { status });
    return res.data;
  },
  generateAIResponse: async (id: number): Promise<GenerateResponseOutput> => {
    const res = await api.post(`/tickets/${id}/generate-response`);
    return res.data;
  },
  checkSLA: async (max_hours = 24): Promise<{ escalated_count: number; escalated_ticket_ids: number[] }> => {
    const res = await api.post(`/tickets/check-sla?max_hours=${max_hours}`);
    return res.data;
  },
  getAuditLog: async (id: number) => {
    const res = await api.get(`/tickets/${id}/audit-log`);
    return res.data;
  },
};

export const customersApi = {
  getCustomers: async (): Promise<Customer[]> => {
    const res = await api.get('/customers');
    return res.data;
  },
  getCustomerContext: async (customerId: number): Promise<Customer360Context> => {
    const res = await api.get(`/customers/${customerId}/context`);
    return res.data;
  },
};

export const agentsApi = {
  getAgents: async (): Promise<Agent[]> => {
    const res = await api.get('/agents');
    return res.data;
  },
};

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await api.get('/dashboard');
    return res.data;
  },
};

export const analyticsApi = {
  getRiskPredictions: async (limit = 50): Promise<PredictiveRiskResult[]> => {
    const res = await api.get(`/analytics/risk-predictions?limit=${limit}`);
    return res.data;
  },
};

export const channelsApi = {
  ingestEmail: async (data: any): Promise<Ticket> => {
    const res = await api.post('/channels/email', data);
    return res.data;
  },
  ingestChat: async (data: any): Promise<Ticket> => {
    const res = await api.post('/channels/chat', data);
    return res.data;
  },
  ingestSocial: async (data: any): Promise<Ticket> => {
    const res = await api.post('/channels/social', data);
    return res.data;
  },
  ingestPhone: async (data: any): Promise<Ticket> => {
    const res = await api.post('/channels/phone', data);
    return res.data;
  },
};

export default api;
