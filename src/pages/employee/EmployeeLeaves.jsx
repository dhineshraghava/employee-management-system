import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CalendarOff,
  PlusCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  RefreshCw,
  Calendar,
  FileText,
  AlertTriangle,
  Ban,
  MessageSquare,
} from 'lucide-react';
import { getMyLeaves, applyLeave, cancelMyLeave } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const LEAVE_TYPES = [
  'Casual Leave',
  'Sick Leave',
  'Paid Leave',
  'Emergency Leave',
  'Unpaid Leave',
];

export default function EmployeeLeaves() {
  const { user } = useAuth();

  const [leaves, setLeaves] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    approvedDays: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Modal State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Cancellation State
  const [cancelTarget, setCancelTarget] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Form State
  const defaultDates = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return { start: today, end: today };
  }, []);

  const [formData, setFormData] = useState({
    leave_type: 'Casual Leave',
    start_date: defaultDates.start,
    end_date: defaultDates.end,
    reason: '',
  });

  const showToast = (type, text) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const loadLeaves = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyLeaves();
      if (res.data?.success) {
        setLeaves(res.data.leaves || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch (err) {
      console.error('Error loading my leaves:', err);
      setError('Unable to fetch your leave records from MySQL database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  // Calculate day difference
  const calculatedDays = useMemo(() => {
    if (!formData.start_date || !formData.end_date) return 1;
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;
    const diff = Math.abs(end - start);
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  }, [formData.start_date, formData.end_date]);

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!formData.reason || !formData.reason.trim()) {
      setFormError('Please enter a brief reason or justification for your leave request.');
      return;
    }

    if (calculatedDays <= 0) {
      setFormError('End date cannot be earlier than start date.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      const res = await applyLeave({
        leave_type: formData.leave_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason.trim(),
      });

      showToast('success', res.data?.message || 'Leave application submitted successfully!');
      setIsApplyModalOpen(false);
      setFormData({
        leave_type: 'Casual Leave',
        start_date: defaultDates.start,
        end_date: defaultDates.end,
        reason: '',
      });
      loadLeaves();
    } catch (err) {
      console.error('Failed to apply for leave:', err);
      setFormError(err.response?.data?.message || 'Failed to submit leave application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      setIsCancelling(true);
      await cancelMyLeave(cancelTarget.id);
      showToast('success', `Leave request #${cancelTarget.id} was successfully cancelled.`);
      setCancelTarget(null);
      loadLeaves();
    } catch (err) {
      console.error('Failed to cancel leave:', err);
      showToast('error', err.response?.data?.message || 'Failed to cancel leave.');
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="status-badge status-approved">
            <CheckCircle size={14} /> Approved
          </span>
        );
      case 'Pending':
        return (
          <span className="status-badge status-pending">
            <Clock size={14} /> Pending Review
          </span>
        );
      case 'Rejected':
        return (
          <span className="status-badge status-rejected">
            <AlertCircle size={14} /> Rejected
          </span>
        );
      case 'Cancelled':
        return (
          <span className="status-badge status-cancelled">
            <Ban size={14} /> Cancelled
          </span>
        );
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  return (
    <div className="view-employees-page">
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`page-toast ${toastMessage.type}`} role="alert">
          {toastMessage.type === 'success' ? (
            <CheckCircle size={18} className="toast-icon" />
          ) : (
            <AlertCircle size={18} className="toast-icon" />
          )}
          <span>{toastMessage.text}</span>
          <button className="toast-close-btn" onClick={() => setToastMessage(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header-row">
        <div className="header-titles">
          <div className="flex-align-center gap-8 mb-2">
            <span className="badge-pill emp-pill">
              <CalendarOff size={14} />
              <span>Leave & Time-Off Management</span>
            </span>
          </div>
          <h1 className="page-main-heading">Apply for Leave</h1>
          <p className="page-subheading">
            Submit time-off requests directly to the HR Admin panel. Track your approval status and view admin remarks.
          </p>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              setFormError(null);
              setIsApplyModalOpen(true);
            }}
            id="btn-open-apply-leave"
          >
            <PlusCircle size={18} />
            <span>Apply For Leave</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Summary */}
      <div className="stats-cards-grid">
        <div className="stat-card stat-blue">
          <div className="stat-card-icon-box">
            <FileText size={24} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Total Applications</span>
            <h2 className="stat-card-value">{loading ? '...' : summary.total}</h2>
            <span className="stat-card-meta">Lifetime submitted</span>
          </div>
        </div>

        <div className="stat-card stat-amber">
          <div className="stat-card-icon-box">
            <Clock size={24} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Pending Approval</span>
            <h2 className="stat-card-value">{loading ? '...' : summary.pending}</h2>
            <span className="stat-card-meta">Awaiting Admin decision</span>
          </div>
        </div>

        <div className="stat-card stat-teal">
          <div className="stat-card-icon-box">
            <CheckCircle size={24} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Approved Leaves</span>
            <h2 className="stat-card-value">{loading ? '...' : summary.approved}</h2>
            <span className="stat-card-meta">{summary.approvedDays} total day(s) approved</span>
          </div>
        </div>

        <div className="stat-card stat-red">
          <div className="stat-card-icon-box">
            <AlertCircle size={24} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Rejected Requests</span>
            <h2 className="stat-card-value">{loading ? '...' : summary.rejected}</h2>
            <span className="stat-card-meta">Declined by admin</span>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="dashboard-alert-banner" role="alert">
          <AlertCircle size={20} className="alert-icon" />
          <span>{error}</span>
          <button className="btn btn-sm btn-secondary" onClick={loadLeaves}>
            Retry
          </button>
        </div>
      )}

      {/* Main Table Card */}
      <div className="employee-table-card">
        <div className="table-header-bar flex-between">
          <div>
            <h3 className="card-title">My Leave History & Status</h3>
            <p className="card-subtitle">
              Synchronized in real-time with MySQL database. Approved leaves automatically register into your attendance record.
            </p>
          </div>
          <button
            className="btn btn-secondary btn-refresh"
            onClick={loadLeaves}
            disabled={loading}
            title="Refresh Leave History"
          >
            <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="table-loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading your leave records from MySQL...</p>
          </div>
        ) : leaves.length === 0 ? (
          <div className="empty-state-card">
            <CalendarOff size={48} className="empty-icon text-muted" />
            <h3 className="empty-title">No Leave Requests Found</h3>
            <p className="empty-description">
              You haven't applied for any leaves yet. Click the "Apply For Leave" button above to submit your first request.
            </p>
            <button
              className="btn btn-primary mt-3"
              onClick={() => setIsApplyModalOpen(true)}
            >
              <PlusCircle size={16} />
              <span>Apply For Leave Now</span>
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-employee-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Leave Type</th>
                  <th>Duration & Dates</th>
                  <th>Reason for Leave</th>
                  <th>Status</th>
                  <th>Admin Remarks</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((item) => (
                  <tr key={item.id} className="employee-row">
                    <td>
                      <span className="id-badge">#{item.id}</span>
                    </td>
                    <td>
                      <span
                        className={`leave-type-pill ${
                          item.leave_type.includes('Sick')
                            ? 'sick'
                            : item.leave_type.includes('Emergency')
                            ? 'emergency'
                            : item.leave_type.includes('Unpaid')
                            ? 'unpaid'
                            : ''
                        }`}
                      >
                        {item.leave_type}
                      </span>
                    </td>
                    <td>
                      <div>
                        <strong>{item.start_date}</strong> to <strong>{item.end_date}</strong>
                        <span className="leave-duration-badge">
                          {item.days} {item.days === 1 ? 'day' : 'days'}
                        </span>
                      </div>
                      <span className="text-xs text-muted">Applied on: {item.created_at}</span>
                    </td>
                    <td style={{ maxWidth: '280px' }}>
                      <p className="leave-reason-box">{item.reason}</p>
                    </td>
                    <td>{getStatusBadge(item.status)}</td>
                    <td style={{ maxWidth: '240px' }}>
                      {item.admin_remarks ? (
                        <div className="leave-remarks-bubble">
                          <MessageSquare size={14} className="flex-shrink-0 mt-1" />
                          <span>{item.admin_remarks}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted italic">No remarks provided</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {item.status === 'Pending' ? (
                        <button
                          type="button"
                          className="btn-delete"
                          onClick={() => setCancelTarget(item)}
                          title="Cancel this pending leave application"
                        >
                          <Ban size={15} />
                          <span>Cancel</span>
                        </button>
                      ) : (
                        <span className="text-xs text-muted">Closed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply For Leave Modal */}
      {isApplyModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal modal-md">
            <div className="modal-header">
              <div className="flex-align-center gap-10">
                <div className="icon-badge badge-blue">
                  <CalendarOff size={20} className="text-blue" />
                </div>
                <div>
                  <h2 className="modal-title">Apply for Leave</h2>
                  <p className="modal-subtitle">Submit a time-off application for HR review</p>
                </div>
              </div>
              <button
                className="modal-close"
                onClick={() => setIsApplyModalOpen(false)}
                disabled={isSubmitting}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleApplySubmit}>
              <div className="modal-body">
                {formError && (
                  <div className="form-alert-error" role="alert">
                    <AlertCircle size={16} className="alert-icon" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Applicant Summary */}
                <div className="applicant-info-card mb-4" style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <p className="text-sm text-secondary">
                    Applying as: <strong>{user?.name}</strong> • Department: <strong>{user?.department || 'General'}</strong>
                  </p>
                </div>

                {/* Leave Type */}
                <div className="form-group mb-4">
                  <label htmlFor="leave-type-select" className="form-label">
                    Leave Type <span className="required-star">*</span>
                  </label>
                  <select
                    id="leave-type-select"
                    className="form-select"
                    value={formData.leave_type}
                    onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                    disabled={isSubmitting}
                    required
                  >
                    {LEAVE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range: Two Columns */}
                <div className="form-row-2col mb-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label htmlFor="leave-start-date" className="form-label">
                      Start Date <span className="required-star">*</span>
                    </label>
                    <div className="input-with-icon">
                      <Calendar size={18} className="field-icon" />
                      <input
                        type="date"
                        id="leave-start-date"
                        className="form-input"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="leave-end-date" className="form-label">
                      End Date <span className="required-star">*</span>
                    </label>
                    <div className="input-with-icon">
                      <Calendar size={18} className="field-icon" />
                      <input
                        type="date"
                        id="leave-end-date"
                        className="form-input"
                        value={formData.end_date}
                        min={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Calculated Duration Preview */}
                <div className="duration-preview-box mb-4" style={{ background: '#f0f9ff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="text-sm text-blue-900 font-semibold">Total Requested Leave Duration:</span>
                  <span className="leave-duration-badge" style={{ fontSize: '0.9rem', padding: '4px 12px' }}>
                    {calculatedDays} {calculatedDays === 1 ? 'Working Day' : 'Working Days'}
                  </span>
                </div>

                {/* Reason / Justification */}
                <div className="form-group mb-2">
                  <label htmlFor="leave-reason-text" className="form-label">
                    Reason for Leave <span className="required-star">*</span>
                  </label>
                  <textarea
                    id="leave-reason-text"
                    className="form-input"
                    rows="3"
                    placeholder="e.g. Taking personal time off for family event / Medical rest prescribed by doctor..."
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    disabled={isSubmitting}
                    required
                  ></textarea>
                  <span className="text-xs text-muted">
                    This will be reviewed by your HR Administrator.
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsApplyModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting || calculatedDays <= 0}
                  id="btn-submit-leave-app"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelTarget && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal modal-sm">
            <div className="modal-header">
              <h2 className="modal-title">Cancel Leave Request</h2>
              <button
                className="modal-close"
                onClick={() => setCancelTarget(null)}
                disabled={isCancelling}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="delete-warning-icon-wrapper" style={{ margin: '0 auto 16px', width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={24} className="text-danger" />
              </div>
              <p className="text-center text-sm mb-2">
                Are you sure you want to cancel your leave request for{' '}
                <strong>{cancelTarget.leave_type}</strong> ({cancelTarget.start_date} to {cancelTarget.end_date})?
              </p>
              <p className="text-center text-xs text-muted">
                This will remove the request from pending review. You can apply again anytime.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCancelTarget(null)}
                disabled={isCancelling}
              >
                Keep Request
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
              >
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
