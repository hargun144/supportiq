import React from 'react';
import {
  Zap,
  ArrowRight,
  ShieldAlert,
  Bot,
  Users,
  Inbox,
  Sparkles,
  TrendingUp,
  BarChart3,
  Clock,
  Layers,
  Sliders
} from 'lucide-react';

interface LandingPageProps {
  onNavigateLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateLogin }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent blur-3xl pointer-events-none"></div>

      {/* Navigation Header */}
      <header className="relative z-20 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <span className="font-heading font-extrabold text-lg tracking-wider uppercase text-white">SupportIQ</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-400">
            <a href="#how-it-works" className="hover:text-emerald-300 transition-colors">How it works</a>
            <a href="#pillars" className="hover:text-emerald-300 transition-colors">The Four Pillars</a>
            <a href="#operations" className="hover:text-emerald-300 transition-colors">Operations</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateLogin}
              className="px-4 py-2 text-xs font-semibold text-slate-300 border border-slate-800 rounded-lg hover:bg-slate-900 transition-all"
            >
              Sign In
            </button>
            <button
              onClick={onNavigateLogin}
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              Access Platform
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 1. HERO SECTION */}
      <section className="relative z-10 pt-16 pb-16 px-6 text-center max-w-4xl mx-auto space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 text-[11px] font-mono uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          AI-POWERED SUPPORT OPERATIONS
        </div>

        <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight max-w-3xl mx-auto">
          Predict. Resolve.<br />
          Route Every Ticket.<br />
          Automatically.
        </h1>

        <p className="text-base sm:text-lg text-slate-400 font-normal max-w-2xl mx-auto leading-relaxed">
          SupportIQ unifies multi-channel customer messages, executes real-time AI triage, synthesizes RAG responses, and predicts account escalations — end to end.
        </p>

        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={onNavigateLogin}
            className="px-7 py-3.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-sm font-extrabold rounded-xl shadow-lg transition-all flex items-center gap-2"
          >
            Access Platform
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onNavigateLogin}
            className="px-6 py-3.5 border border-slate-800 bg-slate-900/60 text-slate-200 hover:bg-slate-800 text-sm font-semibold rounded-xl transition-all"
          >
            Sign In
          </button>
        </div>

        {/* 2. ACCURATE STAT ROW */}
        <div className="pt-12 max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-y border-slate-800/80">
            <div className="space-y-1">
              <p className="font-heading text-3xl lg:text-4xl font-extrabold text-emerald-400">4 Channels</p>
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">EMAIL · CHAT · SOCIAL · PHONE</p>
            </div>
            <div className="space-y-1 border-y md:border-y-0 md:border-x border-slate-800/80 py-3 md:py-0">
              <p className="font-heading text-3xl lg:text-4xl font-extrabold text-emerald-400">100%</p>
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">AUTOMATED TRIAGE & ROUTING</p>
            </div>
            <div className="space-y-1">
              <p className="font-heading text-3xl lg:text-4xl font-extrabold text-emerald-400">4 Core Tracks</p>
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">TRIAGE · CONTEXT · RAG · ANALYTICS</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS (3 NUMBERED STEPS) */}
      <section id="how-it-works" className="relative z-10 py-20 px-6 border-t border-slate-800/80 bg-slate-900/40">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <p className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">HOW IT WORKS</p>
            <h2 className="font-heading text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              From inquiry to resolution in one automated flow.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 01 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-7 relative space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Inbox className="w-5 h-5" />
                </div>
                <span className="font-mono text-3xl font-black text-slate-700/60">01</span>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-heading text-base font-bold text-white tracking-tight">Ingest & Classify</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Incoming tickets from Email, Chat, Social, or Phone are normalized and classified into categories with priority and risk scores.
                </p>
              </div>
            </div>

            {/* Step 02 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-7 relative space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="font-mono text-3xl font-black text-slate-700/60">02</span>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-heading text-base font-bold text-white tracking-tight">Synthesize RAG Context</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Queries enterprise knowledge bases to draft contextual responses with confidence scores and explicit source citations.
                </p>
              </div>
            </div>

            {/* Step 03 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-7 relative space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="font-mono text-3xl font-black text-slate-700/60">03</span>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-heading text-base font-bold text-white tracking-tight">Workload Routing</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automatically assigns tickets to available specialist agents based on specialty matching and current capacity load.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THE FOUR PILLARS */}
      <section id="pillars" className="relative z-10 py-20 px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <p className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">THE FOUR PILLARS</p>
          <h2 className="font-heading text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Every part of the support lifecycle, automated.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pillar 01 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-7 space-y-5 relative">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <span className="font-mono text-3xl font-black text-slate-700/60">01</span>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-heading text-base font-bold text-white tracking-tight">Intelligent Query Routing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Categorizes and routes queries to the right specialist. Priority scoring by urgency, customer tier, and complexity.
              </p>
            </div>
          </div>

          {/* Pillar 02 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-7 space-y-5 relative">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <span className="font-mono text-3xl font-black text-slate-700/60">02</span>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-heading text-base font-bold text-white tracking-tight">Unified Customer Context</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Aggregates interaction history across every channel. Maintains conversation context through channel transitions.
              </p>
            </div>
          </div>

          {/* Pillar 03 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-7 space-y-5 relative">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-mono text-3xl font-black text-slate-700/60">03</span>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-heading text-base font-bold text-white tracking-tight">Automated Response Generation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                AI drafts responses to common queries using retrieval-augmented generation, with source citations and confidence scoring.
              </p>
            </div>
          </div>

          {/* Pillar 04 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-7 space-y-5 relative">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="font-mono text-3xl font-black text-slate-700/60">04</span>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-heading text-base font-bold text-white tracking-tight">Predictive Support Analytics</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Continuously scores escalation risk in real time from sentiment, SLA timers, and account signals — flagging issues before they escalate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FINAL CTA SECTION */}
      <section id="operations" className="relative z-10 py-20 px-6 max-w-4xl mx-auto text-center">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-10 sm:p-14 space-y-5 relative overflow-hidden shadow-2xl">
          <h2 className="font-heading text-2xl sm:text-4xl font-extrabold tracking-tight text-white relative z-10">
            Transform your customer support operations.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto relative z-10 leading-relaxed">
            Equip your support team with automated AI triage, RAG response generation, and predictive risk intelligence.
          </p>

          <div className="pt-3 relative z-10">
            <button
              onClick={onNavigateLogin}
              className="px-7 py-3.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg transition-all"
            >
              Access SupportIQ Platform
            </button>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950 py-8 px-6 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <Zap className="w-3 h-3 fill-current" />
            </div>
            <span className="font-heading font-bold text-slate-300 tracking-wider">SUPPORTIQ</span>
          </div>
          <p>© {new Date().getFullYear()} SupportIQ Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
