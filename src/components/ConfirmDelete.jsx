import { AlertTriangle, Trash2 } from 'lucide-react';

export default function ConfirmDelete({ employee, onConfirm, onCancel }) {
  if (!employee) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="modal modal-sm">
        <div className="modal-body" style={{ textAlign: 'center', paddingTop: 32, paddingBottom: 8 }}>
          <div className="confirm-icon">
            <AlertTriangle size={28} />
          </div>
          <h2 className="confirm-title" id="confirm-title">
            Delete Employee?
          </h2>
          <p className="confirm-text">
            You are about to permanently delete{' '}
            <span className="confirm-name">{employee.fullName}</span>
            {employee.isDemo && ' (Demo Record)'}. This action cannot be undone and will
            remove all associated data.
          </p>
          <p
            style={{
              marginTop: 12,
              fontSize: '0.78rem',
              color: 'var(--gray-400)',
              background: 'var(--gray-50)',
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--gray-200)',
              display: 'inline-block',
            }}
          >
            ID: <strong style={{ fontFamily: 'monospace' }}>{employee.id}</strong>
          </p>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center', gap: 12, paddingTop: 20 }}>
          <button
            id="cancel-delete-btn"
            className="btn btn-secondary"
            onClick={onCancel}
            style={{ minWidth: 110 }}
          >
            Cancel
          </button>
          <button
            id="confirm-delete-btn"
            className="btn btn-danger"
            onClick={() => onConfirm(employee.id)}
            style={{ minWidth: 110, gap: 8 }}
          >
            <Trash2 size={15} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
