import React from 'react';
import { Mail, MessageSquare, Share2, PhoneCall, AlertTriangle, ShieldAlert } from 'lucide-react';
import { TicketStatus, TicketCategory, TicketChannel, CustomerTier } from '../types';

export const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const styles: Record<TicketStatus, string> = {
    open: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    in_progress: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    escalated: 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse',
  };

  const labels: Record<TicketStatus, string> = {
    open: 'OPEN',
    in_progress: 'IN PROGRESS',
    resolved: 'RESOLVED',
    escalated: 'ESCALATED',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export const CategoryBadge: React.FC<{ category?: TicketCategory | null }> = ({ category }) => {
  if (!category) return <span className="text-xs text-slate-400 font-mono">Unassigned</span>;

  const styles: Record<TicketCategory, string> = {
    billing: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    technical: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    complaint: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    general: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase border ${styles[category]}`}>
      {category}
    </span>
  );
};

export const RiskBadge: React.FC<{ score?: number | null; level?: string }> = ({ score, level }) => {
  const scoreVal = score ?? (level === 'CRITICAL' ? 90 : level === 'HIGH' ? 75 : level === 'MEDIUM' ? 50 : 20);

  let bg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let label = level || 'LOW';

  if (scoreVal >= 80) {
    bg = 'bg-rose-500/20 text-rose-400 border-rose-500/50 font-bold animate-pulse';
    label = level || 'HIGH RISK';
  } else if (scoreVal >= 50) {
    bg = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    label = level || 'MEDIUM';
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${bg}`}>
      {scoreVal >= 80 && <ShieldAlert className="w-3 h-3 text-rose-400" />}
      {score !== undefined && score !== null ? `Risk: ${score}` : label}
    </span>
  );
};

export const PriorityBadge: React.FC<{ score?: number | null }> = ({ score }) => {
  if (score === null || score === undefined) return <span className="text-xs text-slate-400">-</span>;

  let color = 'text-slate-400';
  if (score >= 75) color = 'text-rose-400 font-bold';
  else if (score >= 50) color = 'text-amber-400 font-semibold';
  else color = 'text-emerald-400';

  return <span className={`text-xs font-mono ${color}`}>{score}/100</span>;
};

export const ChannelBadge: React.FC<{ channel: TicketChannel }> = ({ channel }) => {
  const icons: Record<TicketChannel, React.ReactNode> = {
    email: <Mail className="w-3.5 h-3.5 text-sky-400" />,
    chat: <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />,
    social: <Share2 className="w-3.5 h-3.5 text-purple-400" />,
    phone: <PhoneCall className="w-3.5 h-3.5 text-amber-400" />,
  };

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium capitalize bg-slate-800/60 text-slate-300 border border-slate-700">
      {icons[channel]}
      {channel}
    </span>
  );
};

export const TierBadge: React.FC<{ tier: CustomerTier }> = ({ tier }) => {
  const styles: Record<CustomerTier, string> = {
    enterprise: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-bold',
    premium: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    free: 'bg-slate-700/40 text-slate-300 border-slate-600',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs uppercase tracking-wider border ${styles[tier]}`}>
      {tier}
    </span>
  );
};

export const SlaBadge: React.FC<{ breached: boolean }> = ({ breached }) => {
  if (!breached) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-800">
      <AlertTriangle className="w-3 h-3 text-rose-400" />
      SLA BREACHED
    </span>
  );
};
