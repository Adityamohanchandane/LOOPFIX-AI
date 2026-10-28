import { AlertTriangle, Clock, MapPin, CheckCircle, X } from 'lucide-react';
import { getCategoryClass, getCategoryEmoji, getStatusClass, formatDate } from '../lib/utils.js';

const MATCH_TYPE_CONFIG = {
  duplicate: {
    label: 'Possible Duplicate',
    color: 'border-red-500/40 bg-red-500/8',
    headerColor: 'text-red-400',
    badge: 'bg-red-500/20 text-red-300 border-red-500/30',
    icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
  },
  recurring: {
    label: 'Possible Recurring Issue',
    color: 'border-orange-500/40 bg-orange-500/8',
    headerColor: 'text-orange-400',
    badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    icon: <AlertTriangle className="w-5 h-5 text-orange-400" />,
  },
  similar: {
    label: 'Similar Past Complaint',
    color: 'border-yellow-500/30 bg-yellow-500/5',
    headerColor: 'text-yellow-400',
    badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
  },
};

function MatchCard({ match, onConfirm, onDismiss }) {
  const config = MATCH_TYPE_CONFIG[match.matchType] || MATCH_TYPE_CONFIG.similar;
  const { complaint } = match;

  return (
    <div className={`rounded-xl border p-4 ${config.color} animate-fade-in`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2.5">
          {config.icon}
          <div>
            <span className={`text-sm font-semibold ${config.headerColor}`}>
              {config.label}
            </span>
            {match.daysSince !== null && (
              <span className="ml-2 text-xs text-gray-500">
                ({match.daysSince} day{match.daysSince !== 1 ? 's' : ''} ago)
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {Math.round(match.score * 100)}% match
          </span>
          {onDismiss && (
            <button
              onClick={() => onDismiss(match.id)}
              className="p-1 text-gray-500 hover:text-white rounded transition-colors"
              aria-label="Dismiss this match"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Match reason */}
      <p className="text-xs text-gray-400 mb-3 leading-relaxed">{match.reason}</p>

      {/* Historical complaint details */}
      <div className="bg-white/5 rounded-lg p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-white font-medium line-clamp-2">
            {complaint.title}
          </p>
          <span className={`badge ${getStatusClass(complaint.status)} shrink-0`}>
            {complaint.status}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          {complaint.category && (
            <span className="flex items-center gap-1">
              <span>{getCategoryEmoji(complaint.category)}</span>
              {complaint.category}
            </span>
          )}
          {complaint.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {complaint.location}
            </span>
          )}
          {complaint.created_at && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Reported {formatDate(complaint.created_at)}
            </span>
          )}
          {complaint.resolved_at && (
            <span className="flex items-center gap-1 text-green-500">
              <CheckCircle className="w-3 h-3" />
              Resolved {formatDate(complaint.resolved_at)}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {(onConfirm || onDismiss) && (
        <div className="flex gap-2 mt-3">
          {onConfirm && (
            <button
              onClick={() => onConfirm(match)}
              className="btn-danger text-xs py-1.5 px-3 flex-1 justify-center"
            >
              Confirm Match
            </button>
          )}
          {onDismiss && (
            <button
              onClick={() => onDismiss(match.id)}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              Not a Match
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function RecurringAlert({ matches, onConfirm, onDismiss }) {
  if (!matches || matches.length === 0) return null;

  const duplicates = matches.filter(m => m.matchType === 'duplicate');
  const recurring = matches.filter(m => m.matchType === 'recurring');
  const similar = matches.filter(m => m.matchType === 'similar');

  return (
    <section
      aria-label="Recurring issue analysis"
      className="space-y-3"
    >
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="w-4 h-4 text-orange-400" />
        <h3 className="text-sm font-semibold text-white">
          Potential Matches Found
          <span className="ml-2 text-xs text-gray-400 font-normal">
            ({matches.length} historical complaint{matches.length !== 1 ? 's' : ''})
          </span>
        </h3>
      </div>

      {duplicates.length > 0 && (
        <div>
          <p className="text-xs text-red-400 font-medium mb-2">⚠️ Open complaints with similar issue:</p>
          <div className="space-y-2">
            {duplicates.map(m => (
              <MatchCard key={m.id} match={m} onConfirm={onConfirm} onDismiss={onDismiss} />
            ))}
          </div>
        </div>
      )}

      {recurring.length > 0 && (
        <div>
          <p className="text-xs text-orange-400 font-medium mb-2">🔁 Previously resolved, now recurring:</p>
          <div className="space-y-2">
            {recurring.map(m => (
              <MatchCard key={m.id} match={m} onConfirm={onConfirm} onDismiss={onDismiss} />
            ))}
          </div>
        </div>
      )}

      {similar.length > 0 && (
        <div>
          <p className="text-xs text-yellow-400 font-medium mb-2">📋 Similar past complaints:</p>
          <div className="space-y-2">
            {similar.map(m => (
              <MatchCard key={m.id} match={m} onConfirm={onConfirm} onDismiss={onDismiss} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
