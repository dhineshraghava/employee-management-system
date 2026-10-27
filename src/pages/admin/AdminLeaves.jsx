import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarOff,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  X,
  AlertCircle,
  Calendar,
  MessageSquare,
  Building,
  User,
  Trash2,
  AlertTriangle,
  Mail,
  Check,
  Send,
  Eye,
} from 'lucide-react';
import { getAdminLeaves, updateLeaveStatus, deleteLeave } from '../../services/api';

export default function AdminLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Decision Modal State (Approve / Reject)
  const [decisionModal, setDecisionModal] = useState({
    isOpen: false,
    leave: null,
    action: 'Approved', // 'Approved' | 'Rejected'
    remarks: '',
    isSubmitting: false,
    error: null,
  });

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (type, text) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const loadLeaves = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await getAdminLeaves(params);
      if (res.data?.success) {
        setLeaves(res.data.leaves || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch (err) {
      console.error('Error loading admin leaves:', err);
      setError('Failed to fetch employee leave applications from MySQL database.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  // Open Decision Modal
  const openDecisionModal = (leave, action) => {
    setDecisionModal({
      isOpen: true,
      leave,
      action,
      remarks: action === 'Approved' ? 'Leave request approved.' : '',
      isSubmitting: false,
      error: null,
    });
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    const { leave, action, remarks } = decisionModal;
    if (!leave) return;

    if (action === 'Rejected' && (!remarks || !remarks.trim())) {
      setDecisionModal((prev) => ({
        ...prev,
        error: 'Please enter a brief remark or reason for rejecting this leave.',
      }));
      return;
    }

    try {
      setDecisionModal((prev) => ({ ...prev, isSubmitting: true, error: null }));
      await updateLeaveStatus(leave.id, action, remarks);

      showToast(
        'success',
        `Leave application for ${leave.employee_name} has been ${action.toLowerCase()}!`
      );
      setDecisionModal({
        isOpen: false,
        leave: null,
        action: 'Approved',
        remarks: '',
        isSubmitting: false,
        error: null,
      });
      loadLeaves();
    } catch (err) {
      console.error('Error updating leave decision:', err);
      setDecisionModal((prev) => ({
        ...prev,
        isSubmitting: false,
        error: err.response?.data?.message || 'Failed to update leave status.',
      }));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteLeave(deleteTarget.id);
      showToast('success', `Leave record #${deleteTarget.id} was deleted from database.`);
      setDeleteTarget(null);
      loadLeaves();
    } catch (err) {
      console.error('Error deleting leave:', err);
      showToast('error', err.response?.data?.message || 'Failed to delete leave record.');
    } finally {
      setIsDeleting(false);
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
            <XCircle size={14} /> Rejected
          </span>
        );
      case 'Cancelled':
        return (
          <span className="status-badge status-cancelled">
            <AlertCircle size={14} /> Cancelled by Emp
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
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
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

      {/* Header */}
      <div className="page-header-row">
        <div className="header-titles">
          <div className="flex-align-center gap-8 mb-2">
            <span className="badge-pill admin-pill">
              <CalendarOff size={14} />
              <span>Leave Approvals & Management</span>
            </span>
          </div>
          <h1 className="page-main-heading">Employee Leave Requests</h1>
          <p className="page-subheading">
            Review time-off requests submitted by employees. Approved leaves automatically synchronize with employee attendance logs.
          </p>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-secondary btn-refresh"
            onClick={loadLeaves}
            disabled={loading}
            title="Refresh Leave Requests"
          >
            <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Summary */}
      <div className="stats-cards-grid">
        <div
          className={`stat-card stat-amber cursor-pointer ${
            statusFilter === 'Pending' ? 'active-filter-card' : ''
          }`}
          onClick={() => setStatusFilter('Pending')}
          title="Click to filter by Pending"
        >
          <div className="stat-card-icon-box">
            <Clock size={24} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Pending Approval</span>
            <h2 className="stat-card-value text-amber-700">{loading ? '...' : summary.pending}</h2>
            <span className="stat-card-meta">
              {summary.pending > 0 ? 'Action required by admin!' : 'All requests reviewed'}
            </span>
          </div>
        </div>

        <div
          className={`stat-card stat-teal cursor-pointer ${
            statusFilter === 'Approved' ? 'active-filter-card' : ''
          }`}
          onClick={() => setStatusFilter('Approved')}
          title="Click to filter by Approved"
        >
          <div className="stat-card-icon-box">
            <CheckCircle size={24} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Approved Leaves</span>
            <h2 className="stat-card-value">{loading ? '...' : summary.approved}</h2>
            <span className="stat-card-meta">Synced to attendance</span>
          </div>
        </div>

        <div
          className={`stat-card stat-red cursor-pointer ${
            statusFilter === 'Rejected' ? 'active-filter-card' : ''
          }`}
          onClick={() => setStatusFilter('Rejected')}
          title="Click to filter by Rejected"
        >
          <div className="stat-card-icon-box">
            <XCircle size={24} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Rejected Requests</span>
            <h2 className="stat-card-value">{loading ? '...' : summary.rejected}</h2>
            <span className="stat-card-meta">Declined applications</span>
          </div>
        </div>

        <div
          className={`stat-card stat-blue cursor-pointer ${
            statusFilter === 'All' ? 'active-filter-card' : ''
          }`}
          onClick={() => setStatusFilter('All')}
          title="Click to show all"
        >
          <div className="stat-card-icon-box">
            <CalendarOff size={24} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Total Applications</span>
            <h2 className="stat-card-value">{loading ? '...' : summary.total}</h2>
            <span className="stat-card-meta">All submitted leaves</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-controls-card">
        <div className="search-input-wrapper">
          <Search size={18} className="search-field-icon" />
          <input
            type="text"
            className="search-input-field"
            placeholder="Search by employee name, email, department, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
              aria-label="Clear Search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="controls-right-group">
          {/* Status Filter Buttons */}
          <div className="filter-tab-buttons" style={{ display: 'flex', gap: '6px' }}>
            {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
              <button
                key={status}
                type="button"
                className={`btn btn-sm ${
                  statusFilter === status ? 'btn-primary' : 'btn-secondary'
                }`}
                onClick={() => setStatusFilter(status)}
              >
                {status}
                {status === 'Pending' && summary.pending > 0 && (
                  <span
                    style={{
                      marginLeft: '6px',
                      background: '#ef4444',
                      color: '#fff',
                      fontSize: '0.7rem',
                      padding: '1px 6px',
                      borderRadius: '10px',
                    }}
                  >
                    {summary.pending}
                  </span>
                )}
              </button>
            ))}
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

      {/* Leaves Table */}
      <div className="employee-table-card">
        {loading ? (
          <div className="table-loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading employee leave requests...</p>
          </div>
        ) : leaves.length === 0 ? (
          <div className="empty-state-card">
            <CalendarOff size={48} className="empty-icon text-muted" />
            <h3 className="empty-title">No Leave Requests Found</h3>
            <p className="empty-description">
              {statusFilter !== 'All'
                ? `There are currently no leaves with status "${statusFilter}".`
                : 'No employee has submitted a leave application yet.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-employee-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Leave Type</th>
                  <th>Dates & Duration</th>
                  <th>Reason / Justification</th>
                  <th>Status</th>
                  <th>Admin Remarks</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave.id} className="employee-row">
                    <td>
                      <div className="employee-name-cell">
                        <div className="table-avatar">{getInitials(leave.employee_name)}</div>
                        <div>
                          <strong className="text-navy-900">{leave.employee_name}</strong>
                          <div className="text-xs text-muted flex-align-center gap-4">
                            <Mail size={12} />
                            <span>{leave.employee_email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="cell-with-icon">
                        <Building size={14} className="cell-muted-icon" />
                        <span>{leave.employee_department || 'General'}</span>
                      </div>
                      <span className="text-xs text-muted">
                        {leave.employee_designation || 'Staff'}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`leave-type-pill ${
                          leave.leave_type.includes('Sick')
                            ? 'sick'
                            : leave.leave_type.includes('Emergency')
                            ? 'emergency'
                            : leave.leave_type.includes('Unpaid')
                            ? 'unpaid'
                            : ''
                        }`}
                      >
                        {leave.leave_type}
                      </span>
                    </td>

                    <td>
                      <div>
                        <strong>{leave.start_date}</strong> to <strong>{leave.end_date}</strong>
                        <span className="leave-duration-badge">
                          {leave.days} {leave.days === 1 ? 'day' : 'days'}
                        </span>
                      </div>
                      <span className="text-xs text-muted">Applied: {leave.created_at}</span>
                    </td>

                    <td style={{ maxWidth: '240px' }}>
                      <p className="leave-reason-box">{leave.reason}</p>
                    </td>

                    <td>{getStatusBadge(leave.status)}</td>

                    <td style={{ maxWidth: '200px' }}>
                      {leave.admin_remarks ? (
                        <div className="leave-remarks-bubble">
                          <MessageSquare size={14} className="flex-shrink-0 mt-1" />
                          <span>{leave.admin_remarks}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted italic">No remarks</span>
                      )}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      {leave.status === 'Pending' ? (
                        <div className="leave-actions-group" style={{ justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn-approve"
                            onClick={() => openDecisionModal(leave, 'Approved')}
                            title="Approve Leave"
                            id={`btn-approve-leave-${leave.id}`}
                          >
                            <Check size={14} />
                            <span>Approve</span>
                          </button>

                          <button
                            type="button"
                            className="btn-reject"
                            onClick={() => openDecisionModal(leave, 'Rejected')}
                            title="Reject Leave"
                            id={`btn-reject-leave-${leave.id}`}
                          >
                            <X size={14} />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex-align-center gap-6" style={{ justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn-action-icon"
                            onClick={() => openDecisionModal(leave, leave.status === 'Approved' ? 'Rejected' : 'Approved')}
                            title={`Change status to ${leave.status === 'Approved' ? 'Rejected' : 'Approved'}`}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn-action-icon text-danger"
                            onClick={() => setDeleteTarget(leave)}
                            title="Delete this leave record"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Decision Modal (Approve or Reject with Remarks) */}
      {decisionModal.isOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal modal-md">
            <div className="modal-header">
              <div className="flex-align-center gap-10">
                <div
                  className="icon-badge"
                  style={{
                    backgroundColor: decisionModal.action === 'Approved' ? '#ecfdf5' : '#fef2f2',
                    color: decisionModal.action === 'Approved' ? '#059669' : '#dc2626',
                    padding: '8px',
                    borderRadius: '8px',
                  }}
                >
                  {decisionModal.action === 'Approved' ? (
                    <CheckCircle size={22} />
                  ) : (
                    <XCircle size={22} />
                  )}
                </div>
                <div>
                  <h2 className="modal-title">
                    {decisionModal.action === 'Approved' ? 'Approve Leave Request' : 'Reject Leave Request'}
                  </h2>
                  <p className="modal-subtitle">
                    Applicant: <strong>{decisionModal.leave?.employee_name}</strong> (#{decisionModal.leave?.employee_id})
                  </p>
                </div>
              </div>
              <button
                className="modal-close"
                onClick={() => setDecisionModal({ ...decisionModal, isOpen: false })}
                disabled={decisionModal.isSubmitting}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleDecisionSubmit}>
              <div className="modal-body">
                {decisionModal.error && (
                  <div className="form-alert-error" role="alert">
                    <AlertCircle size={16} className="alert-icon" />
                    <span>{decisionModal.error}</span>
                  </div>
                )}

                {/* Leave Application Summary Details */}
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '14px 18px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '16px',
                  }}
                >
                  <div className="flex-between mb-2">
                    <span className="text-xs text-muted uppercase font-bold">Leave Details</span>
                    <span className="leave-duration-badge">
                      {decisionModal.leave?.days} {decisionModal.leave?.days === 1 ? 'Day' : 'Days'}
                    </span>
                  </div>
                  <p className="text-sm mb-1">
                    <strong>Type:</strong> {decisionModal.leave?.leave_type}
                  </p>
                  <p className="text-sm mb-1">
                    <strong>Dates:</strong> {decisionModal.leave?.start_date} to {decisionModal.leave?.end_date}
                  </p>
                  <p className="text-sm">
                    <strong>Employee's Reason:</strong> "{decisionModal.leave?.reason}"
                  </p>
                </div>

                {decisionModal.action === 'Approved' ? (
                  <p className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded border border-emerald-200 mb-3">
                    ℹ️ Approving this request will automatically register <strong>'Leave'</strong> status in the attendance records for each date in this range.
                  </p>
                ) : (
                  <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded border border-rose-200 mb-3">
                    ⚠️ Rejecting this request will inform the employee. Please state the reason below so the employee understands the decision.
                  </p>
                )}

                {/* Remarks Field */}
                <div className="form-group">
                  <label htmlFor="admin-remarks-input" className="form-label">
                    Admin Feedback / Remarks{' '}
                    {decisionModal.action === 'Rejected' && <span className="required-star">*</span>}
                  </label>
                  <textarea
                    id="admin-remarks-input"
                    className="form-input"
                    rows="3"
                    placeholder={
                      decisionModal.action === 'Approved'
                        ? 'e.g. Approved. Please ensure handover of critical deliverables.'
                        : 'e.g. Unable to approve due to critical project deadline on selected dates.'
                    }
                    value={decisionModal.remarks}
                    onChange={(e) => setDecisionModal({ ...decisionModal, remarks: e.target.value })}
                    disabled={decisionModal.isSubmitting}
                    required={decisionModal.action === 'Rejected'}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDecisionModal({ ...decisionModal, isOpen: false })}
                  disabled={decisionModal.isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn ${
                    decisionModal.action === 'Approved' ? 'btn-primary' : 'btn-danger'
                  }`}
                  disabled={decisionModal.isSubmitting}
                  id="btn-confirm-leave-decision"
                >
                  {decisionModal.isSubmitting ? (
                    'Saving...'
                  ) : decisionModal.action === 'Approved' ? (
                    'Confirm Approval'
                  ) : (
                    'Confirm Rejection'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Record Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal modal-sm">
            <div className="modal-header">
              <h2 className="modal-title">Delete Leave Record</h2>
              <button
                className="modal-close"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                aria-label="Close"
              >
                ×
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
                Are you sure you want to delete leave record #{deleteTarget.id} for{' '}
                <strong>{deleteTarget.employee_name}</strong>?
              </p>
              <p className="text-center text-xs text-muted">
                This action is permanent and cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
