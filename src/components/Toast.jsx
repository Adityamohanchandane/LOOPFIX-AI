import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useToast } from '../contexts/ToastContext.jsx';

const ICONS = {
  success: { Icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/15 border-green-500/30' },
  error: { Icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30' },
  warning: { Icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30' },
  info: { Icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/30' },
};

function ToastItem({ id, message, type }) {
  const { removeToast } = useToast();
  const { Icon, color, bg } = ICONS[type] || ICONS.info;

  return (
    <div
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={`toast flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-xl max-w-sm w-full ${bg}`}
    >
      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${color}`} aria-hidden="true" />
      <p className="text-sm text-white leading-relaxed flex-1">{message}</p>
      <button
        onClick={() => removeToast(id)}
        className="shrink-0 p-0.5 rounded text-gray-400 hover:text-white transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function Toast() {
  const { toasts } = useToast();

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end"
      aria-label="Notifications"
    >
      {toasts.map(t => (
        <ToastItem key={t.id} {...t} />
      ))}
    </div>
  );
}
