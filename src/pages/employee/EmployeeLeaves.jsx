import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CalendarPlus,
  Calendar,
  CalendarClock,
  CalendarOff,
  Clock,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  RefreshCw,
  FileText,
  Ban,
  MessageSquare,
  ArrowLeft,
  PlusCircle,
} from 'lucide-react';
import { getMyLeaves, applyLeave, cancelMyLeave } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const LEAVE_TYPES = [
  'Casual Leave',
  'Sick Leave',
  'Earned Leave',
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

  // Form View State: Controls whether the Apply for Leave form is open
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Cancellation State
  const [cancelTarget, setCancelTarget] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    leave_type: 'Casual Leave',
    start_date: getTodayStr(),
    end_date: getTodayStr(),
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
      setError('Unable to fetch your leave records from the database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  // Synchronized Duration Calculation (Inclusive of start and end dates)
  const calculatedDays = useMemo(() => {
    if (!formData.start_date || !formData.end_date) return 0;
    const start = new Date(formData.start_date + 'T00:00:00');
    const end = new Date(formData.end_date + 'T00:00:00');
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;
    const diffTime = end.getTime() - start.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [formData.start_date, formData.end_date]);

  const resetForm = () => {
    const today = getTodayStr();
    setFormData({
      leave_type: 'Casual Leave',
      start_date: today,
      end_date: today,
      reason: '',
    });
    setFormError(null);
  };

  const handleCancel = () => {
    if (formData.reason && formData.reason.trim().length > 0) {
      const confirmDiscard = window.confirm(
        'You have unsaved changes in your leave application. Discard and return to leave overview?'
      );
      if (!confirmDiscard) return;
    }
    resetForm();
    setShowApplyForm(false);
  };

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
      resetForm();
      setShowApplyForm(false);
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

  const getInitials = (name) => {
    if (!name) return 'EM';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getLeaveTypeClass = (type) => {
    if (!type) return '';
    const lower = type.toLowerCase();
    if (lower.includes('sick')) return 'sick';
    if (lower.includes('casual')) return 'casual';
    if (lower.includes('earned')) return 'earned';
    if (lower.includes('emergency')) return 'emergency';
    if (lower.includes('unpaid')) return 'unpaid';
    return 'casual';
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
          <button
            type="button"
            className="toast-close-btn"
            onClick={() => setToastMessage(null)}
            aria-label="Dismiss alert"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header-row">
        <div className="header-titles">
          <div className="flex-align-center gap-8 mb-2">
            <span className="badge-pill emp-pill">
              <CalendarClock size={14} />
              <span>Leave & Time-Off Management</span>
            </span>
          </div>
          <div className="flex-align-center gap-12">
            <div className="page-heading-icon-badge" aria-hidden="true">
              <CalendarPlus size={22} />
            </div>
            <div>
              <h1 className="page-main-heading">Apply for Leave</h1>
              <p className="page-subheading">
                Submit time-off requests directly to HR administration. Track your request approval status in real-time.
              </p>
            </div>
          </div>
        </div>

        <div className="header-actions">
          {!showApplyForm ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setFormError(null);
                setShowApplyForm(true);
              }}
              id="btn-open-apply-leave"
            >
              <PlusCircle size={18} />
              <span>Apply For Leave</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancel}
              id="btn-close-apply-leave"
            >
              <ArrowLeft size={16} />
              <span>Back to Leave Overview</span>
            </button>
          )}
        </div>
      </div>

      {/* Apply For Leave Form Section (Visible when user clicks Apply For Leave) */}
      {showApplyForm && (
        <div className="leave-form-card" id="leave-application-form-card">
          <div className="card-header-bar">
            <div className="card-header-titles">
              <div className="icon-badge badge-blue">
                <CalendarPlus size={18} className="text-blue" />
              </div>
              <div>
                <h3>New Leave Application</h3>
                <p>Please enter your leave details below for HR review</p>
              </div>
            </div>
            <button
              type="button"
              className="btn-close-header"
              onClick={handleCancel}
              title="Cancel and return to overview"
              aria-label="Cancel application"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleApplySubmit} className="leave-form-body">
            {formError && (
              <div className="form-alert-error mb-4" role="alert">
                <AlertCircle size={16} className="alert-icon" />
                <span>{formError}</span>
              </div>
            )}

            {/* 1 & 2: Authenticated Employee Identity and Department */}
            <div className="applicant-identity-banner">
              <div className="applicant-identity-left">
                <div className="applicant-avatar">{getInitials(user?.name)}</div>
                <div className="applicant-info">
                  <span className="applicant-name">{user?.name || 'Authenticated Employee'}</span>
                  <span className="applicant-meta">
                    Department: <strong>{user?.department || 'General'}</strong> • Employee ID: <strong>#{user?.id || '—'}</strong>
                  </span>
                </div>
              </div>
              <span className="verified-pill">
                <CheckCircle2 size={13} />
                <span>Verified Account</span>
              </span>
            </div>

            {/* 3: Full-width Leave Type Dropdown */}
            <div className="form-group-full">
              <label htmlFor="leave-type-select" className="form-label-custom">
                Leave Type <span className="required-star">*</span>
              </label>
              <select
                id="leave-type-select"
                className="form-select-full"
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

            {/* 4 & 5: Start Date and End Date Side by Side on Desktop, Stacked on Mobile */}
            <div className="form-row-2col">
              <div>
                <label htmlFor="leave-start-date" className="form-label-custom">
                  Start Date <span className="required-star">*</span>
                </label>
                <div className="input-with-icon-wrapper">
                  <Calendar size={18} className="input-icon-prefix" />
                  <input
                    type="date"
                    id="leave-start-date"
                    className="form-input-custom"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="leave-end-date" className="form-label-custom">
                  End Date <span className="required-star">*</span>
                </label>
                <div className="input-with-icon-wrapper">
                  <Calendar size={18} className="input-icon-prefix" />
                  <input
                    type="date"
                    id="leave-end-date"
                    className="form-input-custom"
                    value={formData.end_date}
                    min={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>
            </div>

            {/* 6: Subtle Information Panel for Calculated Leave Duration */}
            <div className={`duration-info-box ${calculatedDays <= 0 ? 'invalid' : ''}`}>
              <div className="duration-info-content">
                <div className="duration-info-label-group">
                  <Clock size={18} />
                  <span>Total Requested Leave Duration:</span>
                </div>
                <div className="duration-value-badge">
                  {calculatedDays > 0 ? (
                    <>
                      <span className="duration-count">{calculatedDays}</span>
                      <span className="duration-unit">
                        {calculatedDays === 1 ? 'Working Day' : 'Working Days'}
                      </span>
                    </>
                  ) : (
                    <span className="duration-error">Invalid Date Range</span>
                  )}
                </div>
              </div>
              <p className="duration-footnote">
                {calculatedDays > 0
                  ? 'Duration is calculated inclusive of selected start and end dates.'
                  : 'Start date cannot be after end date. Please choose a valid date range.'}
              </p>
            </div>

            {/* 7: Reason for Leave Textarea */}
            <div className="form-group-full">
              <label htmlFor="leave-reason-text" className="form-label-custom">
                Reason for Leave <span className="required-star">*</span>
              </label>
              <textarea
                id="leave-reason-text"
                className="form-textarea-custom"
                rows="3"
                placeholder="Please describe the purpose or circumstances for your leave request..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                disabled={isSubmitting}
                required
              ></textarea>
              <span className="form-helper-text">
                This explanation will be reviewed by HR administration when deciding approval.
              </span>
            </div>

            {/* 8: Action Buttons (Cancel and Submit Application) */}
            <div className="form-actions-bar">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
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
                {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      )}

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
          <button type="button" className="btn btn-sm btn-secondary" onClick={loadLeaves}>
            Retry
          </button>
        </div>
      )}

      {/* Main Leave History Card */}
      <div className="employee-table-card">
        <div className="table-header-bar flex-between">
          <div>
            <h3 className="card-title">My Leave History & Status</h3>
            <p className="card-subtitle">
              Synchronized in real-time with MySQL database. Approved leaves automatically register into your attendance record.
            </p>
          </div>
          <button
            type="button"
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
              type="button"
              className="btn btn-primary mt-3"
              onClick={() => {
                setFormError(null);
                setShowApplyForm(true);
              }}
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
                      <span className={`leave-type-pill ${getLeaveTypeClass(item.leave_type)}`}>
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

      {/* Cancel Confirmation Modal */}
      {cancelTarget && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal modal-sm">
            <div className="modal-header">
              <h2 className="modal-title">Cancel Leave Request</h2>
              <button
                type="button"
                className="btn-close-header"
                onClick={() => setCancelTarget(null)}
                disabled={isCancelling}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div
                className="delete-warning-icon-wrapper"
                style={{
                  margin: '0 auto 16px',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={24} className="text-danger" />
              </div>
              <p className="text-center text-sm mb-2">
                Are you sure you want to cancel your leave request for{' '}
                <strong>{cancelTarget.leave_type}</strong> ({cancelTarget.start_date} to{' '}
                {cancelTarget.end_date})?
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
