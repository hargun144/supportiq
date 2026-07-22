import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Clock,
  Ticket as TicketIcon,
  CheckCircle2,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { ticketsApi, dashboardApi } from '../services/api';
import { DashboardStats, Ticket as TicketType, TicketStatus, TicketCategory, TicketChannel, CustomerTier } from '../types';
import { StatusBadge, CategoryBadge, RiskBadge, PriorityBadge, ChannelBadge, TierBadge, SlaBadge } from '../components/Badges';

interface AgentDashboardProps {
  onSelectTicket: (ticketId: number) => void;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({ onSelectTicket }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const limit = 15;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashStats, ticketData] = await Promise.all([
        dashboardApi.getStats(),
        ticketsApi.getTickets({
          skip: page * limit,
          limit,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          channel: channelFilter !== 'all' ? channelFilter : undefined,
          customer_tier: tierFilter !== 'all' ? tierFilter : undefined,
        })
      ]);
      setStats(dashStats);
      setTickets(ticketData.tickets || []);
      setTotalTickets(ticketData.total || 0);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, statusFilter, categoryFilter, tierFilter, channelFilter]);

  // Client-side search filtering
  const filteredTickets = tickets.filter((t) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      t.id.toString().includes(query) ||
      t.message_text.toLowerCase().includes(query) ||
      (t.customer?.name && t.customer.name.toLowerCase().includes(query)) ||
      (t.customer?.email && t.customer.email.toLowerCase().includes(query))
    );
  });

  const totalPages = Math.ceil(totalTickets / limit);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Agent Support Operations Dashboard</h1>
          <p className="text-xs text-slate-400">Real-time AI ticket routing, SLA monitoring, and agent workload queue</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Dashboard
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tickets</span>
            <TicketIcon className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white">{stats?.total_tickets ?? '-'}</p>
          <p className="text-[11px] text-slate-400 mt-1">Platform wide volume</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Open Queue</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-blue-400">{stats?.open_tickets ?? '-'}</p>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting resolution</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Escalated</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400">{stats?.escalated_tickets ?? '-'}</p>
          <p className="text-[11px] text-slate-400 mt-1">Senior lead assigned</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur border-rose-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">SLA Breached</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400">{stats?.sla_breached_count ?? '-'}</p>
          <p className="text-[11px] text-rose-400/80 mt-1">Requires urgent action</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Risk Score</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-indigo-300">{stats ? roundVal(stats.avg_risk) : '-'}/100</p>
          <p className="text-[11px] text-slate-400 mt-1">AI calculated risk</p>
        </div>
      </div>

      {/* Ticket Queue Filters & Search */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-4 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket ID, customer name, or message..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              className="bg-slate-950/80 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-2 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="escalated">Escalated</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}
              className="bg-slate-950/80 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-2 focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="billing">Billing</option>
              <option value="technical">Technical</option>
              <option value="complaint">Complaint</option>
              <option value="general">General</option>
            </select>

            {/* Tier Filter */}
            <select
              value={tierFilter}
              onChange={(e) => { setTierFilter(e.target.value); setPage(0); }}
              className="bg-slate-950/80 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-2 focus:outline-none"
            >
              <option value="all">All Tiers</option>
              <option value="enterprise">Enterprise</option>
              <option value="premium">Premium</option>
              <option value="free">Free</option>
            </select>

            {/* Channel Filter */}
            <select
              value={channelFilter}
              onChange={(e) => { setChannelFilter(e.target.value); setPage(0); }}
              className="bg-slate-950/80 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-2 focus:outline-none"
            >
              <option value="all">All Channels</option>
              <option value="email">Email</option>
              <option value="chat">Chat</option>
              <option value="social">Social</option>
              <option value="phone">Phone</option>
            </select>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                <th className="py-3 px-4">Ticket ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Risk</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Agent</th>
                <th className="py-3 px-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <span className="inline-block w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mr-2"></span>
                    Loading operational ticket queue...
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No tickets found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => onSelectTicket(t.id)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">
                      #{t.id}
                      {t.sla_breached && <SlaBadge breached={true} />}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{t.customer?.name || `Customer #${t.customer_id}`}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-400 truncate max-w-[140px]">{t.customer?.email}</span>
                        {t.customer?.tier && <TierBadge tier={t.customer.tier} />}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <ChannelBadge channel={t.channel} />
                    </td>
                    <td className="py-3.5 px-4">
                      <CategoryBadge category={t.category} />
                    </td>
                    <td className="py-3.5 px-4">
                      <PriorityBadge score={t.priority_score} />
                    </td>
                    <td className="py-3.5 px-4">
                      <RiskBadge score={t.risk_score} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {t.agent?.name ? (
                        <span className="inline-flex items-center gap-1 text-slate-300 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                          {t.agent.name}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono text-[11px]">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(t.created_at).toLocaleDateString()} {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
          <span>
            Showing <strong className="text-slate-200">{tickets.length}</strong> of <strong className="text-slate-200">{totalTickets}</strong> tickets
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="p-1.5 rounded bg-slate-950 border border-slate-800 hover:bg-slate-800 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono px-2">
              Page {page + 1} of {totalPages || 1}
            </span>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded bg-slate-950 border border-slate-800 hover:bg-slate-800 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function roundVal(val: number): number {
  return Math.round(val * 10) / 10;
}
