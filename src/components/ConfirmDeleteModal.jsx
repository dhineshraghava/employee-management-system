import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function ConfirmDeleteModal({
  isOpen,
  employee,
  onConfirm,
  onCancel,
  isDeleting,
}) {
  if (!isOpen || !employee) return null;

  return (
    <div className="modal-backdrop-overlay" role="dialog" aria-modal="true">
      <div className="confirm-delete-card">
        <div className="confirm-icon-wrapper">
          <AlertTriangle size={32} className="warning-icon" />
        </div>

        <h3 className="confirm-title">Confirm Employee Deletion</h3>
        <p className="confirm-text">
          Are you sure you want to permanently delete employee{' '}
          <strong>
            {employee.name} (ID #{employee.id})
          </strong>
          ?
        </p>
        <p className="confirm-subtext">
          This will execute a <code>DELETE FROM employees WHERE id = {employee.id}</code> query on your MySQL database. This action cannot be undone.
        </p>

        <div className="confirm-actions-row">
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isDeleting}
            id="btn-cancel-delete"
          >
            <X size={16} />
            <span>Cancel</span>
          </button>
          <button
            className="btn btn-danger"
            onClick={() => onConfirm(employee.id)}
            disabled={isDeleting}
            id="btn-confirm-delete"
          >
            {isDeleting ? (
              <>
                <div className="btn-spinner"></div>
                <span>Deleting from MySQL...</span>
              </>
            ) : (
              <>
                <Trash2 size={16} />
                <span>Delete Employee</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
