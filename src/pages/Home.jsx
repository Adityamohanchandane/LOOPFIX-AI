import { Link } from 'react-router-dom';
import { ArrowRight, Zap, BarChart3, RotateCcw, Shield, PlusCircle, ChevronRight } from 'lucide-react';
import Hero3D from '../components/Hero3D.jsx';

const FEATURES = [
  {
    icon: PlusCircle,
    title: 'Smart Complaint Capture',
    desc: 'Students submit issues with location, category, and description. AI instantly normalizes and classifies each report.',
    color: 'blue',
  },
  {
    icon: Zap,
    title: 'AI-Powered Analysis',
    desc: 'AI extracts structured data — category, urgency, department, and recommended action, with a backup provider if the primary is unavailable.',
    color: 'cyan',
  },
  {
    icon: RotateCcw,
    title: 'Recurring Issue Detection',
    desc: 'The core differentiator. LoopFix AI matches new complaints against historical records to identify patterns that keep coming back.',
    color: 'orange',
  },
  {
    icon: BarChart3,
    title: 'Administrator Dashboard',
    desc: 'Full overview of complaints: status tracking, priority management, category filters, and historical trend analysis.',
    color: 'violet',
  },
  {
    icon: Shield,
    title: 'Reliable Fallback',
    desc: 'Even when AI is unavailable, rule-based classification continues working. Complaints are always saved — no data loss.',
    color: 'green',
  },
];

const COLOR_MAP = {
  blue: { icon: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', glow: 'shadow-blue-500/10' },
  cyan: { icon: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', glow: 'shadow-cyan-500/10' },
  orange: { icon: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', glow: 'shadow-orange-500/10' },
  violet: { icon: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20', glow: 'shadow-violet-500/10' },
  green: { icon: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', glow: 'shadow-green-500/10' },
};

const HOW_IT_WORKS = [
  { step: '01', title: 'Student Reports Issue', desc: 'Fill out the complaint form with location and description.' },
  { step: '02', title: 'AI Analyzes Complaint', desc: 'AI normalizes, categorizes, and assesses urgency, with an automatic backup provider.' },
  { step: '03', title: 'History Search', desc: 'System scans last 90 days of complaints for similar patterns.' },
  { step: '04', title: 'Match Found', desc: 'Recurring or duplicate issues are flagged with historical context.' },
  { step: '05', title: 'Admin Takes Action', desc: 'Dashboard highlights patterns for prioritized response.' },
];

export default function Home() {
  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-16">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="ambient-orb w-[600px] h-[600px] bg-blue-600/12 top-0 left-1/4 -translate-x-1/2" />
          <div className="ambient-orb w-[400px] h-[400px] bg-violet-600/10 top-1/3 right-0 translate-x-1/3" />
          <div className="ambient-orb w-[300px] h-[300px] bg-cyan-600/8 bottom-0 left-0 -translate-x-1/4" />
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="section-container relative z-10 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left content */}
            <div className="order-2 lg:order-1">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                AI Vibe Coding Hackathon · 2026
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.05] tracking-tight mb-6">
                <span className="text-white">Find the Problem</span>
                <br />
                <span className="gradient-text">That Keeps</span>
                <br />
                <span className="text-white">Coming Back.</span>
              </h1>

              <p className="text-gray-400 text-lg md:text-xl leading-relaxed mb-8 max-w-lg">
                LoopFix AI connects campus maintenance complaints to their history — identifying recurring issues before they become emergencies.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/submit" className="btn-primary text-base py-3.5 px-7">
                  <PlusCircle className="w-5 h-5" />
                  Report an Issue
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/dashboard" className="btn-secondary text-base py-3.5 px-7">
                  <BarChart3 className="w-5 h-5" />
                  View Dashboard
                </Link>
              </div>

              {/* Quick stats */}
              <div className="flex flex-wrap gap-6 mt-10">
                {[
                  { label: 'Complaints Analyzed', value: 'Real-time' },
                  { label: 'Recurring Detection', value: 'AI-powered' },
                  { label: 'Response Mode', value: 'Intelligent' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-white font-bold text-lg">{value}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — 3D illustration */}
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
              <Hero3D />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-600 animate-bounce" aria-hidden="true">
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-gray-600" />
          <span className="text-[10px] tracking-widest uppercase">Scroll</span>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-28 relative" aria-labelledby="features-heading">
        <div className="section-container">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-4">
              Core Features
            </span>
            <h2 id="features-heading" className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything campus maintenance needs
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              From intelligent complaint capture to pattern recognition — LoopFix AI gives your team the tools to act on data, not just respond to noise.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => {
              const c = COLOR_MAP[color];
              return (
                <div key={title} className={`glass-card-hover p-6 border ${c.bg} shadow-lg ${c.glow}`}>
                  <div className={`w-11 h-11 rounded-xl ${c.bg} border flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${c.icon}`} aria-hidden="true" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-transparent to-[#0d1321]/50" aria-labelledby="how-heading">
        <div className="section-container">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-4">
              How It Works
            </span>
            <h2 id="how-heading" className="text-3xl md:text-4xl font-bold text-white mb-4">
              From complaint to insight in seconds
            </h2>
          </div>

          <div className="relative">
            {/* Connector line (desktop only) */}
            <div className="hidden lg:block absolute top-8 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" aria-hidden="true" />

            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
                <div key={step} className="text-center relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600/20 to-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-blue-400 font-black text-sm">{step}</span>
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-2">{title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                  {i < HOW_IT_WORKS.length - 1 && (
                    <ChevronRight className="hidden lg:block absolute top-4 -right-3 w-4 h-4 text-blue-500/30" aria-hidden="true" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28" aria-labelledby="cta-heading">
        <div className="section-container">
          <div className="relative glass-card border border-blue-500/20 p-8 md:p-14 text-center overflow-hidden">
            {/* Background glow */}
            <div className="ambient-orb w-80 h-80 bg-blue-600/20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />

            <div className="relative z-10">
              <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-4">
                Get Started
              </span>
              <h2 id="cta-heading" className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to fix the loop?
              </h2>
              <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                Submit your first complaint and see LoopFix AI detect recurring patterns in your campus maintenance history.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/submit" className="btn-primary text-base py-3.5 px-8">
                  <PlusCircle className="w-5 h-5" />
                  Report an Issue
                </Link>
                <Link to="/dashboard" className="btn-secondary text-base py-3.5 px-8">
                  <BarChart3 className="w-5 h-5" />
                  Open Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
