import { MapPin, Clock, AlertTriangle, CheckCircle, XCircle, Loader2, ChevronRight } from 'lucide-react';
import { getCategoryClass, getUrgencyClass, getStatusClass, getCategoryEmoji, formatRelativeTime } from '../lib/utils.js';

const STATUS_ICONS = {
  Open: <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />,
  'In Progress': <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />,
  Resolved: <CheckCircle className="w-3.5 h-3.5 text-green-400" />,
};

export default function ComplaintCard({ complaint, onStatusChange, compact = false, showRecurring = false }) {
  if (!complaint) return null;

  const {
    id, ai_title, description, category, location, building, urgency, status,
    created_at, recurring_match_ids, is_demo,
  } = complaint;

  const title = ai_title || description?.slice(0, 80) || 'Campus Issue';
  const hasRecurring = recurring_match_ids && recurring_match_ids.length > 0;

  return (
    <article
      className={`glass-card-hover p-4 md:p-5 flex flex-col gap-3 animate-fade-in ${
        hasRecurring ? 'ring-1 ring-orange-500/30' : ''
      }`}
      aria-label={`Complaint: ${title}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-xl shrink-0 mt-0.5" aria-label={`Category: ${category}`} role="img">
            {getCategoryEmoji(category)}
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2">
              {title}
            </h3>
            {!compact && description && title !== description?.slice(0, 80) && (
              <p className="text-gray-500 text-xs mt-1 line-clamp-2">{description}</p>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`badge ${getStatusClass(status)}`}>
            {STATUS_ICONS[status]}
            <span>{status}</span>
          </span>
          {is_demo && (
            <span className="badge bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px]">
              Demo
            </span>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-2">
        <span className={`badge ${getCategoryClass(category)}`}>
          {category}
        </span>
        <span className={`badge ${getUrgencyClass(urgency)} border border-current/30`}>
          {urgency} priority
        </span>
      </div>

      {/* Location + time */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        {(location || building) && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            {location || building}
          </span>
        )}
        {created_at && (
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <time dateTime={created_at}>{formatRelativeTime(created_at)}</time>
          </span>
        )}
      </div>

      {/* Recurring alert */}
      {hasRecurring && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" aria-hidden="true" />
          <span className="text-xs text-orange-300">
            Matches {recurring_match_ids.length} previous complaint{recurring_match_ids.length > 1 ? 's' : ''} — possible recurring issue
          </span>
        </div>
      )}

      {/* Status actions */}
      {onStatusChange && status !== 'Resolved' && (
        <div className="flex gap-2 mt-1 flex-wrap">
          {status === 'Open' && (
            <button
              onClick={() => onStatusChange(id, 'In Progress')}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              Mark In Progress
            </button>
          )}
          <button
            onClick={() => onStatusChange(id, 'Resolved')}
            className="btn-success text-xs py-1.5 px-3"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Resolve
          </button>
        </div>
      )}
    </article>
  );
}
