import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  ShieldAlert,
  PieChart as PieChartIcon,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  Zap,
  ArrowRight,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { analyticsApi, dashboardApi } from '../services/api';
import { PredictiveRiskResult, DashboardStats } from '../types';
import { RiskBadge } from '../components/Badges';

interface AnalyticsDashboardProps {
  onSelectTicket: (ticketId: number) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onSelectTicket }) => {
  const [predictions, setPredictions] = useState<PredictiveRiskResult[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [preds, dashStats] = await Promise.all([
          analyticsApi.getRiskPredictions(50),
          dashboardApi.getStats()
        ]);
        setPredictions(preds || []);
        setStats(dashStats);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Category chart data
  const categoryData = stats ? Object.entries(stats.tickets_per_category).map(([cat, count]) => ({
    name: cat.toUpperCase(),
    value: count
  })) : [];

  // Agent workload data
  const agentWorkloadData = stats ? Object.entries(stats.tickets_per_agent).map(([agent, load]) => ({
    name: agent,
    load: load
  })) : [];

  // Risk distribution counts
  const riskCounts = {
    LOW: predictions.filter(p => p.risk_level === 'LOW').length,
    MEDIUM: predictions.filter(p => p.risk_level === 'MEDIUM').length,
    HIGH: predictions.filter(p => p.risk_level === 'HIGH').length,
    CRITICAL: predictions.filter(p => p.risk_level === 'CRITICAL').length,
  };

  const riskDistributionData = [
    { name: 'Low Risk', count: riskCounts.LOW, fill: '#10b981' },
    { name: 'Medium Risk', count: riskCounts.MEDIUM, fill: '#f59e0b' },
    { name: 'High Risk', count: riskCounts.HIGH, fill: '#f97316' },
    { name: 'Critical Risk', count: riskCounts.CRITICAL, fill: '#f43f5e' },
  ];

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Predictive Support Analytics & Risk Intelligence
          </h1>
          <p className="text-xs text-slate-400">Track 4: ML risk scoring, escalation probabilities, and capacity allocation</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-80">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400">Evaluating predictive risk analytics models...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Charts Row 1: Risk Distribution & Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Distribution Bar Chart */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Predictive Risk Distribution
              </h3>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {riskDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ticket Categories Pie Chart */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-indigo-400" />
                Ticket Volume by Category
              </h3>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="45%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                        label={false}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                    </PieChart>

                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2: Agent Workload Allocation */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              Agent Active Capacity & Workload Allocation
            </h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentWorkloadData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="load" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* High Risk Predictions Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  High Risk Ticket Predictions & Recommended Actions
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Tickets sorted by highest escalation probability</p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                    <th className="py-3 px-4">Ticket ID</th>
                    <th className="py-3 px-4">Escalation Prob</th>
                    <th className="py-3 px-4">Risk Level</th>
                    <th className="py-3 px-4">Contributing Risk Factors</th>
                    <th className="py-3 px-4">Recommended Action</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {predictions.slice(0, 15).map((pred) => (
                    <tr key={pred.ticket_id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">
                        #{pred.ticket_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                pred.escalation_probability >= 0.75
                                  ? 'bg-rose-500'
                                  : pred.escalation_probability >= 0.5
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${pred.escalation_probability * 100}%` }}
                            ></div>
                          </div>
                          <span className="font-mono font-bold text-slate-200">
                            {(pred.escalation_probability * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <RiskBadge level={pred.risk_level} />
                      </td>
                      <td className="py-3.5 px-4">
                        <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-0.5 max-w-sm">
                          {pred.risk_factors.map((f, i) => (
                            <li key={i} className="truncate">{f}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-indigo-300">
                        {pred.recommended_action}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onSelectTicket(pred.ticket_id)}
                          className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 rounded text-xs font-semibold inline-flex items-center gap-1 transition-all"
                        >
                          View Workspace
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
