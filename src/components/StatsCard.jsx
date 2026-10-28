export default function StatsCard({ label, value, icon: Icon, color = 'blue', sublabel, loading }) {
  const colorMap = {
    blue: { bg: 'from-blue-600/20 to-blue-500/10', border: 'border-blue-500/20', icon: 'text-blue-400', accent: 'bg-blue-500/20' },
    cyan: { bg: 'from-cyan-600/20 to-cyan-500/10', border: 'border-cyan-500/20', icon: 'text-cyan-400', accent: 'bg-cyan-500/20' },
    violet: { bg: 'from-violet-600/20 to-violet-500/10', border: 'border-violet-500/20', icon: 'text-violet-400', accent: 'bg-violet-500/20' },
    green: { bg: 'from-green-600/20 to-green-500/10', border: 'border-green-500/20', icon: 'text-green-400', accent: 'bg-green-500/20' },
    orange: { bg: 'from-orange-600/20 to-orange-500/10', border: 'border-orange-500/20', icon: 'text-orange-400', accent: 'bg-orange-500/20' },
    red: { bg: 'from-red-600/20 to-red-500/10', border: 'border-red-500/20', icon: 'text-red-400', accent: 'bg-red-500/20' },
    yellow: { bg: 'from-yellow-600/20 to-yellow-500/10', border: 'border-yellow-500/20', icon: 'text-yellow-400', accent: 'bg-yellow-500/20' },
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <div className={`stat-card bg-gradient-to-br ${c.bg} border ${c.border} animate-fade-in`}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
      </div>

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">{label}</p>
          {loading ? (
            <div className="h-8 w-16 rounded shimmer" />
          ) : (
            <p className="text-3xl font-bold text-white tabular-nums">{value ?? '—'}</p>
          )}
          {sublabel && (
            <p className="text-xs text-gray-500 mt-1">{sublabel}</p>
          )}
        </div>

        {Icon && (
          <div className={`w-10 h-10 rounded-xl ${c.accent} flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${c.icon}`} aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}
