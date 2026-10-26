import { useEffect } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ICONS = {
  success: { icon: CheckCircle2, size: 20 },
  error: { icon: XCircle, size: 20 },
  info: { icon: Info, size: 20 },
};

export default function Toast({ toasts, onDismiss }) {
  return (
    <div className="toast-container" aria-live="polite" aria-label="Notifications">
      {toasts.map((toast) => {
        const { icon: Icon } = ICONS[toast.type] || ICONS.info;
        return (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            role="alert"
          >
            <div className="toast-icon">
              <Icon size={20} />
            </div>
            <div className="toast-content">
              <p className="toast-title">{toast.title}</p>
              {toast.message && <p className="toast-msg">{toast.message}</p>}
            </div>
            <button
              className="btn btn-ghost"
              style={{ width: 26, height: 26, padding: 0, borderRadius: 6 }}
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
