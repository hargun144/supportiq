import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Clock,
  MessageSquare,
  Ticket as TicketIcon,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  FileText,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { customersApi } from '../services/api';
import { Customer360Context, Customer } from '../types';
import { TierBadge, StatusBadge, RiskBadge, PriorityBadge } from '../components/Badges';

interface Customer360PageProps {
  initialCustomerId?: number | null;
  onSelectTicket: (ticketId: number) => void;
}

export const Customer360Page: React.FC<Customer360PageProps> = ({
  initialCustomerId,
  onSelectTicket
}) => {
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(initialCustomerId || null);
  const [contextData, setContextData] = useState<Customer360Context | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch list of customers for selection dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const list = await customersApi.getCustomers();
        setCustomersList(list);
        if (!selectedCustomerId && list.length > 0) {
          setSelectedCustomerId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load customers list:', err);
      }
    };
    fetchCustomers();
  }, []);

  // Fetch Customer 360 Context when selectedCustomerId changes
  useEffect(() => {
    if (!selectedCustomerId) return;
    const load360 = async () => {
      setLoading(true);
      try {
        const data = await customersApi.getCustomerContext(selectedCustomerId);
        setContextData(data);
      } catch (err) {
        console.error('Failed to fetch Customer 360 context:', err);
      } finally {
        setLoading(false);
      }
    };
    load360();
  }, [selectedCustomerId]);

  // Format chart data for Risk History
  const riskChartData = contextData?.risk_history.map((r, i) => ({
    name: `Ticket #${r.ticket_id}`,
    risk_score: r.risk_score,
    index: i + 1
  })) || [];

  // Format chart data for Sentiment History
  const sentimentChartData = contextData?.sentiment_history.map((s, i) => ({
    name: `Ticket #${s.ticket_id}`,
    sentiment: s.sentiment,
    val: s.sentiment === 'positive' ? 3 : s.sentiment === 'neutral' ? 2 : s.sentiment === 'negative' ? 1 : 0
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header & Customer Selection Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Customer 360 Intelligence System
          </h1>
          <p className="text-xs text-slate-400">Unified customer profile, multi-channel history, and predictive risk trends</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-400">Select Customer:</label>
          <select
            value={selectedCustomerId || ''}
            onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
            className="bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            {customersList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.tier.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-80">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400">Loading Customer 360 profile...</p>
          </div>
        </div>
      ) : contextData ? (
        <div className="space-y-6">
          {/* Top Profile Summary Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Account Name</span>
              <h2 className="text-lg font-bold text-white">{contextData.customer_profile.name}</h2>
              <p className="text-xs text-indigo-300 font-mono">{contextData.customer_profile.email}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Subscription Tier</span>
              <div>
                <TierBadge tier={contextData.customer_tier} />
              </div>
              <p className="text-[11px] text-slate-400">Since {new Date(contextData.customer_profile.created_at).toLocaleDateString()}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Historical Tickets</span>
              <p className="text-2xl font-black text-slate-100">{contextData.previous_tickets.length}</p>
              <p className="text-[11px] text-slate-400">Total submitted queries</p>
            </div>

            <div className="space-y-1 border-l border-slate-800/80 pl-4">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Unresolved Issues</span>
              <p className="text-2xl font-black text-rose-400">{contextData.unresolved_issues.length}</p>
              <p className="text-[11px] text-slate-400">Active open/escalated cases</p>
            </div>
          </div>

          {/* Charts Row: Risk Trend & Sentiment Evolution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Trend Chart */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  Risk Score Trajectory
                </h3>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={riskChartData}>
                    <defs>
                      <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="risk_score" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#riskGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sentiment History Chart */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Customer Sentiment Evolution
                </h3>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sentimentChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 3]} ticks={[0, 1, 2, 3]} tickFormatter={(v) => v === 3 ? 'Pos' : v === 2 ? 'Neu' : v === 1 ? 'Neg' : 'Frust'} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="val" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Timeline & Tickets Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Interaction Timeline */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
                <Clock className="w-4 h-4 text-indigo-400" />
                Interaction Timeline
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {contextData.interaction_timeline.length === 0 ? (
                  <p className="text-xs text-slate-500">No interaction history recorded.</p>
                ) : (
                  contextData.interaction_timeline.map((item) => (
                    <div key={item.id} className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-indigo-300 uppercase">{item.interaction_type}</span>
                        <span className="text-[10px] text-slate-400">{new Date(item.timestamp).toLocaleString()}</span>
                      </div>
                      {item.interaction_metadata && (
                        <p className="text-[11px] text-slate-400 font-mono truncate">{JSON.stringify(item.interaction_metadata)}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Previous Tickets History */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
                <TicketIcon className="w-4 h-4 text-indigo-400" />
                Ticket History
              </h3>
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {contextData.previous_tickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onSelectTicket(t.id)}
                    className="p-3 bg-slate-950/80 hover:bg-slate-800/60 border border-slate-800 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-300">#{t.id}</span>
                        <StatusBadge status={t.status} />
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 line-clamp-1">{t.message_text}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
