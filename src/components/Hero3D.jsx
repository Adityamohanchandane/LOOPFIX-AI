import { useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle, Clock, Zap, RotateCcw, MapPin } from 'lucide-react';

function MiniCard({ className, children }) {
  return (
    <div className={`absolute bg-[#0d1321]/90 backdrop-blur-sm border border-white/15 rounded-xl p-3 shadow-xl ${className}`}>
      {children}
    </div>
  );
}

export default function Hero3D() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check reduced motion preference
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    let rafId;
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      targetX = ((e.clientX - centerX) / rect.width) * 8;
      targetY = ((e.clientY - centerY) / rect.height) * -6;
    };

    const handleMouseLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    const animate = () => {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;

      const card = container.querySelector('.hero-3d-card');
      if (card) {
        card.style.transform = `perspective(1200px) rotateY(${-8 + currentX}deg) rotateX(${4 + currentY}deg) translateZ(0)`;
      }

      rafId = requestAnimationFrame(animate);
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    rafId = requestAnimationFrame(animate);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-lg mx-auto h-[420px] md:h-[500px] select-none"
      aria-hidden="true"
    >
      {/* Main 3D dashboard card */}
      <div
        className="hero-3d-card absolute inset-0 bg-gradient-to-br from-[#0d1321] to-[#111827] rounded-2xl border border-white/15 shadow-2xl overflow-hidden"
        style={{
          transform: 'perspective(1200px) rotateY(-8deg) rotateX(4deg)',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
      >
        {/* Ambient glow inside */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-violet-600/15 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />

        {/* Dashboard content */}
        <div className="relative z-10 p-5 h-full flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-white font-semibold text-sm">LoopFix AI</span>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-green-400">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Live
            </span>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Total', value: '247', color: 'text-blue-400' },
              { label: 'Recurring', value: '38', color: 'text-orange-400' },
              { label: 'Resolved', value: '189', color: 'text-green-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white/5 rounded-lg p-2 text-center">
                <p className={`text-lg font-bold ${color}`}>{value}</p>
                <p className="text-gray-500 text-[10px]">{label}</p>
              </div>
            ))}
          </div>

          {/* Issue cards */}
          <div className="flex-1 space-y-2 overflow-hidden">
            {[
              { emoji: '💧', title: 'Block C Pipe Leak', status: 'Recurring', statusClass: 'text-orange-400 bg-orange-500/15', time: '2h ago' },
              { emoji: '⚡', title: 'Main Path Lights Out', status: 'Open', statusClass: 'text-blue-400 bg-blue-500/15', time: '5h ago' },
              { emoji: '📶', title: 'Library WiFi Slow', status: 'Resolved', statusClass: 'text-green-400 bg-green-500/15', time: '3d ago' },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 bg-white/5 rounded-lg px-3 py-2"
              >
                <span className="text-base">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">{item.title}</p>
                  <p className="text-gray-500 text-[10px]">{item.time}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.statusClass}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>

          {/* AI Analysis bar */}
          <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-lg px-3 py-2.5 border border-blue-500/20 flex items-center gap-2">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-1 bg-blue-400 rounded-full animate-pulse" style={{ height: `${8 + i * 3}px`, animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <p className="text-xs text-blue-300">AI analyzing patterns...</p>
          </div>
        </div>
      </div>

      {/* Floating mini-cards */}
      <MiniCard className="top-4 -left-8 md:-left-16 w-40 animate-float-custom">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
            <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <div>
            <p className="text-white text-xs font-semibold">Recurring Issue</p>
            <p className="text-gray-500 text-[10px]">3rd occurrence</p>
          </div>
        </div>
      </MiniCard>

      <MiniCard className="bottom-10 -left-4 md:-left-12 w-36" style={{ animationDelay: '1.5s' }}>
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <div>
            <p className="text-white text-[10px] font-semibold">Block C, GF</p>
            <p className="text-gray-500 text-[10px]">Hotspot area</p>
          </div>
        </div>
      </MiniCard>

      <MiniCard className="top-16 -right-4 md:-right-12 w-36 animate-float-custom" style={{ animationDelay: '2s' }}>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
          <div>
            <p className="text-white text-[10px] font-semibold">Issue Resolved</p>
            <p className="text-gray-500 text-[10px]">In 4.2 hours</p>
          </div>
        </div>
      </MiniCard>

      {/* Ambient orbs */}
      <div className="ambient-orb w-72 h-72 bg-blue-600/20 -top-20 -right-20 pointer-events-none" />
      <div className="ambient-orb w-48 h-48 bg-violet-600/20 -bottom-10 -left-10 pointer-events-none" />
    </div>
  );
}
