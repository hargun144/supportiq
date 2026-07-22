import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Bot,
  User,
  Send,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  AlertOctagon,
  FileText,
  RefreshCw,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { ticketsApi } from '../services/api';
import { Ticket, TicketStatus, GenerateResponseOutput } from '../types';
import { StatusBadge, CategoryBadge, RiskBadge, PriorityBadge, ChannelBadge, TierBadge, SlaBadge } from '../components/Badges';

interface TicketDetailPageProps {
  ticketId: number;
  onBack: () => void;
  onViewCustomer360: (customerId: number) => void;
}

export const TicketDetailPage: React.FC<TicketDetailPageProps> = ({
  ticketId,
  onBack,
  onViewCustomer360
}) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [aiResponse, setAiResponse] = useState<GenerateResponseOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingResponse, setGeneratingResponse] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadTicketData = async () => {
    setLoading(true);
    try {
      const [tData, logs] = await Promise.all([
        ticketsApi.getTicket(ticketId),
        ticketsApi.getAuditLog(ticketId)
      ]);
      setTicket(tData);
      setAuditLogs(logs || []);
    } catch (err) {
      console.error('Failed to load ticket details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicketData();
  }, [ticketId]);

  const handleGenerateAiResponse = async () => {
    setGeneratingResponse(true);
    try {
      const res = await ticketsApi.generateAIResponse(ticketId);
      setAiResponse(res);
      // Reload audit logs to reflect response_generated action
      const logs = await ticketsApi.getAuditLog(ticketId);
      setAuditLogs(logs || []);
    } catch (err) {
      console.error('Failed to generate AI response:', err);
    } finally {
      setGeneratingResponse(false);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    setUpdatingStatus(true);
    try {
      const updated = await ticketsApi.updateStatus(ticketId, newStatus);
      setTicket(updated);
      const logs = await ticketsApi.getAuditLog(ticketId);
      setAuditLogs(logs || []);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400">Loading AI Ticket Workspace #{ticketId}...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-slate-400">Ticket #{ticketId} not found.</p>
        <button onClick={onBack} className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white font-mono">Ticket #{ticket.id}</h1>
              <StatusBadge status={ticket.status} />
              {ticket.sla_breached && <SlaBadge breached={true} />}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Created on {new Date(ticket.created_at).toLocaleString()}</p>
          </div>
        </div>

        {/* Quick Status Action Controls */}
        <div className="flex items-center gap-2">
          {ticket.status !== 'in_progress' && (
            <button
              onClick={() => handleStatusChange('in_progress')}
              disabled={updatingStatus}
              className="px-3 py-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
            >
              In Progress
            </button>
          )}

          {ticket.status !== 'resolved' && (
            <button
              onClick={() => handleStatusChange('resolved')}
              disabled={updatingStatus}
              className="px-3 py-1.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
            >
              Resolve Ticket
            </button>
          )}

          {ticket.status !== 'escalated' && (
            <button
              onClick={() => handleStatusChange('escalated')}
              disabled={updatingStatus}
              className="px-3 py-1.5 bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
            >
              Escalate
            </button>
          )}
        </div>
      </div>

      {/* 3-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Customer Information (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Customer Profile</h2>
              <User className="w-4 h-4 text-indigo-400" />
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-400">Full Name</p>
                <p className="text-sm font-bold text-slate-100">{ticket.customer?.name || 'Customer'}</p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Email Address</p>
                <p className="text-xs font-mono text-indigo-300 break-all">{ticket.customer?.email}</p>
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-1">Subscription Tier</p>
                {ticket.customer?.tier && <TierBadge tier={ticket.customer.tier} />}
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <span className="text-slate-400">Channel</span>
                <ChannelBadge channel={ticket.channel} />
              </div>

              {ticket.first_response_time !== null && ticket.first_response_time !== undefined && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">First Response</span>
                  <span className="font-mono text-emerald-400">{ticket.first_response_time} mins</span>
                </div>
              )}

              {ticket.resolution_time !== null && ticket.resolution_time !== undefined && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Resolution Time</span>
                  <span className="font-mono text-emerald-400">{ticket.resolution_time} mins</span>
                </div>
              )}
            </div>

            {ticket.customer_id && (
              <button
                onClick={() => onViewCustomer360(ticket.customer_id)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition-all mt-2"
              >
                View Customer 360
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Assigned Agent Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Agent</h3>
            {ticket.agent ? (
              <div className="flex items-center gap-3 pt-1">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-bold flex items-center justify-center text-xs">
                  {ticket.agent.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200">{ticket.agent.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">{ticket.agent.specialty} Specialist</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-mono">No specialist assigned</p>
            )}
          </div>
        </div>

        {/* CENTER COLUMN: Conversation Timeline (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4 min-h-[480px] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                Conversation Timeline
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">{ticket.channel.toUpperCase()} CHANNEL</span>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              {/* Primary Customer Message */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    {ticket.customer?.name || 'Customer'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{ticket.message_text}</p>
              </div>

              {/* Conversations history if available */}
              {ticket.conversations && ticket.conversations.map((c) => (
                <div
                  key={c.id}
                  className={`p-4 rounded-xl border space-y-2 ${
                    c.sender_type === 'customer'
                      ? 'bg-slate-950/80 border-slate-800'
                      : 'bg-indigo-950/30 border-indigo-500/30 ml-4'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200 capitalize flex items-center gap-1.5">
                      {c.sender_type === 'customer' ? <User className="w-3.5 h-3.5 text-indigo-400" /> : <Bot className="w-3.5 h-3.5 text-purple-400" />}
                      {c.sender_type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{c.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Copilot Panel & Response Assistant (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* AI Intelligence Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                AI Intelligence Copilot
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">Category</span>
                <CategoryBadge category={ticket.category} />
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">Priority</span>
                <PriorityBadge score={ticket.priority_score} />
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">Sentiment</span>
                <span className="font-semibold capitalize text-slate-200">{ticket.sentiment || 'Neutral'}</span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">Risk Score</span>
                <RiskBadge score={ticket.risk_score} />
              </div>
            </div>
          </div>

          {/* AI Response Assistant (RAG Pipeline) */}
          <div className="bg-gradient-to-b from-indigo-950/40 to-slate-900/90 border border-indigo-500/30 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <Bot className="w-4 h-4 text-indigo-400" />
                AI Response Assistant
              </h3>
              <button
                onClick={handleGenerateAiResponse}
                disabled={generatingResponse}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all disabled:opacity-50"
              >
                {generatingResponse ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    {aiResponse ? 'Regenerate Reply' : 'Generate AI Reply'}
                  </>
                )}
              </button>
            </div>

            {aiResponse ? (
              <div className="space-y-3 pt-2">
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Confidence: {(aiResponse.confidence_score * 100).toFixed(0)}%</span>
                    <span className="text-indigo-400">RAG Knowledge Pipeline</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">{aiResponse.suggested_response}</p>
                </div>

                {aiResponse.sources_used && aiResponse.sources_used.length > 0 && (
                  <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/80 space-y-1">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Knowledge Sources Used</span>
                    <ul className="text-[11px] text-indigo-300 space-y-0.5">
                      {aiResponse.sources_used.map((src, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <FileText className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                          <span>{src}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-indigo-500/20 text-center space-y-2">
                <p className="text-xs text-slate-400">Click "Generate AI Reply" to run RAG context retrieval and generate an automated support reply.</p>
              </div>
            )}
          </div>

          {/* Audit Log Timeline */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Audit Log Timeline
            </h3>
            <div className="space-y-3 pt-1 max-h-60 overflow-y-auto pr-1">
              {auditLogs.map((log, idx) => (
                <div key={log.id || idx} className="flex items-start gap-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 font-mono uppercase text-[11px]">{log.action}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {log.details && (
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">{JSON.stringify(log.details)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
