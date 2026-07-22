import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Mail,
  MessageSquare,
  Share2,
  PhoneCall,
  Plus,
  Send,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { ticketsApi, channelsApi, customersApi } from '../services/api';
import { Ticket, TicketChannel, Customer } from '../types';
import { StatusBadge, CategoryBadge, RiskBadge, PriorityBadge, ChannelBadge } from '../components/Badges';

interface UnifiedInboxProps {
  onSelectTicket: (ticketId: number) => void;
}

export const UnifiedInbox: React.FC<UnifiedInboxProps> = ({ onSelectTicket }) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Ingestion Modal State
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [ingestChannel, setIngestChannel] = useState<TicketChannel>('email');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [messageText, setMessageText] = useState('');
  const [submittingIngest, setSubmittingIngest] = useState(false);
  const [ingestSuccessMsg, setIngestSuccessMsg] = useState('');

  const fetchInbox = async () => {
    setLoading(true);
    try {
      const [ticketData, customerList] = await Promise.all([
        ticketsApi.getTickets({
          channel: activeTab !== 'all' ? activeTab : undefined,
          limit: 30
        }),
        customersApi.getCustomers()
      ]);
      setTickets(ticketData.tickets || []);
      setCustomers(customerList || []);
    } catch (err) {
      console.error('Failed to fetch inbox:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, [activeTab]);

  const handleSimulateIngestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setSubmittingIngest(true);
    setIngestSuccessMsg('');
    try {
      const payload = {
        customer_id: selectedCustomerId || undefined,
        message_text: messageText,
        metadata: { simulated_by: 'Omnichannel Ingestion Console' }
      };

      let newTicket: Ticket;
      if (ingestChannel === 'email') newTicket = await channelsApi.ingestEmail(payload);
      else if (ingestChannel === 'chat') newTicket = await channelsApi.ingestChat(payload);
      else if (ingestChannel === 'social') newTicket = await channelsApi.ingestSocial(payload);
      else newTicket = await channelsApi.ingestPhone(payload);

      setIngestSuccessMsg(`Ticket #${newTicket.id} ingested & auto-classified as '${newTicket.category}'!`);
      setMessageText('');
      fetchInbox();
      setTimeout(() => setShowIngestModal(false), 2000);
    } catch (err: any) {
      console.error('Ingestion failed:', err);
    } finally {
      setSubmittingIngest(false);
    }
  };

  const channelTabs = [
    { id: 'all', label: 'All Channels', icon: Inbox },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'chat', label: 'Live Chat', icon: MessageSquare },
    { id: 'social', label: 'Social Media', icon: Share2 },
    { id: 'phone', label: 'Phone Calls', icon: PhoneCall },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Inbox className="w-5 h-5 text-indigo-400" />
            Omnichannel Support Inbox
          </h1>
          <p className="text-xs text-slate-400">Unified multi-channel ticket streams and real-time ingestion console</p>
        </div>

        <button
          onClick={() => setShowIngestModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          Simulate Incoming Channel Message
        </button>
      </div>

      {/* Channel Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        {channelTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Inbox List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400">Loading channel messages...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No incoming messages found for this channel.
          </div>
        ) : (
          <div className="space-y-2">
            {tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => onSelectTicket(t.id)}
                className="p-4 bg-slate-950/70 hover:bg-slate-800/60 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer transition-all gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 mt-0.5">
                    <ChannelBadge channel={t.channel} />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-300 text-xs">#{t.id}</span>
                      <span className="font-bold text-slate-100 text-xs">{t.customer?.name || `Customer #${t.customer_id}`}</span>
                      <CategoryBadge category={t.category} />
                    </div>
                    <p className="text-xs text-slate-300 truncate max-w-2xl">{t.message_text}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <PriorityBadge score={t.priority_score} />
                  <RiskBadge score={t.risk_score} />
                  <StatusBadge status={t.status} />
                  <span className="text-[11px] font-mono text-slate-500 hidden md:inline">
                    {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ingestion Simulation Modal */}
      {showIngestModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Simulate Inbound Multi-Channel Message
              </h3>
              <button
                onClick={() => setShowIngestModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            </div>

            {ingestSuccessMsg && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{ingestSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSimulateIngestion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Channel</label>
                <select
                  value={ingestChannel}
                  onChange={(e) => setIngestChannel(e.target.value as TicketChannel)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200"
                >
                  <option value="email">Email</option>
                  <option value="chat">Live Chat</option>
                  <option value="social">Social Media</option>
                  <option value="phone">Phone Call Transcript</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200"
                >
                  <option value="">-- Anonymous / Auto-Create Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Message Text</label>
                <textarea
                  required
                  rows={4}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Enter ticket query message (e.g. 'URGENT: Refund needed for invoice #9021')..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIngestModal(false)}
                  className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingIngest}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  {submittingIngest ? 'Ingesting...' : 'Submit Message'}
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
