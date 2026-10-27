import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarCheck,
  PlusCircle,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  Edit3,
  Calendar,
  UserCheck,
  UserX,
} from 'lucide-react';
import {
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getEmployees,
  getTodayAttendanceSummary,
} from '../services/api';

const STATUS_OPTIONS = ['Present', 'Absent', 'Late', 'Leave'];

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState({
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
    totalEmployees: 0,
    totalMarked: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Filters
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState(() => ({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Present',
    check_in: '',
    check_out: '',
    notes: '',
  }));

  // Load all attendance records
  const loadAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (filterEmployeeId) params.employee_id = filterEmployeeId;
      if (filterStatus) params.status = filterStatus;
      if (filterDate) params.date = filterDate;

      const [resAtt, resSumm] = await Promise.all([
        getAttendance(params),
        getTodayAttendanceSummary(),
      ]);

      setRecords(resAtt.data || []);
      if (resSumm.data?.data) {
        setSummary(resSumm.data.data);
      }
    } catch (err) {
      console.error('Error loading attendance records:', err);
      setError('Failed to fetch attendance data from MySQL database.');
    } finally {
      setLoading(false);
    }
  }, [filterEmployeeId, filterStatus, filterDate]);

  // Load employees for dropdown selector
  useEffect(() => {
    getEmployees()
      .then((res) => {
        setEmployees(res.data || []);
      })
      .catch((err) => {
        console.error('Error loading employees for attendance:', err);
      });
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const showToast = (type, text) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const openAddModal = () => {
    setEditingRecord(null);
    setFormData({
      employee_id: employees.length > 0 ? employees[0].id : '',
      date: new Date().toISOString().split('T')[0],
      status: 'Present',
      check_in: '09:00',
      check_out: '18:00',
      notes: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (rec) => {
    setEditingRecord(rec);
    setFormData({
      employee_id: rec.employee_id,
      date: rec.date,
      status: rec.status,
      check_in: rec.check_in || '',
      check_out: rec.check_out || '',
      notes: rec.notes || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employee_id) {
      setFormError('Please select an employee.');
      return;
    }
    if (!formData.date) {
      setFormError('Please select a date.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      if (editingRecord) {
        await updateAttendance(editingRecord.id, formData);
        showToast('success', `Attendance record #${editingRecord.id} updated successfully.`);
      } else {
        await createAttendance(formData);
        showToast('success', 'Attendance marked successfully in MySQL.');
      }

      setIsModalOpen(false);
      loadAttendance();
    } catch (err) {
      console.error('Error saving attendance:', err);
      const msg = err.response?.data?.message || 'Failed to save attendance record.';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteAttendance(deleteTarget.id);
      showToast('success', `Attendance record #${deleteTarget.id} deleted successfully.`);
      setDeleteTarget(null);
      loadAttendance();
    } catch (err) {
      console.error('Error deleting attendance:', err);
      showToast('error', err.response?.data?.message || 'Failed to delete attendance record.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Present':
        return 'badge-present';
      case 'Absent':
        return 'badge-absent';
      case 'Late':
        return 'badge-late';
      case 'Leave':
        return 'badge-leave';
      default:
        return 'badge-secondary';
    }
  };

  return (
    <div className="attendance-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`page-toast ${toastMessage.type}`} role="alert">
          {toastMessage.type === 'success' ? (
            <CheckCircle size={18} className="toast-icon" />
          ) : (
            <AlertCircle size={18} className="toast-icon" />
          )}
          <span>{toastMessage.text}</span>
          <button
            className="toast-close-btn"
            onClick={() => setToastMessage(null)}
            aria-label="Dismiss Notification"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header-row">
        <div className="header-titles">
          <h1 className="page-main-heading">Attendance Management</h1>
          <p className="page-subheading">
            Track daily attendance, punctuality, and leaves stored directly in MySQL <code>attendance</code> table.
          </p>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={openAddModal}
            id="btn-mark-attendance"
          >
            <PlusCircle size={18} />
            <span>Mark Attendance</span>
          </button>
        </div>
      </div>

      {/* Attendance Summary Widgets */}
      <div className="stats-cards-grid">
        <div className="stat-card stat-teal">
          <div className="stat-card-icon-box">
            <UserCheck size={24} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Present Today</span>
            <h2 className="stat-card-value">{summary.present}</h2>
            <span className="stat-card-meta">Live check-in records</span>
          </div>
        </div>

        <div className="stat-card stat-amber">
          <div className="stat-card-icon-box">
            <Clock size={24} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Late Today</span>
            <h2 className="stat-card-value">{summary.late}</h2>
            <span className="stat-card-meta">Delayed arrivals</span>
          </div>
        </div>

        <div className="stat-card stat-red">
          <div className="stat-card-icon-box">
            <UserX size={24} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Absent Today</span>
            <h2 className="stat-card-value">{summary.absent}</h2>
            <span className="stat-card-meta">Not present in office</span>
          </div>
        </div>

        <div className="stat-card stat-purple">
          <div className="stat-card-icon-box">
            <Calendar size={24} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">On Leave Today</span>
            <h2 className="stat-card-value">{summary.leave}</h2>
            <span className="stat-card-meta">Approved leave days</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-controls-card">
        <div className="attendance-filter-row">
          <div className="filter-item">
            <label htmlFor="filter-emp" className="filter-label">Filter by Employee:</label>
            <select
              id="filter-emp"
              className="form-input form-select"
              value={filterEmployeeId}
              onChange={(e) => setFilterEmployeeId(e.target.value)}
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  #{emp.id} - {emp.name} ({emp.department || 'General'})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="filter-status" className="filter-label">Status:</label>
            <select
              id="filter-status"
              className="form-input form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="filter-date" className="filter-label">Date:</label>
            <input
              type="date"
              id="filter-date"
              className="form-input"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>

          {(filterEmployeeId || filterStatus || filterDate) && (
            <button
              className="btn btn-secondary btn-clear-filters"
              onClick={() => {
                setFilterEmployeeId('');
                setFilterStatus('');
                setFilterDate('');
              }}
              title="Clear all filters"
            >
              <X size={16} />
              <span>Clear</span>
            </button>
          )}

          <button
            className="btn btn-secondary btn-refresh"
            onClick={loadAttendance}
            disabled={loading}
            title="Refresh Attendance"
          >
            <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="dashboard-alert-banner" role="alert">
          <AlertCircle size={20} className="alert-icon" />
          <span>{error}</span>
          <button className="btn btn-sm btn-secondary" onClick={loadAttendance}>
            Retry
          </button>
        </div>
      )}

      {/* Attendance Records Table */}
      {loading ? (
        <div className="table-loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading attendance records from MySQL...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon-box">
            <CalendarCheck size={48} className="empty-icon" />
          </div>
          <h3 className="empty-title">No Attendance Records Found</h3>
          <p className="empty-description">
            {filterEmployeeId || filterStatus || filterDate
              ? 'No attendance records match the current filter criteria.'
              : 'The MySQL "attendance" table has no records yet. Mark attendance for today to get started.'}
          </p>
          <button className="btn btn-primary empty-action-btn" onClick={openAddModal}>
            <PlusCircle size={18} />
            <span>Mark Today's Attendance</span>
          </button>
        </div>
      ) : (
        <div className="table-card-container">
          <div className="table-responsive-wrapper">
            <table className="custom-employee-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Notes</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec.id}>
                    <td>
                      <span className="id-badge">#{rec.id}</span>
                    </td>
                    <td>
                      <div className="employee-name-cell">
                        <div className="table-avatar">
                          {(rec.employee_name || 'E').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-navy">{rec.employee_name}</div>
                          <div className="text-muted text-xs">
                            {rec.employee_department} • #{rec.employee_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-medium">{rec.date}</span>
                    </td>
                    <td>
                      <span className={`status-pill ${getStatusBadgeClass(rec.status)}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td>
                      <span className="text-secondary">{rec.check_in || '—'}</span>
                    </td>
                    <td>
                      <span className="text-secondary">{rec.check_out || '—'}</span>
                    </td>
                    <td>
                      <span className="text-secondary text-sm">{rec.notes || '—'}</span>
                    </td>
                    <td className="text-center">
                      <div className="action-buttons-group">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => openEditModal(rec)}
                          title="Edit Attendance"
                        >
                          <Edit3 size={15} />
                          <span className="btn-label">Edit</span>
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => setDeleteTarget(rec)}
                          title="Delete Attendance"
                        >
                          <Trash2 size={15} />
                          <span className="btn-label">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer-summary">
            <span>
              Showing <strong>{records.length}</strong> attendance record(s)
            </span>
          </div>
        </div>
      )}

      {/* Add / Edit Attendance Modal */}
      {isModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal modal-md">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingRecord ? `Edit Attendance Record #${editingRecord.id}` : 'Mark Employee Attendance'}
              </h2>
              <button
                className="modal-close"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && (
                  <div className="form-alert-error" role="alert">
                    <AlertCircle size={18} className="alert-icon" />
                    <div className="alert-content">{formError}</div>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="modal-emp-id" className="form-label">
                    Employee <span className="required-star">*</span>
                  </label>
                  <select
                    id="modal-emp-id"
                    className="form-input form-select"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    disabled={Boolean(editingRecord) || isSubmitting}
                    required
                  >
                    <option value="">Select an employee...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        #{emp.id} - {emp.name} ({emp.department || 'General'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="modal-att-date" className="form-label">
                      Date <span className="required-star">*</span>
                    </label>
                    <input
                      type="date"
                      id="modal-att-date"
                      className="form-input"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="modal-att-status" className="form-label">
                      Status <span className="required-star">*</span>
                    </label>
                    <select
                      id="modal-att-status"
                      className="form-input form-select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      disabled={isSubmitting}
                      required
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="modal-check-in" className="form-label">
                      Check-In Time
                    </label>
                    <input
                      type="time"
                      id="modal-check-in"
                      className="form-input"
                      value={formData.check_in}
                      onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="modal-check-out" className="form-label">
                      Check-Out Time
                    </label>
                    <input
                      type="time"
                      id="modal-check-out"
                      className="form-input"
                      value={formData.check_out}
                      onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="modal-att-notes" className="form-label">
                    Notes / Remarks
                  </label>
                  <input
                    type="text"
                    id="modal-att-notes"
                    className="form-input"
                    placeholder="e.g. Worked remotely, Medical leave, Approved by manager"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving to MySQL...' : editingRecord ? 'Update Record' : 'Save Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal modal-sm">
            <div className="modal-header">
              <h2 className="modal-title">Confirm Attendance Deletion</h2>
              <button
                className="modal-close"
                onClick={() => setDeleteTarget(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete attendance record #{deleteTarget.id} for{' '}
                <strong>{deleteTarget.employee_name}</strong> on <strong>{deleteTarget.date}</strong>?
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
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
